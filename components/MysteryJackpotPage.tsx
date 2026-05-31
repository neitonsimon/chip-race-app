import React from 'react';
import { PlayerStats } from '../types';

interface MysteryJackpotPageProps {
  onNavigate: (view: string) => void;
  currentUser?: Partial<PlayerStats>;
}

export const MysteryJackpotPage: React.FC<MysteryJackpotPageProps> = ({ onNavigate, currentUser }) => {
  const isLoggedIn = !!(currentUser && currentUser.id);

  // Default database-backed jackpot vouchers count
  const userVouchers = currentUser?.jackpotVouchers || 0;

  return (
    <div className="min-h-screen bg-[#05030A] text-gray-200 relative overflow-hidden font-body">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-yellow-600/10 via-amber-500/5 to-transparent rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-yellow-700/5 via-yellow-600/10 to-transparent rounded-full blur-[140px] pointer-events-none"></div>

      {/* Futuristic digital lines */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(218,165,32,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(218,165,32,0.15)_1px,transparent_1px)] bg-[size:40px_40px] z-0 pointer-events-none"></div>

      {/* Back button */}
      <div className="fixed top-4 left-4 z-[999]">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#030914]/90 hover:bg-[#06152d]/95 border-2 border-yellow-500/50 hover:border-yellow-400 text-yellow-500 hover:text-white rounded-xl transition-all duration-300 backdrop-blur-md font-display font-black uppercase text-xs tracking-widest cursor-pointer shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:scale-[1.03] group"
        >
          <span className="material-icons-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span>Lobby Principal</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 pb-20">
        
        {/* HERO SECTION */}
        <section className="text-center mb-24 relative">
          
          {/* Animated Envelope in Background */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-tr from-yellow-500/10 to-amber-500/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

          <span className="material-icons-outlined text-6xl md:text-7xl text-yellow-500 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] mb-6 animate-bounce">
            workspace_premium
          </span>

          <h1 className="text-4xl sm:text-6xl md:text-8xl font-display font-black tracking-wider mb-6 select-none leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-600 drop-shadow-[0_2px_15px_rgba(250,204,21,0.3)]">
              MYSTERY JACKPOT
            </span>
          </h1>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-6 uppercase tracking-wider">
            Transforme grandes mãos em recompensas reais.
          </h2>

          <div className="flex flex-col items-center justify-center gap-3 text-gray-400 max-w-xl mx-auto font-light text-base md:text-lg mb-12">
            <p className="flex items-center gap-2">
              <span className="material-icons-outlined text-yellow-500 text-sm">circle</span>
              Cada jogada especial pode render vouchers.
            </p>
            <p className="flex items-center gap-2">
              <span className="material-icons-outlined text-yellow-500 text-sm">circle</span>
              Cada voucher pode revelar um prêmio.
            </p>
            <p className="flex items-center gap-2">
              <span className="material-icons-outlined text-yellow-500 text-sm">circle</span>
              Cada envelope pode mudar sua temporada.
            </p>
          </div>


        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="como-funciona" className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-wider mb-4">
              COMO FUNCIONA
            </h2>
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-16">
            {[
              { step: "01", text: "Participe do Mystery Jackpot no evento." },
              { step: "02", text: "Realize mãos especiais elegíveis." },
              { step: "03", text: "Receba vouchers automaticamente." },
              { step: "04", text: "Troque vouchers por envelopes misteriosos." },
              { step: "05", text: "Revele prêmios exclusivos." }
            ].map((step, idx) => (
              <div key={idx} className="relative bg-[#0d0a14] border border-white/5 rounded-2xl p-6 text-center shadow-lg transition-all hover:border-yellow-500/30 hover:-translate-y-1">
                <div className="absolute top-4 left-4 font-display font-black text-3xl text-yellow-500/20">
                  {step.step}
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-6 shadow-md">
                  <span className="material-icons-outlined text-yellow-500 text-xl">
                    {idx === 0 ? 'stars' : idx === 1 ? 'sports_esports' : idx === 2 ? 'confirmation_number' : idx === 3 ? 'mail' : 'redeem'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-300 leading-relaxed font-body">
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          {/* VOUCHER ACCUMULATION STATE */}
          <div className="max-w-3xl mx-auto bg-gradient-to-b from-[#16121f] to-[#0a0710] border-2 border-yellow-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_30px_rgba(250,204,21,0.05)]">
            <h3 className="font-display text-lg sm:text-xl font-black text-white uppercase tracking-wider mb-6 flex items-center justify-center gap-2">
              <span className="material-icons text-yellow-500 animate-pulse">account_balance_wallet</span>
              SEU SALDO DE VOUCHERS
            </h3>

            {isLoggedIn ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl px-6 py-4">
                  <img
                    src={currentUser?.avatar || '/default-avatar.png'}
                    alt={currentUser?.name}
                    className="w-12 h-12 rounded-xl object-cover border border-yellow-500/30"
                  />
                  <div className="text-left">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Jogador</div>
                    <div className="text-white font-black text-base">{currentUser?.name}</div>
                  </div>
                </div>

                <div className="relative inline-flex items-center gap-3 bg-gradient-to-r from-yellow-600/20 via-yellow-500/10 to-amber-700/20 border-2 border-yellow-500/60 px-8 py-5 rounded-2xl shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                  <span className="material-icons text-yellow-500 text-4xl">confirmation_number</span>
                  <div className="text-left">
                    <span className="font-display font-black text-3xl text-white tracking-widest">{userVouchers}</span>
                    <span className="text-[10px] text-yellow-500 uppercase tracking-widest font-black block mt-0.5">VOUCHERS ACUMULADOS</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center text-center">
                <span className="material-icons-outlined text-gray-600 text-5xl mb-4">lock</span>
                <p className="text-gray-400 font-light text-sm max-w-md mb-6 leading-relaxed">
                  Faça login para ver o seu saldo de vouchers ativos em tempo real e acompanhar suas conquistas no ecossistema Chip Race.
                </p>
                <button
                  onClick={() => onNavigate('login')}
                  className="font-display bg-[#00e0ff] text-background-dark font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,224,255,0.4)] hover:scale-[1.03]"
                >
                  FAZER LOGIN
                </button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-xs text-gray-500 tracking-wider leading-relaxed uppercase">
                Os vouchers são acumulativos e ficam registrados na conta do jogador em:{" "}
                <a href="https://www.chiprace.com.br" className="text-yellow-500 hover:text-yellow-400 transition-colors font-bold underline">
                  www.chiprace.com.br
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* URN SYSTEM SECTION */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-wider mb-4">
              AS URNAS DO JACKPOT
            </h2>
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* BLACK URN CARD */}
            <div className="relative bg-gradient-to-b from-[#0d0d12] to-[#040406] border-2 border-white/10 rounded-[2.5rem] p-8 lg:p-12 flex flex-col justify-between transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.02)] hover:border-white/20 group">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/30 rounded-tl-lg pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/30 rounded-tr-lg pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/30 rounded-bl-lg pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/30 rounded-br-lg pointer-events-none"></div>

              <div>
                <div className="text-center mb-8 border-b border-white/5 pb-8">
                  <span className="material-icons-outlined text-5xl text-gray-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-3">lock</span>
                  <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest mb-2">URNA PRETA</h3>
                  <div className="text-sm text-yellow-500 font-bold uppercase tracking-widest mb-4">100 ENVELOPES MISTERIOSOS</div>
                  <div className="inline-block bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-gray-300">
                    3 vouchers = 1 retirada
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-4">Prêmios Possíveis:</h4>
                  <ul className="space-y-3">
                    {[
                      "Vagas para o The Chosen 30K",
                      "Créditos Chip Race",
                      "Dinheiro vivo",
                      "Prêmios promocionais"
                    ].map((prize, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                        <span className="material-icons text-xs text-yellow-500">circle</span>
                        <span>{prize}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-4">Distribuição das Chances:</h4>
                  <div className="space-y-4">
                    {[
                      { percent: "20%", label: "Vaga The Chosen 30K", color: "bg-yellow-500" },
                      { percent: "20%", label: "Créditos Chip Race R$30–100", color: "bg-gray-400" },
                      { percent: "20%", label: "Créditos Chip Race R$100–200", color: "bg-gray-500" },
                      { percent: "20%", label: "Créditos Chip Race R$200–300", color: "bg-gray-600" },
                      { percent: "20%", label: "Dinheiro vivo R$50–500", color: "bg-emerald-600" }
                    ].map((dist, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                          <span>{dist.label}</span>
                          <span className="text-white">{dist.percent}</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div className={`h-full ${dist.color}`} style={{ width: dist.percent }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* GOLDEN URN CARD */}
            <div className="relative bg-gradient-to-b from-[#1c160c] to-black border-2 border-yellow-500/50 rounded-[2.5rem] p-8 lg:p-12 flex flex-col justify-between transition-all duration-300 shadow-[0_0_40px_rgba(250,204,21,0.12)] hover:border-yellow-400 hover:shadow-[0_0_50px_rgba(250,204,21,0.25)] group">
              
              {/* Glowing golden HUD corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500 rounded-tl-lg pointer-events-none shadow-[0_0_5px_#f59e0b]"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500 rounded-tr-lg pointer-events-none shadow-[0_0_5px_#f59e0b]"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500 rounded-bl-lg pointer-events-none shadow-[0_0_5px_#f59e0b]"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500 rounded-br-lg pointer-events-none shadow-[0_0_5px_#f59e0b]"></div>

              <div>
                <div className="text-center mb-8 border-b border-yellow-500/10 pb-8">
                  <span className="material-icons-outlined text-5xl text-yellow-500 drop-shadow-[0_0_20px_rgba(250,204,21,0.95)] mb-3 animate-pulse">lock_open</span>
                  <h3 className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-600 uppercase tracking-widest mb-2">URNA DOURADA</h3>
                  <div className="text-sm text-yellow-500/80 font-bold uppercase tracking-widest mb-4">A ELITE DO JACKPOT (10 ENVELOPES)</div>
                  <div className="inline-block bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-yellow-400">
                    10 vouchers = 1 retirada
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-4">Prêmios de Altíssima Raridade:</h4>
                  <ul className="space-y-3">
                    {[
                      "Vagas para o The Chosen 30K",
                      "Premiação massiva em dinheiro vivo",
                      "Envelopes altamente limitados e exclusivos"
                    ].map((prize, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-gray-200 font-medium">
                        <span className="material-icons text-xs text-yellow-500 drop-shadow-[0_0_4px_#f59e0b]">circle</span>
                        <span>{prize}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-4">Distribuição da Urna de Elite:</h4>
                  <div className="space-y-4">
                    {[
                      { percent: "30%", label: "Vaga The Chosen 30K", color: "bg-gradient-to-r from-yellow-600 to-yellow-400" },
                      { percent: "70%", label: "Dinheiro vivo R$200–2.000", color: "bg-gradient-to-r from-emerald-500 to-emerald-300" }
                    ].map((dist, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-yellow-500/70">
                          <span>{dist.label}</span>
                          <span className="text-white font-black">{dist.percent}</span>
                        </div>
                        <div className="h-2 bg-yellow-500/5 rounded-full overflow-hidden border border-yellow-500/20">
                          <div className={`h-full ${dist.color}`} style={{ width: dist.percent }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* REGRAS TEXAS HOLD'EM */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-wider mb-4">
              REGRAS – TEXAS HOLD'EM
            </h2>
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mb-6"></div>
            
            <div className="inline-flex flex-wrap items-center justify-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-3 max-w-xl mx-auto">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-2">
                <span className="material-icons-outlined text-yellow-500 text-xs">done</span> Apenas Eventos ao Vivo
              </span>
              <span className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-2">
                <span className="material-icons-outlined text-yellow-500 text-xs">done</span> 2 Cartas da Mão
              </span>
              <span className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-2">
                <span className="material-icons-outlined text-yellow-500 text-xs">done</span> Torneios & Cash Games
              </span>
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-[#0d0a14]/60 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-6 font-display font-black text-xs uppercase tracking-widest text-yellow-500">MÃO ELEGÍVEL</th>
                  <th className="p-6 font-display font-black text-xs uppercase tracking-widest text-yellow-500 text-center">RECOMPENSA</th>
                  <th className="p-6 font-display font-black text-xs uppercase tracking-widest text-yellow-500 text-right">EXEMPLO VISUAL</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    hand: "FULL HOUSE DO MÊS",
                    desc: "Trinca usando o número do mês atual (Ex: Trinca de 5 no mês de Maio)",
                    reward: "1 Voucher",
                    cards: "AA-555"
                  },
                  {
                    hand: "POKER (Quadra)",
                    desc: "Quatro cartas do mesmo valor com 2 hole cards",
                    reward: "2 Vouchers",
                    cards: "KKKK"
                  },
                  {
                    hand: "POKER DO MÊS (Quadra do Mês)",
                    desc: "Quadra formada pelo valor numérico correspondente ao mês atual",
                    reward: "3 Vouchers",
                    cards: "5555"
                  },
                  {
                    hand: "STRAIGHT FLUSH",
                    desc: "Cinco cartas em sequência e do mesmo naipe",
                    reward: "4 Vouchers",
                    cards: "6-7-8-9-10♣"
                  },
                  {
                    hand: "ROYAL STRAIGHT FLUSH",
                    desc: "A sequência máxima (A-K-Q-J-10) do mesmo naipe",
                    reward: "5 Vouchers",
                    cards: "A-K-Q-J-10♦"
                  }
                ].map((row, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="p-6">
                      <div className="font-display font-bold text-white text-base">{row.hand}</div>
                      <div className="text-xs text-gray-400 mt-1 font-light leading-relaxed">{row.desc}</div>
                    </td>
                    <td className="p-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 font-display font-black text-xs tracking-wider uppercase">
                        <span className="material-icons text-xs">confirmation_number</span> {row.reward}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="font-mono text-xs text-yellow-500/70 tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                        {row.cards}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* REGRAS OMAHA 4 CARTAS */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-wider mb-4">
              REGRAS – OMAHA 4 CARTAS
            </h2>
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mb-6"></div>
            
            <div className="inline-flex items-center bg-red-950/20 border border-red-500/30 rounded-2xl px-6 py-3 max-w-2xl mx-auto">
              <span className="text-xs uppercase tracking-wider text-red-400 font-bold flex items-center gap-2">
                <span className="material-icons-outlined text-xs">warning</span> ATENÇÃO: Regra de Omaha exige exatamente 2 cartas da mão e 3 do board, com exceção do poker de mão.
              </span>
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-[#0d0a14]/60 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-6 font-display font-black text-xs uppercase tracking-widest text-yellow-500">MÃO ELEGÍVEL</th>
                  <th className="p-6 font-display font-black text-xs uppercase tracking-widest text-yellow-500 text-center">RECOMPENSA</th>
                  <th className="p-6 font-display font-black text-xs uppercase tracking-widest text-yellow-500 text-right">EXEMPLO VISUAL</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    hand: "POKER (Quadra)",
                    desc: "Quadra tradicional, utilizando 2 cartas da mão",
                    reward: "1 Voucher",
                    cards: "QQQQ"
                  },
                  {
                    hand: "POKER DO MÊS (Quadra do Mês)",
                    desc: "Quadra com valor igual ao número do mês corrente",
                    reward: "2 Vouchers",
                    cards: "5555"
                  },
                  {
                    hand: "STRAIGHT FLUSH",
                    desc: "Sequência de mesmo naipe combinando mão e board",
                    reward: "3 Vouchers",
                    cards: "4-5-6-7-8♠"
                  },
                  {
                    hand: "ROYAL STRAIGHT FLUSH",
                    desc: "Royal Flush em Omaha 4 cartas",
                    reward: "4 Vouchers",
                    cards: "A-K-Q-J-10♥"
                  },
                  {
                    hand: "POKER NA MÃO",
                    desc: "Receber 4 cartas iguais pré-flop na própria mão",
                    reward: "5 Vouchers",
                    cards: "JJJJ na mão"
                  }
                ].map((row, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="p-6">
                      <div className="font-display font-bold text-white text-base">{row.hand}</div>
                      <div className="text-xs text-gray-400 mt-1 font-light leading-relaxed">{row.desc}</div>
                    </td>
                    <td className="p-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 font-display font-black text-xs tracking-wider uppercase">
                        <span className="material-icons text-xs">confirmation_number</span> {row.reward}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="font-mono text-xs text-yellow-500/70 tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                        {row.cards}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* MULTIPLIERS SECTION */}
        <section className="mb-32 text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#17130c] via-black to-[#17130c] border border-yellow-500/25 rounded-[3rem] p-10 lg:p-16 shadow-[0_0_40px_rgba(250,204,21,0.06)] relative overflow-hidden">
            
            {/* Ambient gold dots */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <span className="material-icons text-yellow-500 text-6xl drop-shadow-[0_0_15px_#f59e0b] mb-4">
              military_tech
            </span>

            <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-wider mb-6">
              MULTIPLICADORES
            </h2>

            <p className="text-gray-400 font-body font-light max-w-xl mx-auto text-base md:text-lg leading-relaxed mb-12">
              Eventos especiais podem ativar multiplicadores de vouchers. Isso permite que uma única mão gerada gere recompensas massivas!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-xl mx-auto">
              {[
                { mult: "1x", theme: "border-gray-500/20 text-gray-400 bg-white/5" },
                { mult: "3x", theme: "border-[#00e0ff]/30 text-[#00e0ff] bg-[#00e0ff]/5 shadow-[0_0_15px_rgba(0,224,255,0.15)]" },
                { mult: "10x", theme: "border-yellow-500/50 text-yellow-400 bg-yellow-500/5 shadow-[0_0_25px_rgba(250,204,21,0.3)] animate-bounce" }
              ].map((m, idx) => (
                <div key={idx} className={`border rounded-2xl py-6 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 ${m.theme}`}>
                  <span className="font-display font-black text-3xl sm:text-4xl">{m.mult}</span>
                  <span className="text-[9px] uppercase tracking-wider mt-1.5 font-bold">MULTIPLICADOR</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COELHO SECTION */}
        <section className="mb-32">
          <div className="max-w-5xl mx-auto bg-gradient-to-b from-[#1b0816] to-[#040206] border-2 border-purple-500/20 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-40 h-56 shrink-0 relative perspective">
              {/* Rabbit mystical card style */}
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#2e0924] to-black border-2 border-purple-500/50 p-3 flex flex-col justify-between shadow-[0_0_35px_rgba(168,85,247,0.3)] animate-pulse">
                <div className="flex justify-between items-center">
                  <span className="text-xl">🐇</span>
                  <span className="text-[9px] font-display font-black text-purple-400 uppercase tracking-widest">Coelho Card</span>
                </div>
                <div className="text-center">
                  <span className="material-icons text-purple-400 text-6xl">blur_on</span>
                </div>
                <div className="text-center font-display font-black text-sm text-purple-300 uppercase tracking-widest">
                  MegaNutz
                </div>
              </div>
            </div>

            <div>
              <div className="inline-block bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                MECÂNICA EXCLUSIVA
              </div>
              <h2 className="text-2xl sm:text-4xl font-display font-black text-white uppercase tracking-wider mb-4">
                A CARTA DO COELHO 🐇
              </h2>
              <p className="text-gray-300 font-body text-base leading-relaxed mb-6 font-light">
                A <strong>MegaNutz do COELHO</strong> permite revelar as cartas que viriam no <strong>board</strong>.
              </p>
              <p className="text-gray-400 font-body text-sm sm:text-base leading-relaxed font-light">
                Se algum jogador ainda possuir suas cartas ativas e a continuação simulada do board formar uma jogada elegível, ele também poderá ganhar vouchers do <strong>Mystery Jackpot</strong> de forma retroativa na rodada!
              </p>
            </div>
          </div>
        </section>

        {/* IMPORTANT RULES SECTION */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-wider mb-4">
              REGRAS IMPORTANTES
            </h2>
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              "O jogador deve aderir ao Mystery Jackpot no evento.",
              "A participação ocorre via taxa adicional ou MegaNutz especial.",
              "Vouchers acumulam durante todo o período vigente da temporada.",
              "Novos prêmios promocionais podem ser adicionados sem aviso prévio.",
              "Os vouchers são entregues automaticamente na conta do jogador."
            ].map((rule, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex gap-4 shadow-md transition-all hover:border-yellow-500/25">
                <span className="material-icons-outlined text-yellow-500 text-lg shrink-0">check_circle</span>
                <p className="text-xs sm:text-sm text-gray-400 font-light leading-relaxed">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL SECTION */}
        <section className="text-center border-t border-white/5 pt-20">
          <blockquote className="font-display font-black italic text-2xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-600 tracking-wider mb-4 drop-shadow-[0_0_10px_rgba(250,204,21,0.2)]">
            “Algumas mãos valem mais do que fichas.”
          </blockquote>
          <p className="text-[10px] uppercase font-display font-black text-gray-500 tracking-[0.3em] mt-4">
            Chip Race 2026
          </p>
        </section>

      </div>
    </div>
  );
};
