import React, { useState, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  SpecialEvent, EventSection, EventSectionType,
  TournamentCard, ScheduleItem, PrizeItem, EventNavButton
} from '../../types';

// ── Helpers ────────────────────────────────────────────────────────────────
const newId = () => crypto.randomUUID();

const COLOR_OPTIONS = [
  { value: 'primary',   label: 'Pink — Destaque' },
  { value: 'secondary', label: 'Azul — Chip Race' },
  { value: 'green',     label: 'Verde — Sucesso' },
  { value: 'amber',     label: 'Âmbar — Gold' },
  { value: 'red',       label: 'Vermelho — Alerta' },
  { value: 'cyan',      label: 'Ciano — Neon' },
  { value: 'purple',    label: 'Roxo — Luxury' },
];

const ICON_SUGGESTIONS = [
  'celebration','stars','bolt','local_activity','casino','military_tech',
  'emoji_events','sports_esports','restaurant','local_bar','groups',
  'workspace_premium','auto_awesome','diamond','shield','whatshot',
];

const INTERNAL_VIEWS = [
  { value: 'home',               label: 'Início (Home)' },
  { value: 'calendar',           label: 'Calendário de Eventos' },
  { value: 'ranking',            label: 'Rankings' },
  { value: 'vip',                label: 'Área VIP' },
  { value: 'recarga',            label: 'Recargas & Chipz' },
  { value: 'the-chosen-details', label: 'The Chosen' },
  { value: 'online-credits',     label: 'Créditos Online' },
  { value: 'profile',            label: 'Perfil do Jogador' },
  { value: 'roadmap',            label: 'Roadmap' },
  { value: 'register',           label: 'Registro / Login' },
  { value: 'rules',              label: 'Regras do Clube' },
  { value: 'terms',              label: 'Termos de Uso' },
  { value: 'privacy',            label: 'Política de Privacidade' },
];

const SECTION_META: Record<EventSectionType, { label: string; icon: string; description: string }> = {
  header:           { label: 'Cabeçalho com Fundo',   icon: 'title',           description: 'Hero da página com título, subtítulo e imagem de fundo' },
  info_block:       { label: 'Bloco de Destaque',      icon: 'info',            description: 'Caixa colorida para destaques e avisos importantes' },
  tournament_cards: { label: 'Cards de Torneios',      icon: 'style',           description: 'Grid de cards para listar eventos ou modalidades' },
  countdown:        { label: 'Contagem Regressiva',    icon: 'timer',           description: 'Timer em tempo real até a data do evento' },
  schedule:         { label: 'Programação / Datas',    icon: 'calendar_today',  description: 'Tabela de cronograma com datas, horas e descrições' },
  prize_table:      { label: 'Tabela de Premiação',    icon: 'emoji_events',    description: 'Listagem de prêmios por posição de colocação' },
  cta_button:       { label: 'Botão de Ação (CTA)',    icon: 'touch_app',       description: 'Botão de destaque para conversão (inscrição, WhatsApp, etc.)' },
  rich_text:        { label: 'Texto Livre / Markdown', icon: 'notes',           description: 'Bloco de texto com suporte a formatação básica' },
  image_banner:     { label: 'Banner de Imagem',       icon: 'image',           description: 'Imagem horizontal em destaque (patrocinadores, flyer, etc.)' },
  nav_buttons:      { label: 'Botões de Navegação',    icon: 'navigation',      description: 'Grid de botões que linkam para outras páginas internas/externas' },
};

const defaultSection = (type: EventSectionType): EventSection => ({
  id: newId(),
  type,
  enabled: true,
  order: 0,
  data: {
    ...(type === 'tournament_cards' ? { cards: [{ name: '', description: '', dates: '', icon: 'style', color: 'primary' }] } : {}),
    ...(type === 'schedule'         ? { items: [{ date: '', time: '', description: '' }] } : {}),
    ...(type === 'prize_table'      ? { prizes: [{ position: '1º Lugar', prize: '' }] } : {}),
    ...(type === 'nav_buttons'      ? { nav_buttons: [{ label: '', view: 'home', icon: 'link', color: 'primary', is_external: false }], nav_buttons_title: '' } : {}),
    ...(type === 'info_block'       ? { block_title: '', block_text: '', block_color: 'primary' } : {}),
    ...(type === 'countdown'        ? { countdown_title: 'CONTAGEM REGRESSIVA', target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() } : {}),
    ...(type === 'cta_button'       ? { btn_text: 'SAIBA MAIS', btn_color: 'primary', btn_action_type: 'internal', btn_action: 'home', btn_icon: 'arrow_forward' } : {}),
    ...(type === 'header'           ? { title: '', subtitle: '', background_image: '' } : {}),
    ...(type === 'rich_text'        ? { text: '' } : {}),
    ...(type === 'image_banner'     ? { image_url: '', image_alt: '' } : {}),
  },
});

