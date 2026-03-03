import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

interface SponsorshipPlan {
    id: string;
    name: string;
    subtitle: string;
    physical_application: string;
    structural_responsibilities: string[];
    benefits: string[];
    price: string;
    is_sold_out: boolean;
    is_most_noble: boolean;
    color: string;
    icon: string;
}

export function SponsorsSection() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [plans, setPlans] = useState<SponsorshipPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const { data, error } = await supabase
                    .from('content_db')
                    .select('value')
                    .eq('key', 'sponsorship_plans')
                    .single();

                if (error) throw error;
                if (data) setPlans(data.value);
            } catch (err) {
                console.error('Error fetching sponsorship plans:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlans();
    }, []);

    return (
        <section className="py-20 bg-background-light dark:bg-[#050214] relative overflow-hidden transition-colors border-t border-white/5">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none opacity-50" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black tracking-[0.3em] uppercase mb-4 shadow-neon-pink/20">
                        Oportunidades Premium
                    </span>
                    <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight italic">
                        Apoie a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary text-glow italic">Chip Race</span>
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed font-medium">
                        Eleve o patamar da sua marca associando-a aos espaços mais nobres do nosso clube física e digitalmente.
                    </p>
                </div>

                {/* Main Cards Grid - Modern and Progressive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {plans.map((plan, idx) => (
                        <div
                            key={plan.id}
                            onClick={() => setIsModalOpen(true)}
                            className={`group relative h-full flex flex-col bg-surface-light dark:bg-white/[0.03] border ${plan.is_most_noble ? 'border-amber-500/40 shadow-neon-yellow/10' : 'border-gray-200 dark:border-white/10'} rounded-[2.5rem] p-8 transition-all duration-500 hover:scale-[1.02] cursor-pointer overflow-hidden backdrop-blur-sm`}
                        >
                            {/* Visual Highlight for Noble Plan */}
                            {plan.is_most_noble && (
                                <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-l from-amber-500 to-amber-600 text-black text-[10px] font-black uppercase tracking-widest rounded-bl-3xl shadow-lg z-20">
                                    MASTER NOBRE
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="mb-8 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-xl`}>
                                    <span className={`material-icons text-${plan.color} text-3xl`}>{plan.icon}</span>
                                </div>
                                <h3 className="text-xl font-display font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2 group-hover:text-primary transition-colors leading-none">{plan.name}</h3>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em] leading-relaxed">{plan.subtitle}</p>
                            </div>

                            {/* Brief Info */}
                            <div className="flex-1 space-y-6 relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <span className="material-icons text-primary/60 text-lg">location_on</span>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 font-bold leading-snug">{plan.physical_application}</p>
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        {plan.benefits.slice(0, 3).map((benefit, bIdx) => (
                                            <div key={bIdx} className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter text-left">
                                                <span className="w-1 h-1 bg-primary rounded-full"></span>
                                                {benefit}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Availability/Sold Out */}
                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 relative z-10">
                                {plan.is_sold_out ? (
                                    <div className="flex items-center gap-2 text-red-500 font-black uppercase text-[10px] tracking-widest italic">
                                        <span className="material-icons text-sm">lock_clock</span>
                                        Esgotado para esta temporada
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Sob Consulta</div>
                                        <span className="material-icons text-primary group-hover:translate-x-2 transition-transform">arrow_forward</span>
                                    </div>
                                )}
                            </div>

                            {/* Background decoration */}
                            <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                        </div>
                    ))}
                </div>

                {/* Call to Action Button */}
                <div className="flex flex-col items-center gap-6">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group relative bg-white dark:bg-primary text-black font-black py-5 px-12 rounded-2xl shadow-neon-pink transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-4 uppercase tracking-[0.2em] text-sm overflow-hidden"
                    >
                        <span className="material-icons">handshake</span>
                        CONHECER DETALHES ESTRUTURAIS
                        <span className="material-icons group-hover:translate-x-1 transition-transform">rocket_launch</span>
                    </button>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Apenas 1 cota por espaço. Exclusividade garantida em contrato.</p>
                </div>
            </div>

            {/* Modal for Details */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background-dark/95 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#0a061e] border border-white/10 rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/40">
                            <div className="flex items-center gap-4">
                                <span className="material-icons text-primary text-4xl">inventory_2</span>
                                <div className="text-left">
                                    <h3 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight italic">Guia de <span className="text-primary italic">Patrocínio</span></h3>
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Temporada Chip Race 2026</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all group"
                            >
                                <span className="material-icons group-hover:rotate-90 transition-transform">close</span>
                            </button>
                        </div>

                        {/* Content Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                {plans.map((plan) => (
                                    <div key={plan.id} className={`p-6 bg-white/[0.02] border ${plan.is_most_noble ? 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'border-white/5'} rounded-3xl flex flex-col h-full text-left`}>
                                        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-${plan.color} mb-4 border border-white/5`}>
                                            <span className="material-icons text-xl">{plan.icon}</span>
                                        </div>
                                        <h4 className="text-white font-black uppercase text-sm mb-1">{plan.name}</h4>
                                        <p className="text-[8px] text-gray-500 uppercase font-black mb-6">{plan.subtitle}</p>

                                        <div className="space-y-6 flex-1">
                                            <div>
                                                <h5 className="text-[9px] text-secondary uppercase font-black mb-2 tracking-widest">Logos & Exposição</h5>
                                                <ul className="space-y-1.5">
                                                    {plan.benefits.map((item, i) => (
                                                        <li key={i} className="text-[10px] text-gray-300 font-bold flex items-start gap-2">
                                                            <span className="material-icons text-[12px] text-green-500 shrink-0">check_circle</span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div>
                                                <h5 className="text-[9px] text-primary uppercase font-black mb-2 tracking-widest">Encargos Estruturantes</h5>
                                                <ul className="space-y-1.5">
                                                    {plan.structural_responsibilities.map((item, i) => (
                                                        <li key={i} className="text-[10px] text-gray-400 font-bold flex items-start gap-2">
                                                            <span className="w-1 h-1 bg-gray-600 rounded-full mt-1.5 shrink-0"></span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                                            {plan.is_sold_out ? (
                                                <p className="text-[10px] text-red-500 font-black uppercase italic tracking-widest">Esgotado</p>
                                            ) : (
                                                <p className="text-xl font-display font-black text-amber-500 italic">{plan.price !== '0.00' ? `R$ ${plan.price}` : 'Sob Consulta'}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer / CTA in Modal */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white/5 border border-white/10 p-8 sm:p-10 rounded-[2.5rem] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

                                <div className="relative z-10 text-left">
                                    <h4 className="text-2xl sm:text-3xl font-display font-black text-white italic uppercase mb-4">Gostaria de ser um <span className="text-primary italic">Aliado</span>?</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                                        Nossos projetos estruturantes são a base da experiência Chip Race. Ao investir na nossa infraestrutura, sua marca se torna parte do DNA do nosso clube para sempre.
                                    </p>
                                </div>

                                <div className="relative z-10 space-y-4">
                                    <a
                                        href="https://wa.me/5551992425186"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-black py-6 rounded-2xl shadow-[0_15px_40px_rgba(37,211,102,0.3)] hover:scale-[1.02] hover:-translate-y-1 transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-lg group"
                                    >
                                        FALAR COM A DIRETORIA
                                        <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">campaign</span>
                                    </a>
                                    <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><span className="material-icons-outlined text-sm">schedule</span> Atendimento Imediato</span>
                                        <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                        <span className="flex items-center gap-1"><span className="material-icons-outlined text-sm">verified</span> Proposta Comercial</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
