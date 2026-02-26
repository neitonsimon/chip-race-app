import React, { useState } from 'react';

export function SponsorsSection() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <section className="py-12 bg-background-light dark:bg-background-dark relative overflow-hidden transition-colors border-t border-white/5">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                <div className="text-center mb-10 space-y-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-wider uppercase mb-2 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
                        Parcerias Estratégicas
                    </span>
                    <h2 className="text-2xl sm:text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary text-glow animate-pulse">Patrocine</span> a Chip Race
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-base leading-relaxed">
                        Associe sua marca ao esporte da mente que mais cresce no mundo. Ganhe visibilidade premium em todos os nossos canais.
                    </p>
                </div>

                {/* Advantages - More compact */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                    {[
                        { icon: 'emoji_events', title: 'Marca nos Troféus', color: 'primary', desc: 'Logotipo gravado nos troféus dos principais torneios.' },
                        { icon: 'image', title: 'Destaque nos Flyers', color: 'secondary', desc: 'Presença garantida nas artes oficiais das redes sociais.' },
                        { icon: 'photo_camera', title: 'Foto do 3-Handed', color: 'cyan-500', desc: 'Banner de fundo exclusivo no momento de maior audiência.' },
                        { icon: 'record_voice_over', title: 'Menções nas Lives', color: 'pink-500', desc: 'Chamadas verbais e visuais durante nossas transmissões.' },
                        { icon: 'card_giftcard', title: 'Produtos Personalizados', color: 'purple-500', desc: 'Distribua brindes com sua marca no ecossistema do clube.' },
                        { icon: 'trending_up', title: 'Networking Forte', color: 'green-500', desc: 'Acesso direto a jogadores e empresários de todo o estado.' },
                    ].map((item, idx) => (
                        <div key={idx} className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/5 p-5 rounded-xl hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.05)] group">
                            <div className={`w-10 h-10 rounded-lg bg-${item.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <span className={`material-icons text-${item.color} text-xl`}>{item.icon}</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Call to Action Button */}
                <div className="flex justify-center">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group relative bg-primary text-background-dark font-black py-4 px-10 rounded-xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.6)] transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 uppercase tracking-wider"
                    >
                        <span className="material-icons">stars</span>
                        VER PLANOS E VALORES
                        <span className="material-icons group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* Modal for Pricing and Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background-dark/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-surface-dark border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        {/* Close button */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <span className="material-icons">close</span>
                        </button>

                        <div className="p-8 md:p-12">
                            <div className="text-center mb-10">
                                <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Oportunidades de Apoio</h3>
                                <p className="text-gray-400 text-sm">Escolha o nível de visibilidade da sua marca e fale conosco.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                                {/* Package 1 */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all flex flex-col text-left">
                                    <h4 className="font-bold text-primary mb-1 uppercase text-xs">Trimestral</h4>
                                    <div className="text-lg font-black text-white mb-4 uppercase tracking-tighter">1 por trimestre</div>
                                    <ul className="space-y-2 text-xs text-gray-400 flex-1">
                                        <li className="flex gap-2"><span className="material-icons text-primary/80 text-[14px]">check</span> Logo em todos os flyer do trimestre</li>
                                        <li className="flex gap-2"><span className="material-icons text-primary/80 text-[14px]">check</span> Nome no ranking do trimestre</li>
                                        <li className="flex gap-2"><span className="material-icons text-primary/80 text-[14px]">check</span> Exposição no banner da foto dos campeões</li>
                                        <li className="flex gap-2"><span className="material-icons text-primary/80 text-[14px]">check</span> Exposição nos vídeos e live da Chip Race</li>
                                        <li className="flex gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] text-orange-500/70 uppercase font-bold">
                                            <span className="material-icons text-[12px]">info</span> Máximo 3 patrocinadores
                                        </li>
                                    </ul>
                                </div>

                                {/* Package 2 */}
                                <div className="bg-primary/5 border-2 border-primary rounded-2xl p-6 relative flex flex-col text-left">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-background-dark text-[10px] font-black px-3 py-1 rounded-full uppercase">Master</div>
                                    <h4 className="font-bold text-primary mb-1 uppercase text-xs">Anual Master</h4>
                                    <div className="text-lg font-black text-white mb-4 uppercase tracking-tighter">Exclusividade Anual</div>
                                    <ul className="space-y-2 text-xs text-gray-400 flex-1">
                                        <li className="flex gap-2"><span className="material-icons text-primary text-[14px]">check</span> Logo em todos flyers do ano</li>
                                        <li className="flex gap-2"><span className="material-icons text-primary text-[14px]">check</span> Nome no rank anual</li>
                                        <li className="flex gap-2"><span className="material-icons text-primary text-[14px]">check</span> Exposição da marca no banner do 3-Handed</li>
                                        <li className="flex gap-2"><span className="material-icons text-primary text-[14px]">check</span> Logo nos troféus</li>
                                        <li className="flex gap-2"><span className="material-icons text-primary text-[14px]">check</span> Exposição nos vídeos e live da Chip Race</li>
                                        <li className="flex gap-2"><span className="material-icons text-primary text-[14px]">check</span> Prioridade de divulgação em marketing</li>
                                        <li className="flex gap-2 mt-2 pt-2 border-t border-primary/20 text-[10px] text-primary uppercase font-bold">
                                            <span className="material-icons text-[12px]">verified_user</span> Apenas 1 patrocinador
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="max-w-md mx-auto space-y-6">
                                <a
                                    href="https://wa.me/5551992425186"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(37,211,102,0.3)] hover:shadow-[0_15px_40px_rgba(37,211,102,0.5)] transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-lg group active:scale-95"
                                >
                                    <span className="material-icons text-2xl group-hover:scale-110 transition-transform">whatsapp</span>
                                    Falar no WhatsApp
                                </a>

                                <div className="p-6 bg-black/30 rounded-2xl border border-white/5 text-center">
                                    <p className="text-sm text-gray-400 leading-relaxed italic">
                                        "O Poker é um ambiente de alta fidelização. Sua marca será vista por decisores, empresários e um público AA engajado com o esporte da mente."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
