import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { RankingPlayer } from '../types';
import { supabase } from '../src/lib/supabase';

interface RoundResults {
  [playerName: string]: number; // playerName -> position: 1, 2, 3, 4 or 0 (DNP)
}

interface GroupState {
  id: string;
  name: string;
  players: string[]; // Exactly 4 player names
  rounds: {
    1: RoundResults;
    2: RoundResults;
    3: RoundResults;
    4: RoundResults;
  };
  tieBreakerOverride?: string; // Player name who wins manual tie-breaker
}

interface PlayerStats {
  name: string;
  points: number;
  wins: number; // number of 1st places
  vices: number; // number of 2nd places
  eliminations: number; // number of 4th places
}

interface BracketMatch {
  id: string; // e.g. '16avos-1', 'oitavas-1', 'quartas-1', 'semi-1', 'final', '3place'
  player1: string;
  player2: string;
  score1?: number;
  score2?: number;
  winner?: 1 | 2;
  status: 'finalizado' | 'agendado' | 'ao_vivo';
  date: string;
  buyIn: string;
  rebuy: string;
}

interface BracketState {
  '16avos': BracketMatch[];
  'oitavas': BracketMatch[];
  'quartas': BracketMatch[];
  'semis': BracketMatch[];
  'finais': BracketMatch[]; // Match 0: Final, Match 1: 3rd Place
}

interface MatchCardProps {
  player1: string;
  player2: string;
  score1?: number;
  score2?: number;
  date: string;
  buyIn: string;
  rebuy: string;
  winner?: 1 | 2;
  status: 'finalizado' | 'agendado' | 'ao_vivo';
  gameLabel?: string;
}

