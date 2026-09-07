'use client';
import { useRef, useEffect, useState } from 'react';

interface ScratchCardProps {
  ticketNumber: number;
  onReveal: () => void;
}

export default function ScratchCard({ ticketNumber, onReveal }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pintar la capa superior
    ctx.fillStyle = '#a0aec0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#4a5568';
    ctx.fillText('¡RASPA AQUÍ!', 35, 75);

    let isDrawing = false;

    const scratch = (x: number, y: number) => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
      checkReveal();
    };

    const checkReveal = () => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparent = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) transparent++;
      }
      const percent = (transparent / (pixels.length / 4)) * 100;
      if (percent > 50 && !isRevealed) {
        setIsRevealed(true);
        canvas.style.display = 'none';
        onReveal();
      }
    };

    const getCoordinates = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      isDrawing = true;
      const { x, y } = getCoordinates(e);
      scratch(x, y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const { x, y } = getCoordinates(e);
      scratch(x, y);
    };

    const stopDrawing = () => { isDrawing = false; };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isRevealed, onReveal]);

  return (
    <div className="relative w-48 h-36 bg-white border-4 border-yellow-400 rounded-xl shadow-lg flex flex-col items-center justify-center overflow-hidden">
      <div className="text-center">
        <p className="text-sm text-gray-500 font-bold">TU BOLETO ES EL</p>
        <p className="text-5xl font-black text-blue-600">#{ticketNumber}</p>
        <p className="text-md text-green-600 font-bold mt-1">Costo: ${ticketNumber} MXN</p>
      </div>
      <canvas
        ref={canvasRef}
        width={192}
        height={144}
        className="absolute top-0 left-0 w-full h-full cursor-pointer touch-none"
      />
    </div>
  );
}