// Auto-generated via `mcp__supabase__generate_typescript_types`.
// Regenerate na elke migratie. Niet handmatig bewerken.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      dish_ingredients: {
        Row: {
          amount: number
          dish_id: string
          ingredient_id: string
        }
        Insert: {
          amount: number
          dish_id: string
          ingredient_id: string
        }
        Update: {
          amount?: number
          dish_id?: string
          ingredient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'dish_ingredients_dish_id_fkey'
            columns: ['dish_id']
            isOneToOne: false
            referencedRelation: 'dishes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dish_ingredients_ingredient_id_fkey'
            columns: ['ingredient_id']
            isOneToOne: false
            referencedRelation: 'ingredients'
            referencedColumns: ['id']
          },
        ]
      }
      dishes: {
        Row: {
          course_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          portions: number
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          portions?: number
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          portions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'dishes_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'event_courses'
            referencedColumns: ['id']
          },
        ]
      }
      event_courses: {
        Row: {
          created_at: string
          event_id: string
          id: string
          name: string
          position: number
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          name: string
          position: number
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: 'event_courses_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_date: string
          guest_count: number
          id: string
          location_cost_cents: number
          location_name: string | null
          name: string
          notes: string | null
          ticket_price_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_date: string
          guest_count?: number
          id?: string
          location_cost_cents?: number
          location_name?: string | null
          name: string
          notes?: string | null
          ticket_price_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_date?: string
          guest_count?: number
          id?: string
          location_cost_cents?: number
          location_name?: string | null
          name?: string
          notes?: string | null
          ticket_price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount_cents: number
          category: string
          created_at: string
          description: string
          event_id: string
          id: string
        }
        Insert: {
          amount_cents: number
          category: string
          created_at?: string
          description: string
          event_id: string
          id?: string
        }
        Update: {
          amount_cents?: number
          category?: string
          created_at?: string
          description?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'expenses_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          dietary: string | null
          event_id: string
          id: string
          name: string
          notes: string | null
          party_size: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dietary?: string | null
          event_id: string
          id?: string
          name: string
          notes?: string | null
          party_size?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dietary?: string | null
          event_id?: string
          id?: string
          name?: string
          notes?: string | null
          party_size?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'guests_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      ingredients: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          price_per_unit_cents: number
          purchase_unit: string | null
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          price_per_unit_cents?: number
          purchase_unit?: string | null
          supplier?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          price_per_unit_cents?: number
          purchase_unit?: string | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  T extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][T]['Row']

export type TablesInsert<
  T extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][T]['Insert']

export type TablesUpdate<
  T extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][T]['Update']