const emptyEvent = (): SpecialEvent => ({
  id: newId(), slug: '', title: '', subtitle: '', status: 'active',
  theme_color: 'primary', icon: 'celebration', nav_label: '',
  hero_enabled: true, hero_order: 1, hero_cta_text: 'SAIBA MAIS', sections: [],
});

// ── UI Primitives ───────────────────────────────────────────────────────────
const inputCls = 'w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all placeholder-white/20';
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2';

const Fl: React.FC<{ label: string; children: React.ReactNode; wide?: boolean; hint?: string }> = ({ label, children, wide, hint }) => (
  <div className={wide ? 'col-span-full' : ''}>
    <label className={labelCls}>{label}</label>
    {children}
    {hint && <p className="mt-1.5 text-[10px] text-gray-600">{hint}</p>}
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
  <div className="flex items-center gap-3">
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all ${checked ? 'bg-primary shadow-neon-pink' : 'bg-white/10'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${checked ? 'left-6' : 'left-1'}`} />
    </button>
    {label && <span className="text-xs text-gray-400">{label}</span>}
  </div>
);

const StatusBadge: React.FC<{ status: SpecialEvent['status'] }> = ({ status }) => {
  const map = { active: 'bg-green-500/15 text-green-400 border-green-500/30', inactive: 'bg-gray-500/15 text-gray-400 border-gray-500/30', expired: 'bg-red-500/15 text-red-400 border-red-500/30' };
  const lbl = { active: 'Ativo', inactive: 'Inativo', expired: 'Expirado' };
  return <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${map[status]}`}>{lbl[status]}</span>;
};

const ColorDot: React.FC<{ color: string }> = ({ color }) => {
  const map: Record<string, string> = {
    primary: '#e91e8c', secondary: '#00b4d8', green: '#22c55e',
    amber: '#f59e0b', red: '#ef4444', cyan: '#06b6d4', purple: '#a855f7',
  };
  return <span className="inline-block w-3 h-3 rounded-full mr-2 opacity-80" style={{ background: map[color] || '#888' }} />;
};

