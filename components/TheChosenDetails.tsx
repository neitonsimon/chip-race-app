import React, { useState, useEffect } from 'react';
import { ContentDB, TournamentCategory } from '../types';
import { TheChosenQualifiers } from './TheChosenQualifiers';
import { supabase } from '../src/lib/supabase';
import appConfig from '../src/config/appConfig.json';

interface TheChosenDetailsProps {
    isAdmin?: boolean;
    prizeLabel?: string;
    onNavigate?: (view: string) => void;
    content?: ContentDB['details']; // Torna opcional para não quebrar em renders parciais, mas App deve passar
    onUpdateContent?: (field: string, value: string) => void;
    categories?: TournamentCategory[];
    onUpdateCategory?: (index: number, updates: Partial<TournamentCategory>) => void;
    onNavigatePlayer?: (playerName: string) => void;
    allPlayers?: { name: string }[];
    months?: any[];
    onUpdateMonth?: (index: number, field: any, value: any) => void;
    onToggleMonthStatus?: (index: number) => void;
    totalQualifiers?: number;
    nextGoal?: any;
    onUpdateTotal?: (value: number | null) => void;
    isManualTotal?: boolean;
    heroContent?: any;
    onUpdateHeroContent?: (field: string, value: string) => void;
}

// Fallback content if not provided (should be provided by App)
const DEFAULT_CONTENT = appConfig.initialDefaults.contentDB.details;

