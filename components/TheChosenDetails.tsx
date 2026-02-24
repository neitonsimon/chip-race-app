import React, { useState, useEffect } from 'react';
import { ContentDB, TournamentCategory } from '../types';
import { EditableContent } from './EditableContent';
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
    'rankings': {
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
    'get-up': {
        title: 'Get Up',
        icon: 'psychology',
        color: 'text-secondary',
        rules: `
  1. Eventos designados como "Major" no calendário presencial do QG Chip Race oferecem uma vaga extra ao campeão.
  2. Esta vaga é adicionada ao prêmio regular do torneio, sem descontar do pote garantido.
  3. A lista de torneios Major é divulgada no início de cada mês no calendário oficial.
          `
    },
    'sit-n-go': {
        title: 'Sit & Go Satélite',
        icon: 'satellite_alt',
        color: 'text-primary',
        rules: `
  1. Sit & Gos qualificatórios podem ser abertos sob demanda com 6 a 10 jogadores.
  2. Torneios High Roller mensais garantem vaga direta ao campeão (ou TOP 2 dependendo do field).
  3. A estrutura destes satélites é Turbo ou Hyper-Turbo.
          `
    },
    'red-omaha': { // ID mapeado para "Last Longer" conforme App.tsx
        title: 'Last Longer',
        icon: 'timer',
        color: 'text-secondary',
        rules: `
  1. Disputa de resistência paralela realizada em torneios selecionados.
  2. Os jogadores pagam uma inscrição extra para o Last Longer. O último jogador restante deste grupo (o que cair por último no torneio) leva a vaga.
  3. Válido apenas para quem se inscrever no Last Longer antes do início do torneio.
          `
    },
    'ladies-league': { // ID mapeado para "Vip's" conforme App.tsx
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
    'quests': {
        title: 'Quests',
        icon: 'explore',
        color: 'text-primary',
        rules: `
  1. Complete missões diárias no App (ex: Jogue 50 mãos, Ganhe com AA, etc) para ganhar fragmentos.
  2. Junte fragmentos suficientes para trocar por um Ticket The Chosen na loja do clube.
  3. Existem "Quests Secretas" presenciais que são reveladas apenas durante os eventos ao vivo.
          `
    }
};

const getColors = (color: string) => {
    switch (color) {
        case 'primary': return {
            border: 'hover:border-primary/50',
            icon: 'text-primary',
            shadow: 'group-hover:shadow-neon-pink',
            glow: 'from-primary/10',
            text: 'group-hover:text-primary',
            btn: 'text-primary',
            badge: 'bg-primary/20 text-primary border-primary/40'
        };
        case 'secondary': return {
            border: 'hover:border-secondary/50',
            icon: 'text-secondary',
            shadow: 'group-hover:shadow-neon-blue',
            glow: 'from-secondary/10',
            text: 'group-hover:text-secondary',
            btn: 'text-secondary',
            badge: 'bg-secondary/20 text-secondary border-secondary/40'
        };
        case 'cyan': return {
            border: 'hover:border-cyan-500/50',
            icon: 'text-cyan-500',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]',
            glow: 'from-cyan-500/10',
            text: 'group-hover:text-cyan-500',
            btn: 'text-cyan-500',
            badge: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/40'
        };
        case 'pink': return {
            border: 'hover:border-pink-500/50',
            icon: 'text-pink-500',
            shadow: 'group-hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]',
            glow: 'from-pink-500/10',
            text: 'group-hover:text-pink-500',
            btn: 'text-pink-500',
            badge: 'bg-pink-500/20 text-pink-500 border-pink-500/40'
        };
        default: return {
            border: 'hover:border-gray-500',
            icon: 'text-gray-500',
            shadow: '',
            glow: 'from-gray-500/10',
            text: '',
            btn: 'text-gray-500',
            badge: 'bg-gray-500/20 text-gray-500 border-gray-500/40'
        };
    }
};

