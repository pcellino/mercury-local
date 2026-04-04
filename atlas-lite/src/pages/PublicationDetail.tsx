import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PublicationDetail() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div>
      <Link to="/" className="flex items-center gap-1 text-sm text-mercury-muted hover:text-mercury-accent mb-4 transition-colors">
        <ArrowLeft size={14} /> Back to Home
      </Link>
      <h2 className="text-lg font-black text-mercury-ink mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        {slug}
      </h2>
      <div className="rule-double mb-4" />
      <p className="text-sm text-mercury-muted">Publication detail pages with tabs — coming in Phase 2.</p>
    </div>
  )
}
