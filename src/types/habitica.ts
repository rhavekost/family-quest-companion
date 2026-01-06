// Habitica API Types

export interface HabiticaResponse<T> {
  success: boolean;
  data: T;
  notifications?: any[];
  userV?: number;
  appVersion?: string;
}

export interface HabiticaTask {
  id: string;
  type: 'habit' | 'daily' | 'todo' | 'reward';
  text: string;
  notes: string;
  tags: string[];
  value: number;
  priority: number;
  completed?: boolean;
  isDue?: boolean;
  streak?: number;
  date?: string;
  up?: boolean;
  down?: boolean;
  counterUp?: number;
  counterDown?: number;
  checklist?: { id: string; text: string; completed: boolean }[];
  alias?: string; // Used for group task linking
}

export interface HabiticaStats {
  hp: number;
  maxHealth: number;
  mp: number;
  maxMP: number;
  exp: number;
  toNextLevel: number;
  gp: number;
  lvl: number;
  class: 'warrior' | 'mage' | 'healer' | 'rogue';
  str: number;
  con: number;
  int: number;
  per: number;
}

export interface HabiticaUser {
  id: string;
  profile: {
    name: string;
  };
  stats: HabiticaStats;
  balance: number; // Gems (stored as balance * 4 to get actual gem count)
  items: {
    gear: { equipped: Record<string, string> };
    currentPet?: string;
    currentMount?: string;
  };
}

export interface FamilyMember {
  id: string;
  displayName: string;
  color: string;
  habiticaUserId: string;
  habiticaApiToken: string;
  avatarEmoji?: string;
}

export interface FamilyMemberWithData extends FamilyMember {
  userData?: HabiticaUser;
  tasks?: HabiticaTask[];
  isLoading?: boolean;
  error?: string;
}

export type TaskType = 'habits' | 'dailys' | 'todos' | 'completedTodos' | 'rewards';

export const CLASS_COLORS: Record<string, string> = {
  warrior: 'text-warrior',
  mage: 'text-mage',
  healer: 'text-healer',
  rogue: 'text-rogue',
};

export const CLASS_ICONS: Record<string, string> = {
  warrior: '⚔️',
  mage: '🔮',
  healer: '💚',
  rogue: '🗡️',
};

export const MEMBER_COLORS = [
  { name: 'Royal Purple', value: '#6133b4' },
  { name: 'Golden Sun', value: '#ffa623' },
  { name: 'Forest Green', value: '#48bb78' },
  { name: 'Ocean Blue', value: '#2995cd' },
  { name: 'Ruby Red', value: '#e53e3e' },
  { name: 'Mystic Teal', value: '#38b2ac' },
  { name: 'Sunset Orange', value: '#ed8936' },
  { name: 'Rose Pink', value: '#ed64a6' },
  { name: 'Slate Grey', value: '#718096' },
];

export const MEMBER_AVATARS = ['🧙', '🧝', '🧚', '🦸', '🧛', '🧜', '🧞', '🦹', '🥷'];
