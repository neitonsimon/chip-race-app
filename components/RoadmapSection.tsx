import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

interface RoadmapMilestone {
    id?: string;
    version: string;
    title: string;
    date?: string;
    status: 'completed' | 'current' | 'upcoming';
    topics: string[];
}

export const RoadmapSection: React.FC = () => {
    const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const initialMilestones: RoadmapMilestone[] = [
        {
            version: 'V 1.0',
            title: 'Lançamento Oficial',
            date: 'Fevereiro 2026',
            status: 'current',
            topics: [
                'Sistema de Comandas Digital Integrado',
                'Carteira Multicurrency (BRL e Chipz)',
                'Gamificação: Níveis, XP e Badges',
                'Rankings Automatizados em Tempo Real',
                'Notificações de Sistema e Eventos'
            ]
        },
        {
            version: 'V 1.1',
            title: 'Interatividade & Social',
            date: 'Abril 2026',
            status: 'upcoming',
            topics: [
                'Chat de Mesa e Mensagens Interativas',
                'Sistema de Missões Diárias (Quests)',
                'Marketplace VIP de Itens Digitais',
                'Relatórios Mensais de Performance'
            ]
        },
        {
            version: 'V 1.5',
            title: 'Ecossistema Multi-Clube',
            date: 'Junho 2026',
            status: 'upcoming',
            topics: [
                'Dashboard Avançado para Proprietários',
                'Rede de Benefícios Compartilhada',
                'Sistema de Staking (Cavalarias)',
                'Torneios Inter-clubes Integrados'
            ]
        },
        {
            version: 'V 2.0',
            title: 'Chip Race Web3',
            date: 'Novembro 2026',
            status: 'upcoming',
            topics: [
                'Lançamento do Token Nativo $CHIPZ',
                'Governança Descentralizada (Voting)',
                'Premiações em Criptoativos',
                'Integração com Realidade Aumentada (AR)'
            ]
        }
    ];

    useEffect(() => {
        const fetchRoadmap = async () => {
            try {
                const { data, error } = await supabase
                    .from('roadmap_milestones')
                    .select('*')
                    .order('display_order', { ascending: true });

                if (error) throw error;
                if (data && data.length > 0) {
                    setMilestones(data);
                } else {
                    setMilestones(initialMilestones);
                }
            } catch (err) {
                console.error('Error fetching roadmap:', err);
                setMilestones(initialMilestones);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoadmap();
    }, []);

    if (isLoading && milestones.length === 0) {
        return (
            <section className="py-24 bg-background-dark flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </section>
        );
    }

    return (
        <section className="py-24 relative overflow-hidden bg-background-dark">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Evolução Contínua</h2>
                    <h3 className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tighter mb-6">
                        Roadmap <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Chip Race</span>
                    </h3>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Nossa jornada tecnológica não para. Confira os próximos marcos de desenvolvimento do ecossistema que está revolucionando o poker nacional.
                    </p>
                </div>

                {/* Timeline Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden lg:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>

                    {milestones.map((m, idx) => (
                        <div key={m.id || m.version} className="relative group">
                            {/* Version Tag */}
                            <div className="mb-8 flex flex-col items-center lg:items-start relative z-10">
                                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-500 border-2 ${m.status === 'current'
                                    ? 'bg-primary/20 border-primary shadow-[0_0_30px_rgba(255,0,122,0.3)] animate-float'
                                    : 'bg-white/5 border-white/10 group-hover:border-white/20'
                                    }`}>
                                    <span className={`text-2xl font-display font-black tracking-tighter ${m.status === 'current' ? 'text-white' : 'text-gray-500'
                                        }`}>
                                        {m.version}
                                    </span>
                                </div>
                                <div className={`h-12 w-px my-4 hidden lg:block ${m.status === 'current' ? 'bg-primary' : 'bg-white/10'
                                    }`}></div>
                            </div>

                            {/* Card */}
                            <div className={`p-8 rounded-[2.5rem] border bg-black/40 backdrop-blur-xl transition-all duration-500 relative group-hover:-translate-y-2 ${m.status === 'current'
                                ? 'border-primary/30 shadow-[0_20px_40px_rgba(0,0,0,0.4)]'
                                : 'border-white/5 hover:border-white/20'
                                }`}>
                                {m.status === 'current' && (
                                    <div className="absolute -top-3 left-8 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                        Versão Atual
                                    </div>
                                )}

                                <div className="mb-6">
                                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{m.date}</div>
                                    <h4 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{m.title}</h4>
                                </div>

                                <ul className="space-y-4">
                                    {m.topics?.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                                            <span className={`material-icons-outlined text-[14px] mt-0.5 ${m.status === 'current' ? 'text-primary' : 'text-gray-600'
                                                }`}>
                                                {m.status === 'current' ? 'check_circle' : 'radio_button_unchecked'}
                                            </span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Glow Decor */}
                                {m.status === 'current' && (
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary blur-lg opacity-10 -z-10 rounded-[2.5rem]"></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};
