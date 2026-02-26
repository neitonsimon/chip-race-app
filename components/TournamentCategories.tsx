import React, { useState, useEffect } from 'react';
import { TournamentCategory } from '../types';
import { supabase } from '../src/lib/supabase';

interface TournamentCategoriesProps {
  isAdmin?: boolean;
  categories: TournamentCategory[];
  onUpdateCategory: (index: number, updates: Partial<TournamentCategory>) => void;
  prizeLabel?: string;
}

// Mapeamento dos Regulamentos (Cópia fiel do conteúdo de TheChosenDetails para consistência)
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

export const TournamentCategories: React.FC<TournamentCategoriesProps> = ({
  isAdmin,
  categories,
  onUpdateCategory,
  prizeLabel = "2026"
}) => {
  const [activeRegulation, setActiveRegulation] = useState<string | null>(null);
  const [activeTemplateSelect, setActiveTemplateSelect] = useState<number | null>(null);
  const [productDetails, setProductDetails] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: 0, stock: 0, image_url: '' });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (activeRegulation) {
      setIsEditingProduct(false);
      fetchProductInfo(activeRegulation);
    } else {
      setProductDetails(null);
      setIsEditingProduct(false);
    }
  }, [activeRegulation]);

  const handleEditClick = () => {
    setEditForm({
      name: productDetails?.name || REGULATIONS_DATA[activeRegulation!]?.title || '',
      description: productDetails?.description || REGULATIONS_DATA[activeRegulation!]?.rules || '',
      price: productDetails?.price || 0,
      stock: productDetails?.stock || 0,
      image_url: productDetails?.image_url || ''
    });
    setIsEditingProduct(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (!activeRegulation) return;

      const upsertData: any = {
        category: activeRegulation,
        name: editForm.name,
        description: editForm.description,
        price: editForm.price,
        stock: editForm.stock,
        image_url: editForm.image_url,
        active: true
      };

      if (productDetails?.id) {
        upsertData.id = productDetails.id;
      }

      const { data, error } = await supabase.from('products').upsert(upsertData).select().single();
      if (error) throw error;

      setProductDetails(data);
      setIsEditingProduct(false);
      alert('Produto salvo com sucesso no banco de dados!');
    } catch (e: any) {
      console.error(e);
      alert('Erro ao salvar produto: ' + e.message);
    }
  };

  const fetchProductInfo = async (categoryId: string) => {
    setIsLoadingProduct(true);
    try {
      const { data, error } = await supabase
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
    } finally {
      setIsLoadingProduct(false);
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

  const handleOpenRegulation = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    // Verifica se existe dado para este ID, se não, não abre
    if (REGULATIONS_DATA[id]) {
      setActiveRegulation(id);
    }
  };

  return (
    <div className="pt-10 pb-20 bg-background-light dark:bg-background-dark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
            ECOSSISTEMA <span className="text-primary">CHIP RACE</span>
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-base sm:text-lg">
            Explore o universo Chip Race: uma curadoria completa de produtos e serviços desenvolvidos para elevar sua experiência no poker ao próximo nível.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {(showAll ? categories : categories.slice(0, 12)).map((cat, index) => {
            const styles = getColors(cat.color);
            const isMystery = cat.is_mystery;

            return (
              <div
                key={cat.id || index}
                className={`group relative bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-2xl p-4 sm:p-5 ${styles.border} transition-all duration-300 hover:-translate-y-2 overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${styles.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                {/* Padlock Icon for Admin to toggle Mystery/Lock */}

                <div className="relative z-10 flex flex-col items-center text-center mt-2">
                  {isMystery && !isAdmin ? (
                    // Mystery Card Content for regular users
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-gray-600 animate-pulse">
                        <span className="material-icons-outlined text-4xl">lock</span>
                      </div>
                      <h3 className="text-lg font-display font-black text-gray-700 uppercase tracking-widest">
                        Em Breve
                      </h3>
                      <p className="text-[10px] text-gray-500 uppercase font-black mt-2">Mistério!</p>
                    </div>
                  ) : (
                    // Standard Card Content
                    <>
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-gray-800 to-black flex items-center justify-center mb-3 sm:mb-4 shadow-lg ${styles.shadow} transition-shadow duration-300 border border-white/10`}>
                        <span className={`material-icons-outlined text-2xl sm:text-3xl ${styles.icon}`}>{cat.icon}</span>
                      </div>

                      <h3 className={`text-xs sm:text-base font-display font-bold text-gray-900 dark:text-white mb-1 ${styles.text} transition-colors w-full flex items-center justify-center gap-2`}>
                        {cat.title}

                      </h3>

                      <p className="hidden md:flex text-xs text-gray-500 dark:text-gray-400 mb-4 min-h-[40px] items-center justify-center w-full px-2">
                        {cat.description}
                      </p>

                      <button
                        onClick={(e) => handleOpenRegulation(e, cat.id)}
                        className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${styles.btn} hover:scale-105 transition-all flex items-center gap-1 sm:gap-2 cursor-pointer bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 hover:border-white/30 shadow-sm group-hover:bg-white/10`}
                      >
                        Ver <span className="hidden sm:inline">Mais</span> <span className="material-icons-outlined text-xs sm:text-sm">add_circle</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {categories.length > 12 && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="bg-surface-dark border border-white/10 px-10 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-white/5 transition-all flex items-center gap-3 group shadow-xl hover:border-primary/50"
            >
              <span className="text-gray-400 group-hover:text-primary transition-colors">
                {showAll ? 'Mostrar Apenas Essenciais' : 'Ver mais produtos e serviços da chip race'}
              </span>
              <span className="material-icons-outlined text-sm group-hover:translate-y-1 transition-transform">
                {showAll ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE PRODUTO / DETALHES (POP-UP) */}
      {activeRegulation && (REGULATIONS_DATA[activeRegulation] || productDetails) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#0f0a28] border-white/10 sm:border rounded-none sm:rounded-[3rem] w-full h-full sm:h-auto sm:max-w-4xl shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">

            {/* Header Background Glow */}
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-20 bg-gradient-to-br ${getColors(categories.find(c => c.id === activeRegulation)?.color || '').glow}`}></div>

            {/* Fixed Close Button */}
            <button
              onClick={() => setActiveRegulation(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full z-[30]"
            >
              <span className="material-icons-outlined text-2xl">close</span>
            </button>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 relative z-10 pt-16 sm:pt-10">

              <div className="flex flex-col items-center text-center mb-8 pt-4">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-black border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden group`}>
                  <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${getColors(categories.find(c => c.id === activeRegulation)?.color || '').glow}`}></div>
                  {productDetails?.image_url ? (
                    <img src={productDetails.image_url} alt={productDetails.name} className="w-full h-full object-cover relative z-10" />
                  ) : (
                    <span className={`material-icons-outlined text-4xl sm:text-5xl relative z-10 ${REGULATIONS_DATA[activeRegulation]?.color || 'text-primary'}`}>
                      {REGULATIONS_DATA[activeRegulation]?.icon || 'star'}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-wider mb-2">
                  {productDetails?.name || REGULATIONS_DATA[activeRegulation]?.title}
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
                    {productDetails?.description || REGULATIONS_DATA[activeRegulation]?.rules}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* CATEGORY TEMPLATE SELECTOR MODAL (FIXED POSITION OUTSIDE MAP LOOP) */}
      {activeTemplateSelect !== null && (
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
              {Object.entries(REGULATIONS_DATA).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => {
                    const index = activeTemplateSelect as number;
                    const colorValue = (data.color.replace('text-', '').replace('-500', '') as any);
                    const firstRule = data.rules.trim().split('\n')[0].replace(/^\d+\.\s*/, '');
                    onUpdateCategory(index, {
                      id: key,
                      title: data.title,
                      icon: data.icon,
                      description: firstRule,
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
        </div>
      )}
    </div>
  );
};