export type Macro = 'kcal' | 'protein' | 'carbs' | 'fat'

/** Repas auquel une entrée est rattachée. `null` = entrée non classée. */
export type MealType = 'petit_dej' | 'dejeuner' | 'diner' | 'collation'

export type Targets = {
  user_id: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  water_ml: number
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
  meal_type: MealType | null
  created_at: string
}

/** Total d'eau bu sur un jour — une ligne par (user, jour). */
export type Water = {
  user_id: string
  day: string
  ml: number
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

/** Objectifs éditables : les 4 macros + l'eau. */
export type TargetValues = MacroTotals & { water_ml: number }

export const DEFAULT_TARGETS: TargetValues = {
  kcal: 2800,
  protein: 140,
  carbs: 390,
  fat: 78,
  water_ml: 3000,
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
        Insert: Omit<FoodEntry, 'id' | 'user_id' | 'created_at' | 'meal_type'> &
          Partial<Pick<FoodEntry, 'id' | 'user_id' | 'created_at' | 'meal_type'>>
        Update: Partial<FoodEntry>
        Relationships: []
      }
      water: {
        Row: Water
        Insert: Omit<Water, 'user_id'> & Partial<Pick<Water, 'user_id'>>
        Update: Partial<Water>
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
    Functions: {
      /** Incrément atomique du total d'eau ; renvoie le nouveau total en ml. */
      add_water: {
        Args: { delta: number; target_day: string }
        Returns: number
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
