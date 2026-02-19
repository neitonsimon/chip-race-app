import React, { useState, useEffect } from 'react';
import { CountdownTime } from '../types';

export const EventCountdown: React.FC = () => {
  // Simulando data futura para 2026 (apenas visualmente para o demo)
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 120,
    hours: 14,
    minutes: 58,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              if (days > 0) {
                days--;
              }
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const pad = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="relative py-12 bg-gray-100 dark:bg-[#0A051E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center border border-primary/20 bg-white/5 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-8 lg:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
          
          <div className="mb-8 md:mb-0 md:mr-12 text-center md:text-left">
            <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
              RUMO AO
            </h3>
            <p className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary uppercase mb-2">
              CAPÍTULO FINAL
            </p>
            <p className="text-gray-400 text-sm max-w-xs">
              O prêmio garantido aumenta a cada marco batido pela comunidade.
            </p>
          </div>

          <div className="flex gap-4 sm:gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-5xl font-display font-black text-white mb-2">
                {pad(timeLeft.days)}
              </div>
              <div className="text-xs uppercase tracking-widest text-gray-500">Dias</div>
            </div>
            
            <div className="text-3xl sm:text-5xl font-display font-black text-gray-700 dark:text-gray-600">:</div>
            
            <div>
              <div className="text-3xl sm:text-5xl font-display font-black text-white mb-2">
                {pad(timeLeft.hours)}
              </div>
              <div className="text-xs uppercase tracking-widest text-gray-500">Horas</div>
            </div>
            
            <div className="text-3xl sm:text-5xl font-display font-black text-gray-700 dark:text-gray-600">:</div>
            
            <div>
              <div className="text-3xl sm:text-5xl font-display font-black text-white mb-2">
                {pad(timeLeft.minutes)}
              </div>
              <div className="text-xs uppercase tracking-widest text-gray-500">Min</div>
            </div>
          </div>

          <div className="mt-8 md:mt-0 md:ml-12 flex flex-col gap-3">
             <div className="text-center">
                <p className="text-xs text-secondary uppercase tracking-widest mb-1">Próximo Marco</p>
                <p className="text-2xl font-bold text-white">GTD 35K</p>
             </div>
            <button className="bg-transparent border border-secondary text-secondary hover:bg-secondary hover:text-black font-bold py-2 px-6 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(0,224,255,0.2)] hover:shadow-neon-blue">
              VER RANKING
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};