// Mapeamento dos Regulamentos (Cópia fiel do conteúdo de TournamentCategories para consistência)
const REGULATIONS_DATA: Record<string, { title: string; icon: string; color: string; rules: string }> = {
    'rank': {
        title: 'Rankings 2026',
        icon: 'leaderboard',
        color: 'text-primary',
        rules: `
  1. O Ranking Geral Anual soma pontos de todos os torneios regulares presenciais e online da temporada 2026.
  2. Os 10 jogadores com maior pontuação acumulada ao final do ciclo classificatório (Outubro/2026) garantem vaga direta (Direct Entry) no dia 1 do The Chosen.
  3. Em caso de empate na 10ª colocação, o critério de desempate será o valor total de premiações (winnings) arrecadado no ano.
  4. A vaga é intransferível e não pode ser trocada por dinheiro.
  
  --------------------------------------------------
  FÓRMULAS DE PONTUAÇÃO (2026)
  --------------------------------------------------
  
  ► TORNEIOS SEMANAIS (Regular):
  Pontos = (Total Jogadores / 3) + (Buy-in Gasto / 3) + (10 se Mesa Final) + (Premiação ITM / 10) + (5 se VIP)
  
  ► TORNEIOS MENSAIS (High Rollers/Deep):
  Pontos = (Total Jogadores / 3) + (Buy-in Gasto / 4) + (15 se Mesa Final) + (Premiação ITM / 15) + (5 se VIP)
  
  ► ESPECIAIS (Majors/Estaduais):
  Pontos = (Total Jogadores / 4) + (Buy-in Gasto / 6) + (30 se Mesa Final) + (Premiação ITM / 25) + (5 se VIP)
          `
    },
    'jackpot': {
        title: 'Jackpot',
        icon: 'attach_money',
        color: 'text-secondary',
        rules: `
  1. Satélites Jackpot ocorrem semanalmente no aplicativo online Chip Race.
  2. O vencedor de cada satélite Jackpot recebe um Ticket The Chosen.
  3. Jogadores também podem ganhar vagas através de mãos premiadas específicas em mesas de Cash Game (Jackpot Hands) definidas mensalmente.
  4. Vagas ganhas via Jackpot são acumulativas para o sistema de Bônus de Stack.
          `
    },
    'get_up': {
        title: 'Get Up',
        icon: 'psychology',
        color: 'text-secondary',
        rules: `
  1. Eventos designados como "Major" no calendário presencial do QG Chip Race oferecem uma vaga extra ao campeão.
  2. Esta vaga é adicionada ao prêmio regular do torneio, sem descontar do pote garantido.
  3. A lista de torneios Major é divulgada no início de cada mês no calendário oficial.
          `
    },
    'sitngo': {
        title: 'Sit & Go Satélite',
        icon: 'satellite_alt',
        color: 'text-primary',
        rules: `
  1. Sit & Gos qualificatórios podem ser abertos sob demanda com 6 a 10 jogadores.
  2. Torneios High Roller mensais garantem vaga direta ao campeão (ou TOP 2 dependendo do field).
  3. A estrutura destes satélites é Turbo ou Hyper-Turbo.
          `
    },
    'll': { // ID mapeado para "Last Longer" conforme App.tsx
        title: 'Last Longer',
        icon: 'timer',
        color: 'text-secondary',
        rules: `
  1. Disputa de resistência paralela realizada em torneios selecionados.
  2. Os jogadores pagam uma inscrição extra para o Last Longer. O último jogador restante deste grupo (o que cair por último no torneio) leva a vaga.
  3. Válido apenas para quem se inscrever no Last Longer antes do início do torneio.
          `
    },
    'vip': { // ID mapeado para "Vip's" conforme App.tsx
        title: "Vip's",
        icon: 'diamond',
        color: 'text-primary',
        rules: `
  1. Torneio restrito a jogadores que atingiram o status VIP na plataforma ou no clube.
  2. O evento VIP ocorre trimestralmente e distribui múltiplas vagas para o The Chosen.
  3. Jogadores VIPs têm buy-in descontado ou freebuy dependendo do nível de fidelidade.
          `
    },
    'bet': {
        title: 'Bet',
        icon: 'casino',
        color: 'text-cyan-500',
        rules: `
  1. Campanhas promocionais de apostas esportivas parceiras da Chip Race.
  2. Desafios de repescagem através do "Bet": Sorteios de vagas entre os bolhas dos torneios Major.
  3. Regras específicas são divulgadas a cada campanha "Bet & Win".
          `
    },
    'quest': {
        title: 'Quests',
        icon: 'explore',
        color: 'text-primary',
        rules: `
  1. Complete missões diárias no App (ex: Jogue 50 mãos, Ganhe com AA, etc) para ganhar fragmentos.
  2. Junte fragmentos suficientes para trocar por um Ticket The Chosen na loja do clube.
  3. Existem "Quests Secretas" presenciais que são reveladas apenas durante os eventos ao vivo.
          `
    },
    'sat': {
        title: 'Satélite',
        icon: 'confirmation_number',
        color: 'text-red-500',
        rules: `
  1. Torneios Satélites ocorrem regularmente para diversos eventos do calendário.
  2. Cada satélite garante um número específico de vagas para o evento alvo.
  3. Siga a estrutura de blinds e premiações definida para cada satélite individualmente.
        `
    }
};

