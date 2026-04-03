import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// queries used inline via supabase
import { updateAuthor } from '../lib/mutations'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { PUB_COLORS, PUB_SHORT } from '../lib/utils'
import { Edit2, Save, X, Mail } from 'lucide-react'

interface AuthorDetail {
  id: string
  name: string
  slug: string
  bio: string | null
  avatar_url: string | null
  email: string | null
  credentials: string | null
  beat_description: string | null
  publication_id: string | null
  publication: { name: string; slug: string } | null
  post_count: number
}

export default function Authors() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    bio: string; credentials: string; beat_description: string; email: string
  }>({ bio: '', credentials: '', beat_description: '', email: '' })

  const { data: authors, isLoading } = useQuery({
    queryKey: ['authors-detail'],
    queryFn: async (): Promise<AuthorDetail[]> => {
      const { data, error } = await supabase
        .from('authors')
        .select('id, name, slug, bio, avatar_url, email, credentials, beat_description, publication_id, publications(name, slug)')
        .order('name')
      if (error) throw error

      // Get post counts per author
      const { data: counts, error: countErr } = await supabase
        .from('posts')
        .select('author_id')
        .in('status', ['published', 'scheduled', 'draft'])
      if (countErr) throw countErr

      const countMap: Record<string, number> = {}
      for (const row of counts ?? []) {
        if (row.author_id) countMap[row.author_id] = (countMap[row.author_id] ?? 0) + 1
      }

      return (data ?? []).map((a: Record<string, unknown>) => ({
        ...a,
        publication: a.publications as AuthorDetail['publication'],
        post_count: countMap[a.id as string] ?? 0,
      })) as AuthorDetail[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: (vars: { id: string; updates: Record<string, string | null> }) =>
      updateAuthor(vars.id, vars.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors-detail'] })
      setEditingId(null)
    },
  })

  function startEdit(author: AuthorDetail) {
    setEditingId(author.id)
    setEditForm({
      bio: author.bio ?? '',
      credentials: author.credentials ?? '',
      beat_description: author.beat_description ?? '',
      email: author.email ?? '',
    })
  }

  function saveEdit(id: string) {
    saveMutation.mutate({
      id,
      updates: {
        bio: editForm.bio || null,
        credentials: editForm.credentials || null,
        beat_description: editForm.beat_description || null,
        email: editForm.email || null,
      },
    })
  }

  // Group by publication
  const grouped = (authors ?? []).reduce<Record<string, AuthorDetail[]>>((acc, a) => {
    const key = a.publication?.name ?? 'Unassigned'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-4">
        <p className="text-[13px] text-[var(--color-text-muted)]">
          {authors?.length ?? 0} authors across all publications
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading authors...</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([pubName, pubAuthors]) => {
            const pubSlug = pubAuthors[0]?.publication?.slug ?? ''
            return (
              <div key={pubName}>
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: PUB_COLORS[pubSlug] ?? '#6366f1' }}
                  >
                    {(PUB_SHORT[pubSlug] ?? pubSlug.slice(0, 2).toUpperCase()).slice(0, 2)}
                  </span>
                  {pubName}
                </h2>
                <div className="space-y-3">
                  {pubAuthors.map((author) => (
                    <div
                      key={author.id}
                      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {author.avatar_url ? (
                            <img src={author.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-accent-hover)]">
                              {author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <h3 className="text-sm font-semibold">{author.name}</h3>
                            <p className="text-[11px] text-[var(--color-text-muted)]">
                              {author.credentials ?? author.slug}
                              {author.email && (
                                <span className="ml-2 inline-flex items-center gap-1">
                                  <Mail size={10} /> {author.email}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {author.post_count} posts
                          </span>
                          {user && editingId !== author.id && (
                            <button
                              onClick={() => startEdit(author)}
                              className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {author.beat_description && editingId !== author.id && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-2 pl-[52px]">
                          <span className="text-[var(--color-text)]">Beat:</span> {author.beat_description}
                        </p>
                      )}

                      {author.bio && editingId !== author.id && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 pl-[52px] line-clamp-2">{author.bio}</p>
                      )}

                      {/* Edit form */}
                      {editingId === author.id && (
                        <div className="mt-3 pl-[52px] space-y-2">
                          <div>
                            <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Credentials</label>
                            <input
                              value={editForm.credentials}
                              onChange={(e) => setEditForm({ ...editForm, credentials: e.target.value })}
                              className="mt-0.5 w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Beat Description</label>
                            <input
                              value={editForm.beat_description}
                              onChange={(e) => setEditForm({ ...editForm, beat_description: e.target.value })}
                              className="mt-0.5 w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Email</label>
                            <input
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="mt-0.5 w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Bio</label>
                            <textarea
                              value={editForm.bio}
                              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                              rows={3}
                              className="mt-0.5 w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1.5 text-xs"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(author.id)}
                              disabled={saveMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded text-xs font-medium transition-colors"
                            >
                              <Save size={12} /> Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-surface-2)] text-[var(--color-text-muted)] rounded text-xs hover:text-[var(--color-text)] transition-colors"
                            >
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
