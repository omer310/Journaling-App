import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      journal_entries: {
        Row: {
          id: string;
          title: string;
          content: string;
          date: string;
          tags: string[];
          user_id: string;
          source: 'web' | 'mobile';
          last_modified: string;
          mood: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          date?: string;
          tags?: string[];
          user_id: string;
          source?: 'web' | 'mobile';
          last_modified?: string;
          mood?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          date?: string;
          tags?: string[];
          user_id?: string;
          source?: 'web' | 'mobile';
          last_modified?: string;
          mood?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}; 