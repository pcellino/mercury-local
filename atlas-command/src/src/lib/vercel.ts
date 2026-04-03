// Vercel deployment data types and fetcher
// For Phase 2, deployments are fetched via Vite proxy to avoid CORS
// In production, this would go through a Supabase Edge Function

export interface Deployment {
  id: string
  state: string
  created: number
  target: string | null
  commitMessage: string
  commitSha: string
  commitRef: string
  inspectorUrl: string
}

export const VERCEL_PROJECT_ID = 'prj_RcVrZmi0O4SJsnZlQ59rr3n02OtQ'
export const VERCEL_TEAM_ID = 'team_5iQ0kejBcy7jEXS9D7TMotZq'

export async function getDeployments(): Promise<Deployment[]> {
  try {
    const res = await fetch(
      `/api/vercel/deployments?projectId=${VERCEL_PROJECT_ID}&teamId=${VERCEL_TEAM_ID}&limit=20`
    )
    if (!res.ok) throw new Error('Vercel API unavailable')
    const data = await res.json()
    return (data.deployments?.deployments ?? data.deployments ?? []).map((d: any) => ({
      id: d.id,
      state: d.state,
      created: d.created,
      target: d.target,
      commitMessage: d.meta?.githubCommitMessage ?? '(no message)',
      commitSha: d.meta?.githubCommitSha?.slice(0, 7) ?? '',
      commitRef: d.meta?.githubCommitRef ?? '',
      inspectorUrl: d.inspectorUrl ?? '',
    }))
  } catch {
    // Fallback: return empty (Vercel proxy not configured)
    return []
  }
}
