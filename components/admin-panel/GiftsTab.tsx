import React from 'react';

interface GiftsTabProps {
    giftTarget: 'single' | 'all';
    setGiftTarget: (t: 'single' | 'all') => void;
    giftType: 'brl' | 'chipz' | 'badge';
    setGiftType: (t: 'brl' | 'chipz' | 'badge') => void;
    giftAmount: string;
    setGiftAmount: (a: string) => void;
    giftSearchQuery: string;
    setGiftSearchQuery: (q: string) => void;
    giftDescription: string;
    setGiftDescription: (d: string) => void;
    selectedBadgeId: string;
    setSelectedBadgeId: (id: string) => void;
    giftSearchResults: any[];
    setGiftSearchResults: (res: any[]) => void;
    badgeTemplates: any[];
    selectedGiftUsers: any[];
    setSelectedGiftUsers: (users: any[]) => void;
    usersWithSelectedBadge: Set<string>;
    handleSendGifts: () => Promise<void>;
    handleGiftSearch: (query: string) => Promise<void>;
    onCreateBadgeTemplate?: (badge: any) => Promise<void>;
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

// ─── Badge Preview Component ─────────────────────────────────────────────────
const BadgePreview: React.FC<{ icon: string; color?: string; size?: 'sm' | 'lg'; active?: boolean }> = ({ icon, color = '#00E5FF', size = 'sm', active }) => {
    const isLg = size === 'lg';
    return (
        <div
            className={`relative flex items-center justify-center transition-all duration-300 ${isLg ? 'w-20 h-20 rounded-[2rem]' : 'w-12 h-12 rounded-2xl'
                } ${active ? 'border-2' : 'border border-white/10'}`}
            style={{
                backgroundColor: active ? `${color}26` : 'rgba(255,255,255,0.05)',
                borderColor: active ? color : 'rgba(255,255,255,0.1)',
                color: active ? color : '#9ca3af',
                boxShadow: active ? `0 0 20px ${color}40` : 'none'
            }}
        >
            <span className={`material-icons-outlined ${isLg ? 'text-4xl' : 'text-2xl'}`}>{icon}</span>
            {active && (
                <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0c0920] animate-pulse"
                    style={{ backgroundColor: color }}
                />
            )}
        </div>
    );
};

const RARITY_COLORS = [
    { id: 'comum', label: 'Comum', color: '#00E5FF' }, // Azul Clara / Cyan
    { id: 'incomum', label: 'Incomum', color: '#22c55e' }, // Verde
    { id: 'rara', label: 'Rara', color: '#ec4899' }, // Rosa
    { id: 'epica', label: 'Épica', color: '#ef4444' }, // Vermelha
    { id: 'lendaria', label: 'Lendária', color: '#eab308' }, // Dourada
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0c0920] border border-white/10 rounded-[2.5rem] w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-8 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center">
                            <span className="material-icons-outlined text-primary text-2xl">grid_view</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-widest leading-none mb-1">Escolher ícone</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{filtered.length} ícones disponíveis</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all group">
                        <span className="material-icons-outlined text-gray-500 group-hover:text-white text-xl">close</span>
                    </button>
                </div>

                {/* Search */}
                <div className="px-8 py-4">
                    <div className="relative group">
                        <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg group-focus-within:text-primary transition-colors">search</span>
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setRows(3); }}
                            placeholder="Buscar ícone... (ex: troféu, estrela, fogo)"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-primary/50 focus:bg-primary/5 transition-all font-bold"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="overflow-y-auto flex-1 px-8 pb-4 pt-2 custom-scrollbar">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                        {displayedIcons.map(icon => (
                            <button
                                key={icon.id}
                                onClick={() => { onSelect(icon.id); onClose(); }}
                                className="group flex flex-col items-center gap-2"
                            >
                                <BadgePreview icon={icon.id} size="sm" active={currentIcon === icon.id} color={currentColor} />
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter truncate w-full text-center group-hover:text-white transition-colors">{icon.label}</span>
                            </button>
                        ))}
                    </div>

                    {hasMore && (
                        <div className="mt-8 mb-4 flex justify-center">
                            <button
                                onClick={() => setRows(prev => prev + 3)}
                                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-[0.2em] transition-all flex items-center gap-2"
                            >
                                <span className="material-icons-outlined text-sm">expand_more</span>
                                Ver mais ícones
                            </button>
                        </div>
                    )}

                    {filtered.length === 0 && (
                        <div className="text-center py-20">
                            <span className="material-icons-outlined text-gray-700 text-5xl mb-4">search_off</span>
                            <p className="text-gray-500 text-sm italic font-light">Nenhum ícone encontrado para "{search}"</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-black/20 border-t border-white/5 text-center">
                    <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Estilo Minimalista • Chip Race Design System</p>
                </div>
            </div>
        </div>
    );
};