export const TheChosenDetails: React.FC<TheChosenDetailsProps> = ({
    isAdmin,
    prizeLabel = "30K+",
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
    const [activeTemplateSelect, setActiveTemplateSelect] = useState<number | null>(null);

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
                .select('*')
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
                <div className={`absolute top-0 left-0 w-full text-[9px] uppercase font-black py-1 tracking-widest rounded-t-lg ${isActive ? 'bg-primary text-white' :
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
                        {isAdmin ? (
                            <input
                                type="text"
                                value={month.prize}
                                onChange={(e) => onUpdateMonth(index, 'prize', e.target.value)}
                                className="w-16 text-center bg-black/50 border border-white/20 rounded text-sm text-white font-bold mb-1"
                            />
                        ) : (
                            <div className={`text-lg font-display font-black ${isActive ? 'text-white' : isCompleted ? 'text-secondary' : 'text-gray-500'}`}>
                                {month.prize}
                            </div>
                        )}
                        <div className="text-[10px] uppercase text-gray-400">GTD</div>
                    </div>
                )}
                <div className="mt-3 w-full flex justify-center">
                    {isAdmin ? (
                        <div className="flex items-center gap-1 justify-center">
                            <input
                                type="text"
                                value={month.qualifiers}
                                onChange={(e) => onUpdateMonth(index, 'qualifiers', e.target.value)}
                                className="w-10 text-center bg-black/50 border border-white/20 rounded text-xs text-white"
                            />
                            <span className="text-[10px] text-gray-400">Vagas</span>
                        </div>
                    ) : (
                        <div className={`text-[10px] py-1 px-2 rounded-full font-bold ${isActive ? 'bg-primary text-white' :
                            isCompleted ? 'bg-secondary/20 text-secondary' :
                                'bg-black/30 text-gray-500'
                            }`}>
                            {month.qualifiers} {typeof month.qualifiers === 'number' || !isNaN(Number(month.qualifiers)) ? 'Vagas' : ''}
                        </div>
                    )}
                </div>
                {isAdmin && (
                    <button
                        onClick={() => onToggleMonthStatus(index)}
                        className={`absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center border z-20 ${isActive ? 'bg-green-500 border-green-300' :
                            isCompleted ? 'bg-blue-500 border-blue-300' : 'bg-red-500 border-red-300'
                            }`}
                    >
                        <span className="material-icons-outlined text-[10px] text-white">change_circle</span>
                    </button>
                )}
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

                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center mt-8">
                    <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-4 drop-shadow-lg">
                        <EditableContent
                            isAdmin={isAdmin}
                            value={content.header_title}
                            onSave={(val) => onUpdateContent('header_title', val)}
                        /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{prizeLabel}</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl mx-auto">
                        <EditableContent
                            isAdmin={isAdmin}
                            value={content.header_subtitle}
                            onSave={(val) => onUpdateContent('header_subtitle', val)}
                            type="textarea"
                        />
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-8 relative z-20">

                {/* Introduction Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 mb-16">
                    {/* ... (Cards Conceito e Plus Mantidos) ... */}
                    <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 border-l-4 border-l-primary p-8 rounded-2xl relative overflow-hidden group hover:bg-white/[0.05] transition-all hover:shadow-[0_0_30px_rgba(217,0,255,0.1)]">
                        <h2 className="text-2xl font-display font-bold text-primary mb-4 flex items-center gap-2 text-glow">
                            <span className="material-icons-outlined text-primary text-2xl">lightbulb</span>
                            <EditableContent
                                isAdmin={isAdmin}
                                value={content.concept_title}
                                onSave={(val) => onUpdateContent('concept_title', val)}
                            />
                        </h2>
                        <p className="text-gray-400 leading-relaxed font-light text-base">
                            <EditableContent
                                isAdmin={isAdmin}
                                value={content.concept_desc}
                                onSave={(val) => onUpdateContent('concept_desc', val)}
                                type="textarea"
                            />
                        </p>
                    </div>

                    <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 border-l-4 border-l-secondary p-8 rounded-2xl relative overflow-hidden group hover:bg-white/[0.05] transition-all hover:shadow-[0_0_30px_rgba(0,224,255,0.1)]">
                        <h2 className="text-2xl font-display font-bold text-secondary mb-4 flex items-center gap-2 text-glow-blue">
                            <span className="material-icons-outlined text-secondary text-2xl">add_circle</span>
                            <EditableContent
                                isAdmin={isAdmin}
                                value={content.plus_title}
                                onSave={(val) => onUpdateContent('plus_title', val)}
                            />
                        </h2>
                        <p className="text-gray-400 leading-relaxed font-light text-base">
                            <EditableContent
                                isAdmin={isAdmin}
                                value={content.plus_desc}
                                onSave={(val) => onUpdateContent('plus_desc', val)}
                                type="textarea"
                            />
                        </p>
                    </div>
                </div>

                {/* CRONOGRAMA DE EVOLUÇÃO (MOVIDO DA HOME) */}
                <div className="mb-20">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-display font-bold text-white mb-2 uppercase tracking-wide">
                            <EditableContent
                                isAdmin={isAdmin}
                                value={heroContent?.timeline_title || "Cronograma de Evolução"}
                                onSave={(val) => onUpdateHeroContent('timeline_title', val)}
                            />
                        </h2>
                        <div className="h-1 w-20 bg-primary/30 mx-auto rounded-full"></div>
                    </div>

                    {/* Desktop View: Full Grid */}
                    <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-9 gap-3">
                        {months.map((month: any, index: number) => renderMonthCard(month, index))}
                    </div>

                    {/* Mobile View: Toggle logic */}
                    <div className="md:hidden">
                        {!expandMobileTimeline ? (
                            <div className="flex flex-col items-center">
                                <div className="w-full max-w-[240px]">
                                    {renderMonthCard(months[currentMonthIndex], currentMonthIndex)}
                                </div>
                                <button onClick={() => setExpandMobileTimeline(true)} className="mt-6 text-xs text-gray-400 font-bold tracking-widest bg-white/5 px-6 py-3 rounded-full border border-white/10">VER CRONOGRAMA COMPLETO</button>
                            </div>
                        ) : (
                            <div>
                                <div className="grid grid-cols-2 gap-3">
                                    {months.map((month: any, index: number) => renderMonthCard(month, index))}
                                </div>
                                <button onClick={() => setExpandMobileTimeline(false)} className="mt-6 w-full py-3 text-xs text-gray-500 font-bold uppercase tracking-widest bg-black/20 rounded-lg">RECOLHER</button>
                            </div>
                        )}
                    </div>

                    <p className="mt-6 text-center text-xs text-gray-500 italic">
                        * Nos meses bloqueados, a premiação e o número de classificados são suspensos e revelados posteriormente pela Chip Race.
                    </p>
                </div>


                {/* Ecosystem Categories Section */}
                <div className="mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-display font-bold text-white mb-4">
                            <EditableContent
                                isAdmin={isAdmin}
                                value={content.ways_title || "Ecossistema Chip Race"}
                                onSave={(val) => onUpdateContent('ways_title', val)}
                            />
                        </h2>
                        <div className="h-1 w-20 bg-gradient-to-r from-primary/50 to-secondary/50 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((cat, index) => {
                            const styles = getColors(cat.color);

                            return (
                                <div key={cat.id} className="relative bg-[#0f0a20] border border-white/5 p-8 rounded-2xl hover:border-primary/30 transition-colors flex flex-col h-full text-center items-center shadow-lg group hover:-translate-y-2 duration-300">

                                    {/* SLOT/QUALIFIER BADGE EDITABLE (Only relevant for some categories, but keeping it as a generic 'Stat' for now) */}
                                    <div className={`absolute top-4 right-4 text-[10px] font-black uppercase px-2 py-1 rounded-full border ${styles.badge} z-20 flex items-center gap-1`}>
                                        <EditableContent
                                            isAdmin={isAdmin}
                                            value={String(cat.slots || 0)}
                                            onSave={(val) => onUpdateCategory(index, { slots: parseInt(val) || 0 })}
                                        />
                                        <span>Vagas</span>
                                    </div>

                                    <div className="mb-6 relative mt-4">
                                        <div className={`w-16 h-16 rounded-full bg-black border border-white/10 flex items-center justify-center relative z-10 group-hover:${styles.glow} transition-all duration-300`}>
                                            <span className={`material-icons-outlined text-3xl ${styles.icon}`}>{cat.icon}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center">
                                        <h3 className="text-xl font-display font-bold text-white mb-3 uppercase tracking-wide flex items-center justify-center gap-2">
                                            <EditableContent
                                                isAdmin={isAdmin}
                                                value={cat.title}
                                                onSave={(val) => onUpdateCategory(index, { title: val })}
                                            />
                                            {isAdmin && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setActiveTemplateSelect(activeTemplateSelect === index ? null : index)}
                                                        className="p-1 hover:bg-white/10 rounded transition-colors text-gray-500 hover:text-primary"
                                                        title="Escolher Categoria do Sistema"
                                                    >
                                                        <span className="material-icons-outlined text-sm">settings</span>
                                                    </button>

                                                    {activeTemplateSelect === index && (
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-surface-dark border border-white/10 rounded-xl shadow-2xl z-[100] p-2 animate-in fade-in zoom-in duration-200">
                                                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest p-2 border-b border-white/5 mb-1">Categorias do Sistema</div>
                                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                                {Object.entries(REGULATIONS_DATA).map(([key, data]) => (
                                                                    <button
                                                                        key={key}
                                                                        onClick={() => {
                                                                            const colorValue = (data.color.replace('text-', '').replace('-500', '') as any);
                                                                            onUpdateCategory(index, {
                                                                                id: key,
                                                                                title: data.title,
                                                                                icon: data.icon,
                                                                                color: colorValue === 'primary' || colorValue === 'secondary' || colorValue === 'cyan' || colorValue === 'pink' ? colorValue : 'primary'
                                                                            });
                                                                            setActiveTemplateSelect(null);
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/5 transition-colors flex items-center gap-2 group/item"
                                                                    >
                                                                        <span className={`material-icons-outlined text-sm ${data.color}`}>{data.icon}</span>
                                                                        <span className="text-gray-300 group-hover/item:text-white truncate">{data.title}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-6 leading-relaxed max-w-[200px]">
                                            <EditableContent
                                                isAdmin={isAdmin}
                                                value={cat.description}
                                                onSave={(val) => onUpdateCategory(index, { description: val })}
                                                type="textarea"
                                            />
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveRegulation(cat.id)}
                                        className={`mt-auto text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-current hover:bg-white/10 transition-all ${styles.icon}`}
                                    >
                                        VER MAIS <span className="material-icons-outlined text-xs">add_circle</span>
                                    </button>
                                </div>
                            );
                        })}
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
                            <div className="text-3xl lg:text-4xl font-display font-black text-white mb-1 flex items-start">
                                25K<span className="text-primary text-xl -mt-1 ml-0.5">*</span>
                            </div>
                            <div className="text-sm text-gray-500 mb-2">Fichas</div>
                            <div className="text-primary font-bold uppercase text-xs lg:text-sm">Stack Inicial Base</div>
                        </div>

                        {/* Rebuy */}
                        <div className="flex flex-col items-center bg-black/20 rounded-xl p-4 border border-white/5">
                            <div className="text-3xl lg:text-4xl font-display font-black text-white mb-1">R$ 200</div>
                            <div className="text-sm text-gray-400 mb-2">25K Fichas <span className="text-secondary font-bold text-[10px]">+ BÔNUS</span></div>
                            <div className="text-primary font-bold uppercase text-xs lg:text-sm">Rebuy / Reentrada</div>
                        </div>

                        {/* Add-on */}
                        <div className="flex flex-col items-center bg-black/20 rounded-xl p-4 border border-white/5">
                            <div className="text-3xl lg:text-4xl font-display font-black text-white mb-1">R$ 200</div>
                            <div className="text-sm text-gray-400 mb-2">50K Fichas <span className="text-secondary font-bold text-[10px]">+ BÔNUS</span></div>
                            <div className="text-primary font-bold uppercase text-xs lg:text-sm">Add-on</div>
                        </div>

                        {/* Blinds */}
                        <div className="flex flex-col items-center bg-black/20 rounded-xl p-4 border border-white/5">
                            <div className="text-3xl lg:text-4xl font-display font-black text-white mb-1">30</div>
                            <div className="text-sm text-gray-500 mb-2">Minutos</div>
                            <div className="text-primary font-bold uppercase text-xs lg:text-sm">Tempo de Blind</div>
                        </div>
                    </div>

                    <div className="mt-8 text-center space-y-4">
                        <div className="bg-black/20 p-6 rounded-xl border border-white/5 text-sm text-gray-400 max-w-3xl mx-auto text-left space-y-4">
                            <div className="pt-2">
                                <p className="text-yellow-500 flex items-start gap-2">
                                    <span className="material-icons-outlined text-base mt-0.5">info</span>
                                    <span>
                                        <strong>Regra de Valor Plus:</strong> O valor base de Rebuy e Add-on é de R$ 200,00.
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
            {activeRegulation && (REGULATIONS_DATA[activeRegulation] || productDetails || categories.some(cat => cat.id === activeRegulation)) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-float overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Header Background Glow */}
                        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-20 bg-gradient-to-br from-primary/20 to-secondary/20`}></div>

                        <div className="p-8 overflow-y-auto custom-scrollbar relative z-10">
                            <button
                                onClick={() => setActiveRegulation(null)}
                                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
                            >
                                <span className="material-icons-outlined text-2xl">close</span>
                            </button>

                            {(() => {
                                const category = categories.find(c => c.id === activeRegulation);
                                const styles = getColors(category?.color || '');
                                return (
                                    <div key={category?.id || 'product'}>
                                        <div className="flex flex-col items-center text-center mb-8 pt-4">
                                            <div className={`w-24 h-24 rounded-3xl bg-black border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden group`}>
                                                <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${styles.glow}`}></div>
                                                {productDetails?.image_url ? (
                                                    <img src={productDetails.image_url} alt={productDetails.name} className="w-full h-full object-cover relative z-10" />
                                                ) : (
                                                    <span className={`material-icons-outlined text-5xl relative z-10 ${styles.icon}`}>{category?.icon || 'star'}</span>
                                                )}
                                            </div>

                                            <h3 className="text-3xl font-display font-black text-white uppercase tracking-wider mb-2">
                                                {productDetails?.name || category?.title}
                                            </h3>
                                            <div className="h-1 w-16 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                                <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">
                                                    {productDetails ? 'DESCRIÇÃO DO PRODUTO' : 'INFORMAÇÕES GERAIS'}
                                                </h4>
                                                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-light">
                                                    {productDetails?.description || REGULATIONS_DATA[activeRegulation]?.rules || category?.description}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">
                                                        {productDetails ? 'Valor' : 'Status'}
                                                    </p>
                                                    <p className="text-white font-bold">
                                                        {productDetails ? `R$ ${parseFloat(productDetails.price).toFixed(2).replace('.', ',')}` : 'Disponível'}
                                                    </p>
                                                </div>
                                                <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">
                                                        {productDetails ? 'Disponível' : 'Vagas'}
                                                    </p>
                                                    <p className="text-white font-bold uppercase">
                                                        {productDetails ? `${productDetails.stock} unidades` : `${category?.slots || 0} Vagas`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-10">
                                            <button
                                                onClick={() => setActiveRegulation(null)}
                                                className="w-full py-4 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-primary/50 transition-all hover:scale-[1.02]"
                                            >
                                                {productDetails ? 'Adquirir via App' : 'Entendido'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};