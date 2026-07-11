import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { useApp } from '../contexts/AppContext';

interface CvthStage {
  id: string;
  name: string;
  category: string;
  date: string;
  buyin: string;
  rebuy: string;
  addon: string;
  stack: string;
  gtd: string;
  active: boolean;
  order: number;
  highlight: boolean;
  color: 'green' | 'blue' | 'cyan' | 'gold';
  banner_url?: string;
  getup_limit: string;
  getup_initial: string;
  getup_increment: string;
  custom_rules?: string;
}

interface CvthConfig {
  counters: {
    getups: number;
    stacks: number;
    players: number;
  };
  stages: CvthStage[];
}

interface CvthSeason2Props {
  isAdmin?: boolean;
  onNavigate: (view: string) => void;
}

const DEFAULT_STAGES: CvthStage[] = [
  {
    id: 'stage-1',
    name: 'Etapa #1',
    category: 'Mensal',
    date: '13/07',
    buyin: 'R$ 50',
    rebuy: '30/50',
    addon: '30/50',
    stack: '15k / 15k / 25k',
    gtd: 'R$ 2.200',
    active: true,
    order: 1,
    highlight: false,
    color: 'green',
    getup_limit: '4 jogadores podem levantar stack.',
    getup_initial: '50.000 fichas.',
    getup_increment: '+5.000 fichas a cada jogador classificado.',
    custom_rules: 'Regulamento padrão GET UP Mensal.'
  },
  {
    id: 'stage-2',
    name: 'Etapa #2',
    category: 'Semanal',
    date: '20/07',
    buyin: 'R$ 20',
    rebuy: '20/30',
    addon: '20/40',
    stack: '10k / 10k / 15k',
    gtd: 'R$ 1.200',
    active: true,
    order: 2,
    highlight: false,
    color: 'blue',
    getup_limit: 'Até 2 jogadores.',
    getup_initial: '50.000 fichas.',
    getup_increment: '+10.000 fichas após cada GET UP.',
    custom_rules: 'Regulamento padrão GET UP Semanal.'
  },
  {
    id: 'stage-3',
    name: 'Etapa #3',
    category: 'Semanal',
    date: '27/07',
    buyin: 'R$ 20',
    rebuy: '20/30',
    addon: '20/40',
    stack: '10k / 10k / 15k',
    gtd: 'R$ 1.200',
    active: true,
    order: 3,
    highlight: false,
    color: 'blue',
    getup_limit: 'Até 2 jogadores.',
    getup_initial: '50.000 fichas.',
    getup_increment: '+10.000 fichas após cada GET UP.',
    custom_rules: 'Regulamento padrão GET UP Semanal.'
  },
  {
    id: 'stage-4',
    name: 'Etapa #4',
    category: 'Semanal',
    date: '03/08',
    buyin: 'R$ 20',
    rebuy: '20/30',
    addon: '20/40',
    stack: '10k / 10k / 15k',
    gtd: 'R$ 1.200',
    active: true,
    order: 4,
    highlight: false,
    color: 'blue',
    getup_limit: 'Até 2 jogadores.',
    getup_initial: '50.000 fichas.',
    getup_increment: '+10.000 fichas após cada GET UP.',
    custom_rules: 'Regulamento padrão GET UP Semanal.'
  },
  {
    id: 'stage-5',
    name: 'Etapa #5',
    category: 'Mensal',
    date: '10/08',
    buyin: 'R$ 50',
    rebuy: '30/50',
    addon: '30/50',
    stack: '15k / 15k / 25k',
    gtd: 'R$ 2.200',
    active: true,
    order: 5,
    highlight: false,
    color: 'green',
    getup_limit: '4 jogadores podem levantar stack.',
    getup_initial: '50.000 fichas.',
    getup_increment: '+5.000 fichas a cada jogador classificado.',
    custom_rules: 'Regulamento padrão GET UP Mensal.'
  },
  {
    id: 'stage-6',
    name: 'Etapa #6',
    category: 'Semanal',
    date: '17/08',
    buyin: 'R$ 20',
    rebuy: '20/30',
    addon: '20/40',
    stack: '10k / 10k / 15k',
    gtd: 'R$ 1.200',
    active: true,
    order: 6,
    highlight: false,
    color: 'blue',
    getup_limit: 'Até 2 jogadores.',
    getup_initial: '50.000 fichas.',
    getup_increment: '+10.000 fichas após cada GET UP.',
    custom_rules: 'Regulamento padrão GET UP Semanal.'
  },
  {
    id: 'stage-7',
    name: 'Etapa #7',
    category: 'Semanal',
    date: '24/08',
    buyin: 'R$ 20',
    rebuy: '20/30',
    addon: '20/40',
    stack: '10k / 10k / 15k',
    gtd: 'R$ 1.200',
    active: true,
    order: 7,
    highlight: false,
    color: 'blue',
    getup_limit: 'Até 2 jogadores.',
    getup_initial: '50.000 fichas.',
    getup_increment: '+10.000 fichas após cada GET UP.',
    custom_rules: 'Regulamento padrão GET UP Semanal.'
  },
  {
    id: 'stage-8',
    name: 'Etapa #8',
    category: 'Semanal',
    date: '31/08',
    buyin: 'R$ 20',
    rebuy: '20/30',
    addon: '20/40',
    stack: '10k / 10k / 15k',
    gtd: 'R$ 1.400',
    active: true,
    order: 8,
    highlight: false,
    color: 'blue',
    getup_limit: 'Até 4 jogadores.',
    getup_initial: '50.000 fichas.',
    getup_increment: '+5.000 fichas.',
    custom_rules: 'Regra especial de maior número de classificados.'
  },
  {
    id: 'stage-satellite',
    name: 'Satélite ME - 10 vagas GTD',
    category: 'Satélite',
    date: '06/09',
    buyin: 'R$ 30',
    rebuy: 'R$ 20',
    addon: 'R$ 20',
    stack: '10k',
    gtd: '10 Vagas',
    active: true,
    order: 9,
    highlight: false,
    color: 'cyan',
    getup_limit: 'Sem limite específico.',
    getup_initial: 'Conquistar vaga direta.',
    getup_increment: '-',
    custom_rules: 'Objetivo: Conquistar GET UP para o Main Event.'
  },
  {
    id: 'stage-main-event',
    name: 'MAIN EVENT',
    category: 'Especial',
    date: '06/09',
    buyin: 'R$ 130 ou FREE para acumulados',
    rebuy: 'R$ 100 ou FREE',
    addon: 'R$ 100',
    stack: '50k por GET UP conquistado',
    gtd: 'R$ 4.000',
    active: true,
    order: 10,
    highlight: true,
    color: 'gold',
    getup_limit: 'Acumulável.',
    getup_initial: '50.000 fichas por stack conquistada.',
    getup_increment: '-',
    custom_rules: 'O maior evento da temporada. Golden Ticket exclusivo.'
  }
];

