import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../src/lib/supabase';

interface FenachimPageProps {
  onNavigate: (view: string) => void;
}

export const FenachimPage: React.FC<FenachimPageProps> = ({ onNavigate }) => {
  const { events, currentUser, isLoggedIn, refreshSupabaseData } = useApp();
  const [isReserving, setIsReserving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isAlreadyReserved, setIsAlreadyReserved] = useState(false);
  const [currentReservationsCount, setCurrentReservationsCount] = useState<number>(0);
  const [reservationPlayers, setReservationPlayers] = useState<any[]>([]);
  const [showReservationPlayers, setShowReservationPlayers] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    const fetchLogo = async () => {
      const { data, error } = await supabase.from('content_db').select('value').eq('key', 'fenachim_logo').single();
      if (!error && data) {
        setLogoUrl(data.value);
      }
    };
    fetchLogo();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setLogoUrl(base64);
      try {
        await supabase.from('content_db').upsert({ key: 'fenachim_logo', value: base64 }, { onConflict: 'key' });
        alert('Logo salvo com sucesso!');
      } catch (err) {
        console.error('Error saving logo', err);
        alert('Erro ao salvar logo.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Find the event in the calendar list
  const fenachimEvent = events.find(e => 
    e.title.toLowerCase().includes('cvth #6') || 
    e.title.toLowerCase().includes('fenachim')
  );

  const openReservationModal = async () => {
    if (!isLoggedIn || !currentUser) {
      onNavigate('login');
      return;
    }

    if (!fenachimEvent) {
      alert("Evento não encontrado no calendário ativo.");
      return;
    }

    setShowModal(true);
    setShowReservationPlayers(false);

    try {
      // Check if user already booked
      const { data: userData } = await supabase
        .from('tournament_reservations')
        .select('id')
        .eq('event_id', fenachimEvent.id)
        .eq('user_id', currentUser.id)
        .in('status', ['reserved', 'confirmed']);
        
      setIsAlreadyReserved(userData && userData.length > 0);

      // Fetch all reservations
      const { data, count, error } = await supabase
        .from('tournament_reservations')
        .select('is_outsourced, profiles(name, avatar_url)', { count: 'exact' })
        .eq('event_id', fenachimEvent.id)
        .in('status', ['reserved', 'confirmed']);
        
      if (!error && data) {
        setCurrentReservationsCount(count || 0);
        setReservationPlayers(data.filter(r => !r.is_outsourced).map(d => d.profiles));
      } else {
        setCurrentReservationsCount(0);
        setReservationPlayers([]);
      }
    } catch(e) {
      setCurrentReservationsCount(0);
      setReservationPlayers([]);
    }
  };

  const confirmReservation = async () => {
    if (!currentUser || !fenachimEvent) return;
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
        alert("Assento reservado com sucesso! A organização foi notificada.");
        setShowModal(false);
        if (refreshSupabaseData) await refreshSupabaseData();
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      alert("Ocorreu um erro ao processar sua reserva.");
    } finally {
      setIsReserving(false);
    }
  };

  const cancelReservation = async () => {
    if (!fenachimEvent || !currentUser) return;
    if (!window.confirm("Deseja realmente cancelar sua reserva?")) return;

    try {
        const { error: err } = await supabase
            .from('tournament_reservations')
            .update({ status: 'cancelled' })
            .eq('event_id', fenachimEvent.id)
            .eq('user_id', currentUser.id)
            .in('status', ['reserved', 'confirmed']);

        if (!err) {
            alert("Reserva cancelada com sucesso.");
            setShowModal(false);
            if (refreshSupabaseData) await refreshSupabaseData();
        } else {
            console.error("Erro ao cancelar reserva:", err);
            alert("Erro ao cancelar reserva: " + (err.message || "Erro desconhecido"));
        }
    } catch (e) {
        alert("Erro ao cancelar reserva.");
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
          <div className="relative w-full max-w-4xl mx-auto mb-10 group">
             {logoUrl ? (
                <div className="w-full flex justify-center">
                  <img 
                    src={logoUrl} 
                    alt="Fenachim Logo" 
                    className="w-full h-auto max-h-[400px] sm:max-h-[600px] object-contain rounded-3xl" 
                  />
                </div>
             ) : (
                <div className="inline-block p-10 bg-white/5 rounded-3xl backdrop-blur-sm border border-green-500/30">
                   <span className="material-icons-outlined text-green-500 text-7xl">nature</span>
                </div>
             )}
             
             {currentUser?.role === 'admin' && (
                <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                   <label className="cursor-pointer bg-primary p-4 rounded-full shadow-neon-pink flex items-center justify-center relative overflow-hidden transition-transform hover:scale-110">
                      <span className="material-icons-outlined text-white text-2xl pointer-events-none">upload</span>
                      <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleLogoUpload} />
                   </label>
                </div>
             )}
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
                <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight break-words">POKER - 5K GTD</h2>
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
                <div className="ml-9 mt-3 flex flex-col gap-1 border-t border-white/5 pt-3">
                   <div className="text-sm text-gray-400 font-bold uppercase tracking-widest flex justify-between">
                     <span>Rebuy Simples:</span> <span className="text-white">{fenachimEvent?.rebuyValue ? `R$ ${fenachimEvent.rebuyValue}` : 'R$ 40'} <span className="text-[10px] text-gray-500 font-normal">/ {fenachimEvent?.rebuyChips || '15k'}</span></span>
                   </div>
                   {fenachimEvent?.doubleRebuyValue && (
                     <div className="text-sm text-gray-400 font-bold uppercase tracking-widest flex justify-between">
                       <span>Rebuy Duplo:</span> <span className="text-white">R$ {fenachimEvent.doubleRebuyValue} <span className="text-[10px] text-gray-500 font-normal">/ {fenachimEvent.doubleRebuyChips}</span></span>
                     </div>
                   )}
                   <div className="text-sm text-gray-400 font-bold uppercase tracking-widest flex justify-between">
                     <span>Add-on Simples:</span> <span className="text-white">{fenachimEvent?.addonValue ? `R$ ${fenachimEvent.addonValue}` : 'R$ 50'} <span className="text-[10px] text-gray-500 font-normal">/ {fenachimEvent?.addonChips || '30k'}</span></span>
                   </div>
                   {fenachimEvent?.doubleAddonValue && (
                     <div className="text-sm text-gray-400 font-bold uppercase tracking-widest flex justify-between">
                       <span>Add-on Duplo:</span> <span className="text-white">R$ {fenachimEvent.doubleAddonValue} <span className="text-[10px] text-gray-500 font-normal">/ {fenachimEvent.doubleAddonChips}</span></span>
                     </div>
                   )}
                </div>
              </div>
            </div>

            <button 
              onClick={openReservationModal}
              disabled={isReserving}
              className={`mt-8 w-full ${!isLoggedIn ? 'bg-transparent border border-primary text-primary hover:bg-primary/10' : 'bg-gradient-to-r from-primary to-accent text-white border-0 shadow-neon-pink hover:opacity-90'} font-black uppercase tracking-widest py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2`}
            >
              <span className="material-icons-outlined">
                {!isLoggedIn ? 'login' : 'how_to_reg'}
              </span>
              {!isLoggedIn ? 'FAÇA LOGIN PARA RESERVAR' : 'RESERVAR ASSENTO NO POKER'}
            </button>
          </div>

        </div>

        {/* Gratuity Text */}
        <div className="mt-12 text-center max-w-3xl mx-auto bg-green-500/5 p-6 rounded-2xl border border-green-500/20">
          <p className="text-sm md:text-base text-gray-300 font-bold tracking-widest uppercase leading-relaxed">
            * <span className="text-green-400">Jogadores</span> terão <span className="text-white font-black">entrada gratuita no Parque da Fenachim</span> durante os dias em que estiverem participando dos eventos.
          </p>
        </div>
      </div>

      {/* MODAL DE RESERVA (Replica of EventCalendar) */}
      {showModal && fenachimEvent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm overflow-y-auto">
            <div className="bg-[#1c1c1c] border border-primary/30 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(217,0,255,0.15)] animate-in fade-in zoom-in duration-200 relative my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={() => setShowModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="material-icons-outlined">close</span>
                </button>

                <div className="p-6 md:p-8">
                    <div className={`flex items-center gap-3 ${isAlreadyReserved ? 'text-blue-500' : 'text-primary'} mb-6`}>
                        <span className="material-icons-outlined text-4xl">{isAlreadyReserved ? 'info' : 'event_seat'}</span>
                        <h2 className="text-2xl font-bold uppercase tracking-wider">{isAlreadyReserved ? 'Informações da Reserva' : 'Confirmar Reserva'}</h2>
                    </div>

                    <div className="space-y-6 text-gray-300">
                        <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Ocupação Atual</h4>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-white">{currentReservationsCount}</span>
                                        <span className="text-gray-500 font-bold uppercase">Assentos Reservados</span>
                                    </div>
                                </div>
                                <button onClick={() => setShowReservationPlayers(!showReservationPlayers)} className="w-16 h-16 rounded-full border-4 border-white/10 flex items-center justify-center relative shadow-inner cursor-pointer hover:bg-white/5 transition-colors group" title="Ver Jogadores garantidos">
                                    <span className="material-icons-outlined text-primary z-10 text-xl group-hover:scale-110 transition-transform">people</span>
                                    <span className="absolute bottom-1 text-[8px] font-bold text-primary uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-1 rounded-sm z-20">Ver Lista</span>
                                </button>
                            </div>

                            {/* Reservation Players Expansion */}
                            {showReservationPlayers && reservationPlayers.length > 0 && (
                                <div className="mt-4 p-3 bg-black/60 rounded-xl space-y-2 max-h-40 overflow-y-auto border border-white/5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 sticky top-0 bg-[#0f1011] p-1 -m-1 z-10">Jogadores Garantidos:</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                        {reservationPlayers.map((player, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                                                <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden shrink-0">
                                                    <img src={player?.avatar_url || '/default-avatar.png'} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=User&background=random'; }} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-300 truncate">{player?.name || 'Desconhecido'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-white mb-2 mt-6">Seus Compromissos:</h3>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li>Você se compromete em comparecer ao evento <strong>{fenachimEvent.title}</strong> na data <strong>{fenachimEvent.date.split('-').reverse().join('/')}</strong>, às <strong>15:00h</strong>.</li>
                                <li>Nós nos comprometemos a garantir que sempre haverá <strong>um(1) assento disponível</strong> para você iniciar este torneio.</li>
                                <li>A reserva é um acordo de cavalheiros. O cancelamento sem aviso prévio nos lesa profundamente e pode afetar futuras reservas.</li>
                                <li>O pagamento pode ser realizado presencialmente na hora ou debitado via App Poker caso você possua créditos Online.</li>
                            </ul>
                        </div>

                        {(fenachimEvent.timeChipChips || fenachimEvent.timeChipAddonChips || fenachimEvent.timeChipDiscountBrl) && (
                            <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl">
                                <h3 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                                    <span className="material-icons-outlined">redeem</span> 
                                    Bônus de Reserva do App:
                                </h3>
                                <ul className="space-y-1 text-sm font-semibold">
                                    {fenachimEvent.timeChipChips && (
                                        <li className="flex items-center gap-2 text-white">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> 
                                            +{fenachimEvent.timeChipChips} Fichas extras (bônus no Buy-In).
                                        </li>
                                    )}
                                    {fenachimEvent.timeChipAddonChips && (
                                        <li className="flex items-center gap-2 text-white">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> 
                                            +{fenachimEvent.timeChipAddonChips} Fichas extras (bônus no Add-On).
                                        </li>
                                    )}
                                    {fenachimEvent.timeChipDiscountBrl && (
                                        <li className="flex items-center gap-2 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">
                                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> 
                                            Você receberá {String(fenachimEvent.timeChipDiscountBrl).toLowerCase() === 'free' ? 'Staff Free' : `Desconto de R$ ${fenachimEvent.timeChipDiscountBrl}`} ao iniciar a compra!
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-6">
                            {isAlreadyReserved ? (
                                <>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest transition-all"
                                    >
                                        Fechar
                                    </button>
                                    <button
                                        onClick={cancelReservation}
                                        className="flex-1 py-4 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons-outlined">cancel</span>
                                        Cancelar Reserva
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={confirmReservation}
                                    disabled={isReserving}
                                    className="w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex justify-center items-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-neon-pink"
                                >
                                    {isReserving ? 'PROCESSANDO...' : 'EU CONCORDO E QUERO RESERVAR'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
