
export interface TournamentCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: 'primary' | 'secondary' | 'cyan' | 'pink';
  slots: number; // Número de vagas fixas/editáveis
}

export interface NavLink {
  label: string;
  view: string;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Interface para resultados de fechamento de evento (Movida para cima para ser usada em Event)
export interface PlayerResult {
  id: string;
  userId?: string;
  name: string;
  position: number;
  prize: number;
  isVip: boolean;
  calculatedPoints: number;
  pointsPerRanking?: Record<string, number>; // Points specific to each ranking
  rake?: number; // For Cash Games
  profitLoss?: number; // For Cash Games
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'live' | 'online';
  buyin: string;
  guaranteed: string;
  status: 'open' | 'closed' | 'running';
  // Novos campos detalhados
  rankingType?: 'weekly' | 'monthly' | 'special'; // Novo campo para definir peso do ranking
  includedRankings?: string[]; // 'annual', 'quarterly', 'legacy'
  description?: string;
  stack?: string;
  blinds?: string;
  lateReg?: string;
  location?: string;
  // Detalhes extras de estrutura
  rebuyValue?: string;
  rebuyChips?: string;
  addonValue?: string;
  addonChips?: string;
  // Dual Values & Files requested
  staffBonusValue?: string;
  staffBonusChips?: string;
  timeChipValue?: string;
  timeChipChips?: string;
  // --- New Cash Game Properties ---
  gameMode?: 'tournament' | 'cash_game';
  cashGameType?: 'omaha4' | 'omaha5' | 'texas';
  cashGameBlinds?: string;
  cashGameCapacity?: string;
  cashGameMinMax?: string;
  cashGameDinner?: boolean;
  cashGameNotes?: string;
  flyerUrl?: string;
  // Double Options (Novos campos)
  doubleRebuyValue?: string;
  doubleRebuyChips?: string;
  doubleAddonValue?: string;
  doubleAddonChips?: string;
  // Produtos Paralelos
  parallelProducts?: string[]; // Array de IDs: 'last-longer', 'jackpot', etc.
  // Resultados Finais e Estatísticas (Campos atualizados)
  results?: PlayerResult[];
  totalRebuys?: number;
  totalAddons?: number;
  totalPrize?: number; // Alterado de totalStaff para totalPrize
  scoringSchemaId?: string; // ID of the scoring formula to use
}

export interface RankingPlayer {
  id?: string;
  numericId?: number;
  rank: number;
  name: string;
  avatar: string;
  points: number;
  city: string;
  change: 'up' | 'down' | 'same';
  manualPrize?: string;
  // Campos estendidos para perfil completo
  bio?: string;
  social?: {
    instagram?: string;
    twitter?: string;
    discord?: string;
  };
  playStyles?: string[];
  gallery?: string[];
  // Gamification fields (Optional on generic ranking list to save bandwidth, required on profile)
  level?: number;
  currentExp?: number;
  nextLevelExp?: number;
  lastDailyClaim?: string; // ISO Date String
  isVip?: boolean; // Legacy
  vipStatus?: 'nao_vip' | 'trimestral' | 'anual' | 'master';
  vipExpiresAt?: string;
  balanceBrl?: number;
  balanceChipz?: number;
}

export interface ChipzPackage {
  id: string;
  amount: number;
  price: number;
  stock: number;
  popular: boolean;
  active: boolean;
}

// NOVA INTERFACE PARA RANKINGS DINÂMICOS
export type CriterionType = 'participants' | 'buyin' | 'itm' | 'winnings' | 'rake' | 'spent' | 'isFt' | 'isVip' | 'profit_loss';

export interface ScoringCriterion {
  id: string;
  type: CriterionType;
  label: string; // Ex: "Total de Participantes", "Mesa Final"
  dataType: 'integer' | 'boolean';
  operation?: 'multiply' | 'divide' | 'sum'; // sum is for boolean fixed points
  value: number; // The factor or fixed points
}

export interface ScoringSchema {
  id: string;
  name: string; // Ex: "Semanal", "Mensal", "Especial"
  criteria: ScoringCriterion[];
  positionPoints?: { [position: number]: number }; // Rank-based fixed points
}

export interface RankingInstance {
  id: string;
  label: string; // ex: "Anual", "Cash Game", "Novatos"
  description: string; // Subtítulo
  rules: string; // Regulamento específico
  startDate?: string;
  endDate?: string;
  prizeInfoTitle?: string; // ex: "3 Vagas Diretas"
  prizeInfoDetail?: string; // ex: "Os 3 jogadores que mais somarem..."
  players: RankingPlayer[];
  scoringSchemas?: ScoringSchema[]; // Fallback schemas
  scoringSchemaMap?: Record<string, string>; // Maps event.rankingType (weekly, monthly, special) to scoringSchemaId
}

export interface TournamentResult {
  date: string;
  eventName: string;
  position: number;
  points: number;
  prize: string;
}

export interface PlayerStats {
  id: string;
  numericId?: number;
  name: string;
  avatar: string;
  city: string;
  bio: string;
  rank: number;
  points: number;
  winnings: string;
  titles: number;
  itm: string;
  gallery: string[];
  playStyles: string[];
  social: {
    instagram?: string;
    twitter?: string;
    discord?: string;
  };
  tournamentLog: TournamentResult[];
  // Gamification Fields
  level: number;
  currentExp: number;
  nextLevelExp: number;
  lastDailyClaim: string | null; // ISO timestamp do último resgate
  dailyStreak: number;
  isVip: boolean; // Legacy
  vipStatus: 'nao_vip' | 'trimestral' | 'anual' | 'master';
  vipExpiresAt: string | null;
  balanceBrl: number;
  balanceChipz: number;
}

export interface MonthData {
  name: string;
  qualifiers: number | string;
  prize: string;
  status: 'active' | 'completed' | 'locked';
}

export type MessageCategory = 'system' | 'admin' | 'private' | 'bonus' | 'tournament' | 'poll';

export interface Message {
  id: string;
  from: string;
  senderId?: string;
  subject: string;
  content: string;
  date: string;
  read: boolean;
  category: MessageCategory;
  pollId?: string;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  active: boolean;
  createdAt: string;
}

export interface PollVote {
  poll_id: string;
  user_id: string;
  option_index: number;
}

export interface ExperienceLevel {
  level: number;
  required_exp: number;
}

export interface DailyReward {
  day: number;
  reward_type: 'xp' | 'chipz' | 'brl';
  reward_value: number;
  reward_label: string | null;
}

export interface ChipzPackage {
  id: string;
  name: string;
  amount: number;
  bonus: number;
  price_brl: number;
  active: boolean;
  image_url: string | null;
}

export type RankingFormula = 'weekly' | 'monthly' | 'special' | 'cash_online' | 'mtt_online' | 'sit_n_go' | 'satellite' | 'legacy_weekly' | 'legacy_monthly' | 'legacy_special';

export type QualificationMode = 'rankings' | 'jackpot' | 'last_longer' | 'bet' | 'bet_up' | 'sng_sat' | 'quests' | 'vip';

export interface TheChosenQualifier {
  id: string;
  user_id?: string;
  player_name: string;
  mode: QualificationMode;
  created_at: string;
}

// SIMULAÇÃO DO BANCO DE DADOS DE CONTEÚDO
export interface ContentDB {
  hero: {
    title_line1: string;
    title_line2_prefix: string;
    subtitle: string;
    timeline_title: string;
    btn_ranking: string;
    btn_details: string;
  };
  details: {
    header_title: string;
    header_subtitle: string;
    concept_title: string;
    concept_desc: string;
    plus_title: string;
    plus_desc: string;
    ways_title: string;
  };
  // Adicione mais seções conforme necessário
  categories: TournamentCategory[]; // Categories são dinâmicas agora
  faq?: { question: string; answer: string }[];
  timeline?: { year: string; title: string; description: string; imageUrl?: string }[];
}