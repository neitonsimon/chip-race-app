import React from 'react';

interface RegulationsProps {
    onBack: () => void;
    prizeLabel: string;
}

export const TheChosenRegulations: React.FC<RegulationsProps> = ({ onBack, prizeLabel }) => {
  return (
    <div className="min-h-screen bg-background-dark text-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                <span className="material-icons-outlined">arrow_back</span> Voltar
            </button>

            <div className="bg-surface-dark border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-display font-bold text-white mb-4">REGULAMENTO OFICIAL</h1>
                    <div className="text-2xl text-primary font-display font-black uppercase">THE CHOSEN {prizeLabel}</div>
                    <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mt-6"></div>
                </div>

                <div className="space-y-10 font-light leading-relaxed text-gray-300 text-justify">
                    
                    {/* TÓPICO 1 */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                            <span className="text-secondary">1.</span> Definição e Estrutura ({prizeLabel})
                        </h3>
                        <div className="space-y-3">
                            <p>
                                <strong>1.1. Natureza do Evento:</strong> O <strong>The Chosen {prizeLabel}</strong> é um torneio de poker na modalidade <em>Texas Hold'em No Limit</em>, de caráter "Invitational" (apenas convidados/classificados), a ser realizado em Novembro de 2026 nas dependências do QG Chip Race.
                            </p>
                            <p>
                                <strong>1.2. Exclusividade de Acesso:</strong> Não haverá venda de inscrição direta (Buy-in/Direct Entry) no dia do evento. A participação é restrita a jogadores que conquistarem sua vaga através dos 8 métodos de qualificação oficiais durante a temporada.
                            </p>
                            <p>
                                <strong>1.3. Premiação Dinâmica:</strong> O prêmio garantido base inicia em R$ 30.000,00. Este valor é progressivo e ajustado conforme metas de engajamento da comunidade, refletido no título atual do evento (<strong>{prizeLabel}</strong>).
                            </p>
                        </div>
                    </section>

                    {/* TÓPICO 2 */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                            <span className="text-secondary">2.</span> Qualificação e Sistema de Bônus
                        </h3>
                        <div className="space-y-4">
                            <p>
                                <strong>2.1. Qualificação Primária:</strong> Ao conquistar sua primeira vaga (independente do método), o jogador garante o assento no evento com um <strong>Stack Inicial de 25.000 fichas</strong>.
                            </p>
                            
                            <div className="bg-white/5 p-4 rounded-lg border-l-4 border-primary">
                                <p className="mb-2"><strong>2.2. Bônus por Qualificação Cruzada (Stack Inicial):</strong></p>
                                <p className="text-sm">
                                    Caso o jogador conquiste novas vagas através de <strong>modalidades diferentes</strong> de classificação (ex: ganhou via Ranking e depois via Jackpot), ele acumula <strong>25.000 fichas adicionais</strong> diretamente ao seu Stack Inicial para cada nova modalidade conquistada.
                                    <br/>
                                    <em className="text-gray-400 text-xs block mt-1">Exemplo: Vaga via Ranking (25k) + Vaga via Torneio Major (25k) = Inicia o dia com 50.000 fichas.</em>
                                </p>
                            </div>

                            <div className="bg-white/5 p-4 rounded-lg border-l-4 border-secondary">
                                <p className="mb-2"><strong>2.3. Bônus por Reincidência (Rebuy/Add-on):</strong></p>
                                <p className="text-sm">
                                    Caso o jogador conquiste novas vagas dentro da <strong>mesma modalidade</strong> de classificação (ex: ganhou 2 satélites Jackpot), o bônus de <strong>25.000 fichas</strong> será aplicado exclusivamente como acréscimo ao realizar uma Recompra (Rebuy) ou Add-on durante o evento.
                                    <br/>
                                    <em className="text-gray-400 text-xs block mt-1">Exemplo: Ganhou 2 satélites. Inicia com 25k. Se fizer Rebuy, recebe as fichas do Rebuy + 25k de bônus extra.</em>
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* TÓPICO 3 */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                            <span className="text-secondary">3.</span> Recompras, Add-on e Ajuste Tarifário
                        </h3>
                        <div className="space-y-3">
                            <p>
                                <strong>3.1. Política de Recompras:</strong> Durante o período de registro tardio, são permitidos Rebuys (ilimitados) e um Add-on ao final do período.
                            </p>
                            <p>
                                <strong>3.2. Valor Base:</strong> Para o garantido inicial de 30K, o custo base de Rebuy e Add-on é fixado em <strong>R$ 200,00</strong>.
                            </p>
                            <p>
                                <strong>3.3. Regra de Ajuste Progressivo:</strong> Para manter a proporcionalidade da premiação, o valor do Rebuy e Add-on sofrerá um acréscimo de <strong>R$ 5,00</strong> para cada <strong>R$ 1.000,00</strong> adicionados ao prêmio garantido total acima dos 30K iniciais.
                            </p>
                            <div className="bg-black/20 p-3 rounded border border-white/5 text-sm font-mono text-gray-400">
                                Fórmula: Novo Preço = R$ 200 + ((Novo Garantido - 30.000) / 1.000 * 5)
                            </div>
                        </div>
                    </section>

                    {/* TÓPICO 4 */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                            <span className="text-secondary">4.</span> Custos Operacionais e Benefícios (Rake)
                        </h3>
                        <div className="space-y-3">
                            <p>
                                <strong>4.1. Arrecadação Integral (0% Rake):</strong> Durante toda a temporada classificatória, a organização <strong>não retém</strong> nenhuma porcentagem sobre os valores destinados à formação do pote garantido inicial ou suas metas adicionais. 100% do valor arrecadado nas etapas classificatórias destinado ao The Chosen é revertido integralmente para a premiação.
                            </p>
                            <p>
                                <strong>4.2. Taxa Administrativa (Dia Final):</strong> Exclusivamente sobre o valor arrecadado com <strong>Recompras (Rebuys) e Add-ons</strong> realizados no dia do evento final, será retido o percentual de <strong>50%</strong> a título de taxa administrativa, custeio operacional e staff.
                            </p>
                            <p>
                                <strong>4.3. Isenção de Taxa Staff:</strong> Em virtude da retenção descrita no item 4.2, os jogadores estão <strong>isentos</strong> do pagamento de taxa de staff (Dealer's Choice/Caixinha) no ato da inscrição ou recompras do dia final.
                            </p>
                            <p>
                                <strong>4.4. Hospitality (Open Bar & Food):</strong> Como contrapartida à taxa administrativa do dia final, a organização fornecerá serviço de alimentação e bebidas (Open Bar e Open Food) para todos os jogadores ativos no torneio, sem custo adicional, garantindo uma experiência de confraternização premium.
                            </p>
                        </div>
                    </section>

                     {/* TÓPICO 5 */}
                     <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                            <span className="text-secondary">5.</span> Disposições Gerais
                        </h3>
                        <div className="space-y-3">
                            <p>
                                <strong>5.1. Intransferibilidade:</strong> As vagas para o The Chosen são pessoais e intransferíveis. Em hipótese alguma uma vaga poderá ser vendida, doada ou convertida em dinheiro (cash out) antes do evento.
                            </p>
                            <p>
                                <strong>5.2. Direitos de Imagem:</strong> Ao participar de qualquer etapa classificatória ou do evento final, o jogador cede gratuitamente o direito de uso de sua imagem e voz para fins de divulgação da marca Chip Race em qualquer mídia.
                            </p>
                            <p>
                                <strong>5.3. Soberania da Direção:</strong> Casos omissos neste regulamento serão resolvidos pela Direção Geral do Torneio, cuja decisão é soberana e irrecorrível, prezando sempre pela integridade do esporte.
                            </p>
                        </div>
                    </section>

                </div>
                
                <div className="mt-16 pt-8 border-t border-white/5 text-center">
                    <p className="text-xs text-gray-500 font-mono">
                        Documento atualizado em Março de 2026. Válido para a Temporada 2026.<br/>
                        Chip Race Eventos e Entretenimento.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};