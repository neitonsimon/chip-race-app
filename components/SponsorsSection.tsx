import React from 'react';

export function SponsorsSection() {
    return (
        <section className="py-20 bg-background-light dark:bg-background-dark relative overflow-hidden transition-colors">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold tracking-wider uppercase mb-4 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
                        Esporte da Mente
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">Patrocine</span> a Chip Race
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        Associe sua marca ao poker, um esporte de habilidade mental em franca expansão. Converse com um público qualificado, decisor e engajado, e ganhe visibilidade em todos os canais da Chip Race.
                    </p>
                </div>

                {/* Advantages */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                    <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 rounded-2xl hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] group">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <span className="material-icons text-primary text-3xl">emoji_events</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Sua Marca nos Troféus</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Logotipo da sua empresa gravado nos cobiçados troféus dos nossos principais torneios, eternizando sua marca na glória dos campeões.
                        </p>
                    </div>

                    <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 rounded-2xl hover:border-secondary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--secondary-rgb),0.1)] group">
                        <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <span className="material-icons text-secondary text-3xl">image</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Destaque nos Flyers</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Presença garantida nas artes e flyers oficias divulgados massivamente em nossas redes sociais e grupos de jogadores.
                        </p>
                    </div>

                    <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 rounded-2xl hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] group">
                        <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <span className="material-icons text-cyan-500 text-3xl">photo_camera</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Foto do 3-Handed</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Banner de fundo exclusivo ou destaque visual na tradicional foto dos três finalistas (3-handed), o momento de maior tensão e audiência.
                        </p>
                    </div>

                    <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 rounded-2xl hover:border-pink-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)] group">
                        <div className="w-14 h-14 rounded-xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <span className="material-icons text-pink-500 text-3xl">record_voice_over</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Menções nas Lives</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Chamadas verbais e visuais da sua marca durante as transmissões ao vivo e coberturas escritas, alcançando espectadores engajados.
                        </p>
                    </div>

                    <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 rounded-2xl hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] group">
                        <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <span className="material-icons text-purple-500 text-3xl">card_giftcard</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Produtos Personalizados</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Possibilidade de distribuir brindes ou produtos com a sua marca, como baralhos, bonés e moletons, dentro do ecossistema do clube.
                        </p>
                    </div>

                    <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 rounded-2xl hover:border-green-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] group">
                        <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <span className="material-icons text-green-500 text-3xl">trending_up</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Networking Forte</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Acesso direto a jogadores e empresários de todo o estado. Posicione seu negócio onde as decisões e conexões acontecem.
                        </p>
                    </div>
                </div>

                {/* Pricing / Packages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Trimestral */}
                    <div className="relative bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-3xl p-8 flex flex-col hover:border-primary/30 transition-all duration-300">
                        <div className="mb-6">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase">Cota Trimestral</h3>
                            <p className="text-gray-500 dark:text-gray-400">Impacto concentrado para o trimestre.</p>
                        </div>

                        <div className="mb-8">
                            <span className="text-4xl font-black text-primary">R$ 2.500</span>
                            <span className="text-gray-500 dark:text-gray-400">/trimestre</span>
                        </div>

                        <ul className="space-y-4 mb-8 flex-grow">
                            <li className="flex items-start gap-3">
                                <span className="material-icons text-primary/80 text-xl mt-0.5">check_circle</span>
                                <span className="text-gray-700 dark:text-gray-300">Todas as vantagens básicas de visibilidade.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="material-icons text-primary/80 text-xl mt-0.5">check_circle</span>
                                <span className="text-gray-700 dark:text-gray-300">Destaque em 1 evento especial do trimestre.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="material-icons text-yellow-500 text-xl mt-0.5">stars</span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    <strong className="text-primary dark:text-primary-light">GRANDE BÔNUS:</strong> O nome da sua empresa estampará oficialmente o <strong className="text-gray-900 dark:text-white">Ranking Trimestral</strong> da Chip Race!
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="material-icons text-orange-500 text-xl mt-0.5">warning</span>
                                <span className="text-orange-600 dark:text-orange-400 font-bold">Limitado a 1 patrocinador por trimestre.</span>
                            </li>
                        </ul>

                        <a
                            href="https://wa.me/5551999999999?text=Olá,%20tenho%20interesse%20na%20cota%20Trimestral%20de%20patrocínio%20da%20Chip%20Race."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 text-center flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                            Quero Ser Trimestral
                            <span className="material-icons text-sm">arrow_forward_ios</span>
                        </a>
                    </div>

                    {/* Anual Master */}
                    <div className="relative bg-gradient-to-b from-primary/10 to-transparent border-2 border-primary rounded-3xl p-8 flex flex-col shadow-[0_0_40px_rgba(var(--primary-rgb),0.15)] transform md:-translate-y-4">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white font-bold py-1 px-4 rounded-full text-sm uppercase tracking-widest shadow-lg flex items-center gap-2">
                            <span className="material-icons text-base">star</span> Exclusivo
                        </div>

                        <div className="mb-6 mt-4">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase">Patrocinador Master (Anual)</h3>
                            <p className="text-gray-500 dark:text-gray-400">Domine a temporada completa de 2026.</p>
                        </div>

                        <div className="mb-8">
                            <span className="text-4xl font-black text-white">R$ 8.000</span>
                            <span className="text-gray-500 dark:text-gray-400">/ano</span>
                        </div>

                        <ul className="space-y-4 mb-8 flex-grow">
                            <li className="flex items-start gap-3">
                                <span className="material-icons text-primary text-xl mt-0.5">check_circle</span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">Naming rights em pelo menos 1 etapa do ano.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="material-icons text-primary text-xl mt-0.5">check_circle</span>
                                <span className="text-gray-700 dark:text-gray-300">Logo com maior destaque que os demais (Master).</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="material-icons text-primary text-xl mt-0.5">check_circle</span>
                                <span className="text-gray-700 dark:text-gray-300">Presença VIP em todos os eventos do The Chosen.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="material-icons text-yellow-500 text-xl mt-0.5">stars</span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    <strong className="text-primary dark:text-primary-light">TERRITÓRIO MASTER:</strong> O nome da sua empresa estampará oficialmente o cobiçado <strong className="text-gray-900 dark:text-white">Ranking Anual</strong> The Chosen!
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="material-icons text-orange-500 text-xl mt-0.5">lock</span>
                                <span className="text-orange-600 dark:text-orange-400 font-bold">Limitado a APENAS 1 patrocinador master por ano.</span>
                            </li>
                        </ul>

                        <a
                            href="https://wa.me/5551999999999?text=Olá,%20tenho%20interesse%20em%20ser%20o%20PATROCINADOR%20MASTER%20da%20temporada."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 rounded-xl font-bold bg-primary text-white hover:bg-primary-light transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                            Quero Ser Master
                            <span className="material-icons">rocket_launch</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
