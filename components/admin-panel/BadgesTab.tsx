import React from 'react';
import { ViewBadgeUsersModal } from './modals/ViewBadgeUsersModal';
import { BadgePreview } from './BadgePreview';

interface BadgesTabProps {
    targetType: 'single' | 'all';
    setTargetType: (t: 'single' | 'all') => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    description: string;
    setDescription: (d: string) => void;
    selectedBadgeId: string;
    setSelectedBadgeId: (id: string) => void;
    searchResults: any[];
    setSearchResults: (res: any[]) => void;
    badgeTemplates: any[];
    selectedUsers: any[];
    setSelectedUsers: (users: any[]) => void;
    usersWithSelectedBadge: Set<string>;
    handleSendBadges: () => Promise<void>;
    handleSearch: (query: string) => Promise<void>;
    onCreateBadgeTemplate?: (badge: any) => Promise<void>;
    onUpdateBadgeTemplate?: (id: string, badge: any) => Promise<void>;
    isLoading: boolean;
}

// ─── 200+ Material Icons for badges ────────────────────────────────────────
const BADGE_ICONS = [
    // Conquistas & Trofeus
    { id: 'stars', label: 'Estrela' },
    { id: 'star', label: 'Estrela Sólida' },
    { id: 'star_border', label: 'Estrela Borda' },
    { id: 'star_half', label: 'Meia Estrela' },
    { id: 'emoji_events', label: 'Troféu' },
    { id: 'workspace_premium', label: 'Premium' },
    { id: 'military_tech', label: 'Medalha Militar' },
    { id: 'medal', label: 'Medalha' },
    { id: 'diamond', label: 'Diamante' },
    { id: 'verified', label: 'Verificado' },
    { id: 'verified_user', label: 'Usuário Verificado' },
    { id: 'grade', label: 'Grade' },
    { id: 'local_fire_department', label: 'Fogo' },
    { id: 'whatshot', label: 'Quente' },
    { id: 'auto_awesome', label: 'Brilho' },
    { id: 'flash_on', label: 'Raio' },
    { id: 'bolt', label: 'Bolt' },
    { id: 'electric_bolt', label: 'Raio Elétrico' },
    { id: 'crown', label: 'Coroa' },
    { id: 'king', label: 'Rei' },
    { id: 'queen', label: 'Rainha' },
    { id: 'ace', label: 'Ás' },

    // Cartões & Jogos
    { id: 'casino', label: 'Casino' },
    { id: 'sports_esports', label: 'Esports' },
    { id: 'videogame_asset', label: 'Controle' },
    { id: 'extension', label: 'Puzzle' },
    { id: 'token', label: 'Token' },
    { id: 'toll', label: 'Ficha' },
    { id: 'paid', label: 'Pago' },
    { id: 'monetization_on', label: 'Moeda' },
    { id: 'attach_money', label: 'Dinheiro' },
    { id: 'savings', label: 'Poupança' },
    { id: 'account_balance', label: 'Banco' },
    { id: 'currency_bitcoin', label: 'Bitcoin' },
    { id: 'poker', label: 'Poker' },

    // Natureza & Elementos
    { id: 'eco', label: 'Eco' },
    { id: 'spa', label: 'Spa' },
    { id: 'park', label: 'Parque' },
    { id: 'terrain', label: 'Terreno' },
    { id: 'waves', label: 'Ondas' },
    { id: 'water', label: 'Água' },
    { id: 'air', label: 'Ar' },
    { id: 'wb_sunny', label: 'Sol' },
    { id: 'cloud', label: 'Nuvem' },
    { id: 'storm', label: 'Tempestade' },
    { id: 'thunderstorm', label: 'Trovão' },
    { id: 'tornado', label: 'Tornado' },
    { id: 'ac_unit', label: 'Gelo' },
    { id: 'snowflake', label: 'Floco Neve' },
    { id: 'fireplace', label: 'Lareira' },
    { id: 'volcano', label: 'Vulcão' },
    { id: 'landslide', label: 'Avalanche' },
    { id: 'forest', label: 'Floresta' },
    { id: 'grass', label: 'Grama' },
    { id: 'yard', label: 'Jardim' },
    { id: 'agriculture', label: 'Agricultura' },
    { id: 'cruelty_free', label: 'Vegano' },

    // Animais & Criaturas
    { id: 'pets', label: 'Pets' },
    { id: 'pest_control', label: 'Bicho' },
    { id: 'set_meal', label: 'Peixe' },
    { id: 'phishing', label: 'Pesca' },
    { id: 'bug_report', label: 'Bug' },
    { id: 'flutter_dash', label: 'Pássaro' },
    { id: 'rocket', label: 'Foguete' },
    { id: 'rocket_launch', label: 'Lançamento' },

    // Esportes & Atividade
    { id: 'sports', label: 'Esportes' },
    { id: 'sports_basketball', label: 'Basquete' },
    { id: 'sports_soccer', label: 'Futebol' },
    { id: 'sports_football', label: 'Futebol Americano' },
    { id: 'sports_baseball', label: 'Baseball' },
    { id: 'sports_tennis', label: 'Tênis' },
    { id: 'sports_golf', label: 'Golf' },
    { id: 'sports_volleyball', label: 'Vôlei' },
    { id: 'sports_mma', label: 'MMA' },
    { id: 'sports_martial_arts', label: 'Artes Marciais' },
    { id: 'sports_gymnastics', label: 'Ginástica' },
    { id: 'sports_motorsports', label: 'Motorsports' },
    { id: 'sports_score', label: 'Placar' },
    { id: 'fitness_center', label: 'Academia' },
    { id: 'directions_run', label: 'Corrida' },
    { id: 'hiking', label: 'Trilha' },
    { id: 'kayaking', label: 'Caiaque' },
    { id: 'rowing', label: 'Remo' },
    { id: 'skateboarding', label: 'Skate' },
    { id: 'surfing', label: 'Surf' },
    { id: 'skiing', label: 'Ski' },
    { id: 'snowboarding', label: 'Snowboard' },
    { id: 'pool', label: 'Natação' },
    { id: 'downhill_skiing', label: 'Esqui Down' },
    { id: 'paragliding', label: 'Parapente' },
    { id: 'scuba_diving', label: 'Mergulho' },
    { id: 'nordic_walking', label: 'Caminhada' },
    { id: 'sports_kabaddi', label: 'Kabaddi' },
    { id: 'sports_handball', label: 'Handebol' },
    { id: 'sports_cricket', label: 'Cricket' },

    // Pessoas & Perfis
    { id: 'person', label: 'Pessoa' },
    { id: 'groups', label: 'Grupo' },
    { id: 'people', label: 'Pessoas' },
    { id: 'psychology', label: 'Psicologia' },
    { id: 'self_improvement', label: 'Meditação' },
    { id: 'accessibility_new', label: 'Acessibilidade' },
    { id: 'elderly', label: 'Idoso' },
    { id: 'child_care', label: 'Criança' },
    { id: 'face', label: 'Rosto' },
    { id: 'face_2', label: 'Rosto 2' },
    { id: 'mood', label: 'Humor' },
    { id: 'sentiment_satisfied', label: 'Feliz' },
    { id: 'sentiment_very_satisfied', label: 'Muito Feliz' },
    { id: 'celebration', label: 'Celebração' },
    { id: 'cake', label: 'Bolo' },
    { id: 'waving_hand', label: 'Aceno' },
    { id: 'thumb_up', label: 'Curtir' },
    { id: 'volunteer_activism', label: 'Voluntário' },
    { id: 'handshake', label: 'Aperto de Mão' },

    // Tecnologia
    { id: 'code', label: 'Código' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'developer_mode', label: 'Dev Mode' },
    { id: 'memory', label: 'Memória' },
    { id: 'computer', label: 'Computador' },
    { id: 'smartphone', label: 'Smartphone' },
    { id: 'wifi', label: 'Wifi' },
    { id: 'satellite', label: 'Satélite' },
    { id: 'launch', label: 'Launch' },
    { id: 'science', label: 'Ciência' },
    { id: 'biotech', label: 'Biotec' },
    { id: 'psychology_alt', label: 'Psico Alt' },
    { id: 'precision_manufacturing', label: 'Manufatura' },
    { id: 'construction', label: 'Construção' },
    { id: 'engineering', label: 'Engenharia' },
    { id: 'architecture', label: 'Arquitetura' },
    { id: 'hub', label: 'Hub' },
    { id: 'lan', label: 'Rede' },
    { id: 'radar', label: 'Radar' },
    { id: 'settings', label: 'Configurações' },
    { id: 'build', label: 'Build' },
    { id: 'tune', label: 'Ajuste' },

    // Criatividade & Arte
    { id: 'palette', label: 'Paleta' },
    { id: 'brush', label: 'Pincel' },
    { id: 'draw', label: 'Desenho' },
    { id: 'create', label: 'Criar' },
    { id: 'edit', label: 'Editar' },
    { id: 'design_services', label: 'Design' },
    { id: 'photo_camera', label: 'Câmera' },
    { id: 'movie', label: 'Filme' },
    { id: 'music_note', label: 'Música' },
    { id: 'headphones', label: 'Fones' },
    { id: 'piano', label: 'Piano' },
    { id: 'mic', label: 'Microfone' },
    { id: 'radio', label: 'Rádio' },
    { id: 'queue_music', label: 'Playlist' },
    { id: 'theater_comedy', label: 'Teatro' },
    { id: 'festival', label: 'Festival' },
    { id: 'auto_stories', label: 'Histórias' },
    { id: 'import_contacts', label: 'Leitura' },
    { id: 'book', label: 'Livro' },
    { id: 'school', label: 'Escola' },
    { id: 'emoji_objects', label: 'Ideia' },
    { id: 'lightbulb', label: 'Lâmpada' },
    { id: 'tips_and_updates', label: 'Dicas' },

    // Segurança & Proteção
    { id: 'shield', label: 'Escudo' },
    { id: 'security', label: 'Segurança' },
    { id: 'lock', label: 'Cadeado' },
    { id: 'key', label: 'Chave' },
    { id: 'gpp_good', label: 'Proteção Boa' },
    { id: 'admin_panel_settings', label: 'Admin' },
    { id: 'manage_accounts', label: 'Contas' },
    { id: 'supervisor_account', label: 'Supervisor' },
    { id: 'badge', label: 'Crachá' },
    { id: 'policy', label: 'Política' },
    { id: 'rule', label: 'Regra' },
    { id: 'fact_check', label: 'Fact Check' },
    { id: 'gavel', label: 'Martelo' },
    { id: 'balance', label: 'Balança' },

    // Transporte & Viagem
    { id: 'flight', label: 'Avião' },
    { id: 'flight_takeoff', label: 'Decolagem' },
    { id: 'sailing', label: 'Vela' },
    { id: 'directions_car', label: 'Carro' },
    { id: 'two_wheeler', label: 'Moto' },
    { id: 'pedal_bike', label: 'Bicicleta' },
    { id: 'train', label: 'Trem' },
    { id: 'subway', label: 'Metrô' },
    { id: 'anchor', label: 'Âncora' },
    { id: 'explore', label: 'Explorar' },
    { id: 'map', label: 'Mapa' },
    { id: 'terrain', label: 'Terreno' },
    { id: 'travel_explore', label: 'Viagem' },
    { id: 'public', label: 'Global' },
    { id: 'language', label: 'Idioma' },
    { id: 'translate', label: 'Traduzir' },

    // Comida & Bebida
    { id: 'restaurant', label: 'Restaurante' },
    { id: 'local_bar', label: 'Bar' },
    { id: 'local_cafe', label: 'Café' },
    { id: 'brunch_dining', label: 'Brunch' },
    { id: 'ramen_dining', label: 'Ramen' },
    { id: 'local_pizza', label: 'Pizza' },
    { id: 'bakery_dining', label: 'Padaria' },
    { id: 'lunch_dining', label: 'Almoço' },
    { id: 'dinner_dining', label: 'Jantar' },
    { id: 'wine_bar', label: 'Vinho' },
    { id: 'sports_bar', label: 'Sports Bar' },
    { id: 'emoji_food_beverage', label: 'Bebida' },
    { id: 'food_bank', label: 'Banco de Alimentos' },

    // Símbolos Especiais
    { id: 'infinity', label: 'Infinito' },
    { id: 'hexagon', label: 'Hexágono' },
    { id: 'pentagon', label: 'Pentágono' },
    { id: 'change_history', label: 'Delta' },
    { id: 'panorama_fish_eye', label: 'Círculo' },
    { id: 'lens', label: 'Lente' },
    { id: 'brightness_high', label: 'Brilhante' },
    { id: 'flare', label: 'Flare' },
    { id: 'blur_on', label: 'Blur' },
    { id: 'center_focus_strong', label: 'Foco' },
    { id: 'scatter_plot', label: 'Scatter' },
    { id: 'bubble_chart', label: 'Bolhas' },
    { id: 'linear_scale', label: 'Escala' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'trending_up', label: 'Crescimento' },
    { id: 'show_chart', label: 'Gráfico' },
    { id: 'leaderboard', label: 'Ranking' },
    { id: 'equalizer', label: 'Equalizador' },
    { id: 'bar_chart', label: 'Barras' },
    { id: 'pie_chart', label: 'Pizza Chart' },
    { id: 'donut_large', label: 'Donut' },
    { id: 'speed', label: 'Velocidade' },
    { id: 'timer', label: 'Timer' },
    { id: 'alarm', label: 'Alarme' },
    { id: 'schedule', label: 'Horário' },
    { id: 'event', label: 'Evento' },
    { id: 'today', label: 'Hoje' },
    { id: 'date_range', label: 'Período' },

    // Saúde & Bem-estar
    { id: 'favorite', label: 'Coração' },
    { id: 'favorite_border', label: 'Coração Borda' },
    { id: 'health_and_safety', label: 'Saúde' },
    { id: 'healing', label: 'Cura' },
    { id: 'medication', label: 'Medicação' },
    { id: 'medical_services', label: 'Médico' },
    { id: 'monitor_heart', label: 'Coração Monitor' },
    { id: 'bloodtype', label: 'Tipo Sanguíneo' },
    { id: 'emergency', label: 'Emergência' },
    { id: 'vaccines', label: 'Vacinas' },
    { id: 'coronavirus', label: 'Virus' },
    { id: 'sanitizer', label: 'Sanitizador' },
    { id: 'masks', label: 'Máscara' },
    { id: 'clean_hands', label: 'Mãos Limpas' },
    { id: 'shower', label: 'Chuveiro' },
    { id: 'soap', label: 'Sabão' },
    { id: 'nightlight', label: 'Lua' },

    // Comunicação
    { id: 'message', label: 'Mensagem' },
    { id: 'chat', label: 'Chat' },
    { id: 'forum', label: 'Fórum' },
    { id: 'email', label: 'Email' },
    { id: 'call', label: 'Ligação' },
    { id: 'campaign', label: 'Campanha' },
    { id: 'notifications', label: 'Notificações' },
    { id: 'announcement', label: 'Anúncio' },
    { id: 'share', label: 'Compartilhar' },
    { id: 'connect_without_contact', label: 'Conectar' },
    { id: 'record_voice_over', label: 'Voz' },

    // Naturais extras
    { id: 'sunny', label: 'Ensolarado' },
    { id: 'nightlight_round', label: 'Noite' },
    { id: 'dark_mode', label: 'Modo Escuro' },
    { id: 'light_mode', label: 'Modo Claro' },
    { id: 'hdr_strong', label: 'Forte' },
    { id: 'lens_blur', label: 'Blur Lente' },
    { id: 'motion_photos_on', label: 'Movimento' },
    { id: 'fire_truck', label: 'Bombeiro' },
    { id: 'military_tech', label: 'Tech Militar' },
    { id: 'local_police', label: 'Polícia' },
    { id: 'person_pin', label: 'Pin Pessoa' },
    { id: 'location_pin', label: 'Localização' },
    { id: 'push_pin', label: 'Alfinete' },
    { id: 'flag', label: 'Bandeira' },
    { id: 'tour', label: 'Tour' },
    { id: 'attractions', label: 'Atrações' },
    { id: 'stadium', label: 'Estádio' },
    { id: 'nightlife', label: 'Vida Noturna' },
    { id: 'piano', label: 'Piano' },
    { id: 'sports_score', label: 'Score' },
    { id: 'scoreboard', label: 'Placar' },
    { id: 'currency_exchange', label: 'Câmbio' },
    { id: 'real_estate_agent', label: 'Imóvel' },
    { id: 'gavel', label: 'Leilão' },
    { id: 'workspace_premium', label: 'VIP' },
    { id: 'verified_user', label: 'Usuário OK' },
    { id: 'how_to_reg', label: 'Registrado' },
    { id: 'loyalty', label: 'Fidelidade' },
    { id: 'card_membership', label: 'Membro' },
    { id: 'card_giftcard', label: 'Gift Card' },
    { id: 'redeem', label: 'Resgatar' },
    { id: 'shopping_bag', label: 'Sacola' },
    { id: 'store', label: 'Loja' },
    { id: 'storefront', label: 'Fachada' },
];



