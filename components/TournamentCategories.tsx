import React, { useState, useEffect } from 'react';
import { TournamentCategory } from '../types';
import { EditableContent } from './EditableContent';
import { supabase } from '../src/lib/supabase';

interface TournamentCategoriesProps {
  isAdmin?: boolean;
  categories: TournamentCategory[];
  onUpdateCategory: (index: number, field: keyof TournamentCategory, value: any) => void;
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
  prizeLabel = "30K+"
}) => {
  const [activeRegulation, setActiveRegulation] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: 0, stock: 0, image_url: '' });

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
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
            ECOSSISTEMA <span className="text-primary">CHIP RACE</span>
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
            Os 8 caminhos sagrados para conquistar seu lugar no Capítulo Final. Escolha sua estratégia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, index) => {
            const styles = getColors(cat.color);

            return (
              <div
                key={cat.id}
                className={`group relative bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-2xl p-6 ${styles.border} transition-all duration-300 hover:-translate-y-2 overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${styles.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>



                <div className="relative z-10 flex flex-col items-center text-center mt-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-b from-gray-800 to-black flex items-center justify-center mb-4 shadow-lg ${styles.shadow} transition-shadow duration-300 border border-white/10`}>
                    <span className={`material-icons-outlined text-3xl ${styles.icon}`}>{cat.icon}</span>
                  </div>

                  <h3 className={`text-lg font-display font-bold text-gray-900 dark:text-white mb-2 ${styles.text} transition-colors w-full`}>
                    <EditableContent
                      isAdmin={isAdmin}
                      value={cat.title}
                      onSave={(val) => onUpdateCategory(index, 'title', val)}
                    />
                  </h3>

                  <p className="text-base text-gray-500 dark:text-gray-400 mb-4 min-h-[60px] flex items-center justify-center w-full">
                    <EditableContent
                      isAdmin={isAdmin}
                      value={cat.description}
                      onSave={(val) => onUpdateCategory(index, 'description', val)}
                      type="textarea"
                      className="w-full"
                    />
                  </p>

                  <button
                    onClick={(e) => handleOpenRegulation(e, cat.id)}
                    className={`text-sm font-bold uppercase tracking-wider ${styles.btn} hover:scale-105 transition-all flex items-center gap-2 cursor-pointer bg-white/5 px-4 py-2 rounded-full border border-current shadow-sm group-hover:bg-white/10`}
                  >
                    Ver Mais <span className="material-icons-outlined text-sm">add_circle</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE PRODUTO / DETALHES (POP-UP) */}
      {activeRegulation && (REGULATIONS_DATA[activeRegulation] || productDetails) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-float overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header Background Glow */}
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-20 bg-gradient-to-br ${getColors(categories.find(c => c.id === activeRegulation)?.color || '').glow}`}></div>

            <div className="p-8 overflow-y-auto custom-scrollbar relative z-10">
              <button
                onClick={() => setActiveRegulation(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
              >
                <span className="material-icons-outlined text-2xl">close</span>
              </button>

              {isAdmin && !isEditingProduct && (
                <button
                  onClick={handleEditClick}
                  className="absolute top-6 right-20 text-secondary hover:text-white transition-colors p-2 bg-secondary/10 hover:bg-secondary/20 rounded-full shadow-lg"
                  title="Editar Produto/Regulamento"
                >
                  <span className="material-icons-outlined text-2xl">edit</span>
                </button>
              )}

              {isEditingProduct ? (
                <div className="pt-8 flex flex-col gap-4">
                  <h3 className="text-xl font-bold text-white mb-4">Editar Conteúdo do Box</h3>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Produto/Regulamento</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-primary outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição / Regras</label>
                    <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-primary outline-none min-h-[150px]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço (R$)</label>
                      <input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estoque/Qtd. (Opcional)</label>
                      <input type="number" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-primary outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL da Imagem (Opcional)</label>
                    <input type="text" value={editForm.image_url} onChange={e => setEditForm({ ...editForm, image_url: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-primary outline-none placeholder-gray-600" placeholder="https://..." />
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button onClick={() => setIsEditingProduct(false)} className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-bold uppercase hover:bg-gray-700 transition-colors">Cancelar</button>
                    <button onClick={handleSaveProduct} className="flex-1 py-3 bg-secondary text-black rounded-xl font-black uppercase hover:scale-105 transition-all shadow-[0_0_15px_rgba(45,212,191,0.4)]">Salvar no Banco</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center mb-8 pt-4">
                    <div className={`w-24 h-24 rounded-3xl bg-black border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden group`}>
                      <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${getColors(categories.find(c => c.id === activeRegulation)?.color || '').glow}`}></div>
                      {productDetails?.image_url ? (
                        <img src={productDetails.image_url} alt={productDetails.name} className="w-full h-full object-cover relative z-10" />
                      ) : (
                        <span className={`material-icons-outlined text-5xl relative z-10 ${REGULATIONS_DATA[activeRegulation]?.color || 'text-primary'}`}>
                          {REGULATIONS_DATA[activeRegulation]?.icon || 'star'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-3xl font-display font-black text-white uppercase tracking-wider mb-2">
                      {productDetails?.name || REGULATIONS_DATA[activeRegulation]?.title}
                    </h3>
                    <div className="h-1 w-16 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">
                        {productDetails ? 'DESCRIÇÃO DO PRODUTO' : 'INFORMAÇÕES GERAIS'}
                      </h4>
                      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-light">
                        {productDetails?.description || REGULATIONS_DATA[activeRegulation]?.rules}
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
                          {productDetails ? 'Disponível' : 'Categoria'}
                        </p>
                        <p className="text-white font-bold uppercase">
                          {productDetails ? `${productDetails.stock} unidades` : activeRegulation}
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};