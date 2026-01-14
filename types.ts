
export interface Card {
  id: string;
  vocab: string;
  meaning: string;
}

export interface Section {
  id: string;
  title: string;
  description: string;
  cards: Card[];
  createdAt: number;
}

export type ViewMode = 'dashboard' | 'edit' | 'flashcard' | 'quiz';
