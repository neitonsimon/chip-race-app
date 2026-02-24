import React from 'react';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#050214] text-gray-300 py-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="relative mb-16 text-center">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-secondary/20 rounded-full blur-[80px]" />
                    <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tighter mb-4 relative">
                        Política de <span className="text-secondary italic">Privacidade</span>
                    </h1>
                    <p className="text-gray-500 uppercase font-black tracking-widest text-xs mb-2">Compromisso Chip Race com seus Dados</p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary/60">
                        <span className="w-10 h-[1px] bg-secondary/30"></span>
                        Última atualização: 24 / 02 / 2026
                        <span className="w-10 h-[1px] bg-secondary/30"></span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="space-y-6">
                    {/* 1. INTRODUÇÃO */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl transition hover:border-secondary/30 group">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3 group-hover:text-secondary transition-colors">
                            <span className="text-secondary">1.</span> Introdução
                        </h2>
                        <p className="leading-relaxed text-gray-400">
                            A presente Política de Privacidade tem como objetivo esclarecer como a CHIP RACE coleta, utiliza, armazena, protege e trata os dados pessoais de seus usuários, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD) e demais normas aplicáveis.
                        </p>
                        <p className="mt-4 leading-relaxed text-gray-400">
                            Ao utilizar a plataforma, o usuário declara estar ciente e de acordo com esta Política.
                        </p>
                    </section>

                    {/* 2. CONTROLADOR */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3">
                            <span className="text-white/40">2.</span> Controlador dos Dados
                        </h2>
                        <p className="leading-relaxed text-gray-400">
                            A empresa administradora da marca CHIP RACE atua como Controladora dos dados pessoais coletados. O tratamento de dados ocorre exclusivamente para finalidades legítimas, específicas e informadas ao usuário.
                        </p>
                    </section>

                    {/* 3. DADOS COLETADOS */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl group hover:border-primary/30 transition">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3 group-hover:text-primary transition-colors">
                            <span className="text-primary">3.</span> Dados Coletados
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">3.1 Fornecidos pelo Usuário</h3>
                                <ul className="space-y-2 text-xs text-gray-500">
                                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary" /> Nome completo e CPF</li>
                                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary" /> Data de nascimento</li>
                                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary" /> E-mail e Telefone</li>
                                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary" /> Cidade e Estado</li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">3.2 Coletados Automaticamente</h3>
                                <ul className="space-y-2 text-xs text-gray-500">
                                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-secondary" /> Endereço IP</li>
                                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-secondary" /> Dados de navegação</li>
                                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-secondary" /> Dispositivo utilizado</li>
                                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-secondary" /> Cookies e IDs Digitais</li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-8 p-4 bg-black/40 border border-white/5 rounded-2xl">
                            <h3 className="text-xs font-black text-white uppercase mb-2">3.3 Dados Financeiros</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Informações de pagamentos e histórico de transações. A CHIP RACE <strong>não armazena</strong> dados completos de cartões de crédito quando processados por intermediadores.
                            </p>
                        </div>
                    </section>

                    {/* 4. FINALIDADE */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl group hover:border-white/20 transition">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3">
                            <span className="text-white/40">4.</span> Finalidade do Tratamento
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: 'manage_accounts', label: 'Gerenciar Contas' },
                                { icon: 'event', label: 'Participação em Eventos' },
                                { icon: 'payments', label: 'Processar Pagamentos' },
                                { icon: 'leaderboard', label: 'Rankings Oficiais' },
                                { icon: 'campaign', label: 'Comunicação' },
                                { icon: 'gavel', label: 'Obrigações Legais' },
                                { icon: 'security', label: 'Prevenir Fraudes' },
                                { icon: 'auto_graph', label: 'Melhorar Experiência' }
                            ].map((item, i) => (
                                <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-xl text-center flex flex-col items-center gap-2">
                                    <span className="material-icons text-secondary text-base">{item.icon}</span>
                                    <span className="text-[9px] font-black uppercase tracking-tight text-gray-500">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 5. COMPARTILHAMENTO */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3">
                            <span className="text-white/40">5.</span> Compartilhamento de Dados
                        </h2>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6">
                            A CHIP RACE poderá compartilhar dados pessoais apenas quando necessário com processadores de pagamento, fornecedores de tecnologia, serviços de hospedagem e autoridades públicas.
                        </p>
                        <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl text-center">
                            <p className="text-xs font-black text-red-400 uppercase tracking-widest">
                                A organização não comercializa dados pessoais.
                            </p>
                        </div>
                    </section>

                    {/* 6 e 7. SEGURANÇA E RETENÇÃO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl group hover:border-green-500/30 transition">
                            <h3 className="text-lg font-display font-black text-white uppercase mb-4 flex items-center gap-3 group-hover:text-green-500">
                                <span className="text-green-500">6.</span> Segurança
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Adotamos medidas técnicas para prevenir acessos não autorizados e vazamentos. O usuário reconhece os riscos inerentes ao ambiente digital.
                            </p>
                        </section>
                        <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl group hover:border-blue-500/30 transition">
                            <h3 className="text-lg font-display font-black text-white uppercase mb-4 flex items-center gap-3 group-hover:text-blue-500">
                                <span className="text-blue-500">7.</span> Retenção
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Dados mantidos enquanto a conta estiver ativa ou pelo período necessário para cumprimento de obrigações legais e defesa judicial.
                            </p>
                        </section>
                    </div>

                    {/* 8. DIREITOS DO TITULAR */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl group hover:border-secondary/30 transition">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center gap-3 group-hover:text-secondary transition-colors">
                            <span className="text-secondary">8.</span> Direitos do Titular
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {[
                                'Confirmação de Tratamento', 'Acesso aos Dados', 'Correção de Erros',
                                'Anonimização', 'Portabilidade', 'Revogação de Consentimento'
                            ].map((right, i) => (
                                <span key={i} className="bg-secondary/5 border border-secondary/20 text-secondary text-[10px] font-black uppercase py-2 px-4 rounded-lg">
                                    {right}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* 11. DADOS DE MENORES */}
                    <section className="bg-red-500/5 border border-red-500/10 p-8 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-4 flex items-center gap-3">
                            <span className="text-red-500">11.</span> Dados de Menores
                        </h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            A plataforma é destinada <strong>exclusivamente a maiores de 18 anos</strong>. Caso seja identificado cadastro irregular de menor, a conta será imediatamente encerrada.
                        </p>
                    </section>

                    {/* 13-14. ALTERAÇÕES E FINAIS */}
                    <section className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                        <h2 className="text-xl font-display font-black text-white uppercase mb-6">Disposições Finais</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-500 leading-relaxed">
                            <div>
                                <span className="text-white font-bold uppercase block mb-2">13. Alterações</span>
                                Esta Política poderá ser atualizada a qualquer momento. A versão vigente sempre será a publicada na plataforma.
                            </div>
                            <div>
                                <span className="text-white font-bold uppercase block mb-2">14. Foro</span>
                                Eventuais controvérsias serão dirimidas no foro da comarca da sede da empresa administradora da CHIP RACE.
                            </div>
                        </div>
                    </section>
                </div>

                {/* Return button */}
                <div className="mt-20 flex flex-col items-center gap-6">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:border-secondary/50 text-gray-500 hover:text-secondary transition-all flex items-center justify-center group"
                    >
                        <span className="material-icons transition-transform group-hover:-translate-y-1">arrow_upward</span>
                    </button>
                    <p className="text-[10px] text-gray-600 uppercase font-black tracking-[0.3em]">Chip Race Security · 2026</p>
                </div>
            </div>
        </div>
    );
};