const getColors = (color: string) => {
    switch (color) {
        case 'primary': return {
            border: 'hover:border-primary/40',
            icon: 'text-gray-400 group-hover:text-primary',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]',
            glow: 'from-primary/5',
            text: 'group-hover:text-gray-200',
            btn: 'text-gray-400 group-hover:text-white',
            badge: 'bg-white/5 text-gray-400 border-white/10'
        };
        case 'secondary': return {
            border: 'hover:border-secondary/40',
            icon: 'text-gray-400 group-hover:text-secondary',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(var(--secondary-rgb),0.3)]',
            glow: 'from-secondary/5',
            text: 'group-hover:text-gray-200',
            btn: 'text-gray-400 group-hover:text-white',
            badge: 'bg-white/5 text-gray-400 border-white/10'
        };
        case 'cyan': return {
            border: 'hover:border-cyan-500/40',
            icon: 'text-gray-400 group-hover:text-cyan-400',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]',
            glow: 'from-cyan-500/5',
            text: 'group-hover:text-gray-200',
            btn: 'text-gray-400 group-hover:text-white',
            badge: 'bg-white/5 text-gray-400 border-white/10'
        };
        case 'pink': return {
            border: 'hover:border-pink-500/40',
            icon: 'text-gray-400 group-hover:text-pink-400',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(244,114,182,0.3)]',
            glow: 'from-pink-500/5',
            text: 'group-hover:text-gray-200',
            btn: 'text-gray-400 group-hover:text-white',
            badge: 'bg-white/5 text-gray-400 border-white/10'
        };
        case 'blue': return {
            border: 'hover:border-blue-500/40',
            icon: 'text-gray-400 group-hover:text-blue-400',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
            glow: 'from-blue-500/5',
            text: 'group-hover:text-gray-200',
            btn: 'text-gray-400 group-hover:text-white',
            badge: 'bg-white/5 text-gray-400 border-white/10'
        };
        case 'emerald': return {
            border: 'hover:border-emerald-500/40',
            icon: 'text-gray-400 group-hover:text-emerald-400',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
            glow: 'from-emerald-500/5',
            text: 'group-hover:text-gray-200',
            btn: 'text-gray-400 group-hover:text-white',
            badge: 'bg-white/5 text-gray-400 border-white/10'
        };
        case 'amber': return {
            border: 'hover:border-amber-500/40',
            icon: 'text-gray-400 group-hover:text-amber-400',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]',
            glow: 'from-amber-500/5',
            text: 'group-hover:text-gray-200',
            btn: 'text-gray-400 group-hover:text-white',
            badge: 'bg-white/5 text-gray-400 border-white/10'
        };
        case 'orange': return {
            border: 'hover:border-orange-500/40',
            icon: 'text-gray-400 group-hover:text-orange-400',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]',
            glow: 'from-orange-500/5',
            text: 'group-hover:text-gray-200',
            btn: 'text-gray-400 group-hover:text-white',
            badge: 'bg-white/5 text-gray-400 border-white/10'
        };
        case 'purple': return {
            border: 'hover:border-purple-500/40',
            icon: 'text-gray-400 group-hover:text-purple-400',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
            glow: 'from-purple-500/5',
            text: 'group-hover:text-gray-200',
            btn: 'text-gray-400 group-hover:text-white',
            badge: 'bg-white/5 text-gray-400 border-white/10'
        };
        case 'red': return {
            border: 'hover:border-red-500/40',
            icon: 'text-gray-400 group-hover:text-red-400',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
            glow: 'from-red-500/5',
            text: 'group-hover:text-gray-200',
            btn: 'text-gray-400 group-hover:text-white',
            badge: 'bg-white/5 text-gray-400 border-white/10'
        };
        default: return {
            border: 'hover:border-white/20',
            icon: 'text-gray-400 group-hover:text-white',
            shadow: '',
            glow: 'from-white/5',
            text: 'group-hover:text-gray-200',
            btn: 'text-gray-400 group-hover:text-white',
            badge: 'bg-white/5 text-gray-400 border-white/10'
        };
    }
};

