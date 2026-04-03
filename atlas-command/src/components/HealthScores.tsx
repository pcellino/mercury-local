import { useQuery } from '@tanstack/react-query'
import { getPublicationHealthScores, type HealthScore } from '../lib/queries'
import { Activity } from 'lucide-react'

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-400'
  if (score >= 60) return 'bg-yellow-400'
  if (score >= 40) return 'bg-orange-400'
  return 'bg-red-400'
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--color-text-muted)] w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${scoreBg(value)}`}
          style={{ width: `${value}%`, opacity: 0.7 }}
        />
      </div>
      <span className={`text-[10px] font-mono w-8 text-right ${scoreColor(value)}`}>{value}</span>
    </div>
  )
}

export default function HealthScores() {
  const { data: scores, isLoading } = useQuery({
    queryKey: ['health-scores'],
    queryFn: getPublicationHealthScores,
    staleTime: 300_000, // 5 min — this query is heavy
  })

  if (isLoading) return null

  if (!scores?.length) return null

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
        <Activity size={14} className="text-[var(--color-accent)]" />
        Publication Health
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {scores.map(s => (
          <HealthCard key={s.publication_id} score={s} />
        ))}
      </div>
    </div>
  )
}

function HealthCard({ score }: { score: HealthScore }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--color-text)]">{score.pub_name}</span>
        <span className={`text-lg font-bold ${scoreColor(score.overall_score)}`}>
          {score.overall_score}
        </span>
      </div>
      <div className="space-y-1.5">
        <ScoreBar value={score.velocity_score} label="Velocity" />
        <ScoreBar value={score.beat_coverage_score} label="Beats" />
        <ScoreBar value={score.hub_freshness_score} label="Hubs" />
        <ScoreBar value={score.pipeline_depth_score} label="Pipeline" />
      </div>
      <div className="mt-3 pt-2 border-t border-[var(--color-border)] grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)]">Posts/wk</p>
          <p className="text-xs font-medium text-[var(--color-text)]">
            {score.details.posts_this_week}/{score.details.weekly_target}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)]">Beats</p>
          <p className="text-xs font-medium text-[var(--color-text)]">
            {score.details.active_beats}/{score.details.total_beats}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)]">Pipeline</p>
          <p className="text-xs font-medium text-[var(--color-text)]">
            {score.details.pipeline_items}
          </p>
        </div>
      </div>
    </div>
  )
}

// Compact version for Publication page
export function HealthScoreCompact({ pubId }: { pubId: string }) {
  const { data: scores } = useQuery({
    queryKey: ['health-scores'],
    queryFn: getPublicationHealthScores,
    staleTime: 300_000,
  })

  const score = scores?.find(s => s.publication_id === pubId)
  if (!score) return null

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
          <Activity size={14} className="text-[var(--color-accent)]" />
          Health Score
        </span>
        <span className={`text-2xl font-bold ${scoreColor(score.overall_score)}`}>
          {score.overall_score}
        </span>
      </div>
      <div className="space-y-1.5">
        <ScoreBar value={score.velocity_score} label="Velocity" />
        <ScoreBar value={score.beat_coverage_score} label="Beats" />
        <ScoreBar value={score.hub_freshness_score} label="Hubs" />
        <ScoreBar value={score.pipeline_depth_score} label="Pipeline" />
      </div>
      <div className="mt-3 pt-2 border-t border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)]">
        {score.details.posts_this_week} posts this week (target: {score.details.weekly_target}) · {score.details.active_beats}/{score.details.total_beats} beats active · {score.details.fresh_hubs}/{score.details.total_hubs} hubs fresh · {score.details.pipeline_items} in pipeline
      </div>
    </div>
  )
}
