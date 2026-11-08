import { MonsterRecord, MonsterStatus } from '../../types';

export type ExploreMode = 'creatures' | 'discover';
export type FilterCategory = 'all' | 'catalogue' | 'foundational' | 'saved';

export interface ExploreCreatureItem {
  id: string;
  name: string;
  index?: number;
  archetypeId?: string;
  archetypeName?: string;
  isFoundational?: boolean;
  isFoundationalDragon?: boolean;
  workingMeaning?: string;
  subtitle?: string;
  category?: string;
  temperament?: string;
  manifestation?: string;
  voice?: string;
  roots?: string;
  somaticFeeling?: string;
  inquiry?: string;
  status?: MonsterStatus;
  isCustom?: boolean;
  foundationalDragons?: ExploreCreatureItem[];
}

export interface DiscoverChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}
