import React from 'react';

export const ClubRules: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#050214] text-gray-300 py-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="relative mb-16 text-center">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/20 rounded-full blur-[80px]" />
                    <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tighter mb-4 relative">
                        Regras do <span className="text-primary italic">Clube</span>
                    </h1>
                    <p className="text-gray-500 uppercase font-black tracking-widest text-xs mb-2">Chip Race QG · Regulamento Interno</p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                        <span className="w-10 h-[1px] bg-primary/30"></span>
                        Conduta e Integridade Competitiva
                        <span className="w-10 h-[1px] bg-primary/30"></span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="space-y-6">
                    {/* 1. NATUREZA */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl transition hover:border-primary/30 group">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3 group-hover:text-primary transition-colors">
                            <span className="text-primary">1.</span> Natureza do Clube
                        </h2>
                        <div className="space-y-4 text-gray-400 leading-relaxed">
                            <p>
                                O CHIP RACE QG é um clube privado de eventos e competições presenciais, operado sob administração da marca CHIP RACE.
                            </p>
                            <p>
                                A participação é voluntária e restrita a membros cadastrados e aprovados pela organização. O clube reserva-se o direito de admissão e permanência.
                            </p>
                        </div>
                    </section>

                    {/* 2. PARTICIPAÇÃO */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl group hover:border-white/20 transition">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3">
                            <span className="text-white/40">2.</span> Participação
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center">
                                <span className="material-icons text-primary mb-2">18_up_rating</span>
                                <p className="text-[10px] font-black uppercase text-gray-500">Idade Mínima</p>
                                <p className="text-xs text-white mt-1">18 anos completos</p>
                            </div>
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center">
                                <span className="material-icons text-primary mb-2">assignment_ind</span>
                                <p className="text-[10px] font-black uppercase text-gray-500">Cadastro</p>
                                <p className="text-xs text-white mt-1">Sempre atualizado</p>
                            </div>
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center">
                                <span className="material-icons text-primary mb-2">fact_check</span>
                                <p className="text-[10px] font-black uppercase text-gray-500">Conformidade</p>
                                <p className="text-xs text-white mt-1">Seguir regras internas</p>
                            </div>
                        </div>
                    </section>

                    {/* 3. CONDUTA */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl group hover:border-red-500/30 transition">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3 group-hover:text-red-500 transition-colors">
                            <span className="text-red-500">3.</span> Conduta e Comportamento
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-green-500/5 border border-green-500/10 p-4 rounded-2xl">
                                <h3 className="text-xs font-black text-green-500 uppercase mb-3 flex items-center gap-2">
                                    <span className="material-icons text-sm">check_circle</span> o que esperamos
                                </h3>
                                <ul className="text-xs text-gray-400 space-y-2">
                                    <li className="flex items-center gap-2">• Respeito à organização, staff e participantes</li>
                                    <li className="flex items-center gap-2">• Conduta ética e esportiva impecável</li>
                                    <li className="flex items-center gap-2">• Cumprimento fiel das regras técnicas</li>
                                </ul>
                            </div>

                            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl">
                                <h3 className="text-xs font-black text-red-500 uppercase mb-3 flex items-center gap-2">
                                    <span className="material-icons text-sm">cancel</span> tolerância zero
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {['Conluio', 'Chip Dumping', 'Agressão', 'Ilícitos', 'Irregularidades'].map((item, i) => (
                                        <span key={i} className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black uppercase px-3 py-1 rounded-full">{item}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <h3 className="text-xs font-black text-white uppercase mb-3 text-center">Sistema de Penalidades</h3>
                                <div className="flex justify-between items-center text-[8px] font-black text-gray-500 uppercase tracking-tighter">
                                    <div className="flex flex-col items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Advertência</div>
                                    <div className="w-full h-[1px] bg-white/5 mx-2"></div>
                                    <div className="flex flex-col items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Perda Pontos</div>
                                    <div className="w-full h-[1px] bg-white/5 mx-2"></div>
                                    <div className="flex flex-col items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Suspensão</div>
                                    <div className="w-full h-[1px] bg-white/5 mx-2"></div>
                                    <div className="flex flex-col items-center gap-1"><span className="w-2 h-2 rounded-full bg-black border border-red-500"></span> Banimento</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4 e 5. REGRAS E PREMIOS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                            <h2 className="text-lg font-display font-black text-white uppercase mb-4 flex items-center gap-3">
                                <span className="text-white/40">4.</span> Regras Eventos
                            </h2>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Cada evento possui regulamento próprio para blinds, pontuação e premiação. A inscrição implica aceitação integral.
                            </p>
                        </section>
                        <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                            <h2 className="text-lg font-display font-black text-white uppercase mb-4 flex items-center gap-3">
                                <span className="text-white/40">5.</span> Premiações
                            </h2>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Distribuição conforme critérios divulgados. Retenção possível em caso de fraude ou irregularidades cadastrais.
                            </p>
                        </section>
                    </div>

                    {/* 7. USO DE IMAGEM */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl group hover:border-secondary/30 transition">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3 group-hover:text-secondary transition-colors">
                            <span className="text-secondary">7.</span> Uso de Imagem
                        </h2>
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center shrink-0">
                                <span className="material-icons text-secondary text-3xl">photo_camera</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Ao participar, você autoriza o uso de sua imagem para fins de divulgação, marketing e redes sociais da instituição. Caso não deseje, comunique formalmente antes do evento.
                            </p>
                        </div>
                    </section>

                    {/* 8. SEGURANÇA */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-4">8. Segurança</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            O membro é responsável por seus pertences. A organização não se responsabiliza por objetos perdidos ou decisões estratégicas individuais.
                        </p>
                    </section>

                    {/* 10. DISPOSIÇÃO FINAL */}
                    <section className="bg-primary/5 border border-primary/20 p-8 rounded-3xl backdrop-blur-xl text-center">
                        <h2 className="text-2xl font-display font-black text-white uppercase mb-4 italic">Concordância Integral</h2>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-lg mx-auto mb-8">
                            A participação no CHIP RACE QG implica concordância total com estas regras, regulamentos, termos de uso e política de privacidade.
                        </p>
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Respeite o Esporte · Jogue com Honra</div>
                    </section>
                </div>

                {/* Return button */}
                <div className="mt-20 flex flex-col items-center gap-6">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:border-primary/50 text-gray-500 hover:text-primary transition-all flex items-center justify-center group"
                    >
                        <span className="material-icons transition-transform group-hover:-translate-y-1">arrow_upward</span>
                    </button>
                    <p className="text-[10px] text-gray-600 uppercase font-black tracking-[0.3em]">Chip Race Headquarters · 2026</p>
                </div>
            </div>
        </div>
    );
};
