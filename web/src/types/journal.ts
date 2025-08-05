export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tags?: string[];
  mood?: 'happy' | 'sad' | 'neutral' | 'excited' | 'anxious' | 'calm';
  source?: 'mobile' | 'web';
  font_family?: string;
} 