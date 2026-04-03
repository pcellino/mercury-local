import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import RecentPosts from './RecentPosts'
import Tags from './Tags'
import Authors from './Authors'
import Hubs from './Hubs'

const TABS = [
  { id: 'posts', label: 'Posts' },
  { id: 'tags', label: 'Tags' },
  { id: 'authors', label: 'Authors' },
  { id: 'hubs', label: 'Hub Pages' },
] as const

type TabId = typeof TABS[number]['id']

export default function Content() {
  const [params, setParams] = useSearchParams()
  const activeTab = (params.get('tab') as TabId) || 'posts'

  function setTab(tab: TabId) {
    setParams({ tab })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Content</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1">Manage posts, tags, authors, and hub pages</p>
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
      {activeTab === 'posts' && <RecentPosts />}
      {activeTab === 'tags' && <Tags />}
      {activeTab === 'authors' && <Authors />}
      {activeTab === 'hubs' && <Hubs />}
    </div>
  )
}
