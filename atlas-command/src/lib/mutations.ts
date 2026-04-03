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

export async function duplicateEditorialItem(id: string) {
  const { data: original, error: fetchError } = await supabase
    .from('editorial_calendar')
    .select('publication_id, concept, target_date, priority, beat, author_id, notes')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const newTargetDate = tomorrow.toISOString().split('T')[0]

  const { error: insertError } = await supabase
    .from('editorial_calendar')
    .insert({
      publication_id: original.publication_id,
      concept: original.concept,
      target_date: newTargetDate,
      priority: original.priority,
      beat: original.beat,
      author_id: original.author_id,
      notes: original.notes,
      status: 'concept',
    })

  if (insertError) throw insertError
}

// ---------- Post CRUD ----------

export async function updatePostStatus(id: string, status: string) {
  const { error } = await supabase
    .from('posts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export interface UpdatePostPayload {
  title?: string
  slug?: string
  excerpt?: string | null
  content?: string | null
  author_id?: string | null
  publication_id?: string | null
  status?: string
  featured?: boolean
  hero_image_url?: string | null
  hero_image_alt?: string | null
  hero_image_width?: number | null
  hero_image_height?: number | null
  pub_date?: string | null
  beat?: string | null
  seo_title?: string | null
  meta_description?: string | null
  summary?: string | null
  follow_up_by?: string | null
  follow_up_note?: string | null
}

export async function updatePost(id: string, updates: UpdatePostPayload) {
  const { error } = await supabase
    .from('posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ---------- Page CRUD ----------

export interface UpdatePagePayload {
  title?: string
  slug?: string
  content?: string | null
  status?: string | null
  publication_id?: string | null
  hub_beat?: string | null
  hub_tag?: string | null
  hub_limit?: number | null
  hub_heading?: string | null
  seo_title?: string | null
  meta_description?: string | null
}

export async function updatePage(id: string, updates: UpdatePagePayload) {
  const { error } = await supabase
    .from('pages')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ---------- Publication CRUD ----------

export interface UpdatePublicationPayload {
  name?: string
  tagline?: string | null
  region?: string | null
  domain?: string | null
  description?: string | null
  logo_url?: string | null
  status?: string | null
  social_links?: Record<string, string>
  primary_color?: string | null
}

export async function updatePublication(id: string, updates: UpdatePublicationPayload) {
  const { error } = await supabase
    .from('publications')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ---------- Author CRUD ----------

export interface UpdateAuthorPayload {
  name?: string
  bio?: string | null
  avatar_url?: string | null
  email?: string | null
  credentials?: string | null
  beat_description?: string | null
}

export async function updateAuthor(id: string, updates: UpdateAuthorPayload) {
  const { error } = await supabase
    .from('authors')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

// ---------- Publication Log CRUD ----------

export async function updatePublicationLog(id: string, content: string) {
  const { error } = await supabase
    .from('publication_logs')
    .update({ content, last_updated: new Date().toISOString(), updated_by: 'atlas-command', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ---------- Feed Source CRUD ----------

export interface CreateFeedSourcePayload {
  publication_id: string
  name: string
  url: string
  feed_type?: string
  beat_category?: string
  notes?: string
}

export async function createFeedSource(data: CreateFeedSourcePayload) {
  const { data: result, error } = await supabase
    .from('feed_sources')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return result
}

export async function updateFeedSource(id: string, updates: Partial<{
  name: string
  url: string
  feed_type: string
  beat_category: string | null
  active: boolean
  notes: string | null
}>) {
  const { error } = await supabase
    .from('feed_sources')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteFeedSource(id: string) {
  const { error } = await supabase
    .from('feed_sources')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ---------- Voice Profile CRUD ----------

export async function updateVoiceProfile(id: string, content: string) {
  const { error } = await supabase
    .from('voice_profiles')
    .update({ content, last_updated: new Date().toISOString(), updated_by: 'atlas-command', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ---------- Beat Research CRUD ----------

export interface UpdateBeatResearchPayload {
  beat_name?: string
  beat_category?: string | null
  content?: string
  updated_by?: string
}

export async function updateBeatResearch(id: string, updates: UpdateBeatResearchPayload) {
  const { error } = await supabase
    .from('beat_research')
    .update({ ...updates, last_updated: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function createBeatResearch(data: {
  publication_id: string
  beat_name: string
  beat_slug: string
  beat_category?: string
  content?: string
}) {
  const { data: result, error } = await supabase
    .from('beat_research')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return result
}

// ---------- Tag Management ----------

export async function addTagToPost(postId: string, tagId: string) {
  const { error } = await supabase
    .from('post_tags')
    .insert({ post_id: postId, tag_id: tagId })
  if (error) throw error
}

export async function removeTagFromPost(postId: string, tagId: string) {
  const { error } = await supabase
    .from('post_tags')
    .delete()
    .eq('post_id', postId)
    .eq('tag_id', tagId)
  if (error) throw error
}
