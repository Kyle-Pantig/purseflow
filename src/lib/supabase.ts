import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          category: 'transportation' | 'food' | 'bills' | 'entertainment' | 'shopping' | 'healthcare' | 'education' | 'travel' | 'groceries' | 'utilities' | 'others'
          description: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          category: 'transportation' | 'food' | 'bills' | 'entertainment' | 'shopping' | 'healthcare' | 'education' | 'travel' | 'groceries' | 'utilities' | 'others'
          description?: string | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          category?: 'transportation' | 'food' | 'bills' | 'others'
          description?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
