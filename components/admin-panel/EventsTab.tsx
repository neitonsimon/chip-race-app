import React, { useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useApp } from '../../contexts/AppContext';
import {
  SpecialEvent, EventSection, EventSectionType,
  TournamentCard, ScheduleItem, PrizeItem, EventNavButton
} from '../../types';

interface EventsTabProps {
  // No props - uses useApp() directly
}

// ── Helpers ────────────────────────────────────────────────────────────────
const newId = () => crypto.randomUUID();

const COLOR_OPTIONS = [
  { value: 'primary',   label: 'Pink (Destaque)' },
  { value: 'secondary', label: 'Blue (Chip Race)' },
  { value: 'green',     label: 'Verde (Chimarrão)' },
  { value: 'amber',     label: 'Âmbar (Gold)' },
  { value: 'red',       label: 'Vermelho (Danger)' },
  { value: 'cyan',      label: 'Ciano (Neon)' },
  { value: 'purple',    label: 'Roxo (Luxury)' },
];

const INTERNAL_VIEWS = [
  { value: 'home',              label: 'Início (Home)' },
  { value: 'calendar',          label: 'Calendário de Eventos' },
  { value: 'ranking',           label: 'Rankings' },
  { value: 'vip',               label: 'Área VIP' },
  { value: 'recharge',          label: 'Recargas & Chipz' },
  { value: 'the-chosen-details', label: 'The Chosen' },
  { value: 'online-credits',    label: 'Créditos Online' },
  { value: 'profile',           label: 'Perfil do Jogador' },
  { value: 'roadmap',           label: 'Roadmap' },
  { value: 'register',          label: 'Registro / Login' },
  { value: 'rules',             label: 'Regras do Clube' },
  { value: 'terms',             label: 'Termos de Uso' },
  { value: 'privacy',           label: 'Política de Privacidade' },
];

const SECTION_LABELS: Record<EventSectionType, { label: string; icon: string }> = {
  header:           { label: 'Cabeçalho com Fundo',   icon: 'title' },
  info_block:       { label: 'Bloco de Informações',   icon: 'info' },
  tournament_cards: { label: 'Cards de Torneio',       icon: 'style' },
  countdown:        { label: 'Contagem Regressiva',    icon: 'timer' },
  schedule:         { label: 'Programação / Datas',    icon: 'calendar_today' },
  prize_table:      { label: 'Tabela de Premiação',    icon: 'emoji_events' },
  cta_button:       { label: 'Botão de Ação (CTA)',    icon: 'touch_app' },
  rich_text:        { label: 'Texto Livre',             icon: 'notes' },
  image_banner:     { label: 'Banner de Imagem',       icon: 'image' },
  nav_buttons:      { label: 'Botões de Navegação',    icon: 'navigation' },
};

const defaultSection = (type: EventSectionType): EventSection => ({
  id: newId(),
  type,
  enabled: true,
  order: 0,
  data: type === 'tournament_cards' ? { cards: [] }
      : type === 'schedule'         ? { items: [] }
      : type === 'prize_table'      ? { prizes: [] }
      : type === 'nav_buttons'      ? { nav_buttons: [] }
      : {},
});

const emptyEvent = (): SpecialEvent => ({
  id: newId(),
  slug: '',
  title: '',
  subtitle: '',
  status: 'active',
  theme_color: 'primary',
  icon: 'celebration',
  nav_label: '',
  hero_enabled: true,
  hero_order: 1,
  hero_cta_text: 'SAIBA MAIS',
  sections: [],
});

