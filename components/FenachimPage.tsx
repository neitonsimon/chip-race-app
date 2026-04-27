import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../src/lib/supabase';

interface FenachimPageProps {
  onNavigate: (view: string) => void;
}

export const FenachimPage: React.FC<FenachimPageProps> = ({ onNavigate }) => {
  const { events, currentUser, isLoggedIn, refreshSupabaseData } = useApp();
  const [isReserving, setIsReserving] = useState(false);

  // Find the event in the calendar list
  const fenachimEvent = events.find(e => 
    e.title.toLowerCase().includes('cvth #6') || 
    e.title.toLowerCase().includes('fenachim')
  );

  const handleReservePoker = async () => {
    if (!isLoggedIn || !currentUser) {
      onNavigate('login');
      return;
    }

    if (!fenachimEvent) {
      alert("Evento não encontrado no calendário ativo.");
      return;
    }

    setIsReserving(true);
    try {
      const { error } = await supabase
        .from('tournament_reservations')
        .insert({
          event_id: fenachimEvent.id,
          user_id: currentUser.id,
          status: 'reserved'
        });

      if (error) {
        if (error.code === '23505') {
          alert("Você já possui reserva para este evento.");
        } else {
          console.error("Erro ao reservar:", error);
          alert("Não foi possível reservar seu assento no momento.");
        }
      } else {
        alert("Reserva confirmada com sucesso! A organização foi notificada.");
        if (refreshSupabaseData) await refreshSupabaseData();
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      alert("Ocorreu um erro ao processar sua reserva.");
    } finally {
      setIsReserving(false);
    }
  };

  const handleWhatsapp = () => {
    const phone = "5551992425186";
    const text = encodeURIComponent("gostaria de mais informações sobre o torneio de canastra");
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background-dark text-gray-200 font-body pb-24">
      {/* Header Banner */}
      <div className="relative py-20 overflow-hidden text-center bg-gradient-to-br from-[#102d20] to-background-dark">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="inline-block p-4 bg-white/5 rounded-3xl backdrop-blur-sm border border-green-500/30 mb-6">
             <span className="material-icons-outlined text-green-500 text-5xl">nature</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-100 to-green-300 mb-6 uppercase tracking-tight">
            PROGRAMAÇÃO POKER & CANASTRA<br/><span className="text-4xl sm:text-6xl text-white">18ª FENACHIM</span>
          </h1>
          <p className="text-xl text-green-100/70 font-light">
            Esporte da Mente presente na Festa com o Sabor do Rio Grande.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Canastra Section */}
          <div className="bg-gradient-to-b from-[#0a1f15] to-[#040e09] border border-green-500/20 rounded-[2rem] p-8 shadow-[0_0_40px_rgba(34,197,94,0.1)] flex flex-col hover:border-green-500/40 transition-colors group">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/30">
                <span className="material-icons-outlined text-green-400 text-3xl">style</span>
              </div>
              <div>
                <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest break-words">Torneio de Duplas</h2>
                <span className="text-green-400 font-bold tracking-widest uppercase text-sm">Canastra</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-6">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-icons-outlined text-green-500/70">event</span>
                  <span className="text-sm font-black uppercase tracking-widest text-gray-400">Datas</span>
                </div>
                <div className="space-y-2 ml-9">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Eliminatórias</span>
                    <span className="text-white font-bold">07 e 08/05 às 19:30h</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-white/5 pt-2">
                    <span className="text-gray-300">Finais</span>
                    <span className="text-white font-bold">10/05 às 16:00h</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-icons-outlined text-green-500/70">payments</span>
                  <span className="text-sm font-black uppercase tracking-widest text-gray-400">Inscrição</span>
                </div>
                <div className="ml-9 text-xl text-white font-bold">R$ 150 <span className="text-sm font-normal text-gray-400">por dupla</span></div>
              </div>
            </div>

            <button 
              onClick={handleWhatsapp}
              className="mt-8 w-full bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              <span className="material-icons-outlined">chat</span>
              Mais Informações (WhatsApp)
            </button>
          </div>

          {/* Poker Section */}
          <div className="bg-gradient-to-b from-[#1c0c16] to-[#0a0408] border border-primary/20 rounded-[2rem] p-8 shadow-[0_0_40px_rgba(217,0,255,0.1)] flex flex-col hover:border-primary/40 transition-colors group">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/30">
                <span className="material-icons-outlined text-primary text-3xl">casino</span>
              </div>
              <div>
                <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest break-words">5K Garantido</h2>
                <span className="text-primary font-bold tracking-widest uppercase text-sm">Especial Fenachim</span>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-icons-outlined text-primary/70">event</span>
                  <span className="text-sm font-black uppercase tracking-widest text-gray-400">Datas</span>
                </div>
                <div className="ml-9 flex justify-between items-center text-sm">
                  <span className="text-gray-300">Dia Único</span>
                  <span className="text-white font-bold">09/05 às 15:00h</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-icons-outlined text-primary/70">payments</span>
                  <span className="text-sm font-black uppercase tracking-widest text-gray-400">Inscrição</span>
                </div>
                <div className="ml-9 text-xl text-white font-bold">R$ 40 + 30</div>
              </div>
            </div>

            <button 
              onClick={handleReservePoker}
              disabled={isReserving}
              className={`mt-8 w-full ${!isLoggedIn ? 'bg-transparent border border-primary text-primary hover:bg-primary/10' : 'bg-gradient-to-r from-primary to-accent text-white border-0 shadow-neon-pink hover:opacity-90'} font-black uppercase tracking-widest py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2`}
            >
              <span className="material-icons-outlined">
                {isReserving ? 'hourglass_empty' : (!isLoggedIn ? 'login' : 'how_to_reg')}
              </span>
              {isReserving ? 'Processando...' : (!isLoggedIn ? 'FAÇA LOGIN PARA RESERVAR' : 'RESERVAR ASSENTO NO POKER')}
            </button>
          </div>

        </div>

        {/* Sponsor/Footer section */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl p-6 shadow-2xl">
             <img src="/fenachim.jpg" alt="Fenachim Logo" className="h-16 w-auto" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>
          <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">
            Apoio Oficial
          </p>
        </div>
      </div>
    </div>
  );
};