// ── Section Editor ──────────────────────────────────────────────────────────
const SectionEditor: React.FC<{
  section: EventSection;
  index: number;
  total: number;
  onChange: (s: EventSection) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}> = ({ section, index, total, onChange, onRemove, onMoveUp, onMoveDown }) => {
  const [open, setOpen] = useState(false);
  const meta = SECTION_META[section.type];

  const upd = useCallback((data: Partial<typeof section.data>) =>
    onChange({ ...section, data: { ...section.data, ...data } }), [section, onChange]);

  // Card helpers
  const updCard = (i: number, field: keyof TournamentCard, val: string) => {
    const cards = [...(section.data.cards || [])];
    cards[i] = { ...cards[i], [field]: val };
    upd({ cards });
  };
  const addCard = () => upd({ cards: [...(section.data.cards || []), { name: '', description: '', dates: '', icon: 'style', color: 'primary' }] });
  const remCard = (i: number) => upd({ cards: (section.data.cards || []).filter((_, j) => j !== i) });
  const moveCard = (i: number, dir: -1 | 1) => {
    const cards = [...(section.data.cards || [])];
    const j = i + dir;
    if (j >= 0 && j < cards.length) { [cards[i], cards[j]] = [cards[j], cards[i]]; upd({ cards }); }
  };

  // Schedule helpers
  const updItem = (i: number, field: keyof ScheduleItem, val: string) => {
    const items = [...(section.data.items || [])];
    items[i] = { ...items[i], [field]: val };
    upd({ items });
  };
  const addItem = () => upd({ items: [...(section.data.items || []), { date: '', time: '', description: '' }] });
  const remItem = (i: number) => upd({ items: (section.data.items || []).filter((_, j) => j !== i) });

  // Prize helpers
  const updPrize = (i: number, field: keyof PrizeItem, val: string) => {
    const prizes = [...(section.data.prizes || [])];
    prizes[i] = { ...prizes[i], [field]: val };
    upd({ prizes });
  };
  const addPrize = () => upd({ prizes: [...(section.data.prizes || []), { position: `${(section.data.prizes || []).length + 1}º Lugar`, prize: '' }] });
  const remPrize = (i: number) => upd({ prizes: (section.data.prizes || []).filter((_, j) => j !== i) });

  // NavButton helpers
  const updNav = (i: number, field: keyof EventNavButton, val: any) => {
    const navBtns = [...(section.data.nav_buttons || [])];
    navBtns[i] = { ...navBtns[i], [field]: val };
    upd({ nav_buttons: navBtns });
  };
  const addNavBtn = () => upd({ nav_buttons: [...(section.data.nav_buttons || []), { label: '', view: 'home', icon: 'link', color: 'primary', is_external: false }] });
  const remNavBtn = (i: number) => upd({ nav_buttons: (section.data.nav_buttons || []).filter((_, j) => j !== i) });

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${section.enabled ? 'border-white/10 bg-white/[0.025]' : 'border-white/5 bg-transparent opacity-40'}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Order controls */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button onClick={onMoveUp} disabled={index === 0}
            className="w-6 h-5 flex items-center justify-center rounded text-gray-600 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all">
            <span className="material-icons-outlined text-xs">expand_less</span>
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="w-6 h-5 flex items-center justify-center rounded text-gray-600 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all">
            <span className="material-icons-outlined text-xs">expand_more</span>
          </button>
        </div>

        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
          <span className="material-icons-outlined text-gray-400 text-sm">{meta.icon}</span>
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setOpen(o => !o)}>
          <p className="text-xs font-black uppercase tracking-wider text-gray-200 truncate">{meta.label}</p>
          <p className="text-[10px] text-gray-600 truncate">{meta.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Toggle checked={section.enabled} onChange={v => onChange({ ...section, enabled: v })} />
          <button onClick={onRemove} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
            <span className="material-icons-outlined text-sm">delete</span>
          </button>
          <button onClick={() => setOpen(o => !o)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-white rounded-lg transition-all">
            <span className="material-icons-outlined text-sm">{open ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-white/5 space-y-4">

          {/* ── HEADER ── */}
          {section.type === 'header' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Fl label="Título Principal">
                <input className={inputCls} value={section.data.title || ''} onChange={e => upd({ title: e.target.value })} placeholder="Ex: A FESTA DA ALEGRIA" />
              </Fl>
              <Fl label="Subtítulo">
                <input className={inputCls} value={section.data.subtitle || ''} onChange={e => upd({ subtitle: e.target.value })} placeholder="Ex: Torneio de Poker Oktober 2026" />
              </Fl>
              <Fl label="URL da Imagem de Fundo" wide hint="Use links de imagens públicos (JPEG/PNG/WEBP)">
                <input className={inputCls} value={section.data.background_image || ''} onChange={e => upd({ background_image: e.target.value })} placeholder="https://..." />
                {section.data.background_image && (
                  <div className="mt-3 rounded-2xl overflow-hidden relative h-28">
                    <img src={section.data.background_image} alt="preview" className="w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute bottom-2 left-3 text-[10px] text-white/60 font-black uppercase">Preview</p>
                  </div>
                )}
              </Fl>
            </div>
          )}

          {/* ── INFO BLOCK ── */}
          {section.type === 'info_block' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Fl label="Título do Bloco">
                <input className={inputCls} value={section.data.block_title || ''} onChange={e => upd({ block_title: e.target.value })} placeholder="Ex: R$ 50.000 GARANTIDOS" />
              </Fl>
              <Fl label="Cor da Borda">
                <select className={inputCls} value={section.data.block_color || 'primary'} onChange={e => upd({ block_color: e.target.value })}>
                  {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Fl>
              <Fl label="Texto / Descrição" wide>
                <textarea rows={4} className={inputCls + ' resize-none'}
                  value={section.data.block_text || ''}
                  onChange={e => upd({ block_text: e.target.value })}
                  placeholder="Descreva o destaque do evento aqui..." />
              </Fl>
            </div>
          )}

          {/* ── TOURNAMENT CARDS ── */}
          {section.type === 'tournament_cards' && (
            <div className="mt-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {(section.data.cards || []).length} card(s) — mínimo 1, máximo recomendado 3
              </p>
              {(section.data.cards || []).map((card, i) => (
                <div key={i} className="bg-black/30 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase text-gray-500">Card #{i + 1}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveCard(i, -1)} disabled={i === 0} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-white disabled:opacity-20 transition-colors">
                        <span className="material-icons-outlined text-xs">arrow_upward</span>
                      </button>
                      <button onClick={() => moveCard(i, 1)} disabled={i === (section.data.cards || []).length - 1} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-white disabled:opacity-20 transition-colors">
                        <span className="material-icons-outlined text-xs">arrow_downward</span>
                      </button>
                      <button onClick={() => remCard(i)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors">
                        <span className="material-icons-outlined text-xs">close</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Fl label="Nome do Torneio">
                      <input className={inputCls} value={card.name} onChange={e => updCard(i, 'name', e.target.value)} placeholder="Ex: Main Event" />
                    </Fl>
                    <Fl label="Ícone (Material Icons)" hint="casino, bolt, stars...">
                      <input className={inputCls} value={card.icon} onChange={e => updCard(i, 'icon', e.target.value)} placeholder="casino" />
                    </Fl>
                    <Fl label="Datas">
                      <input className={inputCls} value={card.dates} onChange={e => updCard(i, 'dates', e.target.value)} placeholder="Ex: 12 de Out, 20h" />
                    </Fl>
                    <Fl label="Cor do Card">
                      <select className={inputCls} value={card.color} onChange={e => updCard(i, 'color', e.target.value)}>
                        {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}><ColorDot color={c.value} />{c.label}</option>)}
                      </select>
                    </Fl>
                    <Fl label="Descrição / Buy-in / Premiação" wide>
                      <textarea rows={2} className={inputCls + ' resize-none'} value={card.description} onChange={e => updCard(i, 'description', e.target.value)} placeholder="Ex: Buy-in R$ 150 — R$ 10k Garantidos" />
                    </Fl>
                  </div>
                </div>
              ))}
              <button onClick={addCard}
                className="w-full py-3 border border-dashed border-white/10 rounded-2xl text-gray-500 hover:text-white hover:border-white/20 text-xs font-black uppercase flex items-center justify-center gap-2 transition-all">
                <span className="material-icons-outlined text-sm">add</span> Adicionar Card de Torneio
              </button>
            </div>
          )}

          {/* ── COUNTDOWN ── */}
          {section.type === 'countdown' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Fl label="Título da Contagem">
                <input className={inputCls} value={section.data.countdown_title || ''} onChange={e => upd({ countdown_title: e.target.value })} placeholder="Ex: CONTAGEM REGRESSIVA" />
              </Fl>
              <Fl label="Data e Hora Alvo">
                <input type="datetime-local" className={inputCls}
                  value={(section.data.target_date || '').slice(0, 16)}
                  onChange={e => { try { upd({ target_date: new Date(e.target.value).toISOString() }); } catch { } }} />
              </Fl>
              {section.data.target_date && (
                <div className="col-span-full bg-black/30 rounded-xl px-4 py-2 text-[11px] text-gray-400">
                  → ISO: <span className="text-gray-300 font-mono">{section.data.target_date}</span>
                </div>
              )}
            </div>
          )}

          {/* ── SCHEDULE ── */}
          {section.type === 'schedule' && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                {(section.data.items || []).length} linha(s)
              </p>
              {(section.data.items || []).map((item, i) => (
                <div key={i} className="bg-black/30 rounded-xl p-3 border border-white/5 grid grid-cols-[100px_90px_1fr_28px] gap-2 items-center">
                  <div>
                    <label className={labelCls}>Data</label>
                    <input className={inputCls} value={item.date} onChange={e => updItem(i, 'date', e.target.value)} placeholder="01/10" />
                  </div>
                  <div>
                    <label className={labelCls}>Hora</label>
                    <input className={inputCls} value={item.time} onChange={e => updItem(i, 'time', e.target.value)} placeholder="20:00" />
                  </div>
                  <div>
                    <label className={labelCls}>Descrição</label>
                    <input className={inputCls} value={item.description} onChange={e => updItem(i, 'description', e.target.value)} placeholder="Ex: Abertura e Satélite Turbo" />
                  </div>
                  <button onClick={() => remItem(i)} className="mt-5 w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10">
                    <span className="material-icons-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
              <button onClick={addItem}
                className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-gray-500 hover:text-white text-xs font-black uppercase flex items-center justify-center gap-2 transition-all">
                <span className="material-icons-outlined text-sm">add</span> Adicionar Horário
              </button>
            </div>
          )}

          {/* ── PRIZE TABLE ── */}
          {section.type === 'prize_table' && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                {(section.data.prizes || []).length} faixa(s) de premiação
              </p>
              {(section.data.prizes || []).map((row, i) => (
                <div key={i} className="bg-black/30 rounded-xl p-3 border border-white/5 grid grid-cols-[1fr_1fr_28px] gap-2 items-end">
                  <Fl label="Posição">
                    <input className={inputCls} value={row.position} onChange={e => updPrize(i, 'position', e.target.value)} placeholder="1º Lugar" />
                  </Fl>
                  <Fl label="Prêmio">
                    <input className={inputCls} value={row.prize} onChange={e => updPrize(i, 'prize', e.target.value)} placeholder="R$ 25.000" />
                  </Fl>
                  <button onClick={() => remPrize(i)} className="mb-0.5 w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10">
                    <span className="material-icons-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
              <button onClick={addPrize}
                className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-gray-500 hover:text-white text-xs font-black uppercase flex items-center justify-center gap-2 transition-all">
                <span className="material-icons-outlined text-sm">add</span> Adicionar Faixa de Prêmio
              </button>
            </div>
          )}

          {/* ── CTA BUTTON ── */}
          {section.type === 'cta_button' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Fl label="Texto do Botão">
                <input className={inputCls} value={section.data.btn_text || ''} onChange={e => upd({ btn_text: e.target.value })} placeholder="Ex: INSCREVA-SE AGORA" />
              </Fl>
              <Fl label="Ícone (Material Icons)" hint="arrow_forward, whatsapp, local_activity...">
                <input className={inputCls} value={section.data.btn_icon || ''} onChange={e => upd({ btn_icon: e.target.value })} placeholder="arrow_forward" />
              </Fl>
              <Fl label="Cor do Botão">
                <select className={inputCls} value={section.data.btn_color || 'primary'} onChange={e => upd({ btn_color: e.target.value })}>
                  {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Fl>
              <Fl label="Tipo de Destino">
                <select className={inputCls} value={section.data.btn_action_type || 'internal'} onChange={e => upd({ btn_action_type: e.target.value as any })}>
                  <option value="internal">Página Interna do App</option>
                  <option value="url">URL Externa (WhatsApp, site...)</option>
                </select>
              </Fl>
              <Fl label={section.data.btn_action_type === 'url' ? 'URL Externa' : 'Página Destino'} wide>
                {section.data.btn_action_type === 'url'
                  ? <input className={inputCls} value={section.data.btn_action || ''} onChange={e => upd({ btn_action: e.target.value })} placeholder="https://wa.me/..." />
                  : <select className={inputCls} value={section.data.btn_action || 'home'} onChange={e => upd({ btn_action: e.target.value })}>
                      {INTERNAL_VIEWS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                }
              </Fl>
              {/* Preview */}
              {section.data.btn_text && (
                <div className="col-span-full">
                  <label className={labelCls}>Preview do Botão</label>
                  <button className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest text-white pointer-events-none`}
                    style={{ background: { primary: '#e91e8c', secondary: '#00b4d8', green: '#22c55e', amber: '#f59e0b', red: '#ef4444', cyan: '#06b6d4', purple: '#a855f7' }[section.data.btn_color || 'primary'] || '#e91e8c' }}>
                    {section.data.btn_icon && <span className="material-icons-outlined text-sm">{section.data.btn_icon}</span>}
                    {section.data.btn_text}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── RICH TEXT ── */}
          {section.type === 'rich_text' && (
            <div className="mt-4 space-y-3">
              <Fl label="Conteúdo de Texto" hint="Suporta quebras de linha. Use # para títulos, ** para negrito, - para listas.">
                <textarea rows={8} className={inputCls + ' resize-y font-mono text-[13px]'}
                  value={section.data.text || ''}
                  onChange={e => upd({ text: e.target.value })}
                  placeholder={"### Regulamento\n\n1. Regra número 1\n2. Regra número 2\n\n**Importante:** Todos os jogadores devem..."} />
              </Fl>
              {section.data.text && (
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">Preview (linhas)</p>
                  {section.data.text.split('\n').map((line, i) => (
                    <p key={i} className={`text-gray-300 text-sm leading-relaxed ${line.startsWith('#') ? 'font-black text-white mt-2' : ''}`}>
                      {line || <span>&nbsp;</span>}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── IMAGE BANNER ── */}
          {section.type === 'image_banner' && (
            <div className="mt-4 space-y-3">
              <Fl label="URL da Imagem (1200×400 recomendado)" hint="Prefira imagens largas e horizontais">
                <input className={inputCls} value={section.data.image_url || ''} onChange={e => upd({ image_url: e.target.value })} placeholder="https://..." />
              </Fl>
              <Fl label="Texto Alternativo (acessibilidade / SEO)">
                <input className={inputCls} value={section.data.image_alt || ''} onChange={e => upd({ image_alt: e.target.value })} placeholder="Ex: Banner de Patrocinadores" />
              </Fl>
              {section.data.image_url && (
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <img src={section.data.image_url} alt={section.data.image_alt || 'preview'} className="w-full h-40 object-cover opacity-80" />
                </div>
              )}
            </div>
          )}

          {/* ── NAV BUTTONS ── */}
          {section.type === 'nav_buttons' && (
            <div className="mt-4 space-y-4">
              <Fl label="Título da Seção de Botões (opcional)">
                <input className={inputCls} value={section.data.nav_buttons_title || ''} onChange={e => upd({ nav_buttons_title: e.target.value })} placeholder="Ex: EXPLORE MAIS" />
              </Fl>
              <div className="space-y-2">
                {(section.data.nav_buttons || []).map((btn, i) => (
                  <div key={i} className="bg-black/30 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase text-gray-500">Botão #{i + 1}</span>
                      <button onClick={() => remNavBtn(i)} className="text-gray-600 hover:text-red-500 transition-colors">
                        <span className="material-icons-outlined text-sm">close</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Fl label="Texto do Botão">
                        <input className={inputCls} value={btn.label} onChange={e => updNav(i, 'label', e.target.value)} placeholder="Ex: Ver Ranking" />
                      </Fl>
                      <Fl label="Ícone (Material Icons)" hint="calendar_month, star, group...">
                        <input className={inputCls} value={btn.icon} onChange={e => updNav(i, 'icon', e.target.value)} placeholder="calendar_month" />
                      </Fl>
                      <Fl label="Cor">
                        <select className={inputCls} value={btn.color} onChange={e => updNav(i, 'color', e.target.value)}>
                          {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </Fl>
                      <Fl label="Destino Externo?">
                        <select className={inputCls} value={btn.is_external ? 'true' : 'false'} onChange={e => updNav(i, 'is_external', e.target.value === 'true')}>
                          <option value="false">Não — Página interna</option>
                          <option value="true">Sim — URL externa</option>
                        </select>
                      </Fl>
                      <Fl label={btn.is_external ? 'URL Externa' : 'Página Destino'} wide>
                        {btn.is_external
                          ? <input className={inputCls} value={btn.view} onChange={e => updNav(i, 'view', e.target.value)} placeholder="https://..." />
                          : <select className={inputCls} value={btn.view} onChange={e => updNav(i, 'view', e.target.value)}>
                              {INTERNAL_VIEWS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                            </select>
                        }
                      </Fl>
                    </div>
                  </div>
                ))}
                <button onClick={addNavBtn}
                  className="w-full py-2.5 border border-dashed border-white/10 rounded-2xl text-gray-500 hover:text-white text-xs font-black uppercase flex items-center justify-center gap-2 transition-all">
                  <span className="material-icons-outlined text-sm">add</span> Adicionar Botão de Navegação
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Event Editor ────────────────────────────────────────────────────────────
const EventEditor: React.FC<{
  event: SpecialEvent;
  onChange: (e: SpecialEvent) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}> = ({ event, onChange, onSave, onCancel, isSaving }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'hero' | 'sections'>('general');

  const upd = (fields: Partial<SpecialEvent>) => onChange({ ...event, ...fields });

  const addSection = (type: EventSectionType) => {
    const s = defaultSection(type);
    s.order = event.sections.length;
    upd({ sections: [...event.sections, s] });
  };

  const updSection = (id: string, updated: EventSection) =>
    upd({ sections: event.sections.map(s => s.id === id ? updated : s) });

  const removeSection = (id: string) =>
    upd({ sections: event.sections.filter(s => s.id !== id) });

  const moveSection = (index: number, dir: -1 | 1) => {
    const sorted = [...event.sections].sort((a, b) => a.order - b.order);
    const j = index + dir;
    if (j < 0 || j >= sorted.length) return;
    const newSections = sorted.map((s, i) => {
      if (i === index) return { ...s, order: sorted[j].order };
      if (i === j)     return { ...s, order: sorted[index].order };
      return s;
    });
    upd({ sections: newSections });
  };

  const sortedSections = [...event.sections].sort((a, b) => a.order - b.order);

  const TABS = [
    { id: 'general',  label: 'Geral',      icon: 'tune' },
    { id: 'hero',     label: 'Carrossel',   icon: 'view_carousel' },
    { id: 'sections', label: `Seções (${event.sections.length})`, icon: 'view_module' },
  ] as const;

  const canSave = event.slug.trim() && event.title.trim();

  return (
    <div className="bg-[#06031a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      {/* Tab bar */}
      <div className="flex border-b border-white/10 bg-white/[0.03]">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-300'}`}>
            <span className="material-icons-outlined text-sm">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-6 space-y-5 max-h-[68vh] overflow-y-auto custom-scrollbar">

        {/* ── GENERAL ── */}
        {activeTab === 'general' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Fl label="Título do Evento">
                <input className={inputCls + ' font-bold text-base'} value={event.title} onChange={e => upd({ title: e.target.value })} placeholder="Ex: FENACHIM 2025" />
              </Fl>
              <Fl label="Subtítulo / Tagline">
                <input className={inputCls} value={event.subtitle} onChange={e => upd({ subtitle: e.target.value })} placeholder="Festa Nacional do Chimarrão" />
              </Fl>
              <Fl label="Slug (ID único na URL)" hint="Sem espaços. Será usado em /event-{slug}">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono">event-</span>
                  <input className={inputCls + ' pl-14'} value={event.slug}
                    onChange={e => upd({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    placeholder="oktoberfest-2026" />
                </div>
              </Fl>
              <Fl label="Status">
                <select className={inputCls} value={event.status} onChange={e => upd({ status: e.target.value as any })}>
                  <option value="active">✅ Ativo — Visível no site</option>
                  <option value="inactive">🔇 Inativo — Oculto do site</option>
                  <option value="expired">⌛ Expirado — Encerrado</option>
                </select>
              </Fl>
              <Fl label="Label no Menu de Navegação">
                <input className={inputCls} value={event.nav_label} onChange={e => upd({ nav_label: e.target.value })} placeholder="Ex: FENACHIM" />
              </Fl>
              <Fl label="Ícone do Evento (Material Icons)">
                <input className={inputCls} value={event.icon} onChange={e => upd({ icon: e.target.value })} placeholder="celebration" />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ICON_SUGGESTIONS.map(ic => (
                    <button key={ic} onClick={() => upd({ icon: ic })}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${event.icon === ic ? 'bg-primary/20 border-primary text-primary' : 'border-white/5 text-gray-500 hover:text-white hover:border-white/10'}`}
                      title={ic}>
                      <span className="material-icons-outlined text-sm">{ic}</span>
                    </button>
                  ))}
                </div>
              </Fl>
              <Fl label="Cor Temática do Evento">
                <select className={inputCls} value={event.theme_color} onChange={e => upd({ theme_color: e.target.value })}>
                  {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Fl>
              <Fl label="Expiração Automática (opcional)" hint="O status mudará para 'Expirado' após esta data">
                <input type="date" className={inputCls} value={(event.expires_at || '').slice(0, 10)}
                  onChange={e => upd({ expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
              </Fl>
            </div>
          </div>
        )}

        {/* ── HERO / CARROSSEL ── */}
        {activeTab === 'hero' && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/8">
              <Toggle
                checked={event.hero_enabled}
                onChange={v => upd({ hero_enabled: v })}
                label={event.hero_enabled ? 'Aparece no carrossel da Home' : 'Oculto do carrossel da Home'}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Fl label="Ordem no Carrossel" hint="Menor número = primeiro slide. The Chosen sempre último.">
                <input type="number" className={inputCls} value={event.hero_order}
                  onChange={e => upd({ hero_order: Math.max(0, parseInt(e.target.value) || 0) })} min={0} />
              </Fl>
              <Fl label="Texto do Botão CTA">
                <input className={inputCls} value={event.hero_cta_text}
                  onChange={e => upd({ hero_cta_text: e.target.value })} placeholder="SAIBA MAIS" />
              </Fl>
              <Fl label="Título Override (opcional)" hint="Se preenchido, substitui o título padrão só no slide">
                <input className={inputCls} value={event.hero_title_override || ''}
                  onChange={e => upd({ hero_title_override: e.target.value || undefined })}
                  placeholder={`Default: "${event.title}"`} />
              </Fl>
              <Fl label="Subtítulo Override (opcional)">
                <input className={inputCls} value={event.hero_subtitle_override || ''}
                  onChange={e => upd({ hero_subtitle_override: e.target.value || undefined })}
                  placeholder={`Default: "${event.subtitle}"`} />
              </Fl>
              <Fl label="URL da Imagem de Fundo do Slide" wide hint="Recomendado: 1920×1080px ou superior">
                <input className={inputCls} value={event.hero_background_image || ''}
                  onChange={e => upd({ hero_background_image: e.target.value || undefined })}
                  placeholder="https://..." />
                {event.hero_background_image && (
                  <div className="mt-3 rounded-2xl overflow-hidden relative h-36 border border-white/10">
                    <img src={event.hero_background_image} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                      <div>
                        <p className="text-white text-xs font-black truncate">{event.hero_title_override || event.title}</p>
                        <p className="text-gray-300 text-[10px] truncate">{event.hero_subtitle_override || event.subtitle}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Fl>
            </div>
          </div>
        )}

        {/* ── SECTIONS ── */}
        {activeTab === 'sections' && (
          <div className="space-y-3">
            {sortedSections.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
                <span className="material-icons-outlined text-3xl text-gray-700 mb-2 block">view_module</span>
                <p className="text-gray-600 text-xs font-black uppercase">Nenhuma seção ainda</p>
                <p className="text-gray-700 text-[10px] mt-1">Adicione seções abaixo para montar a página</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedSections.map((section, index) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    index={index}
                    total={sortedSections.length}
                    onChange={updated => updSection(section.id, updated)}
                    onRemove={() => removeSection(section.id)}
                    onMoveUp={() => moveSection(index, -1)}
                    onMoveDown={() => moveSection(index, 1)}
                  />
                ))}
              </div>
            )}

            {/* Add section palette */}
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-3">+ Adicionar Nova Seção</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.entries(SECTION_META) as [EventSectionType, typeof SECTION_META[EventSectionType]][]).map(([type, meta]) => (
                  <button key={type} onClick={() => addSection(type)}
                    className="flex items-center gap-2 px-3 py-3 bg-white/[0.03] border border-white/8 rounded-xl text-left hover:bg-white/[0.06] hover:border-white/15 transition-all group">
                    <span className="material-icons-outlined text-gray-500 text-sm group-hover:text-primary transition-colors">{meta.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase text-gray-400 group-hover:text-white transition-colors leading-tight truncate">{meta.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 p-5 border-t border-white/10 bg-white/[0.02]">
        <button onClick={onCancel}
          className="px-5 py-3 text-gray-400 font-black uppercase text-[10px] tracking-widest border border-white/10 rounded-2xl hover:text-white hover:border-white/20 transition-all">
          Cancelar
        </button>
        <div className="flex-1 text-center">
          {!canSave && <p className="text-[10px] text-yellow-500/70">⚠ Preencha Título e Slug para salvar</p>}
        </div>
        <button onClick={onSave} disabled={isSaving || !canSave}
          className="flex items-center gap-2 px-7 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-neon-pink hover:bg-primary/80 disabled:opacity-40 disabled:shadow-none transition-all">
          <span className="material-icons-outlined text-sm">{isSaving ? 'hourglass_top' : 'save'}</span>
          {isSaving ? 'Salvando...' : 'Salvar Evento'}
        </button>
      </div>
    </div>
  );
};

// ── Main Tab ────────────────────────────────────────────────────────────────
export const EventsTab: React.FC = () => {
  const { contentDB, updateContent } = useApp();
  const specialEventsFromDB: SpecialEvent[] = contentDB.special_events || [];

  const [events, setEvents] = useState<SpecialEvent[]>(specialEventsFromDB);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<SpecialEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setEvents(contentDB.special_events || []);
  }, [contentDB.special_events]);

  const persistEvents = async (updated: SpecialEvent[]) => {
    await updateContent('special_events', '', updated);
  };

  const startNew = () => { const e = emptyEvent(); setEditingEvent(e); setEditingId('__new__'); };
  const startEdit = (id: string) => {
    const found = events.find(e => e.id === id);
    if (found) { setEditingEvent(JSON.parse(JSON.stringify(found))); setEditingId(id); }
  };
  const cancelEdit = () => { setEditingId(null); setEditingEvent(null); };

  const saveEvent = async () => {
    if (!editingEvent) return;
    setIsSaving(true);
    const updated = editingId === '__new__'
      ? [...events, editingEvent]
      : events.map(e => e.id === editingId ? editingEvent : e);
    setEvents(updated);
    await persistEvents(updated);
    setIsSaving(false);
    cancelEdit();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    await persistEvents(updated);
  };

  const toggleStatus = async (id: string) => {
    const updated = events.map(e => e.id === id
      ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' as any } : e);
    setEvents(updated);
    await persistEvents(updated);
  };

  if (editingId && editingEvent) {
    return (
      <div className="animate-in fade-in duration-300 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={cancelEdit} className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-gray-500 hover:text-white hover:border-white/20 transition-all">
            <span className="material-icons-outlined text-base">arrow_back</span>
          </button>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">
              {editingId === '__new__' ? '+ Novo Evento' : `Editando: ${editingEvent.title || 'sem título'}`}
            </h3>
            <p className="text-[10px] text-gray-600 mt-0.5">url: /event-{editingEvent.slug || '…'}</p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={editingEvent.status} />
          </div>
        </div>
        <EventEditor
          event={editingEvent}
          onChange={setEditingEvent}
          onSave={saveEvent}
          onCancel={cancelEdit}
          isSaving={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Eventos Especiais</h3>
          <p className="text-[10px] text-gray-500">Criar, editar e gerenciar páginas de eventos temporários · {events.length} cadastrado(s)</p>
        </div>
        <button onClick={startNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-neon-pink hover:bg-primary/80 transition-all shrink-0">
          <span className="material-icons-outlined text-sm">add</span>
          Novo Evento
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl">
          <span className="material-icons-outlined text-4xl text-gray-700 mb-3 block">event_busy</span>
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Nenhum evento cadastrado</p>
          <button onClick={startNew}
            className="mt-4 px-6 py-2.5 bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/30 transition-colors">
            Criar Primeiro Evento
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map(evt => (
            <div key={evt.id}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${evt.status === 'active' ? 'border-white/10 bg-white/[0.025] hover:bg-white/[0.04]' : 'border-white/5 bg-transparent opacity-50'}`}>

              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <span className="material-icons-outlined text-gray-400">{evt.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-black text-white truncate">{evt.title}</span>
                  <StatusBadge status={evt.status} />
                  {evt.hero_enabled && (
                    <span className="text-[8px] font-black bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Slide #{evt.hero_order}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 truncate">{evt.subtitle}</p>
                <p className="text-[10px] text-gray-700 mt-0.5">
                  /event-{evt.slug} · {evt.sections.filter(s => s.enabled).length}/{evt.sections.length} seções ativas
                  {evt.expires_at && ` · expira ${new Date(evt.expires_at).toLocaleDateString('pt-BR')}`}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggleStatus(evt.id)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${evt.status === 'active' ? 'border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400 hover:bg-red-500/5' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}>
                  {evt.status === 'active' ? 'Pausar' : 'Ativar'}
                </button>
                <button onClick={() => startEdit(evt.id)}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all">
                  Editar
                </button>
                <button onClick={() => deleteEvent(evt.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/5 text-gray-600 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all">
                  <span className="material-icons-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