const MatchCard: React.FC<MatchCardProps> = ({
  player1,
  player2,
  score1,
  score2,
  date,
  buyIn,
  rebuy,
  winner,
  status,
  gameLabel
}) => {
  const isFinished = status === 'finalizado';
  const isLive = status === 'ao_vivo';
  
  // Determine winner by score or manual override
  const p1Winner = winner === 1 || (isFinished && score1 !== undefined && score2 !== undefined && score1 > score2);
  const p2Winner = winner === 2 || (isFinished && score1 !== undefined && score2 !== undefined && score2 > score1);
  
  return (
    <div className={`relative bg-[#0d091a]/90 border rounded-2xl p-4 transition-all duration-300 ${
      isLive 
        ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]' 
        : isFinished
          ? 'border-white/5 opacity-90 hover:opacity-100 hover:border-white/10'
          : 'border-white/5 hover:border-white/10'
    }`}>
      {/* Live Badge */}
      {isLive && (
        <div className="absolute -top-2.5 right-4 bg-red-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] tracking-wider z-10">
          AO VIVO
        </div>
      )}
      
      {/* Match Meta Information */}
      <div className="flex justify-between items-center text-[9px] text-gray-500 uppercase font-display tracking-wider mb-3">
        <div className="flex items-center gap-2">
          {gameLabel && (
            <span className="bg-red-500/10 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded font-black tracking-wider text-[8px]">
              {gameLabel}
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="material-icons text-[10px] text-gray-600">calendar_today</span>
            {date}
          </span>
        </div>
        <span className="bg-black/40 px-2 py-0.5 rounded border border-white/5 font-semibold text-amber-500">
          {buyIn}
        </span>
      </div>

      {/* Players Duel Grid */}
      <div className="space-y-2.5">
        {/* Player 1 Row */}
        <div className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
          isFinished
            ? p1Winner
              ? 'bg-amber-500/10 border-amber-500/35 text-white'
              : 'bg-black/20 border-white/5 text-gray-500'
            : 'bg-black/30 border-white/5 text-gray-300'
        }`}>
          <div className="flex items-center gap-2 truncate">
            {isFinished && p1Winner && (
              <span className="material-icons text-amber-500 text-xs shrink-0">emoji_events</span>
            )}
            <span className={`text-xs font-semibold truncate ${isFinished && p1Winner ? 'text-amber-400 font-bold' : ''}`}>
              {player1 || 'A definir'}
            </span>
          </div>
          {status !== 'agendado' && (
            <span className={`font-display font-black text-sm px-2 ${
              isFinished 
                ? p1Winner 
                  ? 'text-amber-400' 
                  : 'text-gray-600' 
                : 'text-white'
            }`}>
              {score1 ?? 0}
            </span>
          )}
        </div>

        {/* VS Divider Visual */}
        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-x-0 h-px bg-white/5" />
          <span className="relative px-2.5 bg-[#0d091a] text-[9px] font-display font-black text-red-500/60 uppercase tracking-widest">VS</span>
        </div>

        {/* Player 2 Row */}
        <div className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
          isFinished
            ? p2Winner
              ? 'bg-amber-500/10 border-amber-500/35 text-white'
              : 'bg-black/20 border-white/5 text-gray-500'
            : 'bg-black/30 border-white/5 text-gray-300'
        }`}>
          <div className="flex items-center gap-2 truncate">
            {isFinished && p2Winner && (
              <span className="material-icons text-amber-500 text-xs shrink-0">emoji_events</span>
            )}
            <span className={`text-xs font-semibold truncate ${isFinished && p2Winner ? 'text-amber-400 font-bold' : ''}`}>
              {player2 || 'A definir'}
            </span>
          </div>
          {status !== 'agendado' && (
            <span className={`font-display font-black text-sm px-2 ${
              isFinished 
                ? p2Winner 
                  ? 'text-amber-400' 
                  : 'text-gray-600' 
                : 'text-white'
            }`}>
              {score2 ?? 0}
            </span>
          )}
        </div>
      </div>

      {/* Footer Info inside Card */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-between items-center text-[8px] text-gray-500 uppercase tracking-wider font-display">
        <span>Rebuy: {rebuy}</span>
        <span className={`px-1.5 py-0.5 rounded font-semibold ${
          isLive 
            ? 'bg-red-950/40 text-red-400 border border-red-500/20' 
            : isFinished 
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
              : 'bg-gray-800 text-gray-400 border-transparent'
        }`}>
          {isLive ? 'AO VIVO' : isFinished ? 'CONCLUÍDO' : 'AGENDADO'}
        </span>
      </div>
    </div>
  );
};

export const CopaMundoChipRace: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { 
    getAllUniquePlayers, 
    isAdmin: globalIsAdmin,
    currentUser,
    isLoggedIn,
    userReservations,
    refreshSupabaseData
  } = useApp();
  
  // Developer override to test Admin mode on localhost easily
  const [simulatedAdmin, setSimulatedAdmin] = useState(false);
  const isAdmin = isLoggedIn && (globalIsAdmin || simulatedAdmin);

  const [groups, setGroups] = useState<GroupState[]>([]);
  const [bracket, setBracket] = useState<BracketState | null>(null);
  
  const [activeGroupTab, setActiveGroupTab] = useState<'A-F' | 'G-L'>('A-F');
  const [activeBracketRound, setActiveBracketRound] = useState<'16avos' | 'oitavas' | 'quartas' | 'semis' | 'finais'>('16avos');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Modal / Group Editing states
  const [editingGroup, setEditingGroup] = useState<GroupState | null>(null);
  const [editPlayers, setEditPlayers] = useState<string[]>(['', '', '', '']);
  const [editRounds, setEditRounds] = useState<{ 1: RoundResults; 2: RoundResults; 3: RoundResults; 4: RoundResults }>({
    1: {}, 2: {}, 3: {}, 4: {}
  });
  const [editTieBreaker, setEditTieBreaker] = useState<string>('');
  const [searchQueries, setSearchQueries] = useState<string[]>(['', '', '', '']);
  const [showSearchDropdowns, setShowSearchDropdowns] = useState<boolean[]>([false, false, false, false]);

  // Modal / HU Match Editing states
  const [editingMatch, setEditingMatch] = useState<{ roundKey: keyof BracketState; matchIndex: number } | null>(null);
  const [editMatchPlayer1, setEditMatchPlayer1] = useState('');
  const [editMatchPlayer2, setEditMatchPlayer2] = useState('');
  const [editMatchScore1, setEditMatchScore1] = useState<number | ''>('');
  const [editMatchScore2, setEditMatchScore2] = useState<number | ''>('');
  const [editMatchWinner, setEditMatchWinner] = useState<1 | 2 | ''>('');
  const [editMatchStatus, setEditMatchStatus] = useState<'finalizado' | 'agendado' | 'ao_vivo'>('agendado');
  const [searchQueryM1, setSearchQueryM1] = useState('');
  const [searchQueryM2, setSearchQueryM2] = useState('');
  const [showDropdownM1, setShowDropdownM1] = useState(false);
  const [showDropdownM2, setShowDropdownM2] = useState(false);

  const allSystemPlayers = getAllUniquePlayers ? getAllUniquePlayers() : [];

  const [showCopaModal, setShowCopaModal] = useState(false);
  const [isReservingCopa, setIsReservingCopa] = useState(false);
  const hasCopaReservation = userReservations?.includes('c0ca0000-0000-0000-0000-000000002026');

  const handleCopaButtonClick = () => {
    if (!isLoggedIn) {
      alert("Você precisa estar logado para garantir sua vaga!");
      onNavigate('login');
      return;
    }
    setShowCopaModal(true);
  };

  const handleConfirmCopaReservation = async () => {
    if (!currentUser || !currentUser.id) return;
    setIsReservingCopa(true);
    try {
      const { error } = await supabase
        .from('tournament_reservations')
        .insert({
          event_id: 'c0ca0000-0000-0000-0000-000000002026',
          user_id: currentUser.id,
          status: 'reserved',
          metadata: {
            source: 'app_bonus_claim'
          }
        });

      if (error) {
        if (error.code === '23505') {
          alert("Você já garantiu sua vaga!");
        } else {
          console.error("Erro ao reservar:", error);
          alert("Não foi possível garantir sua vaga no momento.");
        }
      } else {
        alert("Sua vaga foi garantida com sucesso!");
        if (refreshSupabaseData) {
          await refreshSupabaseData();
        }
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      alert("Ocorreu um erro ao processar sua vaga.");
    } finally {
      setIsReservingCopa(false);
      setShowCopaModal(false);
    }
  };

  const handleCancelCopaReservation = async () => {
    if (!currentUser || !currentUser.id) return;
    if (!window.confirm("Deseja realmente cancelar sua reserva para a Copa do Mundo?")) return;
    
    setIsReservingCopa(true);
    try {
      const { error } = await supabase
        .from('tournament_reservations')
        .delete()
        .eq('event_id', 'c0ca0000-0000-0000-0000-000000002026')
        .eq('user_id', currentUser.id);

      if (error) throw error;

      alert("Sua reserva foi cancelada com sucesso.");
      if (refreshSupabaseData) {
        await refreshSupabaseData();
      }
    } catch (err: any) {
      console.error("Erro ao cancelar reserva:", err);
      alert("Erro ao cancelar reserva: " + (err.message || "Erro desconhecido"));
    } finally {
      setIsReservingCopa(false);
      setShowCopaModal(false);
    }
  };

  // Seed default realistic simulation data
  const defaultGroups: GroupState[] = [
    {
      id: 'A', name: 'GRUPO A',
      players: ['NutsMaster', 'FoguetePoker', 'BlefeEstelar', 'DonkeyKong'],
      rounds: {
        1: { 'NutsMaster': 1, 'FoguetePoker': 2, 'BlefeEstelar': 3, 'DonkeyKong': 4 },
        2: { 'NutsMaster': 3, 'FoguetePoker': 1, 'BlefeEstelar': 2, 'DonkeyKong': 4 },
        3: { 'NutsMaster': 1, 'FoguetePoker': 3, 'BlefeEstelar': 2, 'DonkeyKong': 4 },
        4: { 'NutsMaster': 1, 'FoguetePoker': 2, 'BlefeEstelar': 3, 'DonkeyKong': 4 }
      }
    },
    {
      id: 'B', name: 'GRUPO B',
      players: ['AA_Vencedor', 'ReiDoShowdown', 'InstaCall', 'AllInTudoOuNada'],
      rounds: {
        1: { 'AA_Vencedor': 1, 'ReiDoShowdown': 2, 'InstaCall': 3, 'AllInTudoOuNada': 4 },
        2: { 'AA_Vencedor': 2, 'ReiDoShowdown': 1, 'InstaCall': 3, 'AllInTudoOuNada': 4 },
        3: { 'AA_Vencedor': 1, 'ReiDoShowdown': 3, 'InstaCall': 2, 'AllInTudoOuNada': 4 },
        4: { 'AA_Vencedor': 1, 'ReiDoShowdown': 2, 'InstaCall': 3, 'AllInTudoOuNada': 4 }
      }
    },
    {
      id: 'C', name: 'GRUPO C',
      players: ['PirataDoCaribe', 'MestreDosMagos', 'FlushRoyal', 'VentoNorte'],
      rounds: {
        1: { 'PirataDoCaribe': 1, 'MestreDosMagos': 2, 'FlushRoyal': 3, 'VentoNorte': 4 },
        2: { 'PirataDoCaribe': 2, 'MestreDosMagos': 1, 'FlushRoyal': 3, 'VentoNorte': 4 },
        3: { 'PirataDoCaribe': 3, 'MestreDosMagos': 1, 'FlushRoyal': 2, 'VentoNorte': 4 },
        4: { 'PirataDoCaribe': 1, 'MestreDosMagos': 2, 'FlushRoyal': 3, 'VentoNorte': 4 }
      }
    },
    {
      id: 'D', name: 'GRUPO D',
      players: ['CopasValete', 'NoveGaucho', 'BackdoorNut', 'SlowPlayer'],
      rounds: {
        1: { 'CopasValete': 1, 'NoveGaucho': 2, 'BackdoorNut': 3, 'SlowPlayer': 4 },
        2: { 'CopasValete': 1, 'NoveGaucho': 3, 'BackdoorNut': 2, 'SlowPlayer': 4 },
        3: { 'CopasValete': 1, 'NoveGaucho': 2, 'BackdoorNut': 3, 'SlowPlayer': 4 },
        4: { 'CopasValete': 3, 'NoveGaucho': 1, 'BackdoorNut': 2, 'SlowPlayer': 4 }
      }
    },
    {
      id: 'E', name: 'GRUPO E',
      players: ['TexasBoss', 'BaralhoDourado', 'SharkAtack', 'GatoPreto'],
      rounds: {
        1: { 'TexasBoss': 1, 'BaralhoDourado': 2, 'SharkAtack': 3, 'GatoPreto': 4 },
        2: { 'TexasBoss': 1, 'BaralhoDourado': 3, 'SharkAtack': 2, 'GatoPreto': 4 },
        3: { 'TexasBoss': 1, 'BaralhoDourado': 2, 'SharkAtack': 3, 'GatoPreto': 4 },
        4: { 'TexasBoss': 2, 'BaralhoDourado': 1, 'SharkAtack': 3, 'GatoPreto': 4 }
      }
    },
    {
      id: 'F', name: 'GRUPO F',
      players: ['CoringaEsportes', 'DamaDeEspadas', 'ZapCarioca', 'OverpairQQ'],
      rounds: {
        1: { 'CoringaEsportes': 1, 'DamaDeEspadas': 2, 'ZapCarioca': 3, 'OverpairQQ': 4 },
        2: { 'CoringaEsportes': 1, 'DamaDeEspadas': 3, 'ZapCarioca': 2, 'OverpairQQ': 4 },
        3: { 'CoringaEsportes': 1, 'DamaDeEspadas': 2, 'ZapCarioca': 3, 'OverpairQQ': 4 },
        4: { 'CoringaEsportes': 2, 'DamaDeEspadas': 1, 'ZapCarioca': 3, 'OverpairQQ': 4 }
      }
    },
    {
      id: 'G', name: 'GRUPO G',
      players: ['ReiDoOmaha', 'BountyHunter', 'RunnerRunner', 'LimperFeliz'],
      rounds: {
        1: { 'ReiDoOmaha': 1, 'BountyHunter': 2, 'RunnerRunner': 3, 'LimperFeliz': 4 },
        2: { 'ReiDoOmaha': 1, 'BountyHunter': 3, 'RunnerRunner': 2, 'LimperFeliz': 4 },
        3: { 'ReiDoOmaha': 1, 'BountyHunter': 2, 'RunnerRunner': 3, 'LimperFeliz': 4 },
        4: { 'ReiDoOmaha': 2, 'BountyHunter': 1, 'RunnerRunner': 3, 'LimperFeliz': 4 }
      }
    },
    {
      id: 'H', name: 'GRUPO H',
      players: ['FullHouseTop', 'DoubleBarrel', 'Assobiador', 'CheckRaiseViciado'],
      rounds: {
        1: { 'FullHouseTop': 1, 'DoubleBarrel': 2, 'Assobiador': 3, 'CheckRaiseViciado': 4 },
        2: { 'FullHouseTop': 1, 'DoubleBarrel': 3, 'Assobiador': 2, 'CheckRaiseViciado': 4 },
        3: { 'FullHouseTop': 1, 'DoubleBarrel': 2, 'Assobiador': 3, 'CheckRaiseViciado': 4 },
        4: { 'FullHouseTop': 3, 'DoubleBarrel': 1, 'Assobiador': 2, 'CheckRaiseViciado': 4 }
      }
    },
    {
      id: 'I', name: 'GRUPO I',
      players: ['PocketAces_AA', 'SidePotWinner', 'MinRaiseChato', 'FoldadorFrequente'],
      rounds: {
        1: { 'PocketAces_AA': 1, 'SidePotWinner': 2, 'MinRaiseChato': 3, 'FoldadorFrequente': 4 },
        2: { 'PocketAces_AA': 1, 'SidePotWinner': 3, 'MinRaiseChato': 2, 'FoldadorFrequente': 4 },
        3: { 'PocketAces_AA': 1, 'SidePotWinner': 2, 'MinRaiseChato': 3, 'FoldadorFrequente': 4 },
        4: { 'PocketAces_AA': 2, 'SidePotWinner': 1, 'MinRaiseChato': 3, 'FoldadorFrequente': 4 }
      }
    },
    {
      id: 'J', name: 'GRUPO J',
      players: ['RedLineGod', 'GTO_Soldier', 'ExploitKing', 'FishLover'],
      rounds: {
        1: { 'RedLineGod': 1, 'GTO_Soldier': 2, 'ExploitKing': 3, 'FishLover': 4 },
        2: { 'RedLineGod': 1, 'GTO_Soldier': 3, 'ExploitKing': 2, 'FishLover': 4 },
        3: { 'RedLineGod': 1, 'GTO_Soldier': 2, 'ExploitKing': 3, 'FishLover': 4 },
        4: { 'RedLineGod': 2, 'GTO_Soldier': 1, 'ExploitKing': 3, 'FishLover': 4 }
      }
    },
    {
      id: 'K', name: 'GRUPO K',
      players: ['OurosK', 'HeadsUpAssasin', 'OutsInder', 'CoinFlipHater'],
      rounds: {
        1: { 'OurosK': 1, 'HeadsUpAssasin': 2, 'OutsInder': 3, 'CoinFlipHater': 4 },
        2: { 'OurosK': 1, 'HeadsUpAssasin': 3, 'OutsInder': 2, 'CoinFlipHater': 4 },
        3: { 'OurosK': 1, 'HeadsUpAssasin': 2, 'OutsInder': 3, 'CoinFlipHater': 4 },
        4: { 'OurosK': 3, 'HeadsUpAssasin': 1, 'OutsInder': 2, 'CoinFlipHater': 4 }
      }
    },
    {
      id: 'L', name: 'GRUPO L',
      players: ['ValkyriePoker', 'HeroCall99', 'ReraiseMaster', 'MuckAndCry'],
      rounds: {
        1: { 'ValkyriePoker': 1, 'HeroCall99': 2, 'ReraiseMaster': 3, 'MuckAndCry': 4 },
        2: { 'ValkyriePoker': 1, 'HeroCall99': 3, 'ReraiseMaster': 2, 'MuckAndCry': 4 },
        3: { 'ValkyriePoker': 1, 'HeroCall99': 2, 'ReraiseMaster': 3, 'MuckAndCry': 4 },
        4: { 'ValkyriePoker': 2, 'HeroCall99': 1, 'ReraiseMaster': 3, 'MuckAndCry': 4 }
      }
    }
  ];

  // Seed default Bracket
  // Seed default Bracket
  const defaultBracket: BracketState = {
    '16avos': [
      { id: '16avos-1', player1: 'Campeão Grupo A', player2: '8º melhor 3º colocado', status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-2', player1: 'Campeão Grupo B', player2: '7º melhor 3º colocado', status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-3', player1: 'Campeão Grupo C', player2: '6º melhor 3º colocado', status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-4', player1: 'Campeão Grupo D', player2: '5º melhor 3º colocado', status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-5', player1: 'Campeão Grupo E', player2: '4º melhor 3º colocado', status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-6', player1: 'Campeão Grupo F', player2: '3º melhor 3º colocado', status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-7', player1: 'Campeão Grupo G', player2: '2º melhor 3º colocado', status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-8', player1: 'Campeão Grupo H', player2: '1º melhor 3º colocado', status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-9', player1: 'Campeão Grupo I', player2: 'Vice Grupo L', status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-10', player1: 'Campeão Grupo J', player2: 'Vice Grupo K', status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-11', player1: 'Campeão Grupo K', player2: 'Vice Grupo J', status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-12', player1: 'Campeão Grupo L', player2: 'Vice Grupo I', status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-13', player1: 'Vice Grupo A', player2: 'Vice Grupo H', status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-14', player1: 'Vice Grupo B', player2: 'Vice Grupo G', status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-15', player1: 'Vice Grupo C', player2: 'Vice Grupo F', status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-16', player1: 'Vice Grupo D', player2: 'Vice Grupo E', status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' }
    ],
    'oitavas': [
      { id: 'oitavas-1', player1: 'Venc. Jogo 1 (16-avos)', player2: 'Venc. Jogo 16 (16-avos)', status: 'agendado', date: '08/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: 'oitavas-2', player1: 'Venc. Jogo 2 (16-avos)', player2: 'Venc. Jogo 15 (16-avos)', status: 'agendado', date: '08/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: 'oitavas-3', player1: 'Venc. Jogo 3 (16-avos)', player2: 'Venc. Jogo 14 (16-avos)', status: 'agendado', date: '08/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: 'oitavas-4', player1: 'Venc. Jogo 4 (16-avos)', player2: 'Venc. Jogo 13 (16-avos)', status: 'agendado', date: '08/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: 'oitavas-5', player1: 'Venc. Jogo 5 (16-avos)', player2: 'Venc. Jogo 12 (16-avos)', status: 'agendado', date: '08/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: 'oitavas-6', player1: 'Venc. Jogo 6 (16-avos)', player2: 'Venc. Jogo 11 (16-avos)', status: 'agendado', date: '08/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: 'oitavas-7', player1: 'Venc. Jogo 7 (16-avos)', player2: 'Venc. Jogo 10 (16-avos)', status: 'agendado', date: '08/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: 'oitavas-8', player1: 'Venc. Jogo 8 (16-avos)', player2: 'Venc. Jogo 9 (16-avos)', status: 'agendado', date: '08/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' }
    ],
    'quartas': [
      { id: 'quartas-1', player1: 'Venc. Jogo 1 (Oitavas)', player2: 'Venc. Jogo 8 (Oitavas)', status: 'agendado', date: '12/07, 20:00', buyIn: 'Grátis', rebuy: 'R$100' },
      { id: 'quartas-2', player1: 'Venc. Jogo 2 (Oitavas)', player2: 'Venc. Jogo 7 (Oitavas)', status: 'agendado', date: '12/07, 21:30', buyIn: 'Grátis', rebuy: 'R$100' },
      { id: 'quartas-3', player1: 'Venc. Jogo 3 (Oitavas)', player2: 'Venc. Jogo 6 (Oitavas)', status: 'agendado', date: '12/07, 20:00', buyIn: 'Grátis', rebuy: 'R$100' },
      { id: 'quartas-4', player1: 'Venc. Jogo 4 (Oitavas)', player2: 'Venc. Jogo 5 (Oitavas)', status: 'agendado', date: '12/07, 21:30', buyIn: 'Grátis', rebuy: 'R$100' }
    ],
    'semis': [
      { id: 'semis-1', player1: 'Venc. Jogo 1 (Quartas)', player2: 'Venc. Jogo 4 (Quartas)', status: 'agendado', date: '15/07, 20:00', buyIn: 'Grátis', rebuy: 'R$100' },
      { id: 'semis-2', player1: 'Venc. Jogo 2 (Quartas)', player2: 'Venc. Jogo 3 (Quartas)', status: 'agendado', date: '15/07, 21:30', buyIn: 'Grátis', rebuy: 'R$100' }
    ],
    'finais': [
      { id: 'final', player1: 'Venc. Semifinal 1', player2: 'Venc. Semifinal 2', status: 'agendado', date: '19/07, 21:00', buyIn: 'Grátis', rebuy: 'Até 2x R$100' },
      { id: '3place', player1: 'Perd. Semifinal 1', player2: 'Perd. Semifinal 2', status: 'agendado', date: '19/07, 19:00', buyIn: 'Grátis', rebuy: 'Até 2x R$100' }
    ]
  };

  // Load from localStorage or seed
  useEffect(() => {
    const savedGroups = localStorage.getItem('cr_copa_mundo_groups_v3');
    if (savedGroups) {
      try {
        const parsed = JSON.parse(savedGroups);
        // Compatibility check: verify if the loaded state has the old object-based structure or is missing rounds
        if (Array.isArray(parsed) && parsed.length > 0 && (!parsed[0].rounds || typeof parsed[0].players[0] === 'object')) {
          setGroups(defaultGroups);
          localStorage.setItem('cr_copa_mundo_groups_v3', JSON.stringify(defaultGroups));
        } else {
          setGroups(parsed);
        }
      } catch (e) {
        setGroups(defaultGroups);
      }
    } else {
      setGroups(defaultGroups);
      localStorage.setItem('cr_copa_mundo_groups_v3', JSON.stringify(defaultGroups));
    }

    const savedBracket = localStorage.getItem('cr_copa_mundo_bracket_v3');
    if (savedBracket) {
      try {
        const parsed = JSON.parse(savedBracket);
        // Compatibility check for bracket structure
        if (!parsed || !parsed['16avos'] || !parsed['16avos'][0] || typeof parsed['16avos'][0].player1 === 'object' || parsed['16avos'][0].player1 === 'NutsMaster' || parsed['oitavas'][0].player1 === '') {
          setBracket(defaultBracket);
          localStorage.setItem('cr_copa_mundo_bracket_v3', JSON.stringify(defaultBracket));
        } else {
          setBracket(parsed);
        }
      } catch (e) {
        setBracket(defaultBracket);
      }
    } else {
      setBracket(defaultBracket);
      localStorage.setItem('cr_copa_mundo_bracket_v3', JSON.stringify(defaultBracket));
    }
  }, []);

  // Live countdown to June 7, 2026 at 20:00 (Copa do Mundo Chip Race launch date)
  useEffect(() => {
    const targetDate = new Date('2026-06-07T20:00:00').getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const saveGroupsData = (updatedGroups: GroupState[]) => {
    setGroups(updatedGroups);
    localStorage.setItem('cr_copa_mundo_groups_v3', JSON.stringify(updatedGroups));
  };

  const saveBracketData = (updatedBracket: BracketState) => {
    setBracket(updatedBracket);
    localStorage.setItem('cr_copa_mundo_bracket_v3', JSON.stringify(updatedBracket));
  };

  const handleResetToDefault = () => {
    if (window.confirm("Deseja mesmo resetar todos os dados dos grupos e chaveamento mata-mata para a estimativa padrão?")) {
      saveGroupsData(defaultGroups);
      saveBracketData(defaultBracket);
    }
  };

  // Calculation of points & stats & sorting
  const calculatePlayerStats = (player: string, group: GroupState): PlayerStats => {
    let points = 0;
    let wins = 0;
    let vices = 0;
    let eliminations = 0;

    const pName = typeof player === 'string' ? player : (player as any).name || '';

    if (group && group.rounds) {
      [1, 2, 3, 4].forEach((roundNum) => {
        const roundData = group.rounds[roundNum as 1 | 2 | 3 | 4];
        const position = roundData ? roundData[pName] : undefined;

        if (position === 1) {
          points += 5;
          wins += 1;
        } else if (position === 2) {
          points += 3;
          vices += 1;
        } else if (position === 3) {
          points += 2;
        } else if (position === 4) {
          points += 1;
          eliminations += 1;
        }
      });
    }

    return { name: pName, points, wins, vices, eliminations };
  };

  const getSortedGroupPlayers = (group: GroupState): PlayerStats[] => {
    if (!group || !group.players) return [];
    const stats = group.players.map(p => {
      const pName = typeof p === 'string' ? p : (p as any).name || '';
      return calculatePlayerStats(pName, group);
    });

    return stats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.vices !== a.vices) return b.vices - a.vices;

      if (group.tieBreakerOverride) {
        if (a.name === group.tieBreakerOverride) return -1;
        if (b.name === group.tieBreakerOverride) return 1;
      }

      return 0;
    });
  };

  const checkPerfectTie = (group: GroupState): boolean => {
    if (!group || !group.players) return false;
    const stats = group.players.map(p => {
      const pName = typeof p === 'string' ? p : (p as any).name || '';
      return calculatePlayerStats(pName, group);
    });
    for (let i = 0; i < stats.length; i++) {
      for (let j = i + 1; j < stats.length; j++) {
        const p1 = stats[i];
        const p2 = stats[j];
        if (p1.points === p2.points && p1.wins === p2.wins && p1.vices === p2.vices && !group.tieBreakerOverride) {
          return true;
        }
      }
    }
    return false;
  };

  // Group editing handlers
  const handleOpenEditGroup = (group: GroupState) => {
    setEditingGroup(group);
    setEditPlayers([...group.players]);
    setEditRounds({
      1: { ...group.rounds[1] },
      2: { ...group.rounds[2] },
      3: { ...group.rounds[3] },
      4: { ...group.rounds[4] }
    });
    setEditTieBreaker(group.tieBreakerOverride || '');
    setSearchQueries(['', '', '', '']);
    setShowSearchDropdowns([false, false, false, false]);
  };

  const handleSaveEditGroup = () => {
    if (!editingGroup) return;

    const filteredPlayers = editPlayers.filter(p => p.trim() !== '');
    if (filteredPlayers.length < 4) {
      alert("Por favor, adicione exatamente 4 jogadores ao grupo.");
      return;
    }
    const uniquePlayers = new Set(filteredPlayers);
    if (uniquePlayers.size !== 4) {
      alert("Todos os 4 jogadores do grupo devem ter nomes diferentes.");
      return;
    }

    const updatedGroups = groups.map(g => {
      if (g.id === editingGroup.id) {
        return {
          ...g,
          players: editPlayers,
          rounds: editRounds,
          tieBreakerOverride: editTieBreaker || undefined
        };
      }
      return g;
    });

    saveGroupsData(updatedGroups);
    setEditingGroup(null);
  };

  const handleSelectSystemPlayer = (index: number, name: string) => {
    const updated = [...editPlayers];
    updated[index] = name;
    setEditPlayers(updated);

    const updatedQueries = [...searchQueries];
    updatedQueries[index] = '';
    setSearchQueries(updatedQueries);

    const updatedDropdowns = [...showSearchDropdowns];
    updatedDropdowns[index] = false;
    setShowSearchDropdowns(updatedDropdowns);
  };

  const handlePlayerNameChange = (index: number, value: string) => {
    const updated = [...editPlayers];
    updated[index] = value;
    setEditPlayers(updated);

    const updatedQueries = [...searchQueries];
    updatedQueries[index] = value;
    setSearchQueries(updatedQueries);

    const updatedDropdowns = [...showSearchDropdowns];
    updatedDropdowns[index] = true;
    setShowSearchDropdowns(updatedDropdowns);
  };

  const handleSetRoundPosition = (roundNum: 1 | 2 | 3 | 4, position: number, playerName: string) => {
    const currentRound = { ...editRounds[roundNum] };

    Object.keys(currentRound).forEach(name => {
      if (name === playerName) {
        delete currentRound[name];
      }
    });

    if (position !== 0) {
      Object.keys(currentRound).forEach(name => {
        if (currentRound[name] === position) {
          delete currentRound[name];
        }
      });
      currentRound[playerName] = position;
    } else {
      currentRound[playerName] = 0;
    }

    setEditRounds({
      ...editRounds,
      [roundNum]: currentRound
    });
  };

  // BRACKET GENERATION ENGINE (Campeao Grupo x 3º Lugar etc.)
  const handleGenerateBracket = () => {
    if (!window.confirm("Deseja mesmo gerar as posições e o chaveamento Mata-Mata baseado nos resultados atuais da Fase de Grupos? Isto irá resetar o progresso dos mata-matas.")) {
      return;
    }

    // 1. Extract Champions (1st), Runner-ups (2nd), and 3rd place players of all 12 groups A to L
    const championsMap: Record<string, string> = {}; // groupID -> playerName
    const runnerupsMap: Record<string, string> = {}; // groupID -> playerName
    const thirdPlacesList: { name: string; stats: PlayerStats }[] = [];

    groups.forEach((g) => {
      const sorted = getSortedGroupPlayers(g);
      // Slot 0 is Champion, Slot 1 is Runner-up, Slot 2 is 3rd, Slot 3 is 4th
      championsMap[g.id] = sorted[0]?.name || '';
      runnerupsMap[g.id] = sorted[1]?.name || '';
      if (sorted[2]) {
        thirdPlacesList.push({
          name: sorted[2].name,
          stats: sorted[2]
        });
      }
    });

    // 2. Sort the 12 third-place players overall to find the 8 best 3rd-places
    const sortedThirds = thirdPlacesList.sort((a, b) => {
      if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
      if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
      if (b.stats.vices !== a.stats.vices) return b.stats.vices - a.stats.vices;
      return 0;
    });

    const best3rds = sortedThirds.map(t => t.name); // best3rds[0] = 1st best, best3rds[7] = 8th best 3rd

    // Fill blank slots if not enough players
    const getBest3rd = (rankIndex: number) => {
      return best3rds[rankIndex] || `3º Colocado (${rankIndex + 1}º Melhor)`;
    };

    // 3. Assemble the Round of 32 (16-avos)
    const new16avos: BracketMatch[] = [
      // HU 1: campeao grupo A x 8º melhor 3º colocado de grupos
      { id: '16avos-1', player1: championsMap['A'] || 'Campeão Grupo A', player2: getBest3rd(7), status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      // HU 2: campeao grupo B x 7º melhor 3º colocado
      { id: '16avos-2', player1: championsMap['B'] || 'Campeão Grupo B', player2: getBest3rd(6), status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      // HU 3: campeao grupo C x 6º melhor 3º colocado
      { id: '16avos-3', player1: championsMap['C'] || 'Campeão Grupo C', player2: getBest3rd(5), status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      // HU 4: campeao grupo D x 5º melhor 3º colocado
      { id: '16avos-4', player1: championsMap['D'] || 'Campeão Grupo D', player2: getBest3rd(4), status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      // HU 5: campeao grupo E x 4º melhor 3º colocado
      { id: '16avos-5', player1: championsMap['E'] || 'Campeão Grupo E', player2: getBest3rd(3), status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      // HU 6: campeao grupo F x 3º melhor 3º colocado
      { id: '16avos-6', player1: championsMap['F'] || 'Campeão Grupo F', player2: getBest3rd(2), status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      // HU 7: campeao grupo G x 2º melhor 3º colocado
      { id: '16avos-7', player1: championsMap['G'] || 'Campeão Grupo G', player2: getBest3rd(1), status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      // HU 8: campeao grupo H x 1º melhor 3º colocado
      { id: '16avos-8', player1: championsMap['H'] || 'Campeão Grupo H', player2: getBest3rd(0), status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      
      // Remaining Champions (I, J, K, L) vs Runner-ups (L, K, J, I)
      { id: '16avos-9', player1: championsMap['I'] || 'Campeão Grupo I', player2: runnerupsMap['L'] || 'Vice Grupo L', status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-10', player1: championsMap['J'] || 'Campeão Grupo J', player2: runnerupsMap['K'] || 'Vice Grupo K', status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-11', player1: championsMap['K'] || 'Campeão Grupo K', player2: runnerupsMap['J'] || 'Vice Grupo J', status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-12', player1: championsMap['L'] || 'Campeão Grupo L', player2: runnerupsMap['I'] || 'Vice Grupo I', status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      
      // Remaining Runner-ups against each other (A vs H, B vs G, C vs F, D vs E)
      { id: '16avos-13', player1: runnerupsMap['A'] || 'Vice Grupo A', player2: runnerupsMap['H'] || 'Vice Grupo H', status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-14', player1: runnerupsMap['B'] || 'Vice Grupo B', player2: runnerupsMap['G'] || 'Vice Grupo G', status: 'agendado', date: '05/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-15', player1: runnerupsMap['C'] || 'Vice Grupo C', player2: runnerupsMap['F'] || 'Vice Grupo F', status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' },
      { id: '16avos-16', player1: runnerupsMap['D'] || 'Vice Grupo D', player2: runnerupsMap['E'] || 'Vice Grupo E', status: 'agendado', date: '05/07, 21:30', buyIn: 'R$50', rebuy: '1 Permitido' }
    ];

    // Compute advancement state from these new 16avos
    const newBracketState = runAdvancementProgress(new16avos, {
      '16avos': new16avos,
      'oitavas': Array.from({ length: 8 }, (_, i) => ({ id: `oitavas-${i+1}`, player1: '', player2: '', status: 'agendado', date: '08/07, 20:00', buyIn: 'R$50', rebuy: '1 Permitido' })),
      'quartas': Array.from({ length: 4 }, (_, i) => ({ id: `quartas-${i+1}`, player1: '', player2: '', status: 'agendado', date: '12/07, 20:00', buyIn: 'Grátis', rebuy: 'R$100' })),
      'semis': Array.from({ length: 2 }, (_, i) => ({ id: `semis-${i+1}`, player1: '', player2: '', status: 'agendado', date: '15/07, 20:00', buyIn: 'Grátis', rebuy: 'R$100' })),
      'finais': [
        { id: 'final', player1: '', player2: '', status: 'agendado', date: '19/07, 21:00', buyIn: 'Grátis', rebuy: 'Até 2x R$100' },
        { id: '3place', player1: '', player2: '', status: 'agendado', date: '19/07, 19:00', buyIn: 'Grátis', rebuy: 'Até 2x R$100' }
      ]
    });

    saveBracketData(newBracketState);
    setActiveBracketRound('16avos');
    alert("Chaveamento Mata-Mata gerado com sucesso baseado nas classificações!");
  };

  // FULL BRACKET PROGRESSION RECURSIVE ENGINE
  const runAdvancementProgress = (current16avos: BracketMatch[], currentBracket: BracketState): BracketState => {
    const updated = { ...currentBracket };
    updated['16avos'] = [...current16avos];

    const getWinner = (m: BracketMatch) => {
      if (m.status !== 'finalizado') return '';
      const s1 = m.score1 ?? 0;
      const s2 = m.score2 ?? 0;
      if (s1 === s2) {
        return m.winner === 1 ? m.player1 : m.winner === 2 ? m.player2 : '';
      }
      return s1 > s2 ? m.player1 : m.player2;
    };

    const getLoser = (m: BracketMatch) => {
      if (m.status !== 'finalizado') return '';
      const s1 = m.score1 ?? 0;
      const s2 = m.score2 ?? 0;
      if (s1 === s2) {
        return m.winner === 1 ? m.player2 : m.winner === 2 ? m.player1 : '';
      }
      return s1 > s2 ? m.player2 : m.player1;
    };

    // 1. Advance 16avos -> oitavas
    const newOitavas = updated['oitavas'].map((m, idx) => {
      const w1 = getWinner(updated['16avos'][idx]);
      const w2 = getWinner(updated['16avos'][15 - idx]);
      return {
        ...m,
        player1: w1 || m.player1 || `Venc. Jogo ${idx + 1} (16-avos)`,
        player2: w2 || m.player2 || `Venc. Jogo ${16 - idx} (16-avos)`
      };
    });
    updated['oitavas'] = newOitavas;

    // 2. Advance oitavas -> quartas
    const newQuartas = updated['quartas'].map((m, idx) => {
      const w1 = getWinner(updated['oitavas'][idx]);
      const w2 = getWinner(updated['oitavas'][7 - idx]);
      return {
        ...m,
        player1: w1 || m.player1 || `Venc. Jogo ${idx + 1} (Oitavas)`,
        player2: w2 || m.player2 || `Venc. Jogo ${8 - idx} (Oitavas)`
      };
    });
    updated['quartas'] = newQuartas;

    // 3. Advance quartas -> semis
    const newSemis = updated['semis'].map((m, idx) => {
      const qIndex1 = idx === 0 ? 0 : 1;
      const qIndex2 = idx === 0 ? 3 : 2;
      const w1 = getWinner(updated['quartas'][qIndex1]);
      const w2 = getWinner(updated['quartas'][qIndex2]);
      return {
        ...m,
        player1: w1 || m.player1 || `Venc. Jogo ${qIndex1 + 1} (Quartas)`,
        player2: w2 || m.player2 || `Venc. Jogo ${qIndex2 + 1} (Quartas)`
      };
    });
    updated['semis'] = newSemis;

    // 4. Advance semis -> finais (Match 0: Final, Match 1: 3rd Place)
    const newFinais = updated['finais'].map((m, idx) => {
      if (idx === 0) {
        // Grande Final
        const w1 = getWinner(updated['semis'][0]);
        const w2 = getWinner(updated['semis'][1]);
        return {
          ...m,
          player1: w1 || m.player1 || 'Venc. Semifinal 1',
          player2: w2 || m.player2 || 'Venc. Semifinal 2'
        };
      } else {
        // 3rd Place Playoff
        const l1 = getLoser(updated['semis'][0]);
        const l2 = getLoser(updated['semis'][1]);
        return {
          ...m,
          player1: l1 || m.player1 || 'Perd. Semifinal 1',
          player2: l2 || m.player2 || 'Perd. Semifinal 2'
        };
      }
    });
    updated['finais'] = newFinais;

    return updated;
  };

  // HU Match edit triggers
  const handleOpenEditMatch = (roundKey: keyof BracketState, matchIndex: number) => {
    if (!bracket) return;
    const match = bracket[roundKey][matchIndex];
    setEditingMatch({ roundKey, matchIndex });
    setEditMatchPlayer1(match.player1);
    setEditMatchPlayer2(match.player2);
    setEditMatchScore1(match.score1 !== undefined ? match.score1 : '');
    setEditMatchScore2(match.score2 !== undefined ? match.score2 : '');
    setEditMatchWinner(match.winner || '');
    setEditMatchStatus(match.status);
    setSearchQueryM1('');
    setSearchQueryM2('');
    setShowDropdownM1(false);
    setShowDropdownM2(false);
  };

  const handleSaveEditMatch = () => {
    if (!editingMatch || !bracket) return;

    const { roundKey, matchIndex } = editingMatch;
    const currentMatches = [...bracket[roundKey]];
    const oldMatch = currentMatches[matchIndex];

    const score1Val = editMatchScore1 !== '' ? Number(editMatchScore1) : undefined;
    const score2Val = editMatchScore2 !== '' ? Number(editMatchScore2) : undefined;

    let computedWinner: 1 | 2 | undefined = undefined;
    if (editMatchWinner) {
      computedWinner = editMatchWinner as 1 | 2;
    } else if (score1Val !== undefined && score2Val !== undefined) {
      if (score1Val > score2Val) computedWinner = 1;
      else if (score2Val > score1Val) computedWinner = 2;
    }

    const updatedMatch: BracketMatch = {
      ...oldMatch,
      player1: editMatchPlayer1,
      player2: editMatchPlayer2,
      score1: score1Val,
      score2: score2Val,
      winner: computedWinner,
      status: editMatchStatus
    };

    currentMatches[matchIndex] = updatedMatch;

    // Run bracket advancement flow dynamically so changes propagate recursive all the way!
    let updatedBracketState = { ...bracket };
    updatedBracketState[roundKey] = currentMatches;

    // If we changed 16avos, we must advance oitavas onwards
    if (roundKey === '16avos') {
      updatedBracketState = runAdvancementProgress(currentMatches, updatedBracketState);
    } else if (roundKey === 'oitavas') {
      // If we changed oitavas, we re-run advancement starting at oitavas -> quartas -> semis -> final
      const getWinner = (m: BracketMatch) => {
        if (m.status !== 'finalizado') return '';
        const s1 = m.score1 ?? 0;
        const s2 = m.score2 ?? 0;
        if (s1 === s2) return m.winner === 1 ? m.player1 : m.winner === 2 ? m.player2 : '';
        return s1 > s2 ? m.player1 : m.player2;
      };
      const getLoser = (m: BracketMatch) => {
        if (m.status !== 'finalizado') return '';
        const s1 = m.score1 ?? 0;
        const s2 = m.score2 ?? 0;
        if (s1 === s2) return m.winner === 1 ? m.player2 : m.winner === 2 ? m.player1 : '';
        return s1 > s2 ? m.player2 : m.player1;
      };

      updatedBracketState['quartas'] = updatedBracketState['quartas'].map((m, idx) => ({
        ...m,
        player1: getWinner(updatedBracketState['oitavas'][idx]),
        player2: getWinner(updatedBracketState['oitavas'][7 - idx])
      }));
      updatedBracketState['semis'] = updatedBracketState['semis'].map((m, idx) => {
        if (idx === 0) {
          return { ...m, player1: getWinner(updatedBracketState['quartas'][0]), player2: getWinner(updatedBracketState['quartas'][3]) };
        } else {
          return { ...m, player1: getWinner(updatedBracketState['quartas'][1]), player2: getWinner(updatedBracketState['quartas'][2]) };
        }
      });
      updatedBracketState['finais'] = updatedBracketState['finais'].map((m, idx) => {
        if (idx === 0) {
          return { ...m, player1: getWinner(updatedBracketState['semis'][0]), player2: getWinner(updatedBracketState['semis'][1]) };
        } else {
          return { ...m, player1: getLoser(updatedBracketState['semis'][0]), player2: getLoser(updatedBracketState['semis'][1]) };
        }
      });
    } else if (roundKey === 'quartas') {
      const getWinner = (m: BracketMatch) => {
        if (m.status !== 'finalizado') return '';
        const s1 = m.score1 ?? 0;
        const s2 = m.score2 ?? 0;
        if (s1 === s2) return m.winner === 1 ? m.player1 : m.winner === 2 ? m.player2 : '';
        return s1 > s2 ? m.player1 : m.player2;
      };
      const getLoser = (m: BracketMatch) => {
        if (m.status !== 'finalizado') return '';
        const s1 = m.score1 ?? 0;
        const s2 = m.score2 ?? 0;
        if (s1 === s2) return m.winner === 1 ? m.player2 : m.winner === 2 ? m.player1 : '';
        return s1 > s2 ? m.player2 : m.player1;
      };

      updatedBracketState['semis'] = updatedBracketState['semis'].map((m, idx) => {
        if (idx === 0) {
          return { ...m, player1: getWinner(updatedBracketState['quartas'][0]), player2: getWinner(updatedBracketState['quartas'][3]) };
        } else {
          return { ...m, player1: getWinner(updatedBracketState['quartas'][1]), player2: getWinner(updatedBracketState['quartas'][2]) };
        }
      });
      updatedBracketState['finais'] = updatedBracketState['finais'].map((m, idx) => {
        if (idx === 0) {
          return { ...m, player1: getWinner(updatedBracketState['semis'][0]), player2: getWinner(updatedBracketState['semis'][1]) };
        } else {
          return { ...m, player1: getLoser(updatedBracketState['semis'][0]), player2: getLoser(updatedBracketState['semis'][1]) };
        }
      });
    } else if (roundKey === 'semis') {
      const getWinner = (m: BracketMatch) => {
        if (m.status !== 'finalizado') return '';
        const s1 = m.score1 ?? 0;
        const s2 = m.score2 ?? 0;
        if (s1 === s2) return m.winner === 1 ? m.player1 : m.winner === 2 ? m.player2 : '';
        return s1 > s2 ? m.player1 : m.player2;
      };
      const getLoser = (m: BracketMatch) => {
        if (m.status !== 'finalizado') return '';
        const s1 = m.score1 ?? 0;
        const s2 = m.score2 ?? 0;
        if (s1 === s2) return m.winner === 1 ? m.player2 : m.winner === 2 ? m.player1 : '';
        return s1 > s2 ? m.player2 : m.player1;
      };

      updatedBracketState['finais'] = updatedBracketState['finais'].map((m, idx) => {
        if (idx === 0) {
          return { ...m, player1: getWinner(updatedBracketState['semis'][0]), player2: getWinner(updatedBracketState['semis'][1]) };
        } else {
          return { ...m, player1: getLoser(updatedBracketState['semis'][0]), player2: getLoser(updatedBracketState['semis'][1]) };
        }
      });
    }

    saveBracketData(updatedBracketState);
    setEditingMatch(null);
  };

  // Group filter logic based on selected tab A-F or G-L
  const filteredGroups = groups.filter(g => {
    if (activeGroupTab === 'A-F') {
      return ['A', 'B', 'C', 'D', 'E', 'F'].includes(g.id);
    } else {
      return ['G', 'H', 'I', 'J', 'K', 'L'].includes(g.id);
    }
  });

  return (
    <div className="copa-mundo-page min-h-screen bg-[#070511] text-gray-200 font-body relative overflow-hidden pb-12">
      <style dangerouslySetInnerHTML={{__html: `
        .copa-mundo-page {
          font-size: 18px !important; /* Aumenta a fonte geral em 2px */
        }
        .copa-mundo-page .text-[8px] { font-size: 10px !important; }
        .copa-mundo-page .text-[9px] { font-size: 11px !important; }
        .copa-mundo-page .text-[10px] { font-size: 12px !important; }
        .copa-mundo-page .text-xs { font-size: 14px !important; }
        .copa-mundo-page .text-sm { font-size: 16px !important; }
        .copa-mundo-page .text-base { font-size: 18px !important; }
        .copa-mundo-page .text-lg { font-size: 20px !important; }
        .copa-mundo-page .text-xl { font-size: 24px !important; }
        .copa-mundo-page .text-2xl { font-size: 28px !important; }
        .copa-mundo-page .text-3xl { font-size: 32px !important; }
        .copa-mundo-page .text-4xl { font-size: 40px !important; }
        .copa-mundo-page .text-5xl { font-size: 50px !important; }
        .copa-mundo-page .text-6xl { font-size: 62px !important; }
        .copa-mundo-page .text-7xl { font-size: 74px !important; }
        
        .bg-watermark {
          mix-blend-mode: screen;
          mask-image: radial-gradient(circle, black 40%, transparent 85%);
          -webkit-mask-image: radial-gradient(circle, black 40%, transparent 85%);
        }
        
        /* Ajustes responsivos para Mobile */
        @media (max-width: 640px) {
          .copa-mundo-page {
            font-size: 16px !important;
          }
          .copa-mundo-page .text-7xl { font-size: 44px !important; }
          .copa-mundo-page .text-6xl { font-size: 36px !important; }
          .copa-mundo-page .text-5xl { font-size: 30px !important; }
          .copa-mundo-page .text-4xl { font-size: 24px !important; }
          .copa-mundo-page .text-3xl { font-size: 20px !important; }
          .copa-mundo-page .text-2xl { font-size: 18px !important; }
        }
      `}} />
      {/* Decorative Cinematic Spotlight glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[550px] bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.12)_0%,rgba(15,8,28,0)_70%)] pointer-events-none z-0" />
      <div className="absolute top-[800px] left-[-200px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(245,158,11,0.02)_0%,transparent_75%)] pointer-events-none z-0" />
      <div className="absolute top-[1600px] right-[-200px] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(239,68,68,0.03)_0%,transparent_75%)] pointer-events-none z-0" />

      {/* Cyber table lines */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(239,68,68,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.6)_1px,transparent_1px)] bg-[size:45px_45px] pointer-events-none z-0" />

      {/* Fixed Background Watermark Logo */}
      <div className="fixed inset-0 pointer-events-none z-0 select-none overflow-hidden flex items-center justify-center">
        <div className="w-[95vw] max-w-[1250px] aspect-square opacity-[0.14] bg-watermark">
          <img 
            src="/copa-logo.jpg" 
            alt="Copa do Mundo Background Watermark Fixed" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ================= HEADER HERO SECTION ================= */}
        <header className="pt-16 pb-12 sm:py-24 text-center relative flex flex-col items-center">

          {/* Prominent Event Logo Emblem */}
          <div className="mb-8 w-44 h-44 sm:w-52 sm:h-52 relative animate-in zoom-in duration-1000 select-none">
            {/* outer glowing ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-red-600 to-amber-500 opacity-25 blur-xl animate-pulse" />
            <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-amber-500 to-red-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-black/80 backdrop-blur-sm overflow-hidden flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.25)]">
                <img 
                  src="/copa-logo.jpg" 
                  alt="Copa do Mundo Event Logo" 
                  className="w-full h-full object-cover scale-105 filter brightness-110 contrast-105" 
                />
              </div>
            </div>
          </div>

          {/* Trophy reflection badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1b0811] border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.08)] mb-4 animate-in slide-in-from-top-4 duration-1000">
            <span className="material-icons text-amber-500 text-xs">emoji_events</span>
            <span className="text-[10px] sm:text-xs font-display font-black text-red-400 tracking-wider uppercase">COPA DO MUNDO DE POKER CHIP RACE 2026</span>
          </div>

          {/* New Prominent Prize Text Banner requested */}
          <div className="bg-[#1b0a15]/95 border-2 border-amber-500/35 hover:border-amber-400/60 transition-colors rounded-3xl px-4 py-4 sm:px-6 sm:py-5 max-w-3xl mx-auto text-center shadow-[0_0_35px_rgba(245,158,11,0.15)] mb-8 animate-in zoom-in duration-700 select-none">
            <span className="font-display font-black text-[10px] sm:text-xs text-amber-400 tracking-[0.25em] uppercase block mb-2">PROJEÇÃO EXCLUSIVA DE PRÊMIOS</span>
            <span className="text-white text-sm sm:text-base md:text-lg font-bold font-display uppercase tracking-wide block leading-relaxed drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">
              <span className="text-amber-400 text-glow-blue">8K em prêmios</span> <span className="text-gray-400 text-xs sm:text-sm lowercase font-normal">(grupos a oitavas)</span>
              <span className="mx-2 text-white/40">+</span>
              <span className="text-amber-400 text-glow-blue">12K em prêmios</span> <span className="text-gray-400 text-xs sm:text-sm lowercase font-normal">(quartas em diante)</span>
              <br className="hidden sm:block" />
              <span className="sm:mt-1 inline-block">
                <span className="mx-2 hidden sm:inline text-white/40">+</span>
                <span className="text-red-400 text-shadow-red">Vaga The Chosen 30K</span>
                <span className="mx-2 text-white/40">+</span>
                <span className="text-amber-400">Troféu Campeão</span>
              </span>
            </span>
          </div>

          {/* Large Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight text-white mb-6 uppercase leading-none select-none">
            COPA DO MUNDO<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-red-500 to-amber-500 text-shadow-gold tracking-wide">
              CHIP RACE
            </span>
          </h1>

          {/* Subtitle */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-8 mt-2 mb-10 text-gray-300 font-display font-bold text-sm sm:text-base tracking-[0.15em] uppercase">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-lg">⚡</span> 48 jogadores
            </div>
            <div className="hidden sm:block text-gray-700 font-normal">|</div>
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-lg">🛡️</span> 12 grupos
            </div>
            <div className="hidden sm:block text-gray-700 font-normal">|</div>
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-lg">🏆</span> 1 campeão mundial
            </div>
          </div>

          {/* Countdown Area */}
          <div className="bg-[#0b0716]/90 border border-white/5 shadow-[0_0_35px_rgba(0,0,0,0.4)] rounded-3xl p-5 sm:p-7 max-w-lg w-full mb-10 backdrop-blur-md">
            <h4 className="text-[10px] sm:text-xs font-display font-black uppercase text-gray-400 tracking-[0.3em] mb-4">CONTAGEM REGRESSIVA PARA O INÍCIO</h4>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-[#120c24] border border-white/5 rounded-2xl py-3 px-1">
                <div className="text-2xl sm:text-3xl font-display font-black text-amber-400 leading-none mb-1">{String(countdown.days).padStart(2, '0')}</div>
                <div className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gray-500">Dias</div>
              </div>
              <div className="bg-[#120c24] border border-white/5 rounded-2xl py-3 px-1">
                <div className="text-2xl sm:text-3xl font-display font-black text-white leading-none mb-1">{String(countdown.hours).padStart(2, '0')}</div>
                <div className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gray-500">Horas</div>
              </div>
              <div className="bg-[#120c24] border border-white/5 rounded-2xl py-3 px-1">
                <div className="text-2xl sm:text-3xl font-display font-black text-white leading-none mb-1">{String(countdown.minutes).padStart(2, '0')}</div>
                <div className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gray-500">Min</div>
              </div>
              <div className="bg-[#120c24] border border-white/5 rounded-2xl py-3 px-1">
                <div className="text-2xl sm:text-3xl font-display font-black text-red-500 leading-none mb-1">{String(countdown.seconds).padStart(2, '0')}</div>
                <div className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gray-500">Seg</div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCopaButtonClick}
            className={`group relative ${hasCopaReservation ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.55)] text-white' : 'bg-gradient-to-r from-amber-500 via-red-600 to-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.55)]'} font-black uppercase text-xs sm:text-sm tracking-[0.2em] px-8 py-3.5 sm:px-12 sm:py-4.5 rounded-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 overflow-hidden`}
          >
            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            <span className="relative z-10 flex items-center gap-2">
              <span className="material-icons-outlined text-sm">{hasCopaReservation ? 'check_circle' : 'local_activity'}</span>
              {hasCopaReservation ? 'SUA VAGA ESTÁ GARANTIDA' : 'GARANTA SUA VAGA'}
            </span>
          </button>
        </header>

        {/* ================= GROUP STAGE SECTION ================= */}
        <section className="py-12 border-t border-white/5">
          <div className="text-center mb-10">
            <span className="text-[10px] font-display font-black text-red-500 tracking-[0.3em] uppercase block mb-1">FASE CLASSIFICATÓRIA</span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-wider">FASE DE GRUPOS</h2>
            <div className="h-[2px] w-20 bg-red-600 mx-auto mt-3 rounded-full shadow-[0_0_8px_#dc2626]" />
            <p className="mt-4 text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed font-light px-2">
              Os 48 competidores divididos em 12 grupos de 4. Cada grupo joga 4 rodadas Sit & Go. Cada rodada gera pontos para as posições: **1º (Campeão) = 5 pts, 2º (Vice) = 3 pts, 3º = 2 pts, 4º = 1 pt**. Não participantes recebem 0. Critérios de desempate ordenados: mais vezes campeão ➔ vice-campeão ➔ rodada de desempate HU ou 3-handed.
            </p>

            {/* Observation block added as requested */}
            <div className="mt-6 max-w-2xl mx-auto bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-left animate-in fade-in duration-500">
              <span className="material-icons text-amber-500 shrink-0 select-none text-base">info_outline</span>
              <div>
                <span className="text-amber-400 font-display font-black text-[10px] uppercase tracking-wider block mb-1">Observação Importante</span>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  O mesmo jogador pode se inscrever em **mais de um grupo simultaneamente**, caso necessário, para completarmos o quadro de 48 participantes (consulte as regras específicas para esta função).
                </p>
              </div>
            </div>
          </div>

          {/* Group navigation tabs */}
          <div className="flex justify-center gap-3 mb-8">
            <button
              onClick={() => setActiveGroupTab('A-F')}
              className={`px-6 py-2.5 rounded-xl font-display text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeGroupTab === 'A-F' ? 'bg-red-950/45 border border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-[#0d091a]/30 border border-white/5 text-gray-400 hover:text-white'}`}
            >
              GRUPOS A AO F
            </button>
            <button
              onClick={() => setActiveGroupTab('G-L')}
              className={`px-6 py-2.5 rounded-xl font-display text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeGroupTab === 'G-L' ? 'bg-red-950/45 border border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-[#0d091a]/30 border border-white/5 text-gray-400 hover:text-white'}`}
            >
              GRUPOS G AO L
            </button>
          </div>

          {/* Group Mosaico/Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => {
              const sortedPlayers = getSortedGroupPlayers(group);
              const isTied = checkPerfectTie(group);

              return (
                <div key={group.id} className={`bg-[#0b0716]/80 border ${isTied ? 'border-amber-500/45' : 'border-white/5'} rounded-3xl p-5 flex flex-col justify-between hover:border-red-500/25 transition-colors duration-300 relative`}>
                  
                  {isTied && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded px-2 py-0.5 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      <span>⚠️ Empate Técnico</span>
                    </div>
                  )}

                  {/* Group Title Header */}
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-black tracking-widest text-white uppercase">{group.name}</h3>
                      {isAdmin && (
                        <button
                          onClick={() => handleOpenEditGroup(group)}
                          className="flex items-center gap-1 text-[9px] bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase rounded-lg px-2.5 py-1 transition-all"
                        >
                          <span className="material-icons text-[10px]">edit</span>
                          Editar
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-display font-semibold">FASE DE GRUPOS</span>
                  </div>

                  {/* Standing Table */}
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-gray-500 uppercase font-display text-[8px] tracking-wider border-b border-white/5">
                          <th className="py-1.5">Jogador</th>
                          <th className="py-1.5 text-center">Pts</th>
                          <th className="py-1.5 text-center">1ºs</th>
                          <th className="py-1.5 text-center">2ºs</th>
                          <th className="py-1.5 text-center">4ºs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sortedPlayers.map((p, pIdx) => {
                          const status = pIdx < 2 ? 'classificado' : pIdx === 2 ? 'repescagem' : 'eliminado';
                          const isClassificado = status === 'classificado';
                          const isRepescagem = status === 'repescagem';

                          return (
                            <tr key={p.name} className="hover:bg-white/[0.02]">
                              <td className="py-2 pr-2 font-medium flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isClassificado ? 'bg-emerald-500' : isRepescagem ? 'bg-amber-500' : 'bg-red-500'}`} />
                                <span className={isClassificado ? 'text-white font-semibold' : 'text-gray-400 truncate max-w-[110px]'}>
                                  {p.name || 'Vago'}
                                </span>
                                {group.tieBreakerOverride === p.name && (
                                  <span className="text-[8px] font-display font-black bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1 rounded-sm">HU</span>
                                )}
                              </td>
                              <td className={`py-2 text-center font-display font-black ${isClassificado ? 'text-emerald-400' : isRepescagem ? 'text-amber-400' : 'text-gray-500'}`}>{p.points}</td>
                              <td className="py-2 text-center text-gray-400 font-bold">{p.wins}</td>
                              <td className="py-2 text-center text-gray-400">{p.vices}</td>
                              <td className="py-2 text-center text-gray-500">{p.eliminations}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Qualification Indicators Details */}
                  <div className="flex justify-between items-center bg-black/25 p-2 rounded-xl border border-white/5 text-[8px] text-gray-500 font-light">
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Top 2</div>
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Melhores 3ºs</div>
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Elim</div>
                    </div>
                    {group.tieBreakerOverride && (
                      <span className="text-[8px] text-amber-500 font-semibold uppercase">Desempate HU Aplicado</span>
                    )}
                  </div>

                  {/* Tournament Schedule HUD inside group */}
                  <div className="bg-[#120c24]/50 border border-white/5 rounded-2xl p-3 mt-4">
                    <h4 className="text-[8px] font-display font-black uppercase text-gray-400 tracking-wider mb-2">Rodadas Sit & Go</h4>
                    <div className="space-y-2 text-[10px]">
                      {[1, 2, 3, 4].map((roundNum) => {
                        const roundData = group.rounds[roundNum as 1 | 2 | 3 | 4] || {};
                        const winner = Object.keys(roundData).find(name => roundData[name] === 1);
                        const hasPlayed = Object.keys(roundData).length > 0;
                        const isGroupAToF = ['A', 'B', 'C', 'D', 'E', 'F'].includes(group.id);
                        const roundDates = isGroupAToF 
                          ? { 1: '07/06', 2: '10/06', 3: '14/06', 4: '17/06' }
                          : { 1: '21/06', 2: '24/06', 3: '28/06', 4: '01/07' };
                        const rDate = roundDates[roundNum as 1 | 2 | 3 | 4];

                        return (
                          <div key={roundNum} className="flex justify-between items-center bg-black/15 px-2 py-1.5 rounded-lg border border-white/[0.02]">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-300">Sit & Go #{roundNum}</span>
                              <span className="text-[8px] text-gray-500 font-display font-semibold uppercase">{rDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-right">
                              <span className="text-gray-500 font-light text-[9px] truncate max-w-[100px]">
                                {hasPlayed && winner ? `Vencedor: ${winner}` : 'Não Lançada'}
                              </span>
                              <span className={`text-[8px] font-semibold uppercase px-1 rounded-sm ${hasPlayed ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20' : 'bg-[#1b0811] text-amber-500 border border-amber-500/20'}`}>
                                {hasPlayed ? 'FIM' : 'AGENDADO'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

        {/* ================= ADMIN GROUP EDITOR DRAWER MODAL ================= */}
        {editingGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0b081e] border-2 border-amber-500/40 rounded-3xl w-full max-w-2xl shadow-[0_0_60px_rgba(245,158,11,0.25)] relative overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="px-6 py-4.5 border-b border-white/5 flex justify-between items-center bg-black/30">
                <div>
                  <h3 className="text-lg font-display font-black text-white uppercase tracking-wider">
                    EDITAR {editingGroup.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Gerenciador de Jogadores e Rodadas</p>
                </div>
                <button
                  onClick={() => setEditingGroup(null)}
                  className="text-gray-400 hover:text-white transition-colors p-1.5 bg-white/5 rounded-full"
                >
                  <span className="material-icons text-xl">close</span>
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar max-h-[70vh]">
                
                {/* 1. EDIT GROUP PLAYERS */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <h4 className="font-display font-black text-xs text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <span className="material-icons text-xs">group</span>
                    1. Escalamento dos 4 Jogadores
                  </h4>
                  <p className="text-[10px] text-gray-400 font-light mb-4">
                    Digite ou pesquise para selecionar os usuários cadastrados do site. Nomes em branco desclassificam o slot.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[0, 1, 2, 3].map((slotIdx) => (
                      <div key={slotIdx} className="relative">
                        <label className="text-[9px] uppercase tracking-wider text-gray-500 block mb-1">Jogador Slot #{slotIdx + 1}</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={editPlayers[slotIdx] || ''}
                              onChange={(e) => handlePlayerNameChange(slotIdx, e.target.value)}
                              placeholder={`Nome do Jogador ${slotIdx + 1}`}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                              onFocus={() => {
                                const dropdowns = [false, false, false, false];
                                dropdowns[slotIdx] = true;
                                setShowSearchDropdowns(dropdowns);
                              }}
                            />
                            
                            {/* Autocomplete Dropdown Search list */}
                            {showSearchDropdowns[slotIdx] && (
                              <div className="absolute left-0 right-0 mt-1 max-h-36 overflow-y-auto bg-[#130f2c] border border-white/10 rounded-xl shadow-2xl z-50 custom-scrollbar">
                                {allSystemPlayers
                                  .filter(p => p.name.toLowerCase().includes(searchQueries[slotIdx].toLowerCase()))
                                  .map(p => (
                                    <button
                                      key={p.name}
                                      onClick={() => handleSelectSystemPlayer(slotIdx, p.name)}
                                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-amber-500 hover:text-black font-medium border-b border-white/5 flex items-center gap-2"
                                    >
                                      <span className="material-icons text-[10px] text-gray-500">person</span>
                                      {p.name}
                                    </button>
                                  ))}
                                {allSystemPlayers.filter(p => p.name.toLowerCase().includes(searchQueries[slotIdx].toLowerCase())).length === 0 && (
                                  <div className="p-2 text-center text-[10px] text-gray-500">Nenhum jogador encontrado. Pressione Enter para usar "{editPlayers[slotIdx]}".</div>
                                )}
                                <button
                                  onClick={() => {
                                    const dropdowns = [...showSearchDropdowns];
                                    dropdowns[slotIdx] = false;
                                    setShowSearchDropdowns(dropdowns);
                                  }}
                                  className="w-full py-1 text-center text-[8px] bg-black/25 text-red-400 font-bold uppercase tracking-wider border-t border-white/5"
                                >
                                  Fechar Lista
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. SUBMIT ROUND OUTCOMES */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <h4 className="font-display font-black text-xs text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span className="material-icons text-xs">emoji_events</span>
                    2. Lançamento de Resultados por Rodada (4 Sit & Gos)
                  </h4>
                  <p className="text-[10px] text-gray-400 font-light mb-4">
                    Assinale as posições de chegada para cada jogador em cada torneio. O sistema impede duplicidades de colocação por rodada.
                  </p>

                  <div className="space-y-5">
                    {[1, 2, 3, 4].map((roundNum) => {
                      const roundNumTyped = roundNum as 1 | 2 | 3 | 4;
                      return (
                        <div key={roundNum} className="border border-white/5 bg-black/25 rounded-2xl p-3.5">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-display font-black text-[10px] text-white uppercase tracking-wider">SIT & GO TORNEIO #{roundNum}</span>
                            <button
                              onClick={() => {
                                setEditRounds({
                                  ...editRounds,
                                  [roundNumTyped]: {}
                                });
                              }}
                              className="text-[8px] font-display bg-red-950/40 hover:bg-red-900/60 border border-red-500/25 px-2 py-0.5 rounded text-red-400 font-bold uppercase"
                            >
                              Limpar Rodada
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {editPlayers.map((player) => {
                              if (!player.trim()) return null;
                              const currentPos = editRounds[roundNumTyped]?.[player] ?? 0;

                              return (
                                <div key={player} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/[0.02] p-3 rounded-xl border border-white/[0.02] gap-2">
                                  <span className="text-xs text-gray-300 font-semibold">{player}</span>
                                  <div className="flex flex-wrap gap-1">
                                    {[
                                      { label: 'DNP (0pt)', val: 0, classes: 'bg-gray-800 text-gray-400 border-transparent' },
                                      { label: '1º (5pt)', val: 1, classes: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20' },
                                      { label: '2º (3pt)', val: 2, classes: 'bg-blue-950/60 text-blue-400 border-blue-500/20' },
                                      { label: '3º (2pt)', val: 3, classes: 'bg-amber-950/60 text-amber-400 border-amber-500/20' },
                                      { label: '4º (1pt)', val: 4, classes: 'bg-red-950/60 text-red-400 border-red-500/20' }
                                    ].map((pos) => {
                                      const isSel = currentPos === pos.val;
                                      return (
                                        <button
                                          key={pos.val}
                                          onClick={() => handleSetRoundPosition(roundNumTyped, pos.val, player)}
                                          className={`px-2 py-1 text-[8px] sm:text-[9px] font-display font-black uppercase tracking-wider rounded-lg border transition-all ${isSel ? 'scale-105 border-white bg-white text-black' : pos.classes + ' hover:opacity-80'}`}
                                        >
                                          {pos.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. TIE BREAKER RESOLUTION */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <h4 className="font-display font-black text-xs text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span className="material-icons text-xs">help_outline</span>
                    3. Desempate do Grupo (Heads-Up Direto / 3-Handed)
                  </h4>
                  <p className="text-[10px] text-gray-400 font-light mb-3">
                    Se dois ou mais jogadores empatarem perfeitamente em pontos, primeiros e segundos colocados, selecione quem venceu o duelo direto (Heads-Up/3-handed) de desempate.
                  </p>
                  
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-gray-500 block mb-1">Vencedor do Desempate (Opcional)</label>
                    <select
                      value={editTieBreaker}
                      onChange={(e) => setEditTieBreaker(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    >
                      <option value="">Sem desempate manual selecionado</option>
                      {editPlayers.filter(p => p.trim() !== '').map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              <div className="px-6 py-4.5 border-t border-white/5 bg-black/30 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setEditingGroup(null)}
                  className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-gray-400 font-bold uppercase transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEditGroup}
                  className="px-8 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-amber-500/20 transition-all"
                >
                  Salvar Grupo
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================= QUALIFICATION SECTION ================= */}
        <section className="py-12 border-t border-white/5 relative">
          <div className="text-center mb-10">
            <span className="text-[10px] font-display font-black text-amber-500 tracking-[0.3em] uppercase block mb-1">REGRAS DE TRANSIÇÃO</span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-wider">CLASSIFICAÇÃO</h2>
            <div className="h-[2px] w-20 bg-amber-500 mx-auto mt-3 rounded-full shadow-[0_0_8px_#f59e0b]" />
            <p className="mt-4 text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed font-light">
              Apenas os melhores seguem para a glória dos mata-matas. Confira a estrutura exata do avanço:
            </p>
          </div>

          <div className="bg-[#0b0716]/60 border border-white/5 rounded-3xl p-6 sm:p-8 max-w-5xl mx-auto overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative">
              
              {/* Left Stage Box */}
              <div className="lg:col-span-4 bg-[#120c24] border border-white/5 rounded-2xl p-5 text-center relative z-10">
                <span className="material-icons text-red-500 text-3xl mb-2 animate-bounce">group</span>
                <h4 className="font-display font-black text-sm text-white uppercase mb-2">FASE DE GRUPOS</h4>
                <div className="text-3xl font-display font-black text-red-500">48</div>
                <div className="text-[9px] uppercase tracking-widest text-gray-500 mt-1">Jogadores</div>
                <div className="h-px bg-white/5 my-4" />
                <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                  Divididos em 12 grupos de 4. Disputam 4 Sit & Gos acumulando pontuação de performance.
                </p>
              </div>

              {/* Center Connectors Vector Visualizer */}
              <div className="lg:col-span-4 flex flex-col justify-center items-center gap-4 py-4 lg:py-0 relative">
                <div className="hidden lg:block absolute left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 top-1/2 -translate-y-1/2 -z-10" />
                <div className="lg:hidden absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-amber-500 to-emerald-500 left-1/2 -translate-x-1/2 -z-10" />

                <div className="bg-[#0d091a] border border-emerald-500/30 rounded-xl px-3 py-1.5 shadow-[0_0_12px_rgba(16,185,129,0.15)] text-[10px] font-display font-semibold text-emerald-400 uppercase tracking-wider text-center">
                  👑 12 Campeões de Grupo
                </div>
                <div className="bg-[#0d091a] border border-emerald-500/30 rounded-xl px-3 py-1.5 shadow-[0_0_12px_rgba(16,185,129,0.15)] text-[10px] font-display font-semibold text-emerald-400 uppercase tracking-wider text-center">
                  🥈 12 Vice-Campeões
                </div>
                <div className="bg-[#0d091a] border border-amber-500/30 rounded-xl px-3 py-1.5 shadow-[0_0_12px_rgba(245,158,11,0.15)] text-[10px] font-display font-semibold text-amber-400 uppercase tracking-wider text-center">
                  ⚡ 8 Melhores 3º Colocados
                </div>
              </div>

              {/* Right Stage Box */}
              <div className="lg:col-span-4 bg-[#120c24] border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] rounded-2xl p-5 text-center relative z-10">
                <span className="material-icons text-emerald-400 text-3xl mb-2 animate-pulse">emoji_events</span>
                <h4 className="font-display font-black text-sm text-emerald-400 uppercase mb-2">CLASSIFICADOS</h4>
                <div className="text-3xl font-display font-black text-emerald-400">32</div>
                <div className="text-[9px] uppercase tracking-widest text-emerald-500 mt-1">Jogadores Elegíveis</div>
                <div className="h-px bg-white/5 my-4" />
                <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                  Avançam para os chaveamentos heads-up de mata-mata.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ================= ELIMINATION STAGE SECTION ================= */}
        <section className="py-12 border-t border-white/5">
          <div className="text-center mb-10">
            <span className="text-[10px] font-display font-black text-red-500 tracking-[0.3em] uppercase block mb-1">DECISÕES HEADS-UP</span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-wider">MATA-MATA HEADS UP</h2>
            <div className="h-[2px] w-20 bg-red-600 mx-auto mt-3 rounded-full shadow-[0_0_8px_#dc2626]" />
            <p className="mt-4 text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed font-light px-2">
              Heads-up de eliminação direta de altíssimo nível. Ganhe o duelo para avançar no chaveamento de elite! No modo administrador, use o botão especial abaixo para **puxar os classificados da fase de grupos e gerar o chaveamento inicial automaticamente** ou edite os duelos de forma individualizada.
            </p>
          </div>

          {/* Admin Bracket Actions */}
          {isAdmin && (
            <div className="flex justify-center mb-8 max-w-md mx-auto">
              <button
                onClick={handleGenerateBracket}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-red-600 text-black font-black uppercase text-xs tracking-wider px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-red-500/20 hover:scale-[1.02] transition-all"
              >
                <span className="material-icons">settings_suggest</span>
                Gerar Chaveamento de Elite (Puxar Classificados)
              </button>
            </div>
          )}

          {/* Interactive Round Bracket Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-4xl mx-auto">
            <button
              onClick={() => setActiveBracketRound('16avos')}
              className={`px-4 py-2.5 rounded-xl font-display text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${activeBracketRound === '16avos' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-[#0d091a]/40 border border-white/5 text-gray-400 hover:text-white'}`}
            >
              16-avos de Final (32 HU)
            </button>
            <button
              onClick={() => setActiveBracketRound('oitavas')}
              className={`px-4 py-2.5 rounded-xl font-display text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${activeBracketRound === 'oitavas' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-[#0d091a]/40 border border-white/5 text-gray-400 hover:text-white'}`}
            >
              Oitavas de Final (16 HU)
            </button>
            <button
              onClick={() => setActiveBracketRound('quartas')}
              className={`px-4 py-2.5 rounded-xl font-display text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${activeBracketRound === 'quartas' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-[#0d091a]/40 border border-white/5 text-gray-400 hover:text-white'}`}
            >
              Quartas de Final (8 HU)
            </button>
            <button
              onClick={() => setActiveBracketRound('semis')}
              className={`px-4 py-2.5 rounded-xl font-display text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${activeBracketRound === 'semis' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-[#0d091a]/40 border border-white/5 text-gray-400 hover:text-white'}`}
            >
              Semifinais (4 HU)
            </button>
            <button
              onClick={() => setActiveBracketRound('finais')}
              className={`px-4 py-2.5 rounded-xl font-display text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${activeBracketRound === 'finais' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] font-bold' : 'bg-[#0d091a]/40 border border-white/5 text-gray-400 hover:text-white'}`}
            >
              Final & 3º Lugar
            </button>
          </div>

          {/* Active Round Match Bracket View */}
          <div className="max-w-6xl mx-auto">
            {bracket && bracket[activeBracketRound] && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {bracket[activeBracketRound].map((match, idx) => (
                  <div key={match.id} className="relative group">
                    <MatchCard
                      player1={match.player1}
                      player2={match.player2}
                      score1={match.score1}
                      score2={match.score2}
                      date={match.date}
                      buyIn={match.buyIn}
                      rebuy={match.rebuy}
                      winner={match.winner}
                      status={match.status}
                      gameLabel={`Jogo ${idx + 1}`}
                    />
                    
                    {/* Admin Edit HU Match Card Button overlay */}
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenEditMatch(activeBracketRound, idx)}
                        className="absolute bottom-2 right-2 flex items-center gap-1 text-[8px] bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase rounded-lg px-2 py-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <span className="material-icons text-[9px]">edit</span>
                        Editar Duelo
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ================= ADMIN HU MATCH EDITOR MODAL ================= */}
        {editingMatch && bracket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0b081e] border-2 border-amber-500/40 rounded-3xl w-full max-w-lg shadow-[0_0_60px_rgba(245,158,11,0.25)] relative overflow-hidden flex flex-col">
              
              <div className="px-6 py-4.5 border-b border-white/5 flex justify-between items-center bg-black/30">
                <div>
                  <h3 className="text-base font-display font-black text-white uppercase tracking-wider">
                    EDITAR DUELO HU ({bracket[editingMatch.roundKey][editingMatch.matchIndex].id.toUpperCase()})
                  </h3>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">Editor de Chaveamento e Placar</p>
                </div>
                <button
                  onClick={() => setEditingMatch(null)}
                  className="text-gray-400 hover:text-white transition-colors p-1.5 bg-white/5 rounded-full"
                >
                  <span className="material-icons text-lg">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                
                {/* Player 1 Slot selection */}
                <div className="relative">
                  <label className="text-[9px] uppercase tracking-wider text-gray-500 block mb-1">Jogador Slot 1</label>
                  <input
                    type="text"
                    value={editMatchPlayer1}
                    onChange={(e) => {
                      setEditMatchPlayer1(e.target.value);
                      setSearchQueryM1(e.target.value);
                      setShowDropdownM1(true);
                    }}
                    placeholder="Nome do Jogador 1"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                  />
                  {showDropdownM1 && (
                    <div className="absolute left-0 right-0 mt-1 max-h-28 overflow-y-auto bg-[#130f2c] border border-white/10 rounded-xl shadow-2xl z-50 custom-scrollbar">
                      {allSystemPlayers
                        .filter(p => p.name.toLowerCase().includes(searchQueryM1.toLowerCase()))
                        .map(p => (
                          <button
                            key={p.name}
                            onClick={() => {
                              setEditMatchPlayer1(p.name);
                              setShowDropdownM1(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-amber-500 hover:text-black border-b border-white/5"
                          >
                            {p.name}
                          </button>
                        ))}
                      <button onClick={() => setShowDropdownM1(false)} className="w-full py-1 text-center text-[8px] bg-black/25 text-red-400 font-bold uppercase">Fechar</button>
                    </div>
                  )}
                </div>

                {/* Player 2 Slot selection */}
                <div className="relative">
                  <label className="text-[9px] uppercase tracking-wider text-gray-500 block mb-1">Jogador Slot 2</label>
                  <input
                    type="text"
                    value={editMatchPlayer2}
                    onChange={(e) => {
                      setEditMatchPlayer2(e.target.value);
                      setSearchQueryM2(e.target.value);
                      setShowDropdownM2(true);
                    }}
                    placeholder="Nome do Jogador 2"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                  />
                  {showDropdownM2 && (
                    <div className="absolute left-0 right-0 mt-1 max-h-28 overflow-y-auto bg-[#130f2c] border border-white/10 rounded-xl shadow-2xl z-50 custom-scrollbar">
                      {allSystemPlayers
                        .filter(p => p.name.toLowerCase().includes(searchQueryM2.toLowerCase()))
                        .map(p => (
                          <button
                            key={p.name}
                            onClick={() => {
                              setEditMatchPlayer2(p.name);
                              setShowDropdownM2(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-amber-500 hover:text-black border-b border-white/5"
                          >
                            {p.name}
                          </button>
                        ))}
                      <button onClick={() => setShowDropdownM2(false)} className="w-full py-1 text-center text-[8px] bg-black/25 text-red-400 font-bold uppercase">Fechar</button>
                    </div>
                  )}
                </div>

                {/* Score submissions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-gray-500 block mb-1">Placar Jogador 1</label>
                    <input
                      type="number"
                      value={editMatchScore1}
                      onChange={(e) => setEditMatchScore1(e.target.value !== '' ? Number(e.target.value) : '')}
                      placeholder="Pontos"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-gray-500 block mb-1">Placar Jogador 2</label>
                    <input
                      type="number"
                      value={editMatchScore2}
                      onChange={(e) => setEditMatchScore2(e.target.value !== '' ? Number(e.target.value) : '')}
                      placeholder="Pontos"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Manual Winner Override & Match status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-gray-500 block mb-1">Status da Partida</label>
                    <select
                      value={editMatchStatus}
                      onChange={(e) => setEditMatchStatus(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    >
                      <option value="agendado">Agendado</option>
                      <option value="ao_vivo">Ao Vivo</option>
                      <option value="finalizado">Concluído</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-gray-500 block mb-1">Vencedor Manual (Opcional)</label>
                    <select
                      value={editMatchWinner}
                      onChange={(e) => setEditMatchWinner(e.target.value ? Number(e.target.value) as 1 | 2 : '')}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    >
                      <option value="">Automático por Placar</option>
                      <option value="1">Jogador 1 ({editMatchPlayer1 || 'Sem nome'})</option>
                      <option value="2">Jogador 2 ({editMatchPlayer2 || 'Sem nome'})</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="px-6 py-4.5 border-t border-white/5 bg-black/30 flex justify-end gap-3">
                <button
                  onClick={() => setEditingMatch(null)}
                  className="px-5 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-gray-400 font-bold uppercase transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEditMatch}
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-widest transition-all"
                >
                  Salvar Duelo
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================= OFFICIAL SCHEDULE SECTION ================= */}
        <section className="py-12 border-t border-white/5">
          <div className="text-center mb-10">
            <span className="text-[10px] font-display font-black text-amber-500 tracking-[0.3em] uppercase block mb-1">DATAS E CONFRONTOS</span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-wider">CRONOGRAMA OFICIAL</h2>
            <div className="h-[2px] w-20 bg-amber-500 mx-auto mt-3 rounded-full shadow-[0_0_8px_#f59e0b]" />
            <p className="mt-4 text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed font-light px-2">
              Calendário completo das rodadas classificatórias e fases decisivas do mata-mata heads-up:
            </p>
          </div>

          <div className="bg-[#0b0716]/80 border border-white/5 rounded-3xl p-6 max-w-5xl mx-auto overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Group Stage Dates */}
              <div className="bg-black/25 border border-white/5 rounded-2xl p-5">
                <h4 className="font-display font-black text-sm text-amber-400 uppercase mb-4 flex items-center gap-2">
                  <span className="material-icons text-amber-500 text-base">calendar_month</span>
                  Fase de Grupos (Sit & Gos)
                </h4>
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 block mb-1.5">Grupos A ao F</span>
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-display">
                      <div className="bg-[#120c24] p-2 rounded-xl border border-white/5"><div className="text-[8px] text-gray-500">R1</div><div className="text-white font-bold">07/06</div></div>
                      <div className="bg-[#120c24] p-2 rounded-xl border border-white/5"><div className="text-[8px] text-gray-500">R2</div><div className="text-white font-bold">10/06</div></div>
                      <div className="bg-[#120c24] p-2 rounded-xl border border-white/5"><div className="text-[8px] text-gray-500">R3</div><div className="text-white font-bold">14/06</div></div>
                      <div className="bg-[#120c24] p-2 rounded-xl border border-white/5"><div className="text-[8px] text-gray-500">R4</div><div className="text-white font-bold">17/06</div></div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 block mb-1.5">Grupos G ao L</span>
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-display">
                      <div className="bg-[#120c24] p-2 rounded-xl border border-white/5"><div className="text-[8px] text-gray-500">R1</div><div className="text-white font-bold">21/06</div></div>
                      <div className="bg-[#120c24] p-2 rounded-xl border border-white/5"><div className="text-[8px] text-gray-500">R2</div><div className="text-white font-bold">24/06</div></div>
                      <div className="bg-[#120c24] p-2 rounded-xl border border-white/5"><div className="text-[8px] text-gray-500">R3</div><div className="text-white font-bold">28/06</div></div>
                      <div className="bg-[#120c24] p-2 rounded-xl border border-white/5"><div className="text-[8px] text-gray-500">R4</div><div className="text-white font-bold">01/07</div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bracket Stage Dates */}
              <div className="bg-black/25 border border-white/5 rounded-2xl p-5">
                <h4 className="font-display font-black text-sm text-red-500 uppercase mb-4 flex items-center gap-2">
                  <span className="material-icons text-red-500 text-base">emoji_events</span>
                  Mata-Mata (Heads-Up)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-[#120c24] px-3.5 py-2.5 rounded-xl border border-white/5">
                    <span className="font-medium text-gray-300">16-avos de Final (32 HU)</span>
                    <span className="font-display font-bold text-red-400">05/07</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#120c24] px-3.5 py-2.5 rounded-xl border border-white/5">
                    <span className="font-medium text-gray-300">Oitavas de Final (16 HU)</span>
                    <span className="font-display font-bold text-red-400">08/07</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#120c24] px-3.5 py-2.5 rounded-xl border border-white/5">
                    <span className="font-medium text-gray-300">Quartas de Final (8 HU)</span>
                    <span className="font-display font-bold text-red-400">12/07</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#120c24] px-3.5 py-2.5 rounded-xl border border-white/5">
                    <span className="font-medium text-gray-300">Semifinais (4 HU)</span>
                    <span className="font-display font-bold text-red-400">15/07</span>
                  </div>
                  <div className="flex justify-between items-center bg-amber-950/20 px-3.5 py-2.5 rounded-xl border border-amber-500/20">
                    <span className="font-bold text-amber-400">Grande Final & 3º Lugar</span>
                    <span className="font-display font-black text-amber-400">19/07</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= STRUCTURE & BLINDS SECTION ================= */}
        <section className="py-12 border-t border-white/5">
          <div className="text-center mb-10">
            <span className="text-[10px] font-display font-black text-amber-500 tracking-[0.3em] uppercase block mb-1">VALORES E FICHARES</span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-wider">ESTRUTURA DO EVENTO</h2>
            <div className="h-[2px] w-20 bg-amber-500 mx-auto mt-3 rounded-full shadow-[0_0_8px_#f59e0b]" />
            <p className="mt-4 text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed font-light px-2">
              Detalhes técnicos de inscrição, rebuys, fichas iniciais e condições de stacks para cada uma das fases do torneio:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-[#0b0716]/80 border border-white/5 rounded-3xl p-6 hover:border-red-500/25 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-red-950/40 border border-red-500/25 flex items-center justify-center">
                  <span className="material-icons text-red-500 text-lg">group</span>
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-white uppercase">FASE DE GRUPOS</h4>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500">Etapa de Qualificação</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Entrada / Buy-in</span> <span className="font-bold text-white">R$ 50</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Rebuys Permitidos</span> <span className="font-bold text-white">Até 2 rebuys</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Valor do Rebuy</span> <span className="font-bold text-white">R$ 50</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Stack Inicial</span> <span className="font-bold text-emerald-400">10.000 fichas</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Stack do Rebuy</span> <span className="font-bold text-emerald-400">10.000 fichas</span></li>
              </ul>
            </div>

            <div className="bg-[#0b0716]/80 border border-white/5 rounded-3xl p-6 hover:border-red-500/25 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-red-950/40 border border-red-500/25 flex items-center justify-center">
                  <span className="material-icons text-red-500 text-lg">alt_route</span>
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-white uppercase">16-AVOS + OITAVAS</h4>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500">Mata-Mata Eliminatório Inicial</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Entrada / Buy-in</span> <span className="font-bold text-white">R$ 50</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Rebuys Permitidos</span> <span className="font-bold text-white">Apenas 1 rebuy</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Valor do Rebuy</span> <span className="font-bold text-white">R$ 50</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Stack Inicial</span> <span className="font-bold text-emerald-400">10.000 fichas</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Stack do Rebuy</span> <span className="font-bold text-emerald-400">10.000 fichas</span></li>
              </ul>
            </div>

            <div className="bg-[#0b0716]/80 border border-white/5 rounded-3xl p-6 hover:border-red-500/25 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-950/40 border border-amber-500/25 flex items-center justify-center">
                  <span className="material-icons text-amber-500 text-lg">stars</span>
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-white uppercase">QUARTAS + SEMIFINAL</h4>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500">Mata-Mata Chaveamento Avançado</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Entrada / Buy-in</span> <span className="font-bold text-emerald-400">Convite Gratuito</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Rebuys Permitidos</span> <span className="font-bold text-white">Apenas 1 rebuy</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Valor do Rebuy</span> <span className="font-bold text-white">R$ 100</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Stack Inicial</span> <span className="font-bold text-emerald-400">10.000 fichas</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Stack do Rebuy</span> <span className="font-bold text-emerald-400">10.000 fichas</span></li>
              </ul>
            </div>

            <div className="bg-[#0b0716]/80 border border-white/5 rounded-3xl p-6 hover:border-red-500/25 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-950/40 border border-amber-500/25 flex items-center justify-center">
                  <span className="material-icons text-amber-500 text-lg">emoji_events</span>
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-white uppercase">FINAL + 3º LUGAR</h4>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500">Decisão dos Campeões</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Entrada / Buy-in</span> <span className="font-bold text-emerald-400">Grátis</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Rebuys Permitidos</span> <span className="font-bold text-white">Até 2 rebuys</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Valor do Rebuy</span> <span className="font-bold text-white">R$ 100</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Stack Inicial</span> <span className="font-bold text-emerald-400">10.000 fichas</span></li>
                <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Stack do Rebuy</span> <span className="font-bold text-emerald-400">10.000 fichas</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================= PRIZE SECTION ================= */}
        <section className="py-12 border-t border-white/5">
          <div className="text-center mb-12">
            <span className="text-[10px] font-display font-black text-red-500 tracking-[0.3em] uppercase block mb-1">GLÓRIA E RECOMPENSAS</span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-wider">PREMIAÇÃO DO EVENTO</h2>
            <div className="h-[2px] w-20 bg-red-600 mx-auto mt-3 rounded-full shadow-[0_0_8px_#dc2626]" />
            <p className="mt-4 text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed font-light">
              Premiações acumulativas e bônus excepcionais do início ao fim da competição. A glória eterna espera pelo campeão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto mb-16">
            <div className="bg-[#0b0716]/80 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-red-500/25 transition-colors duration-300">
              <div>
                <h4 className="font-display font-black text-sm text-white uppercase mb-3 flex items-center gap-2">
                  <span className="material-icons text-red-500 text-base">group</span>
                  FASE DE GRUPOS
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed font-light mb-4">
                  Excelente incentivo de desempenho financeiro na fase inicial de grupos:
                </p>
                <ul className="space-y-2 text-xs">
                  <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Vencedor de Rodada</span> <span className="font-bold text-emerald-400">R$ 100</span></li>
                  <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">1º Lugar do Grupo</span> <span className="font-bold text-emerald-400">R$ 100</span></li>
                  <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">2º Lugar do Grupo</span> <span className="font-bold text-emerald-400">R$ 50</span></li>
                </ul>
              </div>
            </div>

            <div className="bg-[#0b0716]/80 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-red-500/25 transition-colors duration-300">
              <div>
                <h4 className="font-display font-black text-sm text-white uppercase mb-3 flex items-center gap-2">
                  <span className="material-icons text-red-500 text-base">alt_route</span>
                  MATA-MATAS HEADS-UP
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed font-light mb-4">
                  Resgates e bônus individuais para os classificados de elite:
                </p>
                <ul className="space-y-2 text-xs">
                  <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Nas Oitavas de Final</span> <span className="font-bold text-emerald-400">R$ 100</span></li>
                  <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Nas Quartas de Final</span> <span className="font-bold text-emerald-400">R$ 300</span></li>
                  <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="text-gray-400">Na Semifinal</span> <span className="font-bold text-emerald-400">R$ 500</span></li>
                </ul>
              </div>
            </div>

            <div className="bg-[#1b1407]/40 border border-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.04)] rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/35 transition-all duration-300">
              <div>
                <h4 className="font-display font-black text-sm text-amber-400 uppercase mb-3 flex items-center gap-2">
                  <span className="material-icons text-amber-500 text-base">emoji_events</span>
                  PODIUM DA FINAL
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed font-light mb-4">
                  Estimativa de 7K em premiação para os 4 melhores:
                </p>
                <ul className="space-y-2.5 text-xs">
                  <li className="bg-black/25 px-3 py-2.5 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-amber-400 flex items-center gap-1">🥇 1º (Campeão)</span>
                      <span className="font-display font-black text-white text-sm">45%</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-display font-semibold block">🎁 + VAGA NO THE CHOSEN 30K + TROFÉU</span>
                  </li>
                  <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="font-semibold text-gray-200">🥈 2º (Vice)</span> <span className="font-bold text-white">25%</span></li>
                  <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="font-semibold text-gray-300">🥉 3º Lugar</span> <span className="font-bold text-white">18%</span></li>
                  <li className="flex justify-between items-center bg-black/25 px-3 py-2 rounded-xl"><span className="font-semibold text-gray-400">🎖️ 4º Lugar</span> <span className="font-bold text-white">12%</span></li>
                </ul>
              </div>
            </div>

          </div>
        </section>

        {/* ================= COPA DO MUNDO RESERVATION CONFIRMATION MODAL ================= */}
        {showCopaModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0b081e] border-2 border-amber-500/40 rounded-3xl w-full max-w-sm shadow-[0_0_60px_rgba(245,158,11,0.25)] relative overflow-hidden flex flex-col p-6 animate-in zoom-in duration-300">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4">
                <div>
                  <h3 className="text-lg font-display font-black text-white uppercase tracking-wider">
                    {hasCopaReservation ? 'VAGA GARANTIDA!' : 'GARANTIR SUA VAGA'}
                  </h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                    Copa do Mundo de Poker 2026
                  </p>
                </div>
                <button
                  onClick={() => setShowCopaModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1.5 bg-white/5 rounded-full"
                >
                  <span className="material-icons text-xl">close</span>
                </button>
              </div>

              {/* Simple message prompt */}
              <div className="py-6 text-center">
                <p className="text-sm text-gray-300 leading-relaxed font-light">
                  {hasCopaReservation 
                    ? 'Você já garantiu sua vaga para a Copa do Mundo. Deseja cancelar a sua reserva?' 
                    : 'Deseja confirmar a sua reserva para a Copa do Mundo de Poker Chip Race 2026?'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/5 mt-2">
                <button
                  onClick={() => setShowCopaModal(false)}
                  className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-2xl text-xs font-bold text-gray-400 uppercase tracking-widest transition-all"
                >
                  Fechar
                </button>
                {hasCopaReservation ? (
                  <button
                    onClick={handleCancelCopaReservation}
                    disabled={isReservingCopa}
                    className="flex-1 py-3 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] flex items-center justify-center gap-1.5"
                  >
                    {isReservingCopa ? (
                      <span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-icons text-xs">cancel</span>
                        Cancelar Vaga
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmCopaReservation}
                    disabled={isReservingCopa}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 via-red-600 to-amber-500 hover:from-amber-400 hover:to-amber-400 text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-1.5"
                  >
                    {isReservingCopa ? (
                      <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-icons text-xs">check_circle</span>
                        Confirmar Vaga
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
