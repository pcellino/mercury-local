import { supabase } from './supabase'

// ---------- Editorial Calendar CRUD ----------

export interface CreateEditorialItem {
  publication_id: string
  concept: string
  target_date: string
  status?: string
  priority?: string
  beat?: string
  author_id?: string
  notes?: string
  source_type?: string
}

export async function createEditorialItem(item: CreateEditorialItem) {
  const { data, error } = await supabase
    .from('editorial_calendar')
    .insert({
      ...item,
      status: item.status ?? 'concept',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEditorialStatus(id: string, status: string) {
  const { error } = await supabase
    .from('editorial_calendar')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function updateEditorialDate(id: string, target_date: string) {
  const { error } = await supabase
    .from('editorial_calendar')
    .update({ target_date, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function updateEditorialItem(id: string, updates: Partial<{
  concept: string
  status: string
  target_date: string
  priority: string
  beat: string
  notes: string
  author_id: string
}>) {
  const { error } = await supabase
    .from('editorial_calendar')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function killEditorialItem(id: string) {
  const { error } = await supabase
    .from('editorial_calendar')
    .update({ status: 'killed', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ---------- Post Status ----------

export async function updatePostStatus(id: string, status: string) {
  const { error } = await supabase
    .from('posts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