const RARITY_COLORS = [
    { id: 'comum', label: 'Comum', color: '#9ca3af' }, // Cinza / Prata escuro
    { id: 'incomum', label: 'Incomum', color: '#22c55e' }, // Verde
    { id: 'rara', label: 'Rara', color: '#00E5FF' }, // Azul Claro
    { id: 'epica', label: 'Épica', color: '#ef4444' }, // Vermelha
    { id: 'lendaria', label: 'Lendária', color: '#eab308' }, // Dourada
    { id: 'suprema', label: 'Suprema', color: '#ff4d79' }, // Rosa mesclado laranja
    { id: 'celestial', label: 'Celestial', color: '#fffff0' }, // Marfim
];

// ─── Icon Picker Modal ────────────────────────────────────────────────────────
const IconPickerModal: React.FC<{
    currentIcon: string;
    currentColor?: string;
    onSelect: (icon: string) => void;
    onClose: () => void;
}> = ({ currentIcon, currentColor = '#00E5FF', onSelect, onClose }) => {
    const [search, setSearch] = React.useState('');
    const [rows, setRows] = React.useState(3);

    // Grid settings
    const iconsPerRow = 6;
    const initialIcons = iconsPerRow * rows;

    const filtered = search.length >= 1
        ? BADGE_ICONS.filter(i => i.label.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase()))
        : BADGE_ICONS;

    const displayedIcons = filtered.slice(0, initialIcons);
    const hasMore = filtered.length > initialIcons;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0c0920] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 sm:p-8 pb-4">
                    <div className="flex items-center gap-3 sm:gap-4 text-left">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shrink-0">
                            <span className="material-icons-outlined text-primary text-xl sm:text-2xl">grid_view</span>
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-widest leading-none mb-1">Escolher ícone</h3>
                            <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider">{filtered.length} ícones</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 sm:w-10 sm:h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all group shrink-0">
                        <span className="material-icons-outlined text-gray-500 group-hover:text-white text-lg sm:text-xl">close</span>
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 sm:px-8 py-2 sm:py-4">
                    <div className="relative group text-left">
                        <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg group-focus-within:text-primary transition-colors">search</span>
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setRows(3); }}
                            placeholder="Buscar ícone... (ex: troféu, fogo)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl pl-12 pr-4 py-3 sm:py-4 text-white text-sm outline-none focus:border-primary/50 focus:bg-primary/5 transition-all font-bold"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="overflow-y-auto flex-1 px-6 sm:px-8 pb-4 pt-2 custom-scrollbar">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 sm:gap-4">
                        {displayedIcons.map(icon => (
                            <button
                                key={icon.id}
                                onClick={() => { onSelect(icon.id); onClose(); }}
                                className="group flex flex-col items-center gap-2"
                            >
                                <BadgePreview icon={icon.id} size="sm" active={currentIcon === icon.id} color={currentColor} />
                                <span className="text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase tracking-tighter truncate w-full text-center group-hover:text-white transition-colors">{icon.label}</span>
                            </button>
                        ))}
                    </div>

                    {hasMore && (
                        <div className="mt-6 sm:mt-8 mb-4 flex justify-center">
                            <button
                                onClick={() => setRows(prev => prev + 3)}
                                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] sm:text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-[0.2em] transition-all flex items-center gap-2"
                            >
                                <span className="material-icons-outlined text-xs sm:text-sm">expand_more</span>
                                Ver mais ícones
                            </button>
                        </div>
                    )}

                    {filtered.length === 0 && (
                        <div className="text-center py-16 sm:py-20">
                            <span className="material-icons-outlined text-gray-700 text-4xl sm:text-5xl mb-3 sm:mb-4 block">search_off</span>
                            <p className="text-gray-500 text-xs sm:text-sm italic font-light">Nenhum ícone encontrado para "{search}"</p>
                        </div>
                    )}
                </div>

                <div className="p-4 sm:p-6 bg-black/20 border-t border-white/5 text-center shrink-0">
                    <p className="text-[8px] sm:text-[9px] text-gray-600 uppercase font-black tracking-widest">Estilo Minimalista • Chip Race Design System</p>
                </div>
            </div>
        </div>
    );
};

