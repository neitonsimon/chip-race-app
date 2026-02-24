import React from 'react';

export const ResponsibleGaming: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#050214] text-gray-300 py-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="relative mb-16 text-center">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-green-500/20 rounded-full blur-[80px]" />
                    <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tighter mb-4 relative">
                        Jogo <span className="text-green-500 italic">Responsável</span>
                    </h1>
                    <p className="text-gray-500 uppercase font-black tracking-widest text-xs mb-2">Compromisso com a prática consciente</p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-500/60">
                        <span className="w-10 h-[1px] bg-green-500/30"></span>
                        O POKER É UM ESPORTE DA MENTE
                        <span className="w-10 h-[1px] bg-green-500/30"></span>
                    </div>
                </div>

                {/* Intro Section */}
                <div className="bg-green-500/5 border border-green-500/10 p-8 rounded-3xl backdrop-blur-xl mb-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
                    <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto italic">
                        "A CHIP RACE e o CHIP RACE QG incentivam a participação responsável em todos os eventos.
                        Acreditamos que o jogo deve ser uma atividade recreativa, social e estratégica — nunca um meio de renda ou solução financeira."
                    </p>
                </div>

                {/* Content Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* 1. PARTICIPAÇÃO CONSCIENTE */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl hover:border-green-500/30 transition-all group">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3">
                            <span className="text-green-500">01.</span> Guia de Conduta
                        </h2>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li className="flex gap-3">
                                <span className="material-icons text-green-500 text-base">verified</span>
                                Jogue apenas com valores que não comprometam seu orçamento.
                            </li>
                            <li className="flex gap-3">
                                <span className="material-icons text-green-500 text-base">verified</span>
                                Estabeleça limites rígidos de tempo e gastos.
                            </li>
                            <li className="flex gap-3">
                                <span className="material-icons text-green-500 text-base">verified</span>
                                Evite jogar sob influência de substâncias ou álcool.
                            </li>
                        </ul>
                    </section>

                    {/* 2. NÃO É INVESTIMENTO */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl hover:border-red-500/30 transition-all group">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3">
                            <span className="text-red-500">02.</span> Não é Investimento
                        </h2>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li className="flex gap-3">
                                <span className="material-icons text-red-500/50 text-base">block</span>
                                Não constitui aplicação financeira ou bancária.
                            </li>
                            <li className="flex gap-3">
                                <span className="material-icons text-red-500/50 text-base">block</span>
                                Não oferece garantia de retorno ou rendimento.
                            </li>
                            <li className="flex gap-3">
                                <span className="material-icons text-red-500/50 text-base">block</span>
                                Resultados dependem exclusivamente do desempenho.
                            </li>
                        </ul>
                    </section>
                </div>

                {/* 3. SINAIS DE ALERTA */}
                <div className="bg-black/40 border border-white/10 rounded-3xl p-8 mb-6 relative overflow-hidden group hover:border-yellow-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-icons text-8xl text-yellow-500">warning</span>
                    </div>
                    <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3">
                        <span className="text-yellow-500">03.</span> Sinais de Alerta
                    </h2>
                    <p className="text-sm text-gray-500 mb-6 italic">Fique atento aos seguintes comportamentos:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            'Necessidade de recuperar perdas imediatamente',
                            'Aumentar apostas para compensar prejuízos',
                            'Comprometer recursos destinados a despesas essenciais',
                            'Ocultar participação de amigos e familiares',
                            'Comportamento compulsivo ou irritabilidade'
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-gray-400 bg-white/5 p-3 rounded-xl border border-white/5">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4 & 5. SUPORTE E PAUSA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-lg font-display font-black text-white uppercase mb-4">04. Suporte</h2>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Caso identifique comportamento inadequado, busque apoio profissional. A CHIP RACE pode orientar ou aplicar períodos de pausa preventiva.
                        </p>
                    </section>
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-lg font-display font-black text-white uppercase mb-4">05. Pausa Voluntária</h2>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Você pode solicitar a suspensão temporária, bloqueio de inscrições ou encerramento de conta a qualquer momento pelos canais oficiais.
                        </p>
                    </section>
                </div>

                {/* 6. COMPROMISSO INSTITUCIONAL */}
                <section className="bg-green-500/5 border border-green-500/20 p-8 rounded-3xl backdrop-blur-xl">
                    <h2 className="text-xl font-display font-black text-white uppercase mb-8 text-center">Compromisso Institucional</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-400 leading-relaxed">
                        <div className="space-y-4">
                            <p className="flex items-start gap-3">
                                <span className="material-icons text-green-500 text-sm">shield</span>
                                <strong>Transparência:</strong> Atuamos com clareza total na divulgação de estruturas e premiações.
                            </p>
                            <p className="flex items-start gap-3">
                                <span className="material-icons text-green-500 text-sm">shield</span>
                                <strong>Ética:</strong> Não promovemos promessas de ganhos financeiros ou rendimentos.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <p className="flex items-start gap-3">
                                <span className="material-icons text-green-500 text-sm">shield</span>
                                <strong>Proteção:</strong> Não direcionamos comunicação para públicos vulneráveis ou menores.
                            </p>
                            <p className="flex items-start gap-3">
                                <span className="material-icons text-green-500 text-sm">shield</span>
                                <strong>Responsabilidade:</strong> Nosso foco é a integridade da competição e do esporte.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Return button */}
                <div className="mt-20 flex flex-col items-center gap-6">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:border-green-500/50 text-gray-500 hover:text-green-500 transition-all flex items-center justify-center group"
                    >
                        <span className="material-icons transition-transform group-hover:-translate-y-1">arrow_upward</span>
                    </button>
                    <p className="text-[10px] text-gray-600 uppercase font-black tracking-[0.3em]">Chip Race Ethics · 2026</p>
                </div>
            </div>
        </div>
    );
};