// ── Small UI components ─────────────────────────────────────────────────────
const FormGroup: React.FC<{ label: string; children: React.ReactNode; fullWidth?: boolean }> = ({ label, children, fullWidth }) => (
  <div className={fullWidth ? 'col-span-2' : ''}>
    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary transition-colors';

const StatusBadge: React.FC<{ status: SpecialEvent['status'] }> = ({ status }) => {
  const map = {
    active:   'bg-green-500/15 text-green-400 border-green-500/30',
    inactive: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    expired:  'bg-red-500/15 text-red-400 border-red-500/30',
  };
  const lbl = { active: 'Ativo', inactive: 'Inativo', expired: 'Expirado' };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${map[status]}`}>
      {lbl[status]}
    </span>
  );
};

// ── Section Editor ──────────────────────────────────────────────────────────
const SectionEditor: React.FC<{ section: EventSection; onChange: (s: EventSection) => void; onRemove: () => void }> = ({ section, onChange, onRemove }) => {
  const [open, setOpen] = useState(false);
  const meta = SECTION_LABELS[section.type];

  const upd = (data: Partial<typeof section.data>) => onChange({ ...section, data: { ...section.data, ...data } });

  // ── Card helpers
  const updCard = (i: number, field: keyof TournamentCard, val: string) => {
    const cards = [...(section.data.cards || [])];
    cards[i] = { ...cards[i], [field]: val };
    upd({ cards });
  };
  const addCard = () => upd({ cards: [...(section.data.cards || []), { name: '', description: '', dates: '', icon: 'style', color: 'primary' }] });
  const remCard = (i: number) => upd({ cards: (section.data.cards || []).filter((_, j) => j !== i) });

  // ── Schedule helpers
  const updItem = (i: number, field: keyof ScheduleItem, val: string) => {
    const items = [...(section.data.items || [])];
    items[i] = { ...items[i], [field]: val };
    upd({ items });
  };
  const addItem = () => upd({ items: [...(section.data.items || []), { date: '', time: '', description: '' }] });
  const remItem = (i: number) => upd({ items: (section.data.items || []).filter((_, j) => j !== i) });

  // ── Prize helpers
  const updPrize = (i: number, field: keyof PrizeItem, val: string) => {
    const prizes = [...(section.data.prizes || [])];
    prizes[i] = { ...prizes[i], [field]: val };
    upd({ prizes });
  };
  const addPrize = () => upd({ prizes: [...(section.data.prizes || []), { position: '', prize: '' }] });
  const remPrize = (i: number) => upd({ prizes: (section.data.prizes || []).filter((_, j) => j !== i) });

  // ── NavButton helpers
  const updNav = (i: number, field: keyof EventNavButton, val: any) => {
    const navBtns = [...(section.data.nav_buttons || [])];
    navBtns[i] = { ...navBtns[i], [field]: val };
    upd({ nav_buttons: navBtns });
  };
  const addNavBtn = () => upd({ nav_buttons: [...(section.data.nav_buttons || []), { label: '', view: 'home', icon: 'link', color: 'primary', is_external: false }] });
  const remNavBtn = (i: number) => upd({ nav_buttons: (section.data.nav_buttons || []).filter((_, j) => j !== i) });

  return (
    <div className={`rounded-2xl border transition-all ${section.enabled ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.01] opacity-50'}`}>
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <span className="material-icons-outlined text-gray-500 text-base">{meta.icon}</span>
        <span className="flex-1 text-xs font-black uppercase tracking-wider text-gray-300">{meta.label}</span>
        {/* Toggle enabled */}
        <button onClick={e => { e.stopPropagation(); onChange({ ...section, enabled: !section.enabled }); }}
          className={`w-8 h-4 rounded-full relative transition-colors ${section.enabled ? 'bg-primary' : 'bg-white/10'}`}>
          <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${section.enabled ? 'left-4' : 'left-0.5'}`} />
        </button>
        <button onClick={e => { e.stopPropagation(); onRemove(); }} className="text-gray-600 hover:text-red-500 transition-colors ml-1">
          <span className="material-icons-outlined text-base">delete</span>
        </button>
        <span className="material-icons-outlined text-gray-600 text-base">{open ? 'expand_less' : 'expand_more'}</span>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-white/5">
          {/* header */}
          {section.type === 'header' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <FormGroup label="Título"><input className={inputCls} value={section.data.title || ''} onChange={e => upd({ title: e.target.value })} placeholder="Título grande" /></FormGroup>
                <FormGroup label="Subtítulo"><input className={inputCls} value={section.data.subtitle || ''} onChange={e => upd({ subtitle: e.target.value })} placeholder="Subtítulo" /></FormGroup>
                <FormGroup label="URL da Imagem de Fundo" fullWidth>
                  <input className={inputCls} value={section.data.background_image || ''} onChange={e => upd({ background_image: e.target.value })} placeholder="https://..." />
                  {section.data.background_image && <img src={section.data.background_image} alt="preview" className="mt-2 h-20 w-full object-cover rounded-xl opacity-60" />}
                </FormGroup>
              </div>
            </>
          )}

          {/* info_block */}
          {section.type === 'info_block' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormGroup label="Título do Bloco"><input className={inputCls} value={section.data.block_title || ''} onChange={e => upd({ block_title: e.target.value })} /></FormGroup>
              <FormGroup label="Cor do Bloco">
                <select className={inputCls + ' appearance-none'} value={section.data.block_color || 'primary'} onChange={e => upd({ block_color: e.target.value })}>
                  {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Texto" fullWidth>
                <textarea rows={4} className={inputCls + ' resize-none'} value={section.data.block_text || ''} onChange={e => upd({ block_text: e.target.value })} />
              </FormGroup>
            </div>
          )}

          {/* tournament_cards */}
          {section.type === 'tournament_cards' && (
            <div className="mt-4 space-y-4">
              {(section.data.cards || []).map((card, i) => (
                <div key={i} className="bg-black/30 rounded-2xl p-4 border border-white/5 relative">
                  <button onClick={() => remCard(i)} className="absolute top-3 right-3 text-gray-600 hover:text-red-500 transition-colors"><span className="material-icons-outlined text-sm">close</span></button>
                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup label="Nome"><input className={inputCls} value={card.name} onChange={e => updCard(i, 'name', e.target.value)} /></FormGroup>
                    <FormGroup label="Ícone"><input className={inputCls} value={card.icon} onChange={e => updCard(i, 'icon', e.target.value)} placeholder="material icon" /></FormGroup>
                    <FormGroup label="Datas"><input className={inputCls} value={card.dates} onChange={e => updCard(i, 'dates', e.target.value)} /></FormGroup>
                    <FormGroup label="Cor">
                      <select className={inputCls + ' appearance-none'} value={card.color} onChange={e => updCard(i, 'color', e.target.value)}>
                        {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </FormGroup>
                    <FormGroup label="Descrição" fullWidth><textarea rows={2} className={inputCls + ' resize-none'} value={card.description} onChange={e => updCard(i, 'description', e.target.value)} /></FormGroup>
                  </div>
                </div>
              ))}
              <button onClick={addCard} className="w-full py-2.5 border border-dashed border-white/10 rounded-2xl text-gray-500 hover:text-white hover:border-white/20 text-xs font-black uppercase flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-sm">add</span> Adicionar Card
              </button>
            </div>
          )}

          {/* countdown */}
          {section.type === 'countdown' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormGroup label="Título do Contador"><input className={inputCls} value={section.data.countdown_title || ''} onChange={e => upd({ countdown_title: e.target.value })} /></FormGroup>
              <FormGroup label="Data Alvo (ISO)"><input type="datetime-local" className={inputCls} value={(section.data.target_date || '').slice(0, 16)} onChange={e => upd({ target_date: new Date(e.target.value).toISOString() })} /></FormGroup>
            </div>
          )}

          {/* schedule */}
          {section.type === 'schedule' && (
            <div className="mt-4 space-y-3">
              {(section.data.items || []).map((item, i) => (
                <div key={i} className="bg-black/30 rounded-2xl p-3 border border-white/5 grid grid-cols-3 gap-3 relative">
                  <button onClick={() => remItem(i)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500 transition-colors"><span className="material-icons-outlined text-sm">close</span></button>
                  <FormGroup label="Data"><input className={inputCls} value={item.date} onChange={e => updItem(i, 'date', e.target.value)} /></FormGroup>
                  <FormGroup label="Hora"><input className={inputCls} value={item.time} onChange={e => updItem(i, 'time', e.target.value)} /></FormGroup>
                  <FormGroup label="Descrição"><input className={inputCls} value={item.description} onChange={e => updItem(i, 'description', e.target.value)} /></FormGroup>
                </div>
              ))}
              <button onClick={addItem} className="w-full py-2.5 border border-dashed border-white/10 rounded-2xl text-gray-500 hover:text-white text-xs font-black uppercase flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-sm">add</span> Adicionar Linha
              </button>
            </div>
          )}

          {/* prize_table */}
          {section.type === 'prize_table' && (
            <div className="mt-4 space-y-3">
              {(section.data.prizes || []).map((row, i) => (
                <div key={i} className="bg-black/30 rounded-2xl p-3 border border-white/5 grid grid-cols-2 gap-3 relative">
                  <button onClick={() => remPrize(i)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500 transition-colors"><span className="material-icons-outlined text-sm">close</span></button>
                  <FormGroup label="Posição"><input className={inputCls} value={row.position} onChange={e => updPrize(i, 'position', e.target.value)} /></FormGroup>
                  <FormGroup label="Prêmio"><input className={inputCls} value={row.prize} onChange={e => updPrize(i, 'prize', e.target.value)} /></FormGroup>
                </div>
              ))}
              <button onClick={addPrize} className="w-full py-2.5 border border-dashed border-white/10 rounded-2xl text-gray-500 hover:text-white text-xs font-black uppercase flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-sm">add</span> Adicionar Faixa
              </button>
            </div>
          )}

          {/* cta_button */}
          {section.type === 'cta_button' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormGroup label="Texto do Botão"><input className={inputCls} value={section.data.btn_text || ''} onChange={e => upd({ btn_text: e.target.value })} /></FormGroup>
              <FormGroup label="Ícone (Material Icon)"><input className={inputCls} value={section.data.btn_icon || ''} onChange={e => upd({ btn_icon: e.target.value })} placeholder="ex: arrow_forward" /></FormGroup>
              <FormGroup label="Cor do Botão">
                <select className={inputCls + ' appearance-none'} value={section.data.btn_color || 'primary'} onChange={e => upd({ btn_color: e.target.value })}>
                  {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Tipo de Ação">
                <select className={inputCls + ' appearance-none'} value={section.data.btn_action_type || 'internal'} onChange={e => upd({ btn_action_type: e.target.value as any })}>
                  <option value="internal">Página Interna</option>
                  <option value="url">URL Externa</option>
                </select>
              </FormGroup>
              <FormGroup label={section.data.btn_action_type === 'url' ? 'URL Externa' : 'Página Destino'} fullWidth>
                {section.data.btn_action_type === 'url'
                  ? <input className={inputCls} value={section.data.btn_action || ''} onChange={e => upd({ btn_action: e.target.value })} placeholder="https://..." />
                  : <select className={inputCls + ' appearance-none'} value={section.data.btn_action || 'home'} onChange={e => upd({ btn_action: e.target.value })}>
                      {INTERNAL_VIEWS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                }
              </FormGroup>
            </div>
          )}

          {/* rich_text */}
          {section.type === 'rich_text' && (
            <div className="mt-4">
              <FormGroup label="Texto Livre (suporta quebras de linha)">
                <textarea rows={6} className={inputCls + ' resize-none'} value={section.data.text || ''} onChange={e => upd({ text: e.target.value })} />
              </FormGroup>
            </div>
          )}

          {/* image_banner */}
          {section.type === 'image_banner' && (
            <div className="mt-4 space-y-3">
              <FormGroup label="URL da Imagem">
                <input className={inputCls} value={section.data.image_url || ''} onChange={e => upd({ image_url: e.target.value })} placeholder="https://..." />
              </FormGroup>
              <FormGroup label="Texto Alternativo (acessibilidade)">
                <input className={inputCls} value={section.data.image_alt || ''} onChange={e => upd({ image_alt: e.target.value })} />
              </FormGroup>
              {section.data.image_url && (
                <img src={section.data.image_url} alt="preview" className="h-28 w-full object-cover rounded-2xl opacity-70" />
              )}
            </div>
          )}

          {/* nav_buttons */}
          {section.type === 'nav_buttons' && (
            <div className="mt-4 space-y-3">
              <FormGroup label="Título da Seção (opcional)">
                <input className={inputCls} value={section.data.nav_buttons_title || ''} onChange={e => upd({ nav_buttons_title: e.target.value })} placeholder="ex: Explorar mais" />
              </FormGroup>
              {(section.data.nav_buttons || []).map((btn, i) => (
                <div key={i} className="bg-black/30 rounded-2xl p-3 border border-white/5 grid grid-cols-2 gap-3 relative">
                  <button onClick={() => remNavBtn(i)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500 transition-colors"><span className="material-icons-outlined text-sm">close</span></button>
                  <FormGroup label="Texto do botão"><input className={inputCls} value={btn.label} onChange={e => updNav(i, 'label', e.target.value)} /></FormGroup>
                  <FormGroup label="Ícone"><input className={inputCls} value={btn.icon} onChange={e => updNav(i, 'icon', e.target.value)} placeholder="Material Icon" /></FormGroup>
                  <FormGroup label="Cor">
                    <select className={inputCls + ' appearance-none'} value={btn.color} onChange={e => updNav(i, 'color', e.target.value)}>
                      {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </FormGroup>
                  <FormGroup label="Externo?">
                    <select className={inputCls + ' appearance-none'} value={btn.is_external ? 'true' : 'false'} onChange={e => updNav(i, 'is_external', e.target.value === 'true')}>
                      <option value="false">Não (Página Interna)</option>
                      <option value="true">Sim (URL Externa)</option>
                    </select>
                  </FormGroup>
                  <FormGroup label={btn.is_external ? 'URL Externa' : 'Página Destino'} fullWidth>
                    {btn.is_external
                      ? <input className={inputCls} value={btn.view} onChange={e => updNav(i, 'view', e.target.value)} placeholder="https://..." />
                      : <select className={inputCls + ' appearance-none'} value={btn.view} onChange={e => updNav(i, 'view', e.target.value)}>
                          {INTERNAL_VIEWS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                        </select>
                    }
                  </FormGroup>
                </div>
              ))}
              <button onClick={addNavBtn} className="w-full py-2.5 border border-dashed border-white/10 rounded-2xl text-gray-500 hover:text-white text-xs font-black uppercase flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-sm">add</span> Adicionar Botão
              </button>
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

  const updSection = (id: string, updated: EventSection) => {
    upd({ sections: event.sections.map(s => s.id === id ? updated : s) });
  };

  const removeSection = (id: string) => {
    upd({ sections: event.sections.filter(s => s.id !== id) });
  };

  const TABS = [
    { id: 'general', label: 'Geral', icon: 'settings' },
    { id: 'hero',    label: 'Carrossel',  icon: 'view_carousel' },
    { id: 'sections', label: 'Seções', icon: 'view_module' },
  ] as const;

  return (
    <div className="bg-[#050214] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-white/5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === t.id ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className="material-icons-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormGroup label="Slug (sem espaços, único)">
              <input className={inputCls} value={event.slug} onChange={e => upd({ slug: e.target.value.toLowerCase().replace(/\s/g, '-') })} placeholder="ex: fenachim-2025" />
            </FormGroup>
            <FormGroup label="Status">
              <select className={inputCls + ' appearance-none'} value={event.status} onChange={e => upd({ status: e.target.value as any })}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="expired">Expirado</option>
              </select>
            </FormGroup>
            <FormGroup label="Título do Evento">
              <input className={inputCls + ' font-bold'} value={event.title} onChange={e => upd({ title: e.target.value })} placeholder="FENACHIM 2025" />
            </FormGroup>
            <FormGroup label="Subtítulo">
              <input className={inputCls} value={event.subtitle} onChange={e => upd({ subtitle: e.target.value })} placeholder="Festa Nacional do Chimarrão" />
            </FormGroup>
            <FormGroup label="Label no Menu (Dropdown)">
              <input className={inputCls} value={event.nav_label} onChange={e => upd({ nav_label: e.target.value })} placeholder="FENACHIM" />
            </FormGroup>
            <FormGroup label="Ícone (Material Icon)">
              <input className={inputCls} value={event.icon} onChange={e => upd({ icon: e.target.value })} placeholder="celebration" />
            </FormGroup>
            <FormGroup label="Cor Temática">
              <select className={inputCls + ' appearance-none'} value={event.theme_color} onChange={e => upd({ theme_color: e.target.value })}>
                {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Expiração Automática (opcional)">
              <input type="date" className={inputCls} value={(event.expires_at || '').slice(0, 10)} onChange={e => upd({ expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
            </FormGroup>
          </div>
        )}

        {/* HERO TAB */}
        {activeTab === 'hero' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormGroup label="Exibir no Carrossel da Home">
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => upd({ hero_enabled: !event.hero_enabled })}
                  className={`w-12 h-6 rounded-full relative transition-colors ${event.hero_enabled ? 'bg-primary' : 'bg-white/10'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${event.hero_enabled ? 'left-7' : 'left-1'}`} />
                </button>
                <span className="text-xs text-gray-400">{event.hero_enabled ? 'Ativo no carrossel' : 'Oculto do carrossel'}</span>
              </div>
            </FormGroup>
            <FormGroup label="Ordem no Carrossel (menor = primeiro)">
              <input type="number" className={inputCls} value={event.hero_order} onChange={e => upd({ hero_order: parseInt(e.target.value) || 1 })} min={1} />
            </FormGroup>
            <FormGroup label="Texto do Botão CTA">
              <input className={inputCls + ' font-bold'} value={event.hero_cta_text} onChange={e => upd({ hero_cta_text: e.target.value })} placeholder="SAIBA MAIS" />
            </FormGroup>
            <FormGroup label="Título Override (deixe vazio para usar o título do evento)">
              <input className={inputCls} value={event.hero_title_override || ''} onChange={e => upd({ hero_title_override: e.target.value || undefined })} />
            </FormGroup>
            <FormGroup label="Subtítulo Override" fullWidth>
              <input className={inputCls} value={event.hero_subtitle_override || ''} onChange={e => upd({ hero_subtitle_override: e.target.value || undefined })} />
            </FormGroup>
            <FormGroup label="URL da Imagem de Fundo do Slide" fullWidth>
              <input className={inputCls} value={event.hero_background_image || ''} onChange={e => upd({ hero_background_image: e.target.value || undefined })} placeholder="https://..." />
              {event.hero_background_image && (
                <img src={event.hero_background_image} alt="preview" className="mt-3 h-32 w-full object-cover rounded-2xl opacity-60" />
              )}
            </FormGroup>
          </div>
        )}

        {/* SECTIONS TAB */}
        {activeTab === 'sections' && (
          <div className="space-y-3">
            <div className="space-y-3">
              {[...event.sections].sort((a, b) => a.order - b.order).map(section => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  onChange={upd => updSection(section.id, upd)}
                  onRemove={() => removeSection(section.id)}
                />
              ))}
            </div>

            {/* Add section menu */}
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-3">Adicionar Seção</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SECTION_LABELS) as EventSectionType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => addSection(type)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    <span className="material-icons-outlined text-xs">{SECTION_LABELS[type].icon}</span>
                    {SECTION_LABELS[type].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex gap-4 p-6 border-t border-white/10 bg-white/[0.02]">
        <button onClick={onCancel} className="flex-1 py-3 text-gray-400 font-black uppercase text-[10px] tracking-widest border border-white/10 rounded-2xl hover:text-white hover:border-white/20 transition-colors">
          Cancelar
        </button>
        <button onClick={onSave} disabled={isSaving || !event.slug || !event.title}
          className="flex-1 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-neon-pink hover:bg-primary/80 disabled:opacity-40 disabled:shadow-none transition-all flex items-center justify-center gap-2">
          <span className="material-icons-outlined text-sm">save</span>
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

  // Sync when contentDB changes (e.g., on first load)
  React.useEffect(() => {
    setEvents(contentDB.special_events || []);
  }, [contentDB.special_events]);

  const persistEvents = async (updated: SpecialEvent[]) => {
    await updateContent('special_events', '', updated);
  };

  const startNew = () => {
    const e = emptyEvent();
    setEditingEvent(e);
    setEditingId('__new__');
  };

  const startEdit = (id: string) => {
    const found = events.find(e => e.id === id);
    if (found) { setEditingEvent(JSON.parse(JSON.stringify(found))); setEditingId(id); }
  };

  const cancelEdit = () => { setEditingId(null); setEditingEvent(null); };

  const saveEvent = async () => {
    if (!editingEvent) return;
    setIsSaving(true);
    let updated: SpecialEvent[];
    if (editingId === '__new__') {
      updated = [...events, editingEvent];
    } else {
      updated = events.map(e => e.id === editingId ? editingEvent : e);
    }
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
      ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' as any }
      : e
    );
    setEvents(updated);
    await persistEvents(updated);
  };

  if (editingId && editingEvent) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={cancelEdit} className="text-gray-500 hover:text-white transition-colors">
            <span className="material-icons-outlined">arrow_back</span>
          </button>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">
              {editingId === '__new__' ? 'Novo Evento' : `Editando: ${editingEvent.title}`}
            </h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">slug: {editingEvent.slug || '—'}</p>
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Eventos Especiais</h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Criar, editar e gerenciar páginas de eventos temporários</p>
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
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Nenhum evento cadastrado ainda</p>
          <button onClick={startNew} className="mt-4 px-6 py-2.5 bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/30 transition-colors">
            Criar Primeiro Evento
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(evt => (
            <div key={evt.id} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${evt.status === 'active' ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.01] opacity-60'}`}>
              <span className="material-icons-outlined text-2xl text-gray-500 shrink-0">{evt.icon}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black text-white truncate">{evt.title}</span>
                  <StatusBadge status={evt.status} />
                  {evt.hero_enabled && (
                    <span className="text-[8px] font-black bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full uppercase">Carrossel</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 truncate">{evt.subtitle}</p>
                <p className="text-[9px] text-gray-700 mt-0.5">slug: {evt.slug} · {evt.sections.filter(s => s.enabled).length} seções ativas</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleStatus(evt.id)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${evt.status === 'active' ? 'border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-400' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}>
                  {evt.status === 'active' ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => startEdit(evt.id)}
                  className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all">
                  Editar
                </button>
                <button onClick={() => deleteEvent(evt.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/5 text-gray-600 hover:text-red-500 hover:border-red-500/30 transition-all">
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

