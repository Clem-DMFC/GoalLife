export type Macro = 'kcal' | 'protein' | 'carbs' | 'fat'

export type Targets = {
  user_id: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  updated_at: string | null
}

export type FoodEntry = {
  id: string
  user_id: string
  day: string
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  created_at: string
}

export type Weight = {
  id: string
  user_id: string
  day: string
  kg: number
}

/** Ingrédient d'un plat composé, tel que stocké dans favorites.items. */
export type RecipeItem = { name: string; grams: number } & MacroTotals

export type Favorite = {
  id: string
  user_id: string
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  items: RecipeItem[] | null
  created_at: string
}

export type MacroTotals = Record<Macro, number>

export const EMPTY_TOTALS: MacroTotals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

export const DEFAULT_TARGETS: MacroTotals = {
  kcal: 2800,
  protein: 140,
  carbs: 390,
  fat: 78,
}

/** Schéma minimal pour typer le client Supabase. */
export type Database = {
  public: {
    Tables: {
      targets: {
        Row: Targets
        Insert: Partial<Targets>
        Update: Partial<Targets>
        Relationships: []
      }
      food_entries: {
        Row: FoodEntry
        Insert: Omit<FoodEntry, 'id' | 'user_id' | 'created_at'> &
          Partial<Pick<FoodEntry, 'id' | 'user_id' | 'created_at'>>
        Update: Partial<FoodEntry>
        Relationships: []
      }
      weights: {
        Row: Weight
        Insert: Omit<Weight, 'id' | 'user_id'> & Partial<Pick<Weight, 'id' | 'user_id'>>
        Update: Partial<Weight>
        Relationships: []
      }
      favorites: {
        Row: Favorite
        Insert: Omit<Favorite, 'id' | 'user_id' | 'created_at'> &
          Partial<Pick<Favorite, 'id' | 'user_id' | 'created_at'>>
        Update: Partial<Favorite>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
