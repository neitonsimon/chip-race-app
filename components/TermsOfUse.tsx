import React from 'react';

export const TermsOfUse: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#050214] text-gray-300 py-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="relative mb-16 text-center">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/20 rounded-full blur-[80px]" />
                    <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tighter mb-4 relative">
                        Termos de <span className="text-primary italic">Uso</span>
                    </h1>
                    <p className="text-gray-500 uppercase font-black tracking-widest text-xs mb-2">Plataforma Digital Chip Race</p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                        <span className="w-10 h-[1px] bg-primary/30"></span>
                        Última atualização: 24 / 02 / 2026
                        <span className="w-10 h-[1px] bg-primary/30"></span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="space-y-6">
                    {/* 1. ACEITAÇÃO */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl transition hover:border-primary/30 group">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3 group-hover:text-primary transition-colors">
                            <span className="text-primary">1.</span> Aceitação dos Termos
                        </h2>
                        <div className="space-y-4 text-gray-400 leading-relaxed">
                            <p>
                                Ao acessar, cadastrar-se ou utilizar a plataforma digital da CHIP RACE (site, aplicativo ou sistemas vinculados), o usuário declara ter lido, compreendido e aceito integralmente estes Termos de Uso.
                            </p>
                            <p>
                                Caso não concorde com qualquer disposição aqui prevista, o usuário não deverá utilizar a plataforma.
                            </p>
                        </div>
                    </section>

                    {/* 2. NATUREZA */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl transition hover:border-secondary/30 group">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3 group-hover:text-secondary transition-colors">
                            <span className="text-secondary">2.</span> Natureza da Plataforma
                        </h2>
                        <p className="leading-relaxed text-gray-400 mb-6">
                            A CHIP RACE é uma marca e organização privada voltada à:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {[
                                'Criação e administração de eventos presenciais e online',
                                'Gestão de ligas e competições privadas',
                                'Programas de qualificação e ranking',
                                'Comercialização de produtos e serviços relacionados'
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm text-gray-500 bg-black/40 p-4 rounded-xl border border-white/5">
                                    <span className="material-icons text-secondary text-base">check_circle</span>
                                    {item}
                                </div>
                            ))}
                        </div>
                        <div className="text-sm italic text-gray-500 bg-secondary/5 border-l-4 border-secondary p-5 rounded-r-xl">
                            A plataforma não constitui instituição financeira, casa de apostas online, corretora de investimentos ou entidade bancária. Trata-se de um ambiente digital privado de gestão e organização de eventos competitivos presenciais.
                        </div>
                    </section>

                    {/* 3. CADASTRO */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3">
                            <span className="text-white/40">3.</span> Cadastro e Conta do Usuário
                        </h2>
                        <div className="space-y-4 text-gray-400 leading-relaxed">
                            <p>3.1 O acesso às funcionalidades completas exige cadastro prévio.</p>
                            <p>3.2 O usuário declara que fornece informações verdadeiras, é maior de 18 anos e responsável pela confidencialidade de seus dados.</p>
                            <p>3.3 A CHIP RACE poderá suspender ou cancelar contas em caso de informações falsas, conduta inadequada, violação destes termos ou tentativa de fraude.</p>
                        </div>
                    </section>

                    {/* 4. ECONOMIA INTERNA */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl group hover:border-primary/30 transition">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3 group-hover:text-primary transition-colors">
                            <span className="text-primary">4.</span> Economia Interna da Plataforma
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="material-icons text-green-500">payments</span>
                                    <p className="text-xs font-black text-green-500 uppercase">Moeda Corrente (R$)</p>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed">Saldo financeiro para utilização em taxas, inscrições e produtos.</p>
                            </div>
                            <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="material-icons text-primary">token</span>
                                    <p className="text-xs font-black text-primary uppercase">Chipz</p>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed">Créditos internos que não representam investimento e não possuem conversão obrigatória.</p>
                            </div>
                        </div>
                    </section>

                    {/* 5 e 6. COMPETIÇÕES E RANKING */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                            <h2 className="text-lg font-display font-black text-white uppercase mb-4 flex items-center gap-3">
                                <span className="text-white/40">5.</span> Eventos
                            </h2>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Organização de eventos com regulamentos próprios, premiações e critérios de qualificação. A participação implica aceitação do regulamento específico.
                            </p>
                        </section>
                        <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                            <h2 className="text-lg font-display font-black text-white uppercase mb-4 flex items-center gap-3">
                                <span className="text-white/40">6.</span> Ranking
                            </h2>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Manutenção de sistemas de ranking e pontuação acumulativa. A metodologia é definida pela organização e pode ser ajustada.
                            </p>
                        </section>
                    </div>

                    {/* 7. CONDUTA */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl group hover:border-red-500/30 transition">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3 group-hover:text-red-500 transition-colors">
                            <span className="text-red-500">7.</span> Conduta do Usuário
                        </h2>
                        <div className="space-y-6">
                            <p className="text-gray-400 text-sm italic">Compromisso com ética, boa-fé e respeito.</p>
                            <div className="flex flex-wrap gap-2">
                                {['Sem Fraude', 'Sem Conluio', 'Sem Manipulação', 'Sem Múltiplas Contas'].map((item, i) => (
                                    <span key={i} className="text-[10px] font-black uppercase bg-red-500/5 border border-red-500/20 py-2 px-4 rounded-full text-red-400/80">{item}</span>
                                ))}
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-gray-500 leading-relaxed">
                                <span className="text-red-500 font-bold uppercase block mb-1">Consequências</span>
                                Violações podem resultar em advertência, perda de pontuação, suspensão temporária ou banimento definitivo.
                            </div>
                        </div>
                    </section>

                    {/* 8-10. INTELECTUAL, LIMITAÇÃO, ALTERAÇÕES */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center">
                            <span className="material-icons text-white/20 mb-3">copyright</span>
                            <h3 className="text-xs font-black text-white uppercase mb-2">P. Intelectual</h3>
                            <p className="text-[10px] text-gray-500 leading-relaxed">Marca, Logos e Sistema são de propriedade exclusiva.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center">
                            <span className="material-icons text-white/20 mb-3">gavel</span>
                            <h3 className="text-xs font-black text-white uppercase mb-2">Responsabilidade</h3>
                            <p className="text-[10px] text-gray-500 leading-relaxed">Não nos responsabilizamos por falhas técnicas do usuário.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center">
                            <span className="material-icons text-white/20 mb-3">update</span>
                            <h3 className="text-xs font-black text-white uppercase mb-2">Alterações</h3>
                            <p className="text-[10px] text-gray-500 leading-relaxed">Termos podem ser atualizados a qualquer momento.</p>
                        </div>
                    </div>

                    {/* 11-13. ENCERRAMENTO, GERAIS, FORO */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6">Informações Legais Finais</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-gray-500 leading-relaxed">
                            <div>
                                <span className="text-white font-bold uppercase block mb-2">11. Cancelamento</span>
                                O usuário pode encerrar a conta a qualquer momento. A organização pode encerrar contas por violação de regras.
                            </div>
                            <div>
                                <span className="text-white font-bold uppercase block mb-2">12. Disposições Gerais</span>
                                Tolerância não implica renúncia de direito. A nulidade de uma cláusula não invalida as demais.
                            </div>
                            <div>
                                <span className="text-white font-bold uppercase block mb-2">13. Foro</span>
                                Fica eleito o foro da comarca da sede da empresa administradora da CHIP RACE para dirimir controvérsias.
                            </div>
                        </div>
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
                    <p className="text-[10px] text-gray-600 uppercase font-black tracking-[0.3em]">Chip Race Organization · 2026</p>
                </div>
            </div>
        </div>
    );
};