export const TheChosenDetails: React.FC<TheChosenDetailsProps> = ({
    isAdmin,
    prizeLabel = "2026",
    onNavigate,
    content = DEFAULT_CONTENT,
    onUpdateContent = (_f: string, _v: string) => { },
    categories = [],
    onUpdateCategory = (_index: number, _updates: Partial<TournamentCategory>) => { },
    onNavigatePlayer,
    allPlayers = [],
    months = [],
    onUpdateMonth = (_i: number, _f: any, _v: any) => { },
    onToggleMonthStatus = (_i: number) => { },
    totalQualifiers = 0,
    nextGoal = { prize: 33000, qualifiers: 20 },
    onUpdateTotal = (_v: any) => { },
    isManualTotal,
    heroContent,
    onUpdateHeroContent = (_f: string, _v: string) => { }
}) => {
    const [activeRegulation, setActiveRegulation] = useState<string | null>(null);
    const [expandMobileTimeline, setExpandMobileTimeline] = useState(false);
    const [productDetails, setProductDetails] = useState<any>(null);
    const [activeTemplateSelect, setActiveTemplateSelect] = useState<number | string | null>(null);

    useEffect(() => {
        if (activeRegulation) {
            fetchProductInfo(activeRegulation);
        } else {
            setProductDetails(null);
        }
    }, [activeRegulation]);

    const fetchProductInfo = async (categoryId: string) => {
        try {
            const { data } = await supabase
                .from('products')
                .select('id, name, description, price, stock, category, active, image_url')
                .eq('category', categoryId)
                .eq('active', true)
                .limit(1)
                .single();

            if (data) {
                setProductDetails(data);
            }
        } catch (e) {
            console.error('Error fetching product:', e);
        }
    };

    // Helpers para Timeline (reutilizado do Hero)
    const renderMonthCard = (month: any, index: number) => {
        const isActive = month.status === 'active';
        const isCompleted = month.status === 'completed';
        const isLocked = month.status === 'locked';

        return (
            <div key={index} className={`relative pt-6 pb-3 px-2 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 min-h-[140px] ${isActive
                ? 'bg-primary/20 border-primary shadow-neon-pink scale-105 z-10'
                : isCompleted
                    ? 'bg-secondary/10 border-secondary/50 opacity-100'
                    : 'bg-white/5 border-white/5 opacity-60 grayscale'
                }`}>
                <div className={`absolute top-0 left-0 w-full text-[9px] uppercase font-black py-1 pl-5 tracking-widest rounded-t-lg ${isActive ? 'bg-primary text-white' :
                    isCompleted ? 'bg-secondary text-black' :
                        'bg-gray-800 text-gray-500'
                    }`}>
                    {isActive ? 'EM ANDAMENTO' : isCompleted ? 'ATINGIDA' : 'BLOQUEADA'}
                </div>
                <div className="text-xs font-bold text-gray-400 mb-2 mt-2">{month.name}</div>
                {isLocked && !isAdmin ? (
                    <span className="material-icons-outlined text-2xl text-gray-600 my-2">lock</span>
                ) : (
                    <div className="flex flex-col items-center w-full">
                        <div className={`text-lg font-display font-black ${isActive ? 'text-white' : isCompleted ? 'text-secondary' : 'text-gray-500'}`}>
                            {month.prize}
                        </div>
                        <div className="text-[10px] uppercase text-gray-400">GTD</div>
                    </div>
                )}
                <div className="mt-3 w-full flex justify-center">
                    <div className={`text-[10px] py-1 px-2 rounded-full font-bold ${isActive ? 'bg-primary text-white' :
                        isCompleted ? 'bg-secondary/20 text-secondary' :
                            'bg-black/30 text-gray-500'
                        }`}>
                        {month.qualifiers} {typeof month.qualifiers === 'number' || !isNaN(Number(month.qualifiers)) ? 'Vagas' : ''}
                    </div>
                </div>
            </div>
        );
    };

    const currentMonthIndex = months.findIndex(m => m.status === 'active') === -1
        ? months.findIndex(m => m.status === 'locked')
        : months.findIndex(m => m.status === 'active');

    // Stats calculations
    const currentGtdNum = parseInt(prizeLabel.replace(/\D/g, '')) * 1000 || 30000;
    const remainingQualifiers = nextGoal.qualifiers > totalQualifiers ? nextGoal.qualifiers - totalQualifiers : 0;
    const progressPercentage = Math.min(100, (totalQualifiers / nextGoal.qualifiers) * 100);

    // Calculation logic moved to TheChosenQualifiers component

    return (
        <div className="min-h-screen bg-background-dark text-gray-200 font-body">

            {/* Header Section - Suavizado */}
            <div className="relative py-24 overflow-hidden bg-background-dark">
                {/* Texture Overlay */}
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>

                {/* Subtle Top Gradient instead of centered blob */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 via-background-dark/50 to-transparent pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center mt-12 md:mt-16">
                    <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6 mb-8">
                        <img
                            src="/the-chosen-logo.png"
                            alt="The Chosen"
                            className="w-full max-w-[320px] sm:max-w-[480px] md:max-w-[600px] h-auto drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] drop-shadow-lg animate-float"
                        />
                        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 mb-2"></div>
                        <span className="text-4xl sm:text-5xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-accent tracking-[0.2em] transform -skew-x-6 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]">
                            {prizeLabel}
                        </span>
                    </div>
                    <p className="text-lg md:text-2xl text-gray-400 font-light max-w-2xl mx-auto">
                        {content.header_subtitle}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-8 relative z-20">

                {/* Introduction Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 mb-16">
                    <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 border-l-4 border-l-primary p-6 sm:p-8 rounded-2xl relative overflow-hidden group hover:bg-white/[0.05] transition-all hover:shadow-[0_0_30px_rgba(217,0,255,0.1)]">
                        <h2 className="text-xl sm:text-2xl font-display font-bold text-primary mb-4 flex items-center gap-2 text-glow">
                            <span className="material-icons-outlined text-primary text-xl sm:text-2xl">lightbulb</span>
                            {content.concept_title}
                        </h2>
                        <p className="text-gray-400 leading-relaxed font-light text-base">
                            {content.concept_desc}
                        </p>
                    </div>

                    <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 border-l-4 border-l-secondary p-6 sm:p-8 rounded-2xl relative overflow-hidden group hover:bg-white/[0.05] transition-all hover:shadow-[0_0_30px_rgba(0,224,255,0.1)]">
                        <h2 className="text-xl sm:text-2xl font-display font-bold text-secondary mb-4 flex items-center gap-2 text-glow-blue">
                            <span className="material-icons-outlined text-secondary text-xl sm:text-2xl">add_circle</span>
                            {content.plus_title}
                        </h2>
                        <p className="text-gray-400 leading-relaxed font-light text-base">
                            {content.plus_desc}
                        </p>
                    </div>
                </div>


                {/* --- TABELA DE CLASSIFICADOS E STACKS (REAL TIME) --- */}
                <div className="mb-20">
                    <TheChosenQualifiers
                        isAdmin={isAdmin}
                        onNavigatePlayer={onNavigatePlayer}
                        playerSuggestions={allPlayers}
                    />
                </div>

                {/* FAQ / Structure */}
                <div className="bg-gray-100 dark:bg-[#0A051E] rounded-3xl p-8 lg:p-12 border border-gray-200 dark:border-white/5">
                    <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-8 text-center">Estrutura do Capítulo Final</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

                        {/* Stack Inicial */}
                        <div className="flex flex-col items-center bg-black/20 rounded-xl p-4 border border-white/5 relative">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white mb-1 flex items-start">
                                {(content as any).structure?.stack || '25K'}<span className="text-primary text-xl -mt-1 ml-0.5">*</span>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">Fichas</div>
                            <div className="text-primary font-bold uppercase text-xs lg:text-sm">Stack Inicial Base</div>
                        </div>

                        {/* Rebuy */}
                        <div className="flex flex-col items-center bg-black/20 rounded-xl p-4 border border-white/5">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white mb-1">
                                {(content as any).structure?.rebuy || 'R$ 200'}
                            </div>
                            <div className="text-sm text-gray-400 mb-2">25K Fichas <span className="text-secondary font-bold text-[10px]">+ BÔNUS</span></div>
                            <div className="text-primary font-bold uppercase text-xs lg:text-sm">Rebuy / Reentrada</div>
                        </div>

                        {/* Add-on */}
                        <div className="flex flex-col items-center bg-black/20 rounded-xl p-4 border border-white/5">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white mb-1">
                                {(content as any).structure?.addon || 'R$ 200'}
                            </div>
                            <div className="text-sm text-gray-400 mb-2">50K Fichas <span className="text-secondary font-bold text-[10px]">+ BÔNUS</span></div>
                            <div className="text-primary font-bold uppercase text-xs lg:text-sm">Add-on</div>
                        </div>

                        {/* Blinds */}
                        <div className="flex flex-col items-center bg-black/20 rounded-xl p-4 border border-white/5">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white mb-1">
                                {(content as any).structure?.blinds || '30'}
                            </div>
                            <div className="text-sm text-gray-500 mb-2">Minutos</div>
                            <div className="text-primary font-bold uppercase text-xs lg:text-sm">Tempo de Blind</div>
                        </div>
                    </div>

                    <div className="mt-8 text-center space-y-4">
                        <div className="bg-black/20 p-6 rounded-xl border border-white/5 text-sm text-gray-400 max-w-3xl mx-auto text-left space-y-4">
                            <div className="pt-2">
                                <p className="text-amber-500/90 flex items-start gap-2">
                                    <span className="material-icons-outlined text-base mt-0.5">info</span>
                                    <span>
                                        <strong>Regra de Valor Plus:</strong> O valor base de Rebuy e Add-on é definido conforme a estrutura acima.
                                        Este valor sofre um acréscimo de <strong>R$ 5,00</strong> para cada <strong>R$ 1.000,00</strong> que forem adicionados ao prêmio garantido total.
                                        <br />
                                        <span className="text-gray-500 text-xs italic font-normal block mt-1">Ex: Se o garantido subir para 40K (10K a mais), o Rebuy custará R$ 250,00.</span>
                                    </span>
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-500 mb-6">
                            O Capítulo Final ocorrerá em Novembro de 2026, no QG Chip Race em Venâncio Aires - RS.
                        </p>
                        <button
                            onClick={() => onNavigate && onNavigate('the-chosen-regulations')}
                            className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
                        >
                            VER REGULAMENTO COMPLETO
                        </button>
                    </div>
                </div>

            </div>



            {/* MODAL PRODUTO / DETALHES ESPECÍFICOS */}
            {
                activeRegulation && (REGULATIONS_DATA[activeRegulation] || productDetails || categories.some(cat => cat.id === activeRegulation)) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="bg-[#0f0a28] border-white/10 sm:border rounded-none sm:rounded-[3rem] w-full h-full sm:h-auto sm:max-w-4xl shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">

                            {/* Header Background Glow */}
                            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-20 bg-gradient-to-br from-primary/20 to-secondary/20`}></div>

                            {/* Fixed Close Button */}
                            <button
                                onClick={() => setActiveRegulation(null)}
                                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full z-[30]"
                            >
                                <span className="material-icons-outlined text-2xl">close</span>
                            </button>

                            {/* Content Area - Scrollable */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 relative z-10 pt-16 sm:pt-10">

                                {(() => {
                                    const category = categories.find(c => c.id === activeRegulation);
                                    const styles = getColors(category?.color || '');
                                    return (
                                        <div key={category?.id || 'product'}>
                                            <div className="flex flex-col items-center text-center mb-8 pt-4">
                                                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-black border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden group`}>
                                                    <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${styles.glow}`}></div>
                                                    {productDetails?.image_url ? (
                                                        <img src={productDetails.image_url} alt={productDetails.name} className="w-full h-full object-cover relative z-10" />
                                                    ) : (
                                                        <span className={`material-icons-outlined text-4xl sm:text-5xl relative z-10 ${styles.icon}`}>{category?.icon || 'star'}</span>
                                                    )}
                                                </div>

                                                <h3 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-wider mb-2">
                                                    {productDetails?.name || category?.title}
                                                </h3>
                                                <div className="h-1 w-16 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Botão de Ação - Movido para o topo para melhor visibilidade */}
                                                <div className="px-2">
                                                    <button
                                                        onClick={() => setActiveRegulation(null)}
                                                        className="w-full py-4 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-primary/50 transition-all hover:scale-[1.01] mb-2"
                                                    >
                                                        {productDetails ? 'Adquirir via App' : 'Entendido'}
                                                    </button>
                                                </div>

                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">
                                                        {productDetails ? 'DESCRIÇÃO DO PRODUTO' : 'INFORMAÇÕES GERAIS'}
                                                    </h4>
                                                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-light max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                                        {productDetails?.description || REGULATIONS_DATA[activeRegulation]?.rules || category?.description}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">
                                                            {productDetails ? 'Valor' : 'Status'}
                                                        </p>
                                                        <p className="text-white font-bold text-sm">
                                                            {productDetails ? `R$ ${parseFloat(productDetails.price).toFixed(2).replace('.', ',')}` : 'Disponível'}
                                                        </p>
                                                    </div>
                                                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">
                                                            {productDetails ? 'Disponível' : 'Vagas'}
                                                        </p>
                                                        <p className="text-white font-bold uppercase text-sm">
                                                            {productDetails ? `${productDetails.stock} uni.` : `${category?.slots || 0} Vagas`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                        </div>
                    </div>
                )
            }
            {/* CATEGORY TEMPLATE SELECTOR MODAL (FIXED POSITION OUTSIDE MAP LOOP) */}
            {
                activeTemplateSelect !== null && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActiveTemplateSelect(null)}>
                        <div
                            className="w-full max-w-[280px] bg-[#1a1438] border border-white/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-3 animate-in fade-in zoom-in duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest p-2 border-b border-white/5 mb-1 flex justify-between items-center">
                                <span>Categorias do Sistema</span>
                                <button onClick={() => setActiveTemplateSelect(null)} className="hover:text-white transition-colors">
                                    <span className="material-icons-outlined text-xs font-black">close</span>
                                </button>
                            </div>
                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={async () => {
                                            const isSlotMode = typeof activeTemplateSelect === 'string' && activeTemplateSelect.startsWith('slot-');
                                            if (isSlotMode) {
                                                const slotIndex = parseInt(activeTemplateSelect.toString().split('-')[1]);
                                                const newSlots = [...((content as any).chosen_slots || Object.keys(REGULATIONS_DATA))];
                                                newSlots[slotIndex] = cat.id;
                                                onUpdateContent('chosen_slots', newSlots as any);
                                            } else {
                                                // Handle original isNew logic if still active
                                                const isNew = typeof activeTemplateSelect === 'string' && activeTemplateSelect.startsWith('new-');
                                                const index = isNew ? parseInt(activeTemplateSelect.toString().split('-')[1]) : activeTemplateSelect as number;

                                                const colorValue = (cat.color.replace('text-', '').replace('-500', '') as any);
                                                const firstRule = cat.description.trim().split('\n')[0].replace(/^\d+\.\s*/, '');

                                                if (isNew) {
                                                    const { error } = await supabase.from('ecosystem_categories').insert({
                                                        id: cat.id,
                                                        title: cat.title,
                                                        icon: cat.icon,
                                                        description: firstRule,
                                                        color: colorValue === 'primary' || colorValue === 'secondary' || colorValue === 'cyan' || colorValue === 'pink' ? colorValue : 'primary',
                                                        order: index,
                                                        slots: 1
                                                    });
                                                    if (error) alert('Erro ao criar: ' + error.message);
                                                    else window.location.reload();
                                                } else {
                                                    onUpdateCategory(index, {
                                                        id: cat.id,
                                                        title: cat.title,
                                                        icon: cat.icon,
                                                        description: firstRule,
                                                        color: colorValue === 'primary' || colorValue === 'secondary' || colorValue === 'cyan' || colorValue === 'pink' ? colorValue : 'primary'
                                                    });
                                                }
                                            }
                                            setActiveTemplateSelect(null);
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/5 transition-colors flex items-center gap-2 group/item"
                                    >
                                        <span className={`material-icons-outlined text-sm text-${cat.color}-500`}>{cat.icon}</span>
                                        <span className="text-gray-300 group-hover/item:text-white truncate">{cat.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};