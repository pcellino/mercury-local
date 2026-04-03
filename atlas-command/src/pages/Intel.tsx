import { useSearchParams } from 'react-router-dom'
import FeedMonitor from './FeedMonitor'
import Competitors from './Competitors'
import Transcripts from './Transcripts'
import Sources from './Sources'

const TABS = [
  { id: 'feeds', label: 'Feeds' },
  { id: 'competitors', label: 'Competitors' },
  { id: 'transcripts', label: 'Transcripts' },
  { id: 'sources', label: 'Sources' },
] as const

type TabId = typeof TABS[number]['id']

export default function Intel() {
  const [params, setParams] = useSearchParams()
  const activeTab = (params.get('tab') as TabId) || 'feeds'

  function setTab(tab: TabId) {
    setParams({ tab })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Intel</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1">Feeds, competitors, transcripts, and source documents</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-[var(--color-border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`px-4 py-2.5 text-[13px] font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-[var(--color-accent-hover)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-accent-hover)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'feeds' && <FeedMonitor />}
      {activeTab === 'competitors' && <Competitors />}
      {activeTab === 'transcripts' && <Transcripts />}
      {activeTab === 'sources' && <Sources />}
    </div>
  )
}
