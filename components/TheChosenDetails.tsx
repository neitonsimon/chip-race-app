import React, { useState } from 'react';
import { ContentDB, TournamentCategory } from '../types';
import { EditableContent } from './EditableContent';

interface TheChosenDetailsProps {
  isAdmin?: boolean;
  prizeLabel?: string;
  onNavigate?: (view: string) => void;
  content?: ContentDB['details']; // Torna opcional para não quebrar em renders parciais, mas App deve passar
  onUpdateContent?: (field: string, value: string) => void;
  categories?: TournamentCategory[];
  onUpdateCategory?: (index: number, field: keyof TournamentCategory, value: any) => void;
}

// Fallback content if not provided (should be provided by App)
const DEFAULT_CONTENT = {
    header_title: "THE CHOSEN",
    header_subtitle: "O Capítulo Final da temporada 2026 da Chip Race.",
    concept_title: "CONCEITO",
    concept_desc: "Diferente de torneios abertos, o The Chosen é um evento exclusivo para quem provou seu valor durante o ano. Não é possível comprar o buy-in diretamente para o Capítulo Final. Você deve conquistar sua vaga. Isso garante um field de altíssimo nível e uma atmosfera de verdadeira final de campeonato.",
    plus_title: "DINÂMICA PLUS",
    plus_desc: "O garantido inicial é de R$ 30.000,00, mas a Chip Race desafia a comunidade. A cada mês, se atingirmos metas de classificados, a Chip Race injeta mais dinheiro no garantido. O pote cresce junto com o engajamento dos jogadores.",
    ways_title: "8 Caminhos para a Glória"
};

// Mock Data based on the Spreadsheet Image
interface QualifiedPlayerMock {
    id: string;
    name: string;
    avatar: string;
    // Map method ID to count (1 = Qualified, 2+ = Reincidence)
    qualifications: Record<string, number>;
}

const mockQualifiers: QualifiedPlayerMock[] = [
    {
        id: '1', name: 'Neiton Simon', avatar: 'https://ui-avatars.com/api/?name=Neiton+Simon&background=random',
        qualifications: { 'rankings': 2, 'red-omaha': 1, 'get-up': 1, 'quests': 1 } // Jogador 1 da planilha
    },
    {
        id: '2', name: 'Lucas Poker', avatar: 'https://ui-avatars.com/api/?name=Lucas+Poker&background=random',
        qualifications: { 'jackpot': 1 } // Jogador 2
    },
    {
        id: '3', name: 'Gabriel Silva', avatar: 'https://ui-avatars.com/api/?name=Gabriel+Silva&background=random',
        qualifications: { 'rankings': 1, 'jackpot': 1, 'red-omaha': 2, 'bet': 2 } // Jogador 3
    },
    {
        id: '4', name: 'Mariana T.', avatar: 'https://ui-avatars.com/api/?name=Mariana+T&background=random',
        qualifications: { 'get-up': 2 } // Jogador 4
    },
    {
        id: '5', name: 'Pedro H.', avatar: 'https://ui-avatars.com/api/?name=Pedro+H&background=random',
        qualifications: { 'jackpot': 1, 'red-omaha': 1, 'bet': 1, 'get-up': 1, 'sit-n-go': 1, 'quests': 1, 'ladies-league': 1 } // Jogador 5
    }
];

