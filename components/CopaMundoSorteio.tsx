import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../src/lib/supabase';

interface GroupSeat {
  groupId: string;
  groupName: string;
  seatIndex: number; // 1, 2, or 3 (0 is occupied by leader)
  colorDot: string;  // dot class e.g., bg-emerald-500, bg-amber-500, bg-red-500
}

interface SorteioState {
  player: string;
  group: string; // 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  seatIndex: number; // 1 | 2 | 3 (1 = seat 2, 2 = seat 3, 3 = seat 4)
}

// 6 leader players (cabeça de chave)
const LEADERS: Record<string, string> = {
  A: 'Carlos Stonge',
  B: "Jorge 'Xumiska' Henn",
  C: 'Ismael Ertel',
  D: "'Gonha' Hermes",
  E: "Alex 'Chicle' Leissmann",
  F: 'Robson Gonçalves',
};

// Available seats for raffle (seats 2, 3, 4 of groups A-F)
const SEAT_DOTS = ['bg-emerald-500', 'bg-amber-500', 'bg-red-500']; // colors for seat 2, 3, 4

export const CopaMundoSorteio: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { getAllUniquePlayers } = useApp();
  const allSystemPlayers = getAllUniquePlayers ? getAllUniquePlayers() : [];

  // View state: 'setup' | 'draw'
  const [viewMode, setViewMode] = useState<'setup' | 'draw'>('setup');

  // Setup state: 18 player names to draw
  const [playerInputs, setPlayerInputs] = useState<string[]>(Array(18).fill(''));
  const [searchQueries, setSearchQueries] = useState<string[]>(Array(18).fill(''));
  const [dropdownActiveIndex, setDropdownActiveIndex] = useState<number | null>(null);

  // Draw Mode configuration
  const [isTestMode, setIsTestMode] = useState<boolean>(true);

  // Active draw pools
  const [initialPlayers, setInitialPlayers] = useState<string[]>([]);
  const [remainingPlayers, setRemainingPlayers] = useState<string[]>([]);
  const [remainingSeats, setRemainingSeats] = useState<GroupSeat[]>([]);

  // Drawn items state
  // Key: "groupId-seatIndex", Value: Player name
  const [drawnAssignments, setDrawnAssignments] = useState<Record<string, string>>({});
  const [drawHistory, setDrawHistory] = useState<string[]>([]);

  // Animation states
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentSpinPlayer, setCurrentSpinPlayer] = useState<string>('---');
  const [currentSpinSeat, setCurrentSpinSeat] = useState<string>('---');
  const [lastDrawnPlayer, setLastDrawnPlayer] = useState<string | null>(null);
  const [lastDrawnSeat, setLastDrawnSeat] = useState<GroupSeat | null>(null);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [autoDrawActive, setAutoDrawActive] = useState(false);

  // Camera feed state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sound synthesis utility using Web Audio API
  const playSound = (type: 'scramble' | 'success' | 'place') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'scramble') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.08, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        };
        const now = ctx.currentTime;
        playTone(523.25, now, 0.12); // C5
        playTone(659.25, now + 0.08, 0.12); // E5
        playTone(783.99, now + 0.16, 0.12); // G5
        playTone(1046.50, now + 0.24, 0.35); // C6
      } else if (type === 'place') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  };

  // Populate mock data for testing
  const handleFillMockData = () => {
    const defaultMockNames = [
      'NutsMaster', 'FoguetePoker', 'BlefeEstelar', 'DonkeyKong',
      'AA_Vencedor', 'ReiDoShowdown', 'InstaCall', 'AllInTudoOuNada',
      'PirataDoCaribe', 'MestreDosMagos', 'FlushRoyal', 'VentoNorte',
      'CopasValete', 'NoveGaucho', 'BackdoorNut', 'SlowPlayer',
      'TexasBoss', 'BaralhoDourado'
    ];
    
    // Attempt to fill using system players first to make it look realistic, otherwise use defaults
    const filteredSystem = allSystemPlayers
      .map(p => p.name)
      .filter(name => !Object.values(LEADERS).includes(name));

    const finalNames = [...playerInputs];
    for (let i = 0; i < 18; i++) {
      if (filteredSystem[i]) {
        finalNames[i] = filteredSystem[i];
      } else {
        finalNames[i] = defaultMockNames[i] || `Jogador #${i + 7}`;
      }
    }
    setPlayerInputs(finalNames);
    setSearchQueries(finalNames);
  };

  // Clear all setup inputs
  const handleClearInputs = () => {
    setPlayerInputs(Array(18).fill(''));
    setSearchQueries(Array(18).fill(''));
  };

  // Handle Input Changes
  const handleInputChange = (index: number, val: string) => {
    const updatedInputs = [...playerInputs];
    updatedInputs[index] = val;
    setPlayerInputs(updatedInputs);

    const updatedQueries = [...searchQueries];
    updatedQueries[index] = val;
    setSearchQueries(updatedQueries);
    setDropdownActiveIndex(index);
  };

  const selectPlayerFromAutocomplete = (index: number, name: string) => {
    const updatedInputs = [...playerInputs];
    updatedInputs[index] = name;
    setPlayerInputs(updatedInputs);

    const updatedQueries = [...searchQueries];
    updatedQueries[index] = name;
    setSearchQueries(updatedQueries);
    setDropdownActiveIndex(null);
  };

  // Validate and start draw mode
  const handleStartDraw = () => {
    // Check for empty fields
    const filled = playerInputs.filter(p => p.trim() !== '');
    if (filled.length < 18) {
      alert('Por favor, preencha todos os 18 jogadores para realizar o sorteio.');
      return;
    }

    // Check for duplicates in inputs
    const uniqueInputs = new Set(filled.map(p => p.toLowerCase().trim()));
    if (uniqueInputs.size !== 18) {
      alert('Existem nomes de jogadores duplicados na lista do sorteio.');
      return;
    }

    // Check if any player conflicts with the leaders
    const leaderNamesLower = Object.values(LEADERS).map(l => l.toLowerCase().trim());
    const overlapsLeader = filled.some(p => leaderNamesLower.includes(p.toLowerCase().trim()));
    if (overlapsLeader) {
      alert('Um ou mais jogadores inseridos já são Cabeças de Chave (Líderes de Grupo). Escolha outros jogadores.');
      return;
    }

    // Set up pools
    const playerPool = [...playerInputs];
    const seatPool: GroupSeat[] = [];
    const groupsList = ['A', 'B', 'C', 'D', 'E', 'F'];

    groupsList.forEach(groupId => {
      // Seat indexes: 1, 2, 3 correspond to positions 2, 3, 4 in the table
      for (let sIdx = 1; sIdx <= 3; sIdx++) {
        seatPool.push({
          groupId,
          groupName: `Grupo ${groupId}`,
          seatIndex: sIdx,
          colorDot: SEAT_DOTS[sIdx - 1],
        });
      }
    });

    setInitialPlayers(playerPool);
    setRemainingPlayers(playerPool);
    setRemainingSeats(seatPool);
    setDrawnAssignments({});
    setDrawHistory([]);
    setViewMode('draw');
  };

  // Toggle Camera Feed inside central Guide frame
  const handleToggleCamera = async () => {
    if (cameraStream) {
      // Stop stream
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Erro ao acessar webcam:', err);
        alert('Não foi possível acessar a câmera. Certifique-se de dar as permissões necessárias no seu navegador.');
      }
    }
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Scramble / Spin Animation Logic
  const executeDraw = () => {
    if (isDrawing || remainingPlayers.length === 0 || remainingSeats.length === 0) return;

    setIsDrawing(true);
    setShowResultOverlay(false);
    
    let spinCount = 0;
    const maxSpins = 25; // 2.5 seconds total at 100ms interval
    
    const interval = setInterval(() => {
      // Pick random items to display during scramble
      const tempPlayer = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
      const tempSeat = remainingSeats[Math.floor(Math.random() * remainingSeats.length)];
      
      setCurrentSpinPlayer(tempPlayer);
      setCurrentSpinSeat(`${tempSeat.groupName} - Assento ${tempSeat.seatIndex + 1}`);
      playSound('scramble');
      
      spinCount++;
      if (spinCount >= maxSpins) {
        clearInterval(interval);
        
        // Pick final drawn items
        const finalPlayerIndex = Math.floor(Math.random() * remainingPlayers.length);
        const finalSeatIndex = Math.floor(Math.random() * remainingSeats.length);

        const drawnPlayer = remainingPlayers[finalPlayerIndex];
        const drawnSeat = remainingSeats[finalSeatIndex];

        // Update pools
        const nextPlayers = remainingPlayers.filter((_, idx) => idx !== finalPlayerIndex);
        const nextSeats = remainingSeats.filter((_, idx) => idx !== finalSeatIndex);

        // Save Assignment
        const assignKey = `${drawnSeat.groupId}-${drawnSeat.seatIndex}`;
        const updatedAssignments = {
          ...drawnAssignments,
          [assignKey]: drawnPlayer
        };

        setRemainingPlayers(nextPlayers);
        setRemainingSeats(nextSeats);
        setDrawnAssignments(updatedAssignments);
        setLastDrawnPlayer(drawnPlayer);
        setLastDrawnSeat(drawnSeat);
        
        const historyText = `${drawnPlayer} ➔ ${drawnSeat.groupName} (Assento ${drawnSeat.seatIndex + 1})`;
        const updatedHistory = [historyText, ...drawHistory];
        setDrawHistory(updatedHistory);

        // Play chime & show popup overlay
        playSound('success');
        setIsDrawing(false);
        setShowResultOverlay(true);

        // Sync to localStorage if not in Test Mode
        if (!isTestMode) {
          syncToMainWebsite(updatedAssignments);
        }

        // Auto prompt when draw finishes
        if (nextPlayers.length === 0) {
          setTimeout(() => {
            if (window.confirm("Sorteio Concluído com Sucesso! Deseja salvar estes resultados oficialmente no site?")) {
              syncToMainWebsite(updatedAssignments);
              alert("Resultados salvos com sucesso!");
            }
          }, 600);
        }
      }
    }, 100);
  };

  // Auto Draw Mode (Runs draw every 3.5s automatically)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (autoDrawActive && !isDrawing && remainingPlayers.length > 0 && remainingSeats.length > 0) {
      timeout = setTimeout(() => {
        executeDraw();
      }, 3500);
    } else if (remainingPlayers.length === 0 && autoDrawActive) {
      setAutoDrawActive(false);
    }
    return () => clearTimeout(timeout);
  }, [autoDrawActive, isDrawing, remainingPlayers.length]);

  // Undo / Delete individual assignment
  const handleRemoveAssignment = (groupId: string, seatIndex: number) => {
    const key = `${groupId}-${seatIndex}`;
    const playerToRemove = drawnAssignments[key];
    if (!playerToRemove) return;

    if (!window.confirm(`Deseja remover ${playerToRemove} do Grupo ${groupId} e devolvê-lo ao sorteio?`)) return;

    // Put player back into remaining list
    const updatedPlayers = [...remainingPlayers, playerToRemove];
    
    // Put seat back into remaining seats
    const restoredSeat: GroupSeat = {
      groupId,
      groupName: `Grupo ${groupId}`,
      seatIndex,
      colorDot: SEAT_DOTS[seatIndex - 1]
    };
    const updatedSeats = [...remainingSeats, restoredSeat];

    // Remove from assignments
    const nextAssignments = { ...drawnAssignments };
    delete nextAssignments[key];

    // Remove from history
    const nextHistory = drawHistory.filter(h => !h.startsWith(playerToRemove));

    setRemainingPlayers(updatedPlayers);
    setRemainingSeats(updatedSeats);
    setDrawnAssignments(nextAssignments);
    setDrawHistory(nextHistory);
    setShowResultOverlay(false);
    playSound('place');

    // Sync to localStorage if not in Test Mode
    if (!isTestMode) {
      syncToMainWebsite(nextAssignments);
    }
  };

  // Full Draw Reset
  const handleResetDraw = () => {
    if (!window.confirm('Aviso: Isso irá limpar todo o progresso do sorteio ativo e retornar todos os 18 jogadores ao pote. Deseja prosseguir?')) return;
    
    const seatPool: GroupSeat[] = [];
    const groupsList = ['A', 'B', 'C', 'D', 'E', 'F'];
    groupsList.forEach(groupId => {
      for (let sIdx = 1; sIdx <= 3; sIdx++) {
        seatPool.push({
          groupId,
          groupName: `Grupo ${groupId}`,
          seatIndex: sIdx,
          colorDot: SEAT_DOTS[sIdx - 1],
        });
      }
    });

    setRemainingPlayers([...initialPlayers]);
    setRemainingSeats(seatPool);
    setDrawnAssignments({});
    setDrawHistory([]);
    setLastDrawnPlayer(null);
    setLastDrawnSeat(null);
    setShowResultOverlay(false);
    setAutoDrawActive(false);

    if (!isTestMode) {
      syncToMainWebsite({});
    }
  };

  // Save/Sync to Main LocalStorage State
  const syncToMainWebsite = (assignments: Record<string, string>) => {
    let allGroups: any[] = [];
    const savedGroupsStr = localStorage.getItem('cr_copa_mundo_groups_v3');
    
    if (savedGroupsStr) {
      try {
        allGroups = JSON.parse(savedGroupsStr);
      } catch (e) {
        allGroups = [];
      }
    }

    // Fallback: if localStorage does not exist or has never been initialized, seed all 12 groups A to L
    if (!Array.isArray(allGroups) || allGroups.length === 0) {
      allGroups = [
        { id: 'A', name: 'GRUPO A', players: ['Carlos Stonge'], rounds: { 1: {}, 2: {}, 3: {}, 4: {} } },
        { id: 'B', name: 'GRUPO B', players: ["Jorge 'Xumiska' Henn"], rounds: { 1: {}, 2: {}, 3: {}, 4: {} } },
        { id: 'C', name: 'GRUPO C', players: ['Ismael Ertel'], rounds: { 1: {}, 2: {}, 3: {}, 4: {} } },
        { id: 'D', name: 'GRUPO D', players: ["'Gonha' Hermes"], rounds: { 1: {}, 2: {}, 3: {}, 4: {} } },
        { id: 'E', name: 'GRUPO E', players: ["Alex 'Chicle' Leissmann"], rounds: { 1: {}, 2: {}, 3: {}, 4: {} } },
        { id: 'F', name: 'GRUPO F', players: ['Robson Gonçalves'], rounds: { 1: {}, 2: {}, 3: {}, 4: {} } },
        { id: 'G', name: 'GRUPO G', players: ['ReiDoOmaha', 'BountyHunter', 'RunnerRunner', 'LimperFeliz'], rounds: { 1: {}, 2: {}, 3: {}, 4: {} } },
        { id: 'H', name: 'GRUPO H', players: ['FullHouseTop', 'DoubleBarrel', 'Assobiador', 'CheckRaiseViciado'], rounds: { 1: {}, 2: {}, 3: {}, 4: {} } },
        { id: 'I', name: 'GRUPO I', players: ['PocketAces_AA', 'SidePotWinner', 'MinRaiseChato', 'FoldadorFrequente'], rounds: { 1: {}, 2: {}, 3: {}, 4: {} } },
        { id: 'J', name: 'GRUPO J', players: ['RedLineGod', 'GTO_Soldier', 'ExploitKing', 'FishLover'], rounds: { 1: {}, 2: {}, 3: {}, 4: {} } },
        { id: 'K', name: 'GRUPO K', players: ['OurosK', 'HeadsUpAssasin', 'OutsInder', 'CoinFlipHater'], rounds: { 1: {}, 2: {}, 3: {}, 4: {} } },
        { id: 'L', name: 'GRUPO L', players: ['ValkyriePoker', 'HeroCall99', 'ReraiseMaster', 'MuckAndCry'], rounds: { 1: {}, 2: {}, 3: {}, 4: {} } }
      ];
    }

    try {
      // Update ONLY groups A to F
      const updatedGroups = allGroups.map(group => {
        if (['A', 'B', 'C', 'D', 'E', 'F'].includes(group.id)) {
          // Re-assemble players array
          // Index 0: Leader
          // Index 1: Seat 2
          // Index 2: Seat 3
          // Index 3: Seat 4
          const leader = LEADERS[group.id] || '';
          const p2 = assignments[`${group.id}-1`] || '';
          const p3 = assignments[`${group.id}-2`] || '';
          const p4 = assignments[`${group.id}-3`] || '';

          // Reset round points to 0 since we drew new members
          const cleanRounds = {
            1: {}, 2: {}, 3: {}, 4: {}
          };

          return {
            ...group,
            players: [leader, p2, p3, p4].filter(p => p !== ''), // keep empty slots if not fully drawn
            rounds: cleanRounds,
            tieBreakerOverride: undefined
          };
        }
        return group;
      });

      localStorage.setItem('cr_copa_mundo_groups_v3', JSON.stringify(updatedGroups));
      supabase.from('content_db').upsert({ key: 'copa_mundo_groups', value: updatedGroups }, { onConflict: 'key' })
        .then(({ error }) => {
          if (error) console.error('Error syncing groups to Supabase:', error);
        });
    } catch (e) {
      console.error('Error syncing to main website:', e);
    }
  };

  // Manual Trigger to save/confirm draw results on main site
  const handleSaveOfficially = () => {
    syncToMainWebsite(drawnAssignments);
    alert('Sorteio gravado com sucesso no site! Os grupos A ao F já estão atualizados.');
  };

  return (
    <div className="min-h-screen bg-[#070511] text-gray-200 font-body relative overflow-hidden pb-12 select-none">
      
      {/* Background Neon Grid Decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b1735_1px,transparent_1px),linear-gradient(to_bottom,#1b1735_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      {/* SETUP VIEW: Preparing players to draw */}
      {viewMode === 'setup' && (
        <div className="relative max-w-4xl mx-auto px-4 pt-10 z-10">
          
          <div className="text-center mb-10">
            <span className="text-[10px] font-display font-black text-red-500 tracking-[0.4em] uppercase block mb-1">
              PAINEL ADMINISTRATIVO
            </span>
            <h1 className="text-4xl font-display font-black text-white uppercase tracking-wider">
              CONFIGURAR SORTEIO DA COPA
            </h1>
            <div className="h-[2px] w-28 bg-gradient-to-r from-red-600 to-amber-500 mx-auto mt-4 rounded-full shadow-[0_0_10px_#dc2626]" />
            <p className="mt-4 text-xs text-gray-400 max-w-xl mx-auto leading-relaxed font-light">
              Prepare a lista de 18 jogadores para o sorteio. Os cabeças de chave dos grupos A ao F já estão fixados como líderes dos assentos primários de cada tabela.
            </p>
          </div>

          {/* Leaders Info Box */}
          <div className="bg-[#0f0b21]/90 border border-white/5 rounded-3xl p-5 mb-8">
            <h2 className="text-xs font-display font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-icons text-sm">stars</span>
              Cabeças de Chave (Alocação Automática - Assento 1)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(LEADERS).map(([groupId, name]) => (
                <div key={groupId} className="bg-black/30 border border-white/5 rounded-2xl p-3 text-center">
                  <div className="font-display font-black text-red-500 text-xs mb-1">GRUPO {groupId}</div>
                  <div className="text-[11px] font-bold text-white truncate">{name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Inputs Grid */}
          <div className="bg-[#0f0b21]/90 border border-white/5 rounded-3xl p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-icons text-base text-red-500">people</span>
                Jogadores a Sortear (18 Nomes)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleFillMockData}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-amber-400 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Preenchimento Rápido
                </button>
                <button
                  onClick={handleClearInputs}
                  className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 text-red-400 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {playerInputs.map((pName, idx) => {
                const query = searchQueries[idx] || '';
                const filteredList = allSystemPlayers.filter(sysPlayer => {
                  const alreadyChosen = playerInputs.some((val, i) => i !== idx && val.toLowerCase() === sysPlayer.name.toLowerCase());
                  const isLeader = Object.values(LEADERS).some(lead => lead.toLowerCase() === sysPlayer.name.toLowerCase());
                  return sysPlayer.name.toLowerCase().includes(query.toLowerCase()) && !alreadyChosen && !isLeader;
                }).slice(0, 5);

                return (
                  <div key={idx} className="relative flex flex-col">
                    <label className="text-[10px] font-display font-black text-gray-500 uppercase mb-1">
                      Jogador #{idx + 1}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={pName}
                        onChange={(e) => handleInputChange(idx, e.target.value)}
                        onFocus={() => setDropdownActiveIndex(idx)}
                        placeholder="Nome ou busca..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                      />
                      
                      {/* Autocomplete Dropdown */}
                      {dropdownActiveIndex === idx && query.trim() !== '' && filteredList.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 bg-[#16122d] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                          {filteredList.map((sysPlayer) => (
                            <button
                              key={sysPlayer.id || sysPlayer.name}
                              type="button"
                              onClick={() => selectPlayerFromAutocomplete(idx, sysPlayer.name)}
                              className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-red-600 hover:text-white transition-colors truncate cursor-pointer"
                            >
                              {sysPlayer.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => onNavigate('copa-mundo-poker')}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white font-bold uppercase transition-colors cursor-pointer"
            >
              <span className="material-icons text-sm">arrow_back</span>
              Voltar à Copa
            </button>

            <button
              onClick={handleStartDraw}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 text-black font-black uppercase text-xs tracking-widest px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-red-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-icons text-sm">play_arrow</span>
              Iniciar Sorteio ao Vivo
            </button>
          </div>

        </div>
      )}

      {/* DRAW VIEW: Symmetrical 3-column Layout for Streaming */}
      {viewMode === 'draw' && (
        <div className="w-full max-w-[1440px] mx-auto px-4 pt-6 z-10 relative">

          {/* Setup active dropdown blocker (clicking outside setup screen drops it) */}
          {dropdownActiveIndex !== null && (
            <div className="fixed inset-0 z-40" onClick={() => setDropdownActiveIndex(null)} />
          )}

          {/* Draw Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="material-icons text-amber-500 text-2xl animate-pulse">casino</span>
              <div>
                <h1 className="text-xl font-display font-black text-white uppercase tracking-wider">
                  SORTEIO DE GRUPOS - COPA CHIP RACE
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  Live Draw de Elite • Fase Classificatória Grupos A ao F
                </p>
              </div>
            </div>

            {/* Test Mode / Controls Bar */}
            <div className="flex items-center gap-4">
              
              {/* Test Mode Toggle */}
              <label className="flex items-center gap-2 cursor-pointer bg-black/40 border border-white/5 px-4 py-2 rounded-2xl">
                <input
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) => {
                    setIsTestMode(e.target.checked);
                    if (!e.target.checked) {
                      // Prompt warning
                      if (window.confirm('Atenção: Ao desativar o "Modo de Teste", todos os sorteios seguintes serão salvos e gravados no banco/tabelas da Copa do Mundo Chip Race em tempo real. Deseja prosseguir?')) {
                        syncToMainWebsite(drawnAssignments);
                      } else {
                        setIsTestMode(true);
                      }
                    }
                  }}
                  className="rounded bg-black border-white/20 text-red-600 focus:ring-0 cursor-pointer"
                />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">Modo de Teste</span>
                  <span className="text-[8px] text-gray-500">Não atualiza o site principal</span>
                </div>
              </label>

              {/* Force Official Confirm Button */}
              {isTestMode && Object.keys(drawnAssignments).length > 0 && (
                <button
                  onClick={handleSaveOfficially}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Gravar Resultado no Site
                </button>
              )}

              {/* Go Back / Setup Button */}
              <button
                onClick={() => {
                  if (window.confirm('Deseja retornar ao painel de configuração? O progresso do sorteio atual será reiniciado.')) {
                    setViewMode('setup');
                  }
                }}
                className="bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-[10px] tracking-wider px-4 py-2.5 rounded-xl transition-all border border-white/5 cursor-pointer"
              >
                Voltar à Configuração
              </button>
            </div>
          </div>

          {/* MAIN 3-COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMN 1 (Left): Groups A, B, C */}
            <div className="lg:col-span-4 space-y-6">
              {['A', 'B', 'C'].map(gId => renderGroupDrawCard(gId))}
            </div>

            {/* COLUMN 2 (Center): Draw Panel & Webcam Guide Frame */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Draw Actions Controls */}
              <div className="bg-gradient-to-b from-[#1b102f]/90 to-[#0e071c]/90 border border-red-500/20 rounded-3xl p-6 text-center shadow-[0_0_20px_rgba(239,68,68,0.05)] relative overflow-hidden">
                
                <h3 className="font-display font-black text-xs text-red-400 uppercase tracking-widest mb-4">
                  PAINEL DE SORTEIO
                </h3>

                {/* Remaining Pools Counters */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-3">
                    <div className="text-xl font-display font-black text-white">{remainingPlayers.length}</div>
                    <div className="text-[9px] uppercase tracking-wider text-gray-500">Restantes</div>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-3">
                    <div className="text-xl font-display font-black text-white">{remainingSeats.length}</div>
                    <div className="text-[9px] uppercase tracking-wider text-gray-500">Assentos Livres</div>
                  </div>
                </div>

                {/* Scrambler Reel Display */}
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4 mb-6 relative min-h-[100px] flex flex-col justify-center items-center">
                  
                  {/* Neon Grid Effect Inside */}
                  <div className="absolute inset-0 bg-red-600/5 animate-pulse opacity-10 pointer-events-none" />

                  {isDrawing ? (
                    <div className="space-y-2 w-full animate-pulse">
                      <div className="text-amber-400 text-lg font-black tracking-wide truncate max-w-xs uppercase">
                        {currentSpinPlayer}
                      </div>
                      <div className="text-gray-400 text-[10px] uppercase tracking-widest">
                        ➔ alocando em ➔
                      </div>
                      <div className="text-emerald-400 text-xs font-black uppercase tracking-wider">
                        {currentSpinSeat}
                      </div>
                    </div>
                  ) : lastDrawnPlayer && lastDrawnSeat ? (
                    <div className="space-y-1 animate-in zoom-in duration-300">
                      <div className="text-[9px] font-display font-bold uppercase text-gray-500">
                        ÚLTIMO JOGADOR SORTEADO
                      </div>
                      <div className="text-2xl font-display font-black text-white uppercase tracking-wide">
                        {lastDrawnPlayer}
                      </div>
                      <div className="text-amber-500 font-black text-xs uppercase tracking-widest py-0.5">
                        {lastDrawnSeat.groupName} • ASSENTO {lastDrawnSeat.seatIndex + 1}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-xs font-semibold py-2">
                      PRONTO PARA COMEÇAR O SORTEIO
                    </div>
                  )}
                </div>

                {/* Main Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={executeDraw}
                    disabled={isDrawing || remainingPlayers.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 disabled:from-gray-800 disabled:to-gray-800 text-black font-black uppercase text-xs tracking-widest py-4 rounded-2xl shadow-lg hover:shadow-red-500/20 hover:scale-[1.02] disabled:scale-100 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <span className="material-icons text-base">casino</span>
                    {isDrawing ? 'Sorteando...' : 'SORTEAR PRÓXIMO'}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAutoDrawActive(!autoDrawActive)}
                      disabled={remainingPlayers.length === 0}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
                        autoDrawActive
                          ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)] animate-pulse'
                          : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                      }`}
                    >
                      <span className="material-icons text-sm">{autoDrawActive ? 'pause' : 'autorenew'}</span>
                      {autoDrawActive ? 'Pausar Auto' : 'Sorteio Auto'}
                    </button>

                    <button
                      onClick={handleResetDraw}
                      className="flex items-center justify-center gap-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 text-red-400 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      <span className="material-icons text-sm">refresh</span>
                      Reiniciar Pote
                    </button>
                  </div>
                </div>

              </div>

              {/* Central Webcam Frame Guide Container */}
              <div className="bg-[#0f0b21]/95 border-2 border-dashed border-[#8b5cf6]/40 hover:border-[#8b5cf6] rounded-3xl p-5 shadow-[0_0_20px_rgba(139,92,246,0.1)] relative transition-all group overflow-hidden">
                
                {/* Corner guide markers */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#8b5cf6]" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#8b5cf6]" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#8b5cf6]" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#8b5cf6]" />

                {/* Overlay Header Label */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#a78bfa] bg-[#8b5cf6]/10 px-2 py-0.5 rounded border border-[#8b5cf6]/20">
                    CÂMERA DO ADMIN
                  </span>
                  <button
                    onClick={handleToggleCamera}
                    className="text-[8px] font-bold uppercase tracking-wider text-[#a78bfa] hover:text-white transition-colors flex items-center gap-1 bg-black/40 px-2 py-1 rounded cursor-pointer"
                  >
                    <span className="material-icons text-[10px]">
                      {cameraStream ? 'videocam_off' : 'videocam'}
                    </span>
                    {cameraStream ? 'Desligar Câmera' : 'Ativar Câmera Local'}
                  </button>
                </div>

                {/* Guide Camera Window Frame Area */}
                <div className="relative w-full aspect-[4/3] bg-black/70 border border-white/5 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center">
                  
                  {cameraStream ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="p-4 space-y-2 pointer-events-none">
                      <span className="material-icons text-[#8b5cf6]/30 text-4xl block group-hover:scale-110 transition-transform">
                        photo_camera
                      </span>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Espaço para Webcam
                      </p>
                      <p className="text-[9px] text-gray-600 max-w-[200px] mx-auto leading-relaxed">
                        Posicione a janela da sua webcam (OBS/vMix) exatamente sobre este quadrado durante a gravação da live.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Draw History Feed Box */}
              <div className="bg-black/40 border border-white/5 rounded-3xl p-5">
                <h4 className="text-[10px] font-display font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <span className="material-icons text-xs text-gray-500">history</span>
                  Histórico de Sorteio (Mais Recentes)
                </h4>
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 text-left scrollbar-thin scrollbar-thumb-white/5">
                  {drawHistory.length > 0 ? (
                    drawHistory.map((h, i) => (
                      <div key={i} className="text-[10px] text-gray-400 flex items-center gap-2 border-b border-white/[0.02] pb-1 font-medium">
                        <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500 font-bold">
                          #{drawHistory.length - i}
                        </span>
                        <span className="truncate">{h}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-gray-600 text-center py-4 italic">
                      Nenhum jogador sorteado ainda.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* COLUMN 3 (Right): Groups D, E, F */}
            <div className="lg:col-span-4 space-y-6">
              {['D', 'E', 'F'].map(gId => renderGroupDrawCard(gId))}
            </div>

          </div>

          {/* Congratulations/Drawn Result Giant Popup Overlay */}
          {showResultOverlay && lastDrawnPlayer && lastDrawnSeat && (
            <div
              className="fixed bottom-6 right-6 bg-gradient-to-r from-red-900 to-amber-900 border border-amber-500/40 px-6 py-4 rounded-3xl shadow-[0_0_30px_rgba(245,158,11,0.25)] flex items-center gap-4 animate-in slide-in-from-bottom duration-300 z-50 cursor-pointer"
              onClick={() => setShowResultOverlay(false)}
            >
              <div className="bg-amber-500 text-black rounded-full p-2 flex items-center justify-center animate-bounce">
                <span className="material-icons text-base">celebration</span>
              </div>
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-wider text-amber-300 font-bold">
                  Sorteio Efetuado!
                </div>
                <div className="text-sm font-display font-black text-white uppercase tracking-wide">
                  {lastDrawnPlayer}
                </div>
                <div className="text-[10px] text-gray-200">
                  Alocado no <span className="text-amber-300 font-bold">{lastDrawnSeat.groupName}</span>, Assento {lastDrawnSeat.seatIndex + 1}
                </div>
              </div>
              <button className="text-gray-400 hover:text-white text-xs font-bold pl-2 cursor-pointer">
                ✕
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );

  // Sub-Render Function for individual draw standing cards (exactly matching user picture mockup layout)
  function renderGroupDrawCard(gId: string) {
    const leader = LEADERS[gId] || '';
    const groupName = `GRUPO ${gId}`;

    return (
      <div
        key={gId}
        className="bg-[#0b0716]/80 border border-white/5 rounded-3xl p-5 flex flex-col justify-between hover:border-red-500/25 transition-all duration-300"
      >
        {/* Table Header exactly matching the picture */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-black tracking-widest text-white uppercase">
              {groupName}
            </h3>
            
            {/* Fake disabled edit button just for identical layout appearance */}
            <span className="flex items-center gap-1 text-[8px] bg-amber-500/40 text-black/60 font-bold uppercase rounded-lg px-2 py-0.5 select-none opacity-50">
              <span className="material-icons text-[9px]">edit</span>
              Editar
            </span>
          </div>
          <span className="text-[9px] bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-display font-semibold">
            FASE DE GRUPOS
          </span>
        </div>

        {/* Standing Table Layout exactly matching user mockup image */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-500 uppercase font-display text-[8px] tracking-wider border-b border-white/5">
                <th className="py-1.5">Jogador</th>
                <th className="py-1.5 text-center w-8">Pts</th>
                <th className="py-1.5 text-center w-8">1ºs</th>
                <th className="py-1.5 text-center w-8">2ºs</th>
                <th className="py-1.5 text-center w-8">4ºs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              
              {/* Row 1: Leader (Assento 1) */}
              <tr className="hover:bg-white/[0.01]">
                <td className="py-2 pr-2 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-white font-semibold truncate max-w-[120px]">
                    {leader}
                  </span>
                  <span className="text-[7px] font-display font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded-sm">
                    LÍDER
                  </span>
                </td>
                <td className="py-2 text-center font-display font-black text-gray-600">0</td>
                <td className="py-2 text-center font-display text-gray-600">0</td>
                <td className="py-2 text-center font-display text-gray-600">0</td>
                <td className="py-2 text-center font-display text-gray-600">0</td>
              </tr>

              {/* Rows 2 to 4: Drawn Seats */}
              {[1, 2, 3].map((seatIdx) => {
                const assignedPlayer = drawnAssignments[`${gId}-${seatIdx}`];
                const dotColor = SEAT_DOTS[seatIdx - 1]; // green (seat 2), orange (seat 3), red (seat 4)
                const labelText = `Jogador #${seatIdx + 1 + (gId.charCodeAt(0) - 65) * 4}`; // placeholder like "Jogador #2"
                
                return (
                  <tr key={seatIdx} className="hover:bg-white/[0.01] group/row relative">
                    <td className="py-2 pr-2 font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {assignedPlayer ? (
                          <span className="text-gray-200 font-semibold truncate max-w-[120px] animate-in fade-in duration-300">
                            {assignedPlayer}
                          </span>
                        ) : (
                          <span className="text-gray-600 italic truncate max-w-[120px] font-light">
                            {labelText}
                          </span>
                        )}
                      </div>

                      {/* Seat Specific Hover Undo Button */}
                      {assignedPlayer && (
                        <button
                          onClick={() => handleRemoveAssignment(gId, seatIdx)}
                          className="flex items-center justify-center w-4 h-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full text-[8px] cursor-pointer transition-colors shadow-sm ml-2 shrink-0 opacity-0 group-hover/row:opacity-100"
                          title={`Remover ${assignedPlayer} do sorteio`}
                        >
                          ✕
                        </button>
                      )}
                    </td>
                    <td className="py-2 text-center font-display font-black text-gray-600">0</td>
                    <td className="py-2 text-center font-display text-gray-600">0</td>
                    <td className="py-2 text-center font-display text-gray-600">0</td>
                    <td className="py-2 text-center font-display text-gray-600">0</td>
                  </tr>
                );
              })}

            </tbody>
          </table>
        </div>
      </div>
    );
  }
};