// ─── Main BadgesTab ────────────────────────────────────────────────────────────
export const BadgesTab: React.FC<BadgesTabProps> = ({
    targetType, setTargetType, searchQuery, setSearchQuery, description, setDescription,
    selectedBadgeId, setSelectedBadgeId, searchResults, setSearchResults,
    badgeTemplates, selectedUsers, setSelectedUsers, usersWithSelectedBadge,
    handleSendBadges, handleSearch, onCreateBadgeTemplate, onUpdateBadgeTemplate, isLoading
}) => {
    const [showNewBadgeForm, setShowNewBadgeForm] = React.useState(false);
    const [newBadge, setNewBadge] = React.useState({ title: '', description: '', icon: 'stars', color: '#00E5FF', is_archived: false });
    const [showIconPicker, setShowIconPicker] = React.useState(false);
    const [badgeSearchFilter, setBadgeSearchFilter] = React.useState('');

    const [editingBadgeId, setEditingBadgeId] = React.useState<string | null>(null);
    const [viewBadgeUsers, setViewBadgeUsers] = React.useState<any>(null);

    const handleSaveBadge = async () => {
        if (!newBadge.title) return;

        // Check for duplicates (same icon AND same color)
        const isDuplicate = badgeTemplates.some(b =>
            b.id !== editingBadgeId &&
            b.icon === newBadge.icon &&
            (b.color === newBadge.color || (!b.color && newBadge.color === '#00E5FF'))
        );

        if (isDuplicate) {
            alert('⚠️ Já existe uma insígnia com este mesmo ícone e cor. Use uma combinação única!');
            return;
        }

        if (editingBadgeId && onUpdateBadgeTemplate) {
            await onUpdateBadgeTemplate(editingBadgeId, newBadge);
        } else if (onCreateBadgeTemplate) {
            await onCreateBadgeTemplate(newBadge);
        }
        
        setShowNewBadgeForm(false);
        setEditingBadgeId(null);
        setNewBadge({ title: '', description: '', icon: 'stars', color: '#00E5FF', is_archived: false });
    };

    const handleEditBadge = (b: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setNewBadge({ 
            title: b.title, 
            description: b.description || '', 
            icon: b.icon || 'stars', 
            color: b.color || '#00E5FF',
            is_archived: b.is_archived || false
        });
        setEditingBadgeId(b.id);
        setShowNewBadgeForm(true);
        // Scroll to top to ensure form is visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleViewBadgeUsers = (b: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setViewBadgeUsers(b);
    };

    const getRarityRank = (color: string) => {
        const c = (color || '#00E5FF').toLowerCase();
        // Handle variations from BadgePreview
        if (c === '#ffd700' || c === '#eab308') return 4; // lendaria (index 4)
        if (c === '#9ca3af' || c === '#94a3b8') return 0; // comum (index 0)
        
        const index = RARITY_COLORS.findIndex(r => r.color.toLowerCase() === c);
        return index === -1 ? 99 : index;
    };


    const filteredBadgeTemplates = React.useMemo(() => {
        const filtered = badgeTemplates
            .filter(b => !b.is_archived) // Hide archived badges
            .filter(b => badgeSearchFilter ? b.title.toLowerCase().includes(badgeSearchFilter.toLowerCase()) : true);

        return filtered.sort((a, b) => {
            const iconA = a.icon || '';
            const iconB = b.icon || '';
            
            // First sort by icon
            if (iconA < iconB) return -1;
            if (iconA > iconB) return 1;
            
            // Then sort by rarity rank within the same icon
            return getRarityRank(a.color) - getRarityRank(b.color);
        });
    }, [badgeTemplates, badgeSearchFilter]);


    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-neon-pink/20 shrink-0">
                        <span className="material-icons-outlined text-primary text-2xl sm:text-3xl">badge</span>
                    </div>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-widest leading-tight">Medalhas</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">Crie, edite e conceda medalhas aos jogadores.</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setShowNewBadgeForm(!showNewBadgeForm);
                        if (showNewBadgeForm) {
                            setEditingBadgeId(null);
                            setNewBadge({ title: '', description: '', icon: 'stars', color: '#00E5FF', is_archived: false });
                        }
                    }}
                    className={`w-full sm:w-auto px-4 py-3 sm:py-2 rounded-xl border transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase shadow-neon-pink/10 ${showNewBadgeForm ? 'bg-white/5 border-white/20 text-white' : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                        }`}
                >
                    <span className="material-icons-outlined text-sm">{showNewBadgeForm ? 'close' : 'add_circle'}</span>
                    {showNewBadgeForm && editingBadgeId ? 'Cancelar Edição' : showNewBadgeForm ? 'Cancelar' : 'Nova Medalha'}
                </button>
            </div>

            {/* CREATE BADGE FORM */}
            {showNewBadgeForm && (
                <div className="bg-black/40 border border-primary/20 rounded-[2rem] sm:rounded-3xl p-4 sm:p-6 animate-in slide-in-from-top-4">
                    <h4 className="text-[11px] sm:text-sm font-black text-primary uppercase mb-6 flex items-center gap-2 px-1">
                        <span className="material-icons-outlined text-sm">{editingBadgeId ? 'edit' : 'new_label'}</span>
                        {editingBadgeId ? 'Editar Medalha Existente' : 'Lançar Nova Medalha no Banco'}
                    </h4>

                    {/* Preview */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8 p-4 sm:p-6 bg-black/30 border border-white/5 rounded-[1.5rem] sm:rounded-3xl">
                        <div className="flex justify-center sm:block">
                            <BadgePreview icon={newBadge.icon} color={newBadge.color} size="lg" active />
                        </div>
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5 sm:mb-1">
                                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/10 text-gray-400 uppercase tracking-widest">Preview</span>
                                <span
                                    className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest"
                                    style={{ backgroundColor: `${newBadge.color}20`, color: newBadge.color, border: `1px solid ${newBadge.color}40` }}
                                >
                                    {RARITY_COLORS.find(r => r.color === newBadge.color)?.label}
                                </span>
                            </div>
                            <p className="text-white font-black text-lg sm:text-xl leading-tight truncate">{newBadge.title || 'Nome da Medalha'}</p>
                            <p className="text-gray-500 text-[10px] sm:text-xs mt-1 line-clamp-2 max-w-sm mx-auto sm:mx-0">{newBadge.description || 'Explique como o jogador conquista esta honraria...'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="text-left">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Nome da Medalha</label>
                                <input
                                    type="text"
                                    value={newBadge.title}
                                    onChange={e => setNewBadge({ ...newBadge, title: e.target.value })}
                                    placeholder="Ex: Campeão 2026"
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>

                            <div className="text-left">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Raridade & Cor</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {RARITY_COLORS.map((rarity) => (
                                        <button
                                            key={rarity.id}
                                            onClick={() => setNewBadge({ ...newBadge, color: rarity.color })}
                                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${newBadge.color === rarity.color
                                                ? 'bg-white/10 border-white/20 scale-105'
                                                : 'bg-black/20 border-white/5 hover:border-white/10 opacity-60'}`}
                                            title={rarity.label}
                                        >
                                            <div
                                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-lg"
                                                style={{ 
                                                    backgroundColor: rarity.color, 
                                                    backgroundImage: rarity.color === '#ff4d79' ? 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)' : rarity.color === '#8b5cf6' ? 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' : rarity.color === '#f59e0b' ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' : 'none',
                                                    boxShadow: `0 0 10px ${rarity.color}60` 
                                                }}
                                            />
                                            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter text-gray-400 whitespace-nowrap">{rarity.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Icon picker button */}
                            <div className="text-left">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Ícone da Medalha</label>
                                <button
                                    onClick={() => setShowIconPicker(true)}
                                    className="w-full bg-[#050214] border border-white/10 hover:border-primary/50 rounded-xl px-4 py-3 flex items-center gap-3 transition-all group h-auto sm:h-[74px]"
                                >
                                    <BadgePreview icon={newBadge.icon} color={newBadge.color} size="sm" active />
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-white text-sm font-bold truncate">{BADGE_ICONS.find(i => i.id === newBadge.icon)?.label || newBadge.icon}</p>
                                        <p className="text-gray-600 text-[8px] uppercase font-black">Alterar Ícone</p>
                                    </div>
                                    <span className="material-icons-outlined text-gray-500 group-hover:text-primary transition-colors text-sm shrink-0">open_in_new</span>
                                </button>
                            </div>

                            <div className="text-left">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Descrição</label>
                                <input
                                    type="text"
                                    value={newBadge.description}
                                    onChange={e => setNewBadge({ ...newBadge, description: e.target.value })}
                                    placeholder="Explique como o jogador conquista..."
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {editingBadgeId && (
                            <div className="sm:col-span-2 text-left bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mt-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${newBadge.is_archived ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                                            <span className="material-icons-outlined text-xl">{newBadge.is_archived ? 'archive' : 'unarchive'}</span>
                                        </div>
                                        <div>
                                            <p className="text-white text-[11px] font-black uppercase tracking-widest leading-none mb-1">Arquivar Medalha</p>
                                            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">Uma vez arquivada, não poderá mais ser enviada ou editada.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setNewBadge({ ...newBadge, is_archived: !newBadge.is_archived })}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                            newBadge.is_archived 
                                                ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' 
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        {newBadge.is_archived ? 'Arquivado' : 'Arquivar'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSaveBadge}
                        disabled={isLoading || !newBadge.title}
                        className="w-full mt-6 bg-primary hover:bg-white hover:text-black text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <><span className="material-icons-outlined text-sm">save</span> {editingBadgeId ? 'Salvar Alterações' : 'Salvar Nova Medalha'}</>
                        }
                    </button>
                </div>
            )}

            {/* NEW SOVEREIGN CONTROL TOWER */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start pb-12">
                {/* 1. SELEÇÃO E CONFIGURAÇÃO (SOVEREIGN CENTER) */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-[#0c0920]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-30"></div>
                        
                        <div className="flex items-center justify-between mb-8 sm:mb-10">
                            <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                <span className="material-icons text-primary text-xl">settings_suggest</span>
                                Configuração do Envio
                            </h4>
                            <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                ADMIN MODE
                            </div>
                        </div>

                        <div className="space-y-8 text-left">
                            {/* Target Selection */}
                            <div className="space-y-4">
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Destinatários</label>
                                <div className="flex p-1.5 bg-black/40 border border-white/5 rounded-2xl gap-2">
                                    <button onClick={() => setTargetType('single')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${targetType === 'single' ? 'bg-primary text-white shadow-neon-pink border border-primary/50' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}>
                                        <span className="material-icons-outlined text-sm">{targetType === 'single' ? 'check_circle' : 'person'}</span>
                                        Específicos
                                    </button>
                                    <button onClick={() => setTargetType('all')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${targetType === 'all' ? 'bg-red-500/20 border border-red-500/40 text-red-500' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}>
                                        <span className="material-icons-outlined text-sm">groups</span>
                                        TODOS ({searchResults.length || '...'})
                                    </button>
                                </div>
                            </div>

                            {/* Badge Selection Library */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Selecionar Medalha</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative group min-w-[150px]">
                                            <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs transition-colors group-focus-within:text-primary">search</span>
                                            <input
                                                type="text"
                                                value={badgeSearchFilter}
                                                onChange={e => setBadgeSearchFilter(e.target.value)}
                                                placeholder="Filtrar..."
                                                className="w-full bg-black/60 border border-white/10 rounded-full pl-9 pr-3 py-1.5 text-white text-[10px] font-bold outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
                                    {/* Action Card: New Badge */}
                                    {!showNewBadgeForm && (
                                        <button 
                                            onClick={() => setShowNewBadgeForm(true)}
                                            className="h-[140px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3 bg-white/[0.02] hover:bg-primary/5 hover:border-primary/30 transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                                <span className="material-icons-outlined">add</span>
                                            </div>
                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest group-hover:text-primary">Criar Nova</span>
                                        </button>
                                    )}

                                    {filteredBadgeTemplates.map(b => (
                                        <div 
                                            key={b.id}
                                            onClick={() => setSelectedBadgeId(b.id)}
                                            className={`relative h-[140px] rounded-[2rem] border-2 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group ${selectedBadgeId === b.id
                                                ? 'bg-white/5 scale-105'
                                                : 'bg-black/40 border-white/5 hover:border-white/20'
                                                }`}
                                            style={selectedBadgeId === b.id ? { borderColor: b.color || '#00E5FF', boxShadow: `0 15px 40px -10px ${(b.color || '#00E5FF')}30` } : {}}
                                        >
                                            <div className="relative">
                                                <BadgePreview icon={b.icon || 'stars'} color={b.color} size="md" active={selectedBadgeId === b.id} />
                                                {selectedBadgeId === b.id && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-[#0c0920] animate-in zoom-in">
                                                        <span className="material-icons text-white text-[10px]">check</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span 
                                                className="text-[10px] font-black uppercase tracking-tight px-3 w-full text-center truncate"
                                                style={selectedBadgeId === b.id ? { color: b.color || '#00E5FF' } : { color: 'white' }}
                                            >
                                                {b.title}
                                            </span>

                                            {/* Contextual CRUD Menu */}
                                            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                                                <button 
                                                    onClick={(e) => handleViewBadgeUsers(b, e)} 
                                                    title="Ver quem possui"
                                                    className="w-7 h-7 rounded-lg bg-black/80 border border-white/10 flex items-center justify-center hover:bg-cyan-500/20 hover:text-cyan-500 text-gray-500 transition-all"
                                                >
                                                    <span className="material-icons-outlined text-sm">group</span>
                                                </button>
                                                <button 
                                                    onClick={(e) => handleEditBadge(b, e)} 
                                                    title="Editar medalha"
                                                    className="w-7 h-7 rounded-lg bg-black/80 border border-white/10 flex items-center justify-center hover:bg-amber-500/20 hover:text-amber-500 text-gray-500 transition-all"
                                                >
                                                    <span className="material-icons-outlined text-sm">edit</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Justification & Confirm */}
                            <div className="space-y-6 pt-4 border-t border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                    <div className="md:col-span-8">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">Justificativa / Motivo</label>
                                        <div className="relative">
                                            <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 text-base">notes</span>
                                            <input 
                                                type="text" 
                                                value={description} 
                                                onChange={e => setDescription(e.target.value)}
                                                placeholder={'Ex: Desempenho fantástico na mesa final...'}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:border-primary/50 outline-none transition-all" 
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-4">
                                        <button
                                            onClick={handleSendBadges}
                                            disabled={isLoading || !selectedBadgeId || (targetType === 'single' && selectedUsers.length === 0)}
                                            className="w-full bg-primary hover:bg-white hover:text-black hover:scale-[1.02] active:scale-95 text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale disabled:pointer-events-none"
                                        >
                                            {isLoading
                                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                : <><span className="material-icons-outlined text-sm">rocket_launch</span> Confirmar</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. USER SELECTION SECTION (SIDEBAR) */}
                <div className={`lg:col-span-4 space-y-6 transition-all duration-500 ${targetType === 'all' ? 'opacity-20 pointer-events-none scale-95 blur-sm' : 'opacity-100'}`}>
                    <div className="bg-[#0c0920]/60 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 flex flex-col h-[700px]">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="material-icons-outlined text-primary text-base">person_add</span>
                                Destinatários
                            </h4>
                            <span className="text-[10px] font-black bg-primary/20 text-primary px-3 py-1 rounded-full">{selectedUsers.length}</span>
                        </div>

                        {/* Search Focus */}
                        <div className="relative mb-8 group">
                            <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors">search</span>
                            <input 
                                type="text" 
                                value={searchQuery} 
                                onChange={e => handleSearch(e.target.value)} 
                                placeholder="Buscar Jogador..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-xs outline-none focus:border-primary/40 focus:bg-primary/5 transition-all font-bold placeholder:text-gray-700" 
                            />
                            
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#120d2d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                                    {searchResults.map(u => {
                                        const alreadyHasBadge = usersWithSelectedBadge.has(u.id);
                                        return (
                                            <button
                                                key={u.id}
                                                onClick={() => {
                                                    if (!selectedUsers.find(x => x.id === u.id)) setSelectedUsers([...selectedUsers, u]);
                                                    setSearchQuery(''); setSearchResults([]);
                                                }}
                                                className={`w-full flex items-center justify-between p-4 hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0 ${alreadyHasBadge ? 'opacity-40' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-9 h-9 rounded-full object-cover border border-white/10" alt="" />
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-black text-white leading-none mb-1">{u.name}</p>
                                                        <p className="text-[8px] text-primary font-black uppercase tracking-tighter">CR#{String(u.numeric_id).padStart(3, '0')}</p>
                                                    </div>
                                                </div>
                                                {alreadyHasBadge ? (
                                                    <span className="material-icons text-amber-500 text-base">info</span>
                                                ) : (
                                                    <span className="material-icons text-gray-700 text-sm">add_circle_outline</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Selected List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                            {selectedUsers.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 grayscale">
                                    <span className="material-icons-outlined text-6xl mb-4">search_off</span>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em]">Pesquise pelo nome</p>
                                </div>
                            ) : (
                                selectedUsers.map(u => (
                                    <div key={u.id} className="group flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-white/10 transition-all animate-in fade-in slide-in-from-right-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-10 h-10 rounded-full border border-white/10 object-cover" alt="" />
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#120d2d]"></div>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-white leading-none mb-1">{u.name}</p>
                                                <p className="text-[9px] text-gray-600 font-bold uppercase">CR#{String(u.numeric_id).padStart(3, '0')}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedUsers(selectedUsers.filter(x => x.id !== u.id))} 
                                            className="w-8 h-8 rounded-xl bg-red-500/0 hover:bg-red-500 text-gray-700 hover:text-white transition-all flex items-center justify-center"
                                        >
                                            <span className="material-icons-outlined text-sm">remove_circle</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {selectedUsers.length > 0 && (
                            <button
                                onClick={() => setSelectedUsers([])}
                                className="w-full mt-6 py-3 border border-red-500/20 text-[9px] font-black text-red-500/60 hover:text-red-500 hover:bg-red-500/5 uppercase tracking-widest rounded-xl transition-all"
                            >
                                Limpar Lista
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Icon Picker Modal */}
            {showIconPicker && (
                <IconPickerModal
                    currentIcon={newBadge.icon}
                    currentColor={newBadge.color}
                    onSelect={icon => setNewBadge({ ...newBadge, icon })}
                    onClose={() => setShowIconPicker(false)}
                />
            )}

            {/* View Users Modal */}
            {viewBadgeUsers && (
                <ViewBadgeUsersModal
                    badge={viewBadgeUsers}
                    onClose={() => setViewBadgeUsers(null)}
                />
            )}
        </div>
    );
};