export const TheChosenDetails: React.FC<TheChosenDetailsProps> = ({ 
    isAdmin, 
    prizeLabel = "30K+", 
    onNavigate,
    content = DEFAULT_CONTENT,
    onUpdateContent = (_f: string, _v: string) => {},
    categories = [],
    onUpdateCategory = (_index: number, _field: keyof TournamentCategory, _value: any) => {}
}) => {
  const [activeRegulation, setActiveRegulation] = useState<string | null>(null);

  const qualifyingMethods = [
      { 
          id: 'rankings', // Updated to match App.tsx
          title: 'Rankings', 
          desc: 'A principal porta de entrada. Pontue no Live e Online para garantir sua vaga.', 
          icon: 'leaderboard',
          color: 'text-primary',
          badge: 'bg-primary/20 text-primary border-primary/40',
          glow: 'shadow-neon-pink',
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
      { 
          id: 'jackpot', 
          title: 'Jackpot', 
          desc: 'Classifique-se jogando de casa através dos nossos satélites semanais.', 
          icon: 'attach_money',
          color: 'text-secondary',
          badge: 'bg-secondary/20 text-secondary border-secondary/40',
           glow: 'shadow-neon-blue',
          rules: `
              1. Satélites Jackpot ocorrem semanalmente no aplicativo online Chip Race.
              2. O vencedor de cada satélite Jackpot recebe um Ticket The Chosen.
              3. Jogadores também podem ganhar vagas através de mãos premiadas específicas em mesas de Cash Game (Jackpot Hands) definidas mensalmente.
              4. Vagas ganhas via Jackpot são acumulativas para o sistema de Bônus de Stack.
          ` 
      },
      { 
          id: 'red-omaha', // Updated to match App.tsx (formerly last-longer)
          title: 'Last Longer', 
          desc: 'Aposte em quem vai mais longe. Uma disputa de resistência paralela ao torneio.', 
          icon: 'timer',
          color: 'text-secondary',
          badge: 'bg-secondary/20 text-secondary border-secondary/40',
          glow: 'shadow-neon-blue',
          rules: `
              1. Disputa de resistência paralela realizada em torneios selecionados.
              2. Os jogadores pagam uma inscrição extra para o Last Longer. O último jogador restante deste grupo (o que cair por último no torneio) leva a vaga.
              3. Válido apenas para quem se inscrever no Last Longer antes do início do torneio.
          ` 
      },
      { 
          id: 'bet', 
          title: 'Bet', 
          desc: 'Desafios de apostas e repescagem. A última chance de entrar no 30K+.', 
          icon: 'casino',
          color: 'text-purple-500',
          badge: 'bg-purple-500/20 text-purple-500 border-purple-500/40',
          glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
          rules: `
              1. Campanhas promocionais de apostas esportivas parceiras da Chip Race.
              2. Desafios de repescagem "Lucky Loser": Sorteios de vagas entre os bolhas dos torneios Major.
              3. Regras específicas são divulgadas a cada campanha "Bet & Win".
          ` 
      },
      { 
          id: 'get-up', 
          title: 'Get Up', 
          desc: 'Vença torneios presenciais selecionados na sede e ganhe o Golden Ticket.', 
          icon: 'psychology',
          color: 'text-secondary',
          badge: 'bg-secondary/20 text-secondary border-secondary/40',
          glow: 'shadow-neon-blue',
          rules: `
              1. Eventos designados como "Major" no calendário presencial do QG Chip Race oferecem uma vaga extra ao campeão.
              2. Esta vaga é adicionada ao prêmio regular do torneio, sem descontar do pote garantido.
              3. A lista de torneios Major é divulgada no início de cada mês no calendário oficial.
          ` 
      },
      { 
          id: 'sit-n-go', 
          title: 'SNG / Sat', 
          desc: 'Para quem joga caro. Os campeões dos HRs mensais garantem vaga direta.', 
          icon: 'satellite_alt',
          color: 'text-primary',
          badge: 'bg-primary/20 text-primary border-primary/40',
          glow: 'shadow-neon-pink',
          rules: `
              1. Sit & Gos qualificatórios podem ser abertos sob demanda com 6 a 10 jogadores.
              2. Torneios High Roller mensais garantem vaga direta ao campeão (ou TOP 2 dependendo do field).
              3. A estrutura destes satélites é Turbo ou Hyper-Turbo.
          ` 
      },
      { 
          id: 'quests', 
          title: 'Quests', 
          desc: 'Missões diárias e desafios secretos que desbloqueiam vagas para o The Chosen.', 
          icon: 'explore',
          color: 'text-primary',
          badge: 'bg-primary/20 text-primary border-primary/40',
          glow: 'shadow-neon-pink',
          rules: `
              1. Complete missões diárias no App (ex: Jogue 50 mãos, Ganhe com AA, etc) para ganhar fragmentos.
              2. Junte fragmentos suficientes para trocar por um Ticket The Chosen na loja do clube.
              3. Existem "Quests Secretas" presenciais que são reveladas apenas durante os eventos ao vivo.
          ` 
      },
      { 
          id: 'ladies-league', // Updated to match App.tsx (formerly vips)
          title: "VIP", 
          desc: 'Torneio especial e exclusivo focado em promover a experiência VIP.', 
          icon: 'diamond',
          color: 'text-primary',
          badge: 'bg-primary/20 text-primary border-primary/40',
          glow: 'shadow-neon-pink',
          rules: `
              1. Torneio restrito a jogadores que atingiram o status VIP na plataforma ou no clube.
              2. O evento VIP ocorre trimestralmente e distribui múltiplas vagas para o The Chosen.
              3. Jogadores VIPs têm buy-in descontado ou freebuy dependendo do nível de fidelidade.
          ` 
      },
   ];

   const calculateStack = (player: QualifiedPlayerMock) => {
       let initialStack = 0;
       let bonusStack = 0;
       let uniqueMethods = 0;

       Object.entries(player.qualifications).forEach(([methodId, count]) => {
           if (count > 0) {
               uniqueMethods++;
               // First qualification in this method adds to INITIAL STACK
               initialStack += 25000;
               
               // Subsequent qualifications (Reincidence) in SAME method add to BONUS STACK
               if (count > 1) {
                   bonusStack += (count - 1) * 25000;
               }
           }
       });

       return { initialStack, bonusStack };
   };

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

         {/* 8 Ways to Qualify */}
         <div className="mb-20">
            <div className="text-center mb-12">
               <h2 className="text-3xl font-display font-bold text-white mb-4">
                   <EditableContent
                       isAdmin={isAdmin}
                       value={content.ways_title}
                       onSave={(val) => onUpdateContent('ways_title', val)}
                   />
               </h2>
               <div className="h-1 w-20 bg-gradient-to-r from-primary/50 to-secondary/50 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {qualifyingMethods.map((item) => {
                   // Find the category object from props to get the slot count
                   const categoryData = categories.find(cat => cat.id === item.id);
                   const slotCount = categoryData ? categoryData.slots : 0;
                   const catIndex = categories.findIndex(cat => cat.id === item.id);

                   return (
                      <div key={item.id} className="relative bg-[#0f0a20] border border-white/5 p-8 rounded-2xl hover:border-primary/30 transition-colors flex flex-col h-full text-center items-center shadow-lg group hover:-translate-y-2 duration-300">
                         
                         {/* SLOT BADGE EDITABLE */}
                         <div className={`absolute top-4 right-4 text-[10px] font-black uppercase px-2 py-1 rounded-full border ${item.badge} z-20 flex items-center gap-1`}>
                            <EditableContent
                                isAdmin={isAdmin}
                                value={String(slotCount)}
                                onSave={(val) => catIndex >= 0 && onUpdateCategory(catIndex, 'slots', parseInt(val) || 0)}
                            />
                            <span>Vagas</span>
                         </div>

                         <div className="mb-6 relative mt-4">
                            <div className={`w-16 h-16 rounded-full bg-black border border-white/10 flex items-center justify-center relative z-10 group-hover:${item.glow} transition-shadow duration-300`}>
                                <span className={`material-icons-outlined text-3xl ${item.color}`}>{item.icon}</span>
                            </div>
                         </div>
                         <div className="flex-1 flex flex-col items-center">
                            <h3 className="text-xl font-display font-bold text-white mb-3 uppercase tracking-wide">{item.title}</h3>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed max-w-[200px]">{item.desc}</p>
                         </div>
                         <button 
                            onClick={() => setActiveRegulation(item.id)}
                            className={`mt-auto text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors ${item.color}`}
                         >
                            VER REGULAMENTO <span className="material-icons-outlined text-xs">arrow_forward</span>
                         </button>
                      </div>
                   );
               })}
            </div>
         </div>

         {/* --- NOVO: TABELA DE CLASSIFICADOS E STACKS --- */}
         <div className="mb-20">
             <div className="text-center mb-8">
               <h2 className="text-3xl font-display font-bold text-white mb-2">Classificados & Stacks</h2>
               <p className="text-gray-500">Confira a lista atualizada de classificados e o cálculo do seu stack inicial.</p>
            </div>

            <div className="bg-surface-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-black/30 text-xs font-bold uppercase text-gray-400">
                            <tr>
                                <th className="px-4 py-4 min-w-[150px] sticky left-0 bg-[#0f0a20] z-10 border-r border-white/5">Competidor</th>
                                {qualifyingMethods.map(method => (
                                    <th key={method.id} className="px-2 py-4 text-center min-w-[80px]" title={method.title}>
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`material-icons-outlined ${method.color}`}>{method.icon}</span>
                                            <span className="text-[9px] tracking-tighter">{method.title}</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="px-4 py-4 text-center bg-primary/10 border-l border-white/5 min-w-[100px] text-primary">Stack Inicial</th>
                                <th className="px-4 py-4 text-center bg-secondary/10 border-l border-white/5 min-w-[100px] text-secondary">Bônus Reb/Add</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {mockQualifiers.map(player => {
                                const { initialStack, bonusStack } = calculateStack(player);
                                return (
                                    <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 sticky left-0 bg-[#120B2E] z-10 border-r border-white/5 flex items-center gap-3">
                                            <img src={player.avatar} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                                            <span className="font-bold text-white truncate max-w-[120px]">{player.name}</span>
                                        </td>
                                        {qualifyingMethods.map(method => {
                                            const count = player.qualifications[method.id] || 0;
                                            return (
                                                <td key={method.id} className="px-2 py-3 text-center border-r border-white/5 last:border-0">
                                                    {count > 0 ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="material-icons-outlined text-green-500 text-base">check_circle</span>
                                                            {count > 1 && (
                                                                <span className="text-[9px] text-secondary font-bold mt-0.5">
                                                                    +{count - 1} Bônus
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-700">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-center bg-primary/5 border-l border-white/5 font-black text-primary font-display text-lg">
                                            {(initialStack / 1000)}k
                                        </td>
                                        <td className="px-4 py-3 text-center bg-secondary/5 border-l border-white/5 font-bold text-secondary">
                                            {bonusStack > 0 ? `+${bonusStack / 1000}k` : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {/* Regras de Acumulação - Legenda */}
                <div className="bg-black/40 border-t border-white/10 p-6">
                    <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons-outlined text-yellow-500">info</span> Regras de Acumulação de Stack
                    </h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li className="flex items-start gap-2">
                            <span className="text-primary font-black">•</span>
                            <span>
                                <strong className="text-white">Qualificação Base:</strong> A classificação do jogador em qualquer um dos 8 modos garante a entrada no capítulo final com o stack inicial de <strong>25k fichas</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary font-black">•</span>
                            <span>
                                <strong className="text-white">Bônus de Stack Inicial (Qualificação Cruzada):</strong> Já estando classificado, uma nova classificação em um dos <strong>7 modos restantes</strong> (diferente do primeiro) soma <strong>+25k fichas</strong> ao stack inicial.
                                <br/><em className="text-xs text-gray-500">Ex: Ranking (25k) + Jackpot (25k) = Inicia com 50k.</em>
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-secondary font-black">•</span>
                            <span>
                                <strong className="text-white">Bônus de Rebuy/Add-on (Reincidência):</strong> Uma segunda classificação no <strong>mesmo modo</strong> (ex: ganhou 2 jackpots) não soma ao inicial, mas garante <strong>25k fichas extras</strong> para serem adicionadas ao fazer Rebuy ou Add-on.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
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
                                <br/>
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

      {/* MODAL REGULAMENTO ESPECÍFICO */}
      {activeRegulation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative animate-float flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header & Content Scrollable */}
                  <div className="p-6 overflow-y-auto custom-scrollbar">
                     <button 
                        onClick={() => setActiveRegulation(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                    >
                        <span className="material-icons-outlined">close</span>
                    </button>

                    {qualifyingMethods.filter(m => m.id === activeRegulation).map(method => (
                        <div key={method.id}>
                            <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4 pr-8">
                                <span className={`material-icons-outlined text-3xl ${method.color}`}>{method.icon}</span>
                                <h3 className="text-xl font-bold text-white leading-tight">{method.title}</h3>
                            </div>
                            
                            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                                {method.rules}
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-white/5">
                                <button 
                                    onClick={() => setActiveRegulation(null)}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold transition-colors"
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    ))}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};