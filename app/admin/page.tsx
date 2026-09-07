'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPanel() {
  const [auth, setAuth] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (auth) fetchTickets();
  }, [auth]);

  const fetchTickets = async () => {
    const { data } = await supabase.from('tickets').select('*').order('id', { ascending: true });
    if (data) setTickets(data);
  };

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    const pw = (e.target as any).password.value;
    if (pw === 'admin123') setAuth(true);
    else alert('Contraseña incorrecta');
  };

  // NUEVAS FUNCIONES DE CONTROL
  const handleApprove = async (id: number) => {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'pagado' })
      .eq('id', id);
      
    if (error) alert('Error al aprobar: ' + error.message);
    else fetchTickets();
  };

  const handleCancel = async (id: number) => {
    const confirmacion = window.confirm('¿Seguro que quieres cancelar y liberar este boleto?');
    if (!confirmacion) return;

    const { error } = await supabase
      .from('tickets')
      .update({ 
        status: 'disponible', 
        owner_name: null, 
        owner_phone: null 
      })
      .eq('id', id);
      
    if (error) alert('Error al cancelar: ' + error.message);
    else fetchTickets();
  };

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={login} className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Panel de Control</h2>
          <input name="password" type="password" placeholder="Contraseña" className="border p-2 w-full mb-4" required />
          <button type="submit" className="bg-blue-600 text-white w-full py-2 rounded">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Dashboard Administrativo</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-4">Boleto</th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Teléfono</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tickets.filter(t => t.status !== 'disponible').map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-bold">#{t.id} (${t.id})</td>
                <td className="p-4">{t.owner_name}</td>
                <td className="p-4">{t.owner_phone}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    t.status === 'pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {t.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 gap-2 flex">
                  {t.status === 'apartado' && (
                    <button onClick={() => handleApprove(t.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm mr-2 transition-colors">Aprobar</button>
                  )}
                  <button onClick={() => handleCancel(t.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors">Cancelar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}