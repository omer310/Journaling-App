export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tags?: string[];
  mood?: 'happy' | 'sad' | 'neutral' | 'excited' | 'anxious' | 'calm';
  source?: 'mobile' | 'web';
} 