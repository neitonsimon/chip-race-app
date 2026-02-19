
export interface TournamentCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: 'primary' | 'secondary' | 'purple' | 'pink';
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
  name: string;
  position: number;
  prize: number;
  isVip: boolean;
  calculatedPoints: number;
  pointsPerRanking?: Record<string, number>; // Points specific to each ranking
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
}

// NOVA INTERFACE PARA RANKINGS DINÂMICOS
export type CriterionType = 'participants' | 'buyin' | 'itm' | 'winnings' | 'rake' | 'spent' | 'isFt' | 'isVip';

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
}

export interface MonthData {
  name: string;
  qualifiers: number | string;
  prize: string;
  status: 'active' | 'completed' | 'locked';
}

export interface Message {
  id: string;
  from: string;
  subject: string;
  content: string;
  date: string;
  read: boolean;
}

export type RankingFormula = 'weekly' | 'monthly' | 'special' | 'cash_online' | 'mtt_online' | 'sit_n_go' | 'satellite';

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
}