// ─── Main GiftsTab ────────────────────────────────────────────────────────────
export const GiftsTab: React.FC<GiftsTabProps> = ({
    giftTarget, setGiftTarget, giftType, setGiftType, giftAmount, setGiftAmount,
    giftSearchQuery, setGiftSearchQuery, giftDescription, setGiftDescription,
    selectedBadgeId, setSelectedBadgeId, giftSearchResults, setGiftSearchResults,
    badgeTemplates, selectedGiftUsers, setSelectedGiftUsers, usersWithSelectedBadge,
    handleSendGifts, handleGiftSearch, onCreateBadgeTemplate, isLoading
}) => {
    const [showNewBadgeForm, setShowNewBadgeForm] = React.useState(false);
    const [newBadge, setNewBadge] = React.useState({ title: '', description: '', icon: 'stars', color: '#00E5FF' });
    const [showIconPicker, setShowIconPicker] = React.useState(false);
    const [badgeSearchFilter, setBadgeSearchFilter] = React.useState('');

    const handleCreateBadge = async () => {
        if (!onCreateBadgeTemplate || !newBadge.title) return;

        // Check for duplicates (same icon AND same color)
        const isDuplicate = badgeTemplates.some(b =>
            b.icon === newBadge.icon &&
            (b.color === newBadge.color || (!b.color && newBadge.color === '#00E5FF'))
        );

        if (isDuplicate) {
            alert('⚠️ Já existe uma insígnia com este mesmo ícone e cor. Use uma combinação única!');
            return;
        }

        await onCreateBadgeTemplate(newBadge);
        setShowNewBadgeForm(false);
        setNewBadge({ title: '', description: '', icon: 'stars', color: '#00E5FF' });
    };

    const filteredBadgeTemplates = badgeSearchFilter
        ? badgeTemplates.filter(b => b.title.toLowerCase().includes(badgeSearchFilter.toLowerCase()))
        : badgeTemplates;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-neon-pink/20">
                        <span className="material-icons-outlined text-primary text-3xl">stars</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest">Prêmios &amp; Honrarias</h3>
                        <p className="text-gray-400 text-sm">Distribua créditos, fichas ou insígnias por mérito ou glória.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowNewBadgeForm(!showNewBadgeForm)}
                    className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-[10px] font-black uppercase hover:bg-primary/20 transition-all flex items-center gap-2 shadow-neon-pink/10"
                >
                    <span className="material-icons-outlined text-sm">{showNewBadgeForm ? 'close' : 'add_circle'}</span>
                    {showNewBadgeForm ? 'Cancelar' : 'Criar Nova Insígnia'}
                </button>
            </div>

            {/* CREATE BADGE FORM */}
            {showNewBadgeForm && (
                <div className="mb-8 bg-black/40 border border-primary/20 rounded-3xl p-6 animate-in slide-in-from-top-4">
                    <h4 className="text-sm font-black text-primary uppercase mb-6 flex items-center gap-2">
                        <span className="material-icons-outlined text-sm">new_label</span>
                        Lançar Nova Insígnia no Banco
                    </h4>

                    {/* Preview */}
                    <div className="flex items-center gap-6 mb-8 p-6 bg-black/30 border border-white/5 rounded-3xl">
                        <BadgePreview icon={newBadge.icon} color={newBadge.color} size="lg" active />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/10 text-gray-400 uppercase tracking-widest">Preview</span>
                                <span
                                    className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest"
                                    style={{ backgroundColor: `${newBadge.color}20`, color: newBadge.color, border: `1px solid ${newBadge.color}40` }}
                                >
                                    {RARITY_COLORS.find(r => r.color === newBadge.color)?.label}
                                </span>
                            </div>
                            <p className="text-white font-black text-xl leading-tight truncate">{newBadge.title || 'Nome da Insígnia'}</p>
                            <p className="text-gray-500 text-xs mt-1 line-clamp-2">{newBadge.description || 'Explique como o jogador conquista esta honraria...'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Nome da Insígnia</label>
                                <input
                                    type="text"
                                    value={newBadge.title}
                                    onChange={e => setNewBadge({ ...newBadge, title: e.target.value })}
                                    placeholder="Ex: Campeão 2026"
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>

                            <div>
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
                                                className="w-6 h-6 rounded-full shadow-lg"
                                                style={{ backgroundColor: rarity.color, boxShadow: `0 0 10px ${rarity.color}60` }}
                                            />
                                            <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">{rarity.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Icon picker button */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Ícone da Insígnia</label>
                            <button
                                onClick={() => setShowIconPicker(true)}
                                className="w-full bg-[#050214] border border-white/10 hover:border-primary/50 rounded-xl px-4 py-3 flex items-center gap-3 transition-all group h-[74px]"
                            >
                                <BadgePreview icon={newBadge.icon} color={newBadge.color} size="sm" active />
                                <div className="flex-1 text-left">
                                    <p className="text-white text-sm font-bold">{BADGE_ICONS.find(i => i.id === newBadge.icon)?.label || newBadge.icon}</p>
                                    <p className="text-gray-600 text-[9px] uppercase font-black">Alterar Ícone · {BADGE_ICONS.length}+ opções</p>
                                </div>
                                <span className="material-icons-outlined text-gray-500 group-hover:text-primary transition-colors text-sm">open_in_new</span>
                            </button>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Descrição</label>
                            <input
                                type="text"
                                value={newBadge.description}
                                onChange={e => setNewBadge({ ...newBadge, description: e.target.value })}
                                placeholder="Explique como o jogador conquista esta honraria..."
                                className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-500 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleCreateBadge}
                        disabled={isLoading || !newBadge.title}
                        className="w-full mt-6 bg-primary hover:bg-white hover:text-black text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <><span className="material-icons-outlined text-sm">save</span> Salvar Nova Insígnia</>
                        }
                    </button>
                </div>
            )}

            {/* SEND GIFTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration */}
                <div className="space-y-6">
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                        <h4 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
                            <span className="material-icons-outlined text-primary text-sm">settings</span>
                            Configuração do Prêmio
                        </h4>

                        <div className="space-y-4">
                            {/* Target */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Para quem?</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setGiftTarget('single')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftTarget === 'single' ? 'bg-primary border-primary text-white shadow-neon-pink' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                        Usuários Específicos
                                    </button>
                                    <button onClick={() => setGiftTarget('all')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftTarget === 'all' ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                        TODOS
                                    </button>
                                </div>
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Tipo de Recompensa</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setGiftType('brl')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftType === 'brl' ? 'bg-primary border-primary text-white shadow-neon-pink' : 'bg-white/5 border-white/10 text-gray-400'}`}>R$</button>
                                    <button onClick={() => setGiftType('chipz')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftType === 'chipz' ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>Chipz</button>
                                    <button onClick={() => setGiftType('badge')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftType === 'badge' ? 'bg-primary border-primary text-white shadow-neon-pink' : 'bg-white/5 border-white/10 text-gray-400'}`}>Insígnia</button>
                                </div>
                            </div>

                            {/* Badge selector OR amount */}
                            {giftType === 'badge' ? (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Selecionar Insígnia</label>
                                        <span className="text-[9px] text-gray-600">{badgeTemplates.length} insígnias</span>
                                    </div>
                                    {badgeTemplates.length > 4 && (
                                        <input
                                            type="text"
                                            value={badgeSearchFilter}
                                            onChange={e => setBadgeSearchFilter(e.target.value)}
                                            placeholder="Filtrar insígnias..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-primary/40 mb-2 transition-colors"
                                        />
                                    )}
                                    <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                                        {filteredBadgeTemplates.map(b => (
                                            <button
                                                key={b.id}
                                                onClick={() => setSelectedBadgeId(b.id)}
                                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all hover:scale-105 ${selectedBadgeId === b.id
                                                    ? 'bg-white/5'
                                                    : 'bg-black/20 border-white/5 hover:border-primary/20'
                                                    }`}
                                                style={selectedBadgeId === b.id ? { borderColor: b.color || '#00E5FF', boxShadow: `0 0 15px ${(b.color || '#00E5FF')}40` } : {}}
                                            >
                                                <BadgePreview icon={b.icon || 'stars'} color={b.color} size="sm" active={selectedBadgeId === b.id} />
                                                <span
                                                    className="text-[10px] font-black uppercase truncate w-full text-center"
                                                    style={selectedBadgeId === b.id ? { color: b.color || '#00E5FF' } : { color: 'white' }}
                                                >
                                                    {b.title}
                                                </span>
                                            </button>
                                        ))}
                                        {filteredBadgeTemplates.length === 0 && (
                                            <div className="col-span-2 text-center py-6 text-gray-600 text-xs italic">
                                                Nenhuma insígnia encontrada. Crie uma acima!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Quantidade</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">{giftType === 'brl' ? 'R$' : 'C'}</span>
                                        <input type="number" value={giftAmount} onChange={e => setGiftAmount(e.target.value)} placeholder="0.00"
                                            className="w-full bg-[#050214] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm font-black focus:border-primary outline-none transition-all" />
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Justificativa / Motivo</label>
                                <input type="text" value={giftDescription} onChange={e => setGiftDescription(e.target.value)}
                                    placeholder={giftType === 'badge' ? 'Ex: Membro Honorário por serviços prestados...' : 'Ex: Presente de Natal, Bônus VIP...'}
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none" />
                            </div>

                            <button
                                onClick={handleSendGifts}
                                disabled={isLoading || (giftType !== 'badge' && !giftAmount) || (giftType === 'badge' && !selectedBadgeId)}
                                className="w-full bg-primary hover:bg-white hover:text-black text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                            >
                                {isLoading
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <><span className="material-icons-outlined text-sm">verified</span> Confirmar Recompensas</>
                                }
                            </button>
                        </div>
                    </div>
                </div>

                {/* User Selection */}
                <div className={`space-y-6 transition-all ${giftTarget === 'all' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                        <h4 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
                            <span className="material-icons-outlined text-primary text-sm">person_search</span>
                            Selecionar Destinatários ({selectedGiftUsers.length})
                        </h4>

                        <div className="relative mb-6">
                            <input type="text" value={giftSearchQuery} onChange={e => handleGiftSearch(e.target.value)} placeholder="Buscar por Nome ou CR#"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all" />
                            {giftSearchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0720] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20">
                                    {giftSearchResults.map(u => {
                                        const alreadyHasBadge = giftType === 'badge' && usersWithSelectedBadge.has(u.id);
                                        return (
                                            <button
                                                key={u.id}
                                                onClick={() => {
                                                    if (!selectedGiftUsers.find(x => x.id === u.id)) setSelectedGiftUsers([...selectedGiftUsers, u]);
                                                    setGiftSearchQuery(''); setGiftSearchResults([]);
                                                }}
                                                className={`w-full flex items-center justify-between p-3 hover:bg-primary/20 text-left border-b border-white/5 last:border-0 ${alreadyHasBadge ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" alt="" />
                                                    <div>
                                                        <p className="text-xs font-bold text-white">{u.name}</p>
                                                        <p className="text-[10px] text-primary font-black uppercase">CR#{String(u.numeric_id).padStart(3, '0')}</p>
                                                    </div>
                                                </div>
                                                {alreadyHasBadge && (
                                                    <div className="flex items-center gap-1.5 text-amber-500/80 bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10">
                                                        <span className="material-icons text-xs">info</span>
                                                        <span className="text-[9px] font-black uppercase tracking-wider">Já possui</span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {selectedGiftUsers.length === 0 ? (
                                <div className="text-center py-8 text-gray-600 border border-dashed border-white/5 rounded-2xl">
                                    <p className="text-xs italic">Nenhum usuário selecionado.</p>
                                </div>
                            ) : selectedGiftUsers.map(u => {
                                const alreadyHasBadge = giftType === 'badge' && usersWithSelectedBadge.has(u.id);
                                return (
                                    <div key={u.id} className={`bg-white/5 border rounded-xl p-3 flex items-center justify-between transition-all ${alreadyHasBadge ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/10'}`}>
                                        <div className="flex items-center gap-3">
                                            <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" alt="" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-white">{u.name}</p>
                                                    {alreadyHasBadge && (
                                                        <span className="text-[7px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded font-black uppercase">Atenção</span>
                                                    )}
                                                </div>
                                                {alreadyHasBadge
                                                    ? <p className="text-[9px] text-amber-500/60 font-bold italic mt-0.5">Jogador já possui esta honraria.</p>
                                                    : <p className="text-[10px] text-gray-500">Saldo: R$ {Number(u.balance_brl || 0).toFixed(2)} · {u.balance_chipz || 0} Chipz</p>
                                                }
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedGiftUsers(selectedGiftUsers.filter(x => x.id !== u.id))} className="text-gray-500 hover:text-red-500 transition-colors">
                                            <span className="material-icons-outlined text-base">remove_circle_outline</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
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
        </div>
    );
};
