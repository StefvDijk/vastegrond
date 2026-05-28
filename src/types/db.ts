// Raw DB row types — snake_case matches D1 column names returned by the Worker API.
// Do NOT import from @supabase/supabase-js here.

export type EventRow = {
  id: string
  name: string
  event_date: string
  guest_count: number
  ticket_price_cents: number
  location_name: string | null
  location_cost_cents: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type CourseRow = {
  id: string
  position: number
  name: string
  created_at: string
}

export type DishRow = {
  id: string
  course_id: string
  name: string
  portions: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type IngredientRow = {
  id: string
  name: string
  unit: string
  price_per_unit_cents: number
  purchase_unit: string | null
  supplier: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type DishIngredientRow = {
  dish_id: string
  ingredient_id: string
  amount: number
}

export type GuestRow = {
  id: string
  event_id: string
  name: string
  status: 'invited' | 'confirmed' | 'declined' | 'tentative'
  party_size: number
  dietary: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type TeamMemberRow = {
  id: string
  email: string
  display_name: string | null
  created_at: string
}

export type ExpenseRow = {
  id: string
  category: string
  description: string
  amount_cents: number
  created_at: string
}

export type NoteRow = {
  id: string
  title: string
  body: string
  tags: string  // JSON string e.g. '["tag1","tag2"]'
  dish_id: string | null
  course_id: string | null
  author_id: string | null
  created_at: string
  updated_at: string
}

export type InspirationRow = {
  id: string
  title: string
  note: string
  url: string | null
  image_path: string | null
  tags: string  // JSON string e.g. '["tag1","tag2"]'
  dish_id: string | null
  course_id: string | null
  author_id: string | null
  created_at: string
  updated_at: string
}