export const CvthSeason2: React.FC<CvthSeason2Props> = ({ isAdmin = false, onNavigate }) => {
  const { rankings } = useApp();
  const [config, setConfig] = useState<CvthConfig>({
    counters: { getups: 14, stacks: 22, players: 11 },
    stages: DEFAULT_STAGES
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Admin CRUD states
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingStage, setEditingStage] = useState<CvthStage | null>(null);
  const [counterGetups, setCounterGetups] = useState(config.counters.getups);
  const [counterStacks, setCounterStacks] = useState(config.counters.stacks);
  const [counterPlayers, setCounterPlayers] = useState(config.counters.players);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_db')
        .select('value')
        .eq('key', 'cvth_season2')
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar dados CVTH do Supabase:', error);
      } else if (data && data.value) {
        const fetched = data.value as CvthConfig;
        // Merge with default values in case of schema drift
        const mergedStages = DEFAULT_STAGES.map(defStage => {
          const match = (fetched.stages || []).find(s => s.id === defStage.id);
          return match ? { ...defStage, ...match } : defStage;
        });

        // Add any brand new stages created by user
        const customStages = (fetched.stages || []).filter(
          s => !DEFAULT_STAGES.some(def => def.id === s.id)
        );

        const allStages = [...mergedStages, ...customStages].sort((a, b) => a.order - b.order);

        setConfig({
          counters: fetched.counters || { getups: 14, stacks: 22, players: 11 },
          stages: allStages
        });
        setCounterGetups(fetched.counters?.getups ?? 14);
        setCounterStacks(fetched.counters?.stacks ?? 22);
        setCounterPlayers(fetched.counters?.players ?? 11);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (newConfig: CvthConfig) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('content_db')
        .upsert(
          { key: 'cvth_season2', value: newConfig },
          { onConflict: 'key' }
        );

      if (error) {
        alert('Erro ao salvar no banco de dados: ' + error.message);
      } else {
        setConfig(newConfig);
        alert('Dados salvos com sucesso!');
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCounters = () => {
    const updated = {
      ...config,
      counters: {
        getups: Number(counterGetups),
        stacks: Number(counterStacks),
        players: Number(counterPlayers)
      }
    };
    handleSaveConfig(updated);
  };

  const handleSaveStageEdit = () => {
    if (!editingStage) return;

    let updatedStages = [...config.stages];
    const index = updatedStages.findIndex(s => s.id === editingStage.id);

    if (index > -1) {
      updatedStages[index] = editingStage;
    } else {
      updatedStages.push(editingStage);
    }

    updatedStages.sort((a, b) => a.order - b.order);

    const updated = {
      ...config,
      stages: updatedStages
    };

    handleSaveConfig(updated);
    setEditingStage(null);
  };

  const handleDeleteStage = (stageId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta etapa?')) return;

    const updatedStages = config.stages.filter(s => s.id !== stageId);
    const updated = {
      ...config,
      stages: updatedStages
    };

    handleSaveConfig(updated);
  };

  const handleCreateNewStage = () => {
    const nextOrder = config.stages.length > 0 ? Math.max(...config.stages.map(s => s.order)) + 1 : 1;
    const newStage: CvthStage = {
      id: `stage-custom-${Date.now()}`,
      name: `Nova Etapa #${config.stages.length + 1}`,
      category: 'Semanal',
      date: '01/01',
      buyin: 'R$ 20',
      rebuy: '20/30',
      addon: '20/40',
      stack: '10k',
      gtd: 'R$ 1.000',
      active: true,
      order: nextOrder,
      highlight: false,
      color: 'blue',
      getup_limit: 'Até 2 jogadores.',
      getup_initial: '50.000 fichas.',
      getup_increment: '+10.000 fichas.',
      custom_rules: 'Regulamento customizado.'
    };
    setEditingStage(newStage);
  };

  const faqs = [
    {
      question: 'Posso fazer mais de um GET UP?',
      answer: 'Sim! Você pode conquistar múltiplos GET UPs durante a mesma etapa ou ao longo da temporada, acumulando vantagens significativas para o Main Event.'
    },
    {
      question: 'Quando posso levantar minha stack?',
      answer: 'Durante o período de registro tardio (late registration), logo que atingir a quantidade de fichas exigida pela meta da respectiva etapa.'
    },
    {
      question: 'Posso voltar ao torneio?',
      answer: 'Sim! Ao realizar o GET UP, suas fichas são retiradas da mesa e convertidas em uma stack garantida para o Main Event. Você pode retornar imediatamente ao torneio pagando uma nova inscrição.'
    },
    {
      question: 'Preciso pagar novamente?',
      answer: 'Sim. Para retornar ao torneio regular na mesma etapa após realizar o GET UP, você deve efetuar uma nova inscrição (buy-in). No entanto, o GET UP conquistado é inteiramente gratuito para o Main Event.'
    },
    {
      question: 'O que acontece se eu conquistar duas ou mais stacks?',
      answer: 'Em caso de múltiplos GET UPs conquistados, o jogador escolhe qual usar para o buy-in, rebuy ou add-on no Main Event. Para os jogadores registrados diretamente no dia do Main Event, as fichas serão de 50k para a stack inicial, 50k para o rebuy e 50k para o add-on.'
    },
    {
      question: 'Posso jogar o Main Event sem conquistar nenhum GET UP?',
      answer: 'Sim. Se você não possuir nenhuma stack acumulada via sistema GET UP, poderá disputar normalmente o Main Event realizando o buy-in previsto de R$ 130 no dia da final.'
    },
    {
      question: 'O GET UP tem limite por etapa?',
      answer: 'Sim, o limite de jogadores que podem realizar GET UP varia por etapa (geralmente até 4 em etapas Mensais e até 2 em etapas Semanais). Verifique as especificações nos cards das etapas.'
    },
    {
      question: 'Como funciona o aumento da meta de fichas?',
      answer: 'A cada GET UP realizado na etapa, o nível de exigência para o próximo jogador classificar aumenta. Por exemplo: o primeiro se classifica com 50k, o segundo precisará de 55k ou 60k, sucessivamente.'
    }
  ];

  const getColorClass = (color: CvthStage['color']) => {
    switch (color) {
      case 'green':
        return {
          border: 'border-[#39ff14]/40 hover:border-[#39ff14]',
          text: 'text-[#39ff14]',
          shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.15)] hover:shadow-[0_0_25px_rgba(57,255,20,0.35)]',
          badge: 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/20'
        };
      case 'cyan':
        return {
          border: 'border-[#00e0ff]/40 hover:border-[#00e0ff]',
          text: 'text-[#00e0ff]',
          shadow: 'shadow-[0_0_15px_rgba(0,224,255,0.15)] hover:shadow-[0_0_25px_rgba(0,224,255,0.35)]',
          badge: 'bg-[#00e0ff]/10 text-[#00e0ff] border-[#00e0ff]/20'
        };
      case 'gold':
        return {
          border: 'border-[#ffd700]/40 hover:border-[#ffd700]',
          text: 'text-[#ffd700]',
          shadow: 'shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_35px_rgba(255,215,0,0.45)]',
          badge: 'bg-[#ffd700]/10 text-[#ffd700] border-[#ffd700]/20'
        };
      case 'blue':
      default:
        return {
          border: 'border-[#0080ff]/40 hover:border-[#0080ff]',
          text: 'text-[#0080ff]',
          shadow: 'shadow-[0_0_15px_rgba(0,128,255,0.15)] hover:shadow-[0_0_25px_rgba(0,128,255,0.35)]',
          badge: 'bg-[#0080ff]/10 text-[#0080ff] border-[#0080ff]/20'
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#02050e] text-gray-200 relative overflow-hidden font-body pb-20">
      
      {/* Background glow animations */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-[#00e0ff]/5 via-[#0f52ba]/3 to-transparent rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[800px] h-[800px] bg-gradient-to-tr from-[#39ff14]/3 via-[#0080ff]/5 to-transparent rounded-full blur-[180px] pointer-events-none z-0"></div>
      
      {/* Cyber grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-8">
        
        {/* Admin floating access */}
        {isAdmin && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#131c31]/90 hover:bg-[#1b2847] border border-[#00e0ff]/30 rounded-xl text-[#00e0ff] hover:text-white font-display text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(0,224,255,0.1)] hover:shadow-[0_0_20px_rgba(0,224,255,0.25)]"
            >
              <span className="material-icons-outlined text-base">admin_panel_settings</span>
              <span>{showAdminPanel ? 'Fechar Painel de Controle' : 'Painel Admin CVTH'}</span>
            </button>
          </div>
        )}

        {/* HERO SECTION */}
        <section className="text-center py-16 md:py-24 relative rounded-3xl bg-gradient-to-b from-[#061026]/80 to-transparent border border-white/5 backdrop-blur-md px-6 overflow-hidden mb-16">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#39ff14]/40 to-transparent"></div>

          <h1 className="text-4xl sm:text-6xl md:text-8xl font-display font-black tracking-tighter uppercase mb-6 leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e0ff] via-white to-[#39ff14] drop-shadow-[0_2px_20px_rgba(0,224,255,0.3)]">
              CVTH - 2ª Temporada
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl font-body font-medium text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed uppercase tracking-wider">
            10 etapas presenciais. Um único objetivo: conquistar sua vaga e chegar ao Main Event com vantagem.
          </p>

          {/* Hero Navigation Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-2xl mx-auto">
            <a
              href="#resumo"
              className="flex-1 min-w-[130px] font-display bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#39ff14]/50 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-widest py-3 px-5 rounded-xl transition-all duration-300 text-center"
            >
              Resumo
            </a>
            <a
              href="#etapas"
              className="flex-1 min-w-[130px] font-display bg-gradient-to-r from-[#0080ff] to-[#00e0ff] text-black hover:text-white font-black text-xs uppercase tracking-widest py-3 px-5 rounded-xl transition-all duration-300 text-center shadow-[0_0_15px_rgba(0,224,255,0.3)]"
            >
              Etapas
            </a>
            <a
              href="#get-up"
              className="flex-1 min-w-[130px] font-display bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#39ff14]/50 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-widest py-3 px-5 rounded-xl transition-all duration-300 text-center"
            >
              Regulamento
            </a>
            <a
              href="#faq"
              className="flex-1 min-w-[130px] font-display bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#39ff14]/50 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-widest py-3 px-5 rounded-xl transition-all duration-300 text-center"
            >
              FAQ
            </a>
          </div>
        </section>

        {/* ADMIN PANEL */}
        {showAdminPanel && isAdmin && (
          <section className="bg-[#0b1326] border-2 border-[#00e0ff]/40 rounded-3xl p-6 mb-16 shadow-[0_0_30px_rgba(0,224,255,0.15)] animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-xl font-display font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="material-icons-outlined text-[#00e0ff]">settings</span>
              Painel Administrativo CVTH
            </h2>

            {/* Counters CRUD */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5 mb-8">
              <h3 className="text-sm font-display font-bold uppercase text-[#39ff14] tracking-wider mb-4">Gerenciar Contadores de Progresso</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">GET UPs Conquistados</label>
                  <input
                    type="number"
                    value={counterGetups}
                    onChange={(e) => setCounterGetups(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Stacks Acumuladas</label>
                  <input
                    type="number"
                    value={counterStacks}
                    onChange={(e) => setCounterStacks(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Jogadores Classificados</label>
                  <input
                    type="number"
                    value={counterPlayers}
                    onChange={(e) => setCounterPlayers(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleUpdateCounters}
                disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-[#0080ff] to-[#00e0ff] hover:from-[#00e0ff] hover:to-[#0080ff] text-black font-bold uppercase tracking-wider text-xs rounded-lg transition-all"
              >
                {saving ? 'Salvando...' : 'Salvar Contadores'}
              </button>
            </div>

            {/* Stages Grid Manager */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-display font-bold uppercase text-[#39ff14] tracking-wider">Cronograma de Etapas</h3>
                <button
                  onClick={handleCreateNewStage}
                  className="flex items-center gap-1 px-4 py-1.5 bg-[#39ff14]/20 border border-[#39ff14]/40 hover:bg-[#39ff14]/30 text-[#39ff14] hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <span className="material-icons text-xs">add</span>
                  <span>Nova Etapa</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="py-2 px-3">Etapa</th>
                      <th className="py-2 px-3">Categoria</th>
                      <th className="py-2 px-3">Data</th>
                      <th className="py-2 px-3">Buy-in</th>
                      <th className="py-2 px-3">GTD</th>
                      <th className="py-2 px-3">Meta Inicial</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.stages.map((stage) => (
                      <tr key={stage.id} className="border-b border-white/5 hover:bg-white/5 text-gray-300">
                        <td className="py-3 px-3 font-bold">{stage.name}</td>
                        <td className="py-3 px-3">{stage.category}</td>
                        <td className="py-3 px-3">{stage.date}</td>
                        <td className="py-3 px-3">{stage.buyin}</td>
                        <td className="py-3 px-3">{stage.gtd}</td>
                        <td className="py-3 px-3">{stage.getup_initial}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stage.active ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>
                            {stage.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right flex justify-end gap-2">
                          <button
                            onClick={() => setEditingStage(stage)}
                            className="p-1.5 bg-white/5 border border-white/10 hover:border-yellow-500 hover:text-yellow-500 rounded transition-all"
                            title="Editar"
                          >
                            <span className="material-icons-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteStage(stage.id)}
                            className="p-1.5 bg-white/5 border border-white/10 hover:border-red-500 hover:text-red-500 rounded transition-all"
                            title="Excluir"
                          >
                            <span className="material-icons-outlined text-sm">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* STAGE EDIT MODAL */}
        {editingStage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#0b1326] border-2 border-[#00e0ff]/50 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar p-6 relative">
              <button
                onClick={() => setEditingStage(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-icons-outlined">close</span>
              </button>

              <h3 className="text-lg font-display font-black uppercase text-white tracking-widest mb-6 border-b border-white/10 pb-3">
                Editar Detalhes: {editingStage.name}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nome</label>
                  <input
                    type="text"
                    value={editingStage.name}
                    onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Categoria</label>
                  <input
                    type="text"
                    value={editingStage.category}
                    onChange={(e) => setEditingStage({ ...editingStage, category: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Data</label>
                  <input
                    type="text"
                    value={editingStage.date}
                    onChange={(e) => setEditingStage({ ...editingStage, date: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Premiação Garantida (GTD)</label>
                  <input
                    type="text"
                    value={editingStage.gtd}
                    onChange={(e) => setEditingStage({ ...editingStage, gtd: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Buy-in</label>
                  <input
                    type="text"
                    value={editingStage.buyin}
                    onChange={(e) => setEditingStage({ ...editingStage, buyin: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rebuy</label>
                  <input
                    type="text"
                    value={editingStage.rebuy}
                    onChange={(e) => setEditingStage({ ...editingStage, rebuy: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Add-on</label>
                  <input
                    type="text"
                    value={editingStage.addon}
                    onChange={(e) => setEditingStage({ ...editingStage, addon: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Stack Inicial</label>
                  <input
                    type="text"
                    value={editingStage.stack}
                    onChange={(e) => setEditingStage({ ...editingStage, stack: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Limite GET UP (Ex: "Até 2 jogadores")</label>
                  <input
                    type="text"
                    value={editingStage.getup_limit}
                    onChange={(e) => setEditingStage({ ...editingStage, getup_limit: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Requisito Inicial (Meta Fichas)</label>
                  <input
                    type="text"
                    value={editingStage.getup_initial}
                    onChange={(e) => setEditingStage({ ...editingStage, getup_initial: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Incremento por classificado</label>
                  <input
                    type="text"
                    value={editingStage.getup_increment}
                    onChange={(e) => setEditingStage({ ...editingStage, getup_increment: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ordem / Ordenação</label>
                  <input
                    type="number"
                    value={editingStage.order}
                    onChange={(e) => setEditingStage({ ...editingStage, order: Number(e.target.value) })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Esquema de Cores</label>
                  <select
                    value={editingStage.color}
                    onChange={(e) => setEditingStage({ ...editingStage, color: e.target.value as any })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  >
                    <option value="blue">Azul (Semanal)</option>
                    <option value="green">Verde Neon (Mensal)</option>
                    <option value="cyan">Cyan (Satélite)</option>
                    <option value="gold">Dourado (Main Event)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Banner da Etapa (URL)</label>
                  <input
                    type="text"
                    value={editingStage.banner_url || ''}
                    onChange={(e) => setEditingStage({ ...editingStage, banner_url: e.target.value })}
                    placeholder="URL de imagem..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00e0ff] text-sm"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Regras Específicas / Observações</label>
                <textarea
                  value={editingStage.custom_rules || ''}
                  onChange={(e) => setEditingStage({ ...editingStage, custom_rules: e.target.value })}
                  rows={3}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#00e0ff] text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-4 mb-8">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingStage.active}
                    onChange={(e) => setEditingStage({ ...editingStage, active: e.target.checked })}
                    className="rounded bg-black/50 border-white/10 text-primary w-4 h-4"
                  />
                  <span className="text-sm text-gray-300 font-bold">Etapa Ativa (Visível)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingStage.highlight}
                    onChange={(e) => setEditingStage({ ...editingStage, highlight: e.target.checked })}
                    className="rounded bg-black/50 border-white/10 text-primary w-4 h-4"
                  />
                  <span className="text-sm text-gray-300 font-bold">Destacar Card (Tamanho Dobrado)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  onClick={() => setEditingStage(null)}
                  className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveStageEdit}
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-[#0080ff] to-[#00e0ff] text-black font-black rounded-lg text-xs uppercase tracking-wider transition-all"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY CARD GRID */}
        <section id="resumo" className="mb-20 scroll-mt-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-widest mb-3">
              Ficha Técnica do Campeonato
            </h2>
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-[#00e0ff] to-transparent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: 'place', label: 'Local Oficial', value: 'Clube Chip Race', color: 'text-[#00e0ff]' },
              { icon: 'schedule', label: 'Data & Horário', value: 'Segundas-feiras às 19h', color: 'text-[#00e0ff]' },
              { icon: 'emoji_events', label: 'Formato do Evento', value: '10 etapas presencias', color: 'text-[#39ff14]' },
              { icon: 'monetization_on', label: 'Premiação Regular', value: 'Garantido em todas as etapas', color: 'text-[#ffd700]' },
              { icon: 'stars', label: 'Premiação Especial', value: 'Troféu exclusivo para campeões', color: 'text-[#ffd700]' },
              { icon: 'psychology', label: 'Regra Exclusiva', value: 'Sistema GET UP Inovador', color: 'text-[#39ff14]' }
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 hover:border-[#00e0ff]/30 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center gap-5 hover:translate-y-[-2px] group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                  <span className={`material-icons-outlined text-2xl ${item.color} group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">{item.label}</div>
                  <div className="text-white font-display font-black text-base tracking-wide">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COUNTER SECTION */}
        <section className="mb-20 py-10 px-6 md:px-12 rounded-3xl bg-gradient-to-r from-[#030d22] via-[#051333] to-[#030d22] border-2 border-[#00e0ff]/20 shadow-[0_0_40px_rgba(0,224,255,0.08)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center">
            
            <div className="p-4 relative">
              <span className="material-icons-outlined text-[#39ff14] text-4xl mb-3 drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]">local_play</span>
              <div className="font-display font-black text-5xl md:text-6xl text-white tracking-widest mb-1 animate-pulse">
                {config.counters.getups}
              </div>
              <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-[#39ff14]">
                GET UPs Conquistados
              </div>
              <div className="absolute right-0 top-1/4 h-1/2 w-px bg-white/10 hidden md:block"></div>
            </div>

            <div className="p-4 relative">
              <span className="material-icons-outlined text-[#00e0ff] text-4xl mb-3 drop-shadow-[0_0_8px_rgba(0,224,255,0.5)]">layers</span>
              <div className="font-display font-black text-5xl md:text-6xl text-white tracking-widest mb-1 animate-pulse">
                {config.counters.stacks}
              </div>
              <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-[#00e0ff]">
                Stacks Acumuladas
              </div>
              <div className="absolute right-0 top-1/4 h-1/2 w-px bg-white/10 hidden md:block"></div>
            </div>

            <div className="p-4">
              <span className="material-icons-outlined text-[#ffd700] text-4xl mb-3 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">emoji_events</span>
              <div className="font-display font-black text-5xl md:text-6xl text-white tracking-widest mb-1 animate-pulse">
                {config.counters.players}
              </div>
              <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-[#ffd700]">
                Jogadores Classificados
              </div>
            </div>

          </div>
        </section>

        {/* TIMELINE OF STAGES */}
        <section id="etapas" className="mb-24 scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-widest mb-3">
              Cronograma das Etapas
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-widest max-w-xl mx-auto">
              Acompanhe as 10 etapas da temporada e o caminho competitivo em direção à glória
            </p>
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-[#00e0ff] to-transparent mx-auto mt-4"></div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-[#00e0ff]/30 border-t-[#00e0ff] animate-spin"></div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Carregando cronograma...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {config.stages.filter(s => s.active).map((stage) => {
                const styles = getColorClass(stage.color);
                
                return (
                  <div
                    key={stage.id}
                    className={`bg-gradient-to-b from-[#091122]/90 to-[#040815]/95 border-2 ${styles.border} ${styles.shadow} rounded-3xl p-6 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between relative overflow-hidden group ${
                      stage.highlight ? 'md:col-span-2 lg:col-span-3 border-[#ffd700] hover:border-[#ffd700]' : ''
                    }`}
                  >
                    
                    {/* Stage background banner (if uploaded) */}
                    {stage.banner_url && (
                      <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none group-hover:scale-105 transition-transform duration-700"
                        style={{ backgroundImage: `url(${stage.banner_url})` }}
                      ></div>
                    )}

                    {/* Neon visual chips */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full pointer-events-none"></div>

                    {/* Header: Title / Category / Badge */}
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className={`text-[10px] font-display font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border inline-block ${styles.badge}`}>
                            {stage.category}
                          </div>
                          <h3 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-wider mt-2 group-hover:text-white">
                            {stage.name}
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Data Oficial</div>
                          <div className={`text-lg font-display font-black tracking-widest ${styles.text}`}>
                            {stage.date}
                          </div>
                        </div>
                      </div>

                      {/* Main highlights */}
                      <div className={`grid ${stage.highlight ? 'grid-cols-2 md:grid-cols-4 gap-6' : 'grid-cols-2 gap-4'} mb-6 border-y border-white/5 py-4`}>
                        <div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Buy-in</div>
                          <div className="text-white font-bold text-sm tracking-wide">{stage.buyin}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">GTD Garantido</div>
                          <div className={`font-display font-black text-sm tracking-wider ${styles.text}`}>{stage.gtd}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Rebuy</div>
                          <div className="text-white font-bold text-sm tracking-wide">{stage.rebuy}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Add-on</div>
                          <div className="text-white font-bold text-sm tracking-wide">{stage.addon}</div>
                        </div>
                      </div>

                      {/* Technical specifications */}
                      {!stage.highlight && (
                        <div className="space-y-2 mb-6">
                          <div className="flex justify-between text-xs border-b border-white/5 pb-1">
                            <span className="text-gray-400 font-bold uppercase tracking-wider">Stack Inicial</span>
                            <span className="text-white font-bold">{stage.stack}</span>
                          </div>
                          <div className="flex justify-between text-xs border-b border-white/5 pb-1">
                            <span className="text-gray-400 font-bold uppercase tracking-wider">Limite GET UP</span>
                            <span className="text-white font-bold">{stage.getup_limit}</span>
                          </div>
                          <div className="flex justify-between text-xs border-b border-white/5 pb-1">
                            <span className="text-gray-400 font-bold uppercase tracking-wider">Meta Fichas Inicial</span>
                            <span className="text-white font-bold">{stage.getup_initial}</span>
                          </div>
                          <div className="flex justify-between text-xs border-b border-white/5 pb-1">
                            <span className="text-gray-400 font-bold uppercase tracking-wider">Incremento da Meta</span>
                            <span className="text-[#39ff14] font-bold">{stage.getup_increment}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer note/rule */}
                    <div className="relative z-10 pt-3 border-t border-white/5 text-[11px] text-gray-500 italic leading-relaxed">
                      {stage.custom_rules || 'Regras padrão do campeonato aplicadas.'}
                    </div>

                    {stage.highlight && (
                      <div className="absolute top-4 left-4 z-25">
                        <span className="bg-[#ffd700] text-black font-display font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.6)] flex items-center gap-1">
                          <span className="material-icons text-xs">local_fire_department</span>
                          EVENTO PRINCIPAL
                        </span>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* HOW IT WORKS SECTION (GET UP SECTION) */}
        <section id="get-up" className="mb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-widest mb-3">
              Como funciona o GET UP?
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-widest max-w-xl mx-auto">
              Entenda a inovadora dinâmica do golden ticket da Chip Race e como planejar sua estratégia
            </p>
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-[#39ff14] to-transparent mx-auto mt-4"></div>
          </div>

          {/* Steps visual flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-center mb-12">
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-h-[140px] flex flex-col justify-center shadow-lg relative">
              <div className="absolute -top-3 left-4 bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-gray-400">PASSO 1</div>
              <span className="material-icons-outlined text-[#00e0ff] text-2xl mb-2">sports_esports</span>
              <p className="text-xs font-semibold text-gray-300 leading-relaxed uppercase tracking-wider">
                Participa normalmente da etapa.
              </p>
            </div>

            <div className="text-center text-gray-600 hidden md:block">
              <span className="material-icons">arrow_forward</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-h-[140px] flex flex-col justify-center shadow-lg relative">
              <div className="absolute -top-3 left-4 bg-[#39ff14]/20 px-2 py-0.5 rounded text-[10px] font-bold text-[#39ff14]">PASSO 2</div>
              <span className="material-icons-outlined text-[#39ff14] text-2xl mb-2">trending_up</span>
              <p className="text-xs font-semibold text-gray-300 leading-relaxed uppercase tracking-wider">
                Atinge a meta exigida durante o registro tardio.
              </p>
            </div>

            <div className="text-center text-gray-600 hidden md:block">
              <span className="material-icons">arrow_forward</span>
            </div>

            <div className="bg-white/5 border border-[#39ff14]/30 rounded-2xl p-4 text-center min-h-[140px] flex flex-col justify-center shadow-lg relative shadow-[0_0_15px_rgba(57,255,20,0.1)]">
              <div className="absolute -top-3 left-4 bg-[#39ff14]/20 px-2 py-0.5 rounded text-[10px] font-bold text-[#39ff14]">PASSO 3</div>
              <span className="material-icons text-[#39ff14] text-2xl mb-2">check_circle</span>
              <p className="text-xs font-semibold text-gray-300 leading-relaxed uppercase tracking-wider">
                Opção de levantar stack para o Main Event.
              </p>
            </div>

            <div className="text-center text-gray-600 hidden md:block">
              <span className="material-icons">arrow_forward</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-h-[140px] flex flex-col justify-center shadow-lg relative">
              <div className="absolute -top-3 left-4 bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-gray-400">PASSO 4</div>
              <span className="material-icons-outlined text-[#ffd700] text-2xl mb-2">refresh</span>
              <p className="text-xs font-semibold text-gray-300 leading-relaxed uppercase tracking-wider">
                Retorna imediatamente pagando nova inscrição (opcional).
              </p>
            </div>

          </div>
        </section>

        {/* RANKING CVTH SECTION */}
        <section id="ranking-cvth" className="mb-24 scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-widest mb-3 flex items-center justify-center gap-3">
              🏆 Ranking CVTH
            </h2>
            <p className="text-xs md:text-sm text-gray-400 font-body max-w-lg mx-auto">
              A regularidade também vale uma vaga para a glória.
            </p>
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-[#ffd700] to-transparent mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch max-w-6xl mx-auto">
            {/* Lado Esquerdo - Como funciona */}
            <div className="bg-gradient-to-b from-[#091122]/90 to-[#040815]/95 border-2 border-white/10 hover:border-[#39ff14]/30 rounded-3xl p-8 transition-all duration-300 shadow-xl relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#39ff14]/5 to-transparent rounded-bl-full pointer-events-none"></div>
              
              <div>
                <h3 className="text-xl font-display font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2.5">
                  <span className="material-icons text-[#39ff14] text-2xl">help_outline</span>
                  Como Funciona
                </h3>
                
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                  Durante as <strong>10 etapas da temporada</strong>, todos os jogadores acumulam pontos no Ranking CVTH com base em seu desempenho.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 transition-all duration-300 hover:bg-white/10">
                    <span className="text-2xl shrink-0">🥇</span>
                    <div>
                      <div className="text-sm font-bold text-white uppercase tracking-wide">Líder do Ranking</div>
                      <div className="text-xs text-[#39ff14] font-medium">Vaga garantida para o The Chosen 30K</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 transition-all duration-300 hover:bg-white/10">
                    <span className="text-2xl shrink-0">🥈</span>
                    <div>
                      <div className="text-sm font-bold text-white uppercase tracking-wide">Vice-líder do Ranking</div>
                      <div className="text-xs text-[#39ff14] font-medium">Vaga garantida para o The Chosen 30K</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 transition-all duration-300 hover:bg-white/10">
                    <span className="text-2xl shrink-0">🏅</span>
                    <div>
                      <div className="text-sm font-bold text-white uppercase tracking-wide">Top 9 do Ranking</div>
                      <div className="text-xs text-gray-300 font-medium">Classificados para a Mesa Final do Ranking</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 transition-all duration-300 hover:bg-[#ffd700]/10 border-dashed hover:border-[#ffd700]/30">
                    <span className="text-2xl shrink-0">🏆</span>
                    <div>
                      <div className="text-sm font-bold text-white uppercase tracking-wide">Campeão da Mesa Final</div>
                      <div className="text-xs text-[#ffd700] font-medium">Vaga para o The Chosen 30K + Troféu Especial</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-xs text-[#39ff14] font-medium italic">
                  "A regularidade ao longo da temporada vale tanto quanto vencer grandes etapas."
                </p>
              </div>
            </div>

            {/* Lado Direito - Top 10 Ranking */}
            <div className="bg-gradient-to-b from-[#091122]/90 to-[#040815]/95 border-2 border-white/10 hover:border-[#00e0ff]/30 rounded-3xl p-8 transition-all duration-300 shadow-xl relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00e0ff]/5 to-transparent rounded-bl-full pointer-events-none"></div>

              <div>
                <h3 className="text-xl font-display font-black text-white uppercase tracking-wider mb-6 flex items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <span className="material-icons text-[#00e0ff] text-2xl">leaderboard</span>
                    Top 10 Ranking
                  </span>
                  {(() => {
                    const cvthRanking = rankings.find(r => r.label === 'CVTH Anual' || r.id === 'custom-1771994683731') 
                                        || rankings.find(r => r.label.includes('CVTH'))
                                        || rankings[0];
                    return cvthRanking ? (
                      <span className="text-[10px] bg-[#00e0ff]/10 text-[#00e0ff] border border-[#00e0ff]/20 px-2 py-0.5 rounded font-mono font-bold tracking-wider shrink-0">
                        {cvthRanking.label}
                      </span>
                    ) : null;
                  })()}
                </h3>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                  {(() => {
                    const cvthRanking = rankings.find(r => r.label === 'CVTH Anual' || r.id === 'custom-1771994683731') 
                                        || rankings.find(r => r.label.includes('CVTH'))
                                        || rankings[0];
                    const top10 = cvthRanking?.players
                      ? [...cvthRanking.players].sort((a, b) => (a.rank || 0) - (b.rank || 0)).slice(0, 10)
                      : [];

                    if (top10.length > 0) {
                      return top10.map((player, idx) => {
                        const position = idx + 1;
                        let badge = '';
                        let badgeColor = '';
                        if (position === 1) {
                          badge = '🥇 Líder';
                          badgeColor = 'bg-[#ffd700]/10 text-[#ffd700] border-[#ffd700]/30';
                        } else if (position === 2) {
                          badge = '🥈 Vice';
                          badgeColor = 'bg-gray-300/10 text-gray-300 border-gray-300/30';
                        } else if (position <= 9) {
                          badge = '🏅 Top 9';
                          badgeColor = 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/30';
                        }

                        return (
                          <div
                            key={player.id || player.name}
                            className="flex items-center justify-between p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/5"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-black text-gray-400 w-5 text-center">
                                {position}º
                              </span>
                              <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden shrink-0 bg-black/40">
                                <img
                                  src={player.avatar || 'https://uvipogwhdpszyfcoveic.supabase.co/storage/v1/object/public/profile-avatars/default-avatar.png'}
                                  className="w-full h-full object-cover"
                                  alt={player.name}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://uvipogwhdpszyfcoveic.supabase.co/storage/v1/object/public/profile-avatars/default-avatar.png';
                                  }}
                                />
                              </div>
                              <span className="text-xs font-bold text-white tracking-wide truncate max-w-[120px] sm:max-w-[180px]">
                                {player.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {badge && (
                                <span className={`text-[9px] uppercase tracking-wider font-bold border px-2 py-0.5 rounded shrink-0 ${badgeColor}`}>
                                  {badge}
                                </span>
                              )}
                              <span className="font-mono text-xs font-black text-white shrink-0">
                                {Math.round(player.points || 0).toLocaleString('pt-BR')} pts
                              </span>
                            </div>
                          </div>
                        );
                      });
                    }

                    return (
                      <div className="text-center py-8 text-gray-500 text-xs">
                        {loading ? 'Carregando ranking...' : 'Nenhum jogador classificado no ranking.'}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/5 flex justify-center">
                <button
                  onClick={() => onNavigate && onNavigate('ranking')}
                  className="font-display flex items-center gap-2 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white font-bold uppercase tracking-widest text-[9px] sm:text-[10px] px-6 py-2.5 rounded-lg transition-all duration-300 bg-white/5 hover:bg-white/10"
                >
                  <span className="material-icons text-sm">open_in_new</span>
                  Ver Ranking Completo
                </button>
              </div>
            </div>
          </div>

          {/* Banner Horizontal - A corrida pela regularidade */}
          <div className="mt-16 bg-gradient-to-r from-[#091122]/90 via-[#0f1d39]/80 to-[#091122]/90 border-2 border-[#ffd700]/30 rounded-3xl p-8 max-w-6xl mx-auto shadow-2xl relative overflow-hidden text-center group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.05),transparent_70%)] pointer-events-none"></div>
            
            <h3 className="text-lg md:text-xl font-display font-black text-white uppercase tracking-widest mb-3">
              ⚡ A Corrida pela Regularidade
            </h3>
            
            <p className="text-xs md:text-sm text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8">
              10 etapas. Apenas os <strong>9 melhores</strong> chegam à Mesa Final do Ranking. Somente os campeões conquistam uma vaga para o <strong>The Chosen 30K</strong>.
            </p>

            {/* Linha do tempo elegante */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 font-display text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest text-center">
              
              <div className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl shrink-0 w-full md:w-auto shadow-md">
                Etapas Semanais
              </div>
              
              <span className="material-icons text-gray-600 rotate-90 md:rotate-0">arrow_forward</span>

              <div className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl shrink-0 w-full md:w-auto shadow-md">
                Ranking CVTH
              </div>

              <span className="material-icons text-gray-600 rotate-90 md:rotate-0">arrow_forward</span>

              <div className="bg-[#39ff14]/10 border border-[#39ff14]/30 text-[#39ff14] px-4 py-2 rounded-xl shrink-0 w-full md:w-auto shadow-[0_0_10px_rgba(57,255,20,0.1)]">
                Top 9
              </div>

              <span className="material-icons text-gray-600 rotate-90 md:rotate-0">arrow_forward</span>

              <div className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl shrink-0 w-full md:w-auto shadow-md">
                Mesa Final
              </div>

              <span className="material-icons text-gray-600 rotate-90 md:rotate-0">arrow_forward</span>

              <div className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl shrink-0 w-full md:w-auto shadow-md">
                Campeão
              </div>

              <span className="material-icons text-[#ffd700] rotate-90 md:rotate-0 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">stars</span>

              <div className="bg-[#ffd700]/10 border border-[#ffd700]/40 text-[#ffd700] px-5 py-2.5 rounded-xl shrink-0 w-full md:w-auto shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                The Chosen 30K
              </div>

            </div>
          </div>
        </section>



        {/* FAQ SECTION */}
        <section id="faq" className="mb-16 scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-widest mb-3">
              Perguntas Frequentes
            </h2>
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-[#00e0ff] to-transparent mx-auto"></div>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 shadow-md hover:border-[#00e0ff]/30"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left px-6 py-4.5 flex justify-between items-center gap-4 cursor-pointer outline-none focus:bg-white/5"
                  >
                    <span className="text-sm font-bold text-white uppercase tracking-wider">{faq.question}</span>
                    <span className={`material-icons text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00e0ff]' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-60 border-t border-white/5 bg-black/20 p-6' : 'max-h-0 overflow-hidden'
                    }`}
                  >
                    <p className="text-xs text-gray-400 leading-relaxed font-body tracking-wide font-medium">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};
