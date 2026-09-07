'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ScratchCard from '@/components/ScratchCard';
import confetti from 'canvas-confetti';

interface Ticket {
  id: number;
  status: string;
}

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
    const channel = supabase.channel('realtime-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchTickets();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTickets = async () => {
    const { data } = await supabase.from('tickets').select('id, status').order('id', { ascending: true });
    if (data) setTickets(data);
  };

  const occupiedCount = tickets.filter(t => t.status !== 'disponible').length;

  const handleParticipate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalQuantity = Number(quantity) || 1;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('assign_random_tickets', {
        num_tickets: finalQuantity,
        p_name: formData.name,
        p_phone: formData.phone
      });

      if (error) throw error;
      
      setMyTickets(data);
      setStep(3);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = () => {
    setRevealedCount(prev => {
      const newCount = prev + 1;
      if (newCount === myTickets.length) confetti({ particleCount: 150, spread: 70 });
      return newCount;
    });
  };

  const totalToPay = myTickets.reduce((sum, ticket) => sum + ticket.id, 0);
  const ticketNumbers = myTickets.map(t => `#${t.id}`).join(', ');

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-blue-700 text-white p-6 text-center shadow-md">
        <h1 className="text-3xl font-black uppercase mb-2">🏆 ¡Apoya a Mijael! 🤾</h1>
        <p className="text-lg">En su viaje con la selección premier de handball</p>
      </header>

      <div className="max-w-3xl mx-auto px-4 mt-8">
        {step === 1 && (
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
            <h2 className="text-2xl font-bold text-blue-800 mb-2">🎁 PREMIO: $2,000 MXN EN EFECTIVO</h2>
            <p className="text-gray-600 mb-6">🎟️ ¡El precio de tu boleto es sorpresa! Del $1 al $100 MXN (El precio equivale al número del boleto).</p>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${occupiedCount}%` }}></div>
            </div>
            <p className="text-sm font-bold text-gray-600 mb-8">{occupiedCount} de 100 boletos ocupados</p>

            <button onClick={() => setStep(2)} className="bg-yellow-400 hover:bg-yellow-500 text-black font-black text-xl py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105">
              🎟️ QUIERO PARTICIPAR
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleParticipate} className="bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-center">Registra tus datos</h2>
            <div className="mb-4">
              <label className="block font-bold mb-2">¿Cuántos boletos quieres?</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                required
                className="w-full p-3 border rounded-lg bg-gray-50 text-lg font-bold" 
                value={quantity} 
                onChange={e => {
                  const val = e.target.value;
                  setQuantity(val === '' ? '' : Number(val));
                }} 
              />
              <p className="text-xs text-gray-500 mt-2">Escribe la cantidad de boletos que deseas. El costo total dependerá de los números que descubras al raspar.</p>
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-2">Nombre Completo</label>
              <input required type="text" className="w-full p-3 border rounded-lg bg-gray-50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="mb-8">
              <label className="block font-bold mb-2">Teléfono / WhatsApp</label>
              <input required type="tel" className="w-full p-3 border rounded-lg bg-gray-50" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md">
              {loading ? 'Asignando...' : 'CONFIRMAR Y RASPAR'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl text-center flex flex-col items-center">
            <h2 className="text-2xl font-black text-blue-800 mb-6">¡Descubre tus números!</h2>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 w-full">
              {myTickets.map(ticket => (
                <ScratchCard key={ticket.id} ticketNumber={ticket.id} onReveal={handleReveal} />
              ))}
            </div>

            {revealedCount === myTickets.length && (
              <div className="w-full bg-blue-50 border border-blue-200 p-4 sm:p-6 rounded-xl max-w-lg mx-auto animate-fade-in block">
                <h3 className="text-xl font-bold mb-4 text-center">RESUMEN FINAL</h3>
                <p className="text-lg mb-2">Boletos obtenidos: <strong>{ticketNumbers}</strong></p>
                <p className="text-2xl sm:text-3xl font-black text-green-600 mb-6">TOTAL A PAGAR: ${totalToPay} MXN</p>
                
                <div className="bg-white p-4 rounded-lg shadow-inner text-left mb-6 text-sm">
                  <p className="font-bold text-gray-700 mb-2">Instrucciones de Pago:</p>
                  <p><strong>Banco:</strong> Klar</p>
                  <p><strong>Nombre:</strong> Carmen Zavala</p>
                  <p><strong>CLABE (SPEI):</strong> 661610005936710133</p>
                </div>

                <a 
                  href={`https://wa.me/526624337540?text=${encodeURIComponent(`Hola Mijael, ya separé mis boletos para la rifa de handball (${ticketNumbers}). Mi total es de $${totalToPay} MXN. Aquí te mando mi comprobante.`)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold py-4 rounded-xl shadow-md text-center transition-colors text-base sm:text-lg"
                >
                  📲 ENVIAR COMPROBANTE POR WHATSAPP
                </a>
              </div>
            )}
          </div>
        )}

        {/* GRILLA DE DISPONIBILIDAD */}
        <div className="mt-12 bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-bold text-center mb-6">Disponibilidad de Boletos</h3>
          <div className="grid grid-cols-10 gap-2 sm:gap-3">
            {tickets.map(t => (
              <div key={t.id} className={`aspect-square flex items-center justify-center rounded text-xs sm:text-sm font-bold ${
                t.status === 'disponible' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-500 text-white shadow-inner'
              }`}>
                {t.id}
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </main>
  );
}