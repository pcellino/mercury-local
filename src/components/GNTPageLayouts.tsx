import Link from "next/link";
import type { Page, Post } from "@/lib/types";
import { decodeHtmlEntities, formatDate, estimateReadingTime } from "@/lib/content";
import PostCard from "./PostCard";

// -------------------------------------------------------
// Shared types & helpers
// -------------------------------------------------------
interface GNTLayoutProps {
  page: Page;
  contentHtml: string;
  hubPosts: Post[];
}

/** Extract a clean display name by stripping the "— Type" suffix from GNT page titles */
function displayName(title: string): string {
  return title.replace(/\s*[—–-]\s*(Driver Profile|Team Profile|Track Guide).*$/i, "").trim();
}

// -------------------------------------------------------
// DRIVER PROFILE LAYOUT — Magazine Spread
// -------------------------------------------------------
function DriverProfileLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  const name = displayName(page.title);

  return (
    <div className="gnt-page gnt-driver-profile">
      {/* Hero */}
      <div className="gnt-hero gnt-hero-gradient">
        <div className="gnt-container">
          <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/page/driver-directory">Driver Profiles</Link>
            <span>/</span>
            <span>{name}</span>
          </nav>
          <h1 className="gnt-title gnt-title-xl">{name}</h1>
        </div>
      </div>

      {/* Body: 2-column */}
      <div className="gnt-container">
        <div className="gnt-two-col">
          <div className="gnt-main">
            <div
              className="gnt-article-content article-content font-serif"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
          <aside className="gnt-sidebar">
            {hubPosts.length > 0 && (
              <div className="gnt-sidebar-section">
                <h3 className="gnt-sidebar-heading">GNT Coverage</h3>
                {hubPosts.slice(0, 5).map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.beat}/${post.slug}`}
                    className="gnt-story-link"
                  >
                    <h4>{decodeHtmlEntities(post.title)}</h4>
                    <span className="gnt-story-meta">
                      {post.beat && <>{post.beat}</>}
                      {post.pub_date && <> · {formatDate(post.pub_date)}</>}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// TEAM PROFILE LAYOUT
// -------------------------------------------------------
function TeamProfileLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  const name = displayName(page.title);

  return (
    <div className="gnt-page gnt-team-profile">
      <div className="gnt-hero gnt-hero-gradient">
        <div className="gnt-container">
          <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/page/team-directory">Team Profiles</Link>
            <span>/</span>
            <span>{name}</span>
          </nav>
          <h1 className="gnt-title gnt-title-xl">{name}</h1>
        </div>
      </div>

      <div className="gnt-container">
        <div className="gnt-two-col">
          <div className="gnt-main">
            <div
              className="gnt-article-content article-content font-serif"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
          <aside className="gnt-sidebar">
            {hubPosts.length > 0 && (
              <div className="gnt-sidebar-section">
                <h3 className="gnt-sidebar-heading">GNT Coverage</h3>
                {hubPosts.slice(0, 5).map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.beat}/${post.slug}`}
                    className="gnt-story-link"
                  >
                    <h4>{decodeHtmlEntities(post.title)}</h4>
                    <span className="gnt-story-meta">
                      {post.beat && <>{post.beat}</>}
                      {post.pub_date && <> · {formatDate(post.pub_date)}</>}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// TRACK GUIDE LAYOUT — Specs + Narrative
// -------------------------------------------------------
function TrackGuideLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  const name = displayName(page.title);

  return (
    <div className="gnt-page gnt-track-guide">
      <div className="gnt-hero gnt-hero-gradient">
        <div className="gnt-container">
          <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Track Guides</span>
            <span>/</span>
            <span>{name}</span>
          </nav>
          <h1 className="gnt-title gnt-title-xl">{name}</h1>
        </div>
      </div>

      <div className="gnt-container">
        <div className="gnt-two-col">
          <div className="gnt-main gnt-main-bordered">
            <div
              className="gnt-article-content article-content font-serif"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
          <aside className="gnt-sidebar">
            {hubPosts.length > 0 && (
              <div className="gnt-sidebar-section">
                <h3 className="gnt-sidebar-heading">GNT Coverage</h3>
                {hubPosts.slice(0, 5).map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.beat}/${post.slug}`}
                    className="gnt-story-link"
                  >
                    <h4>{decodeHtmlEntities(post.title)}</h4>
                    <span className="gnt-story-meta">
                      {post.beat && <>{post.beat}</>}
                      {post.pub_date && <> · {formatDate(post.pub_date)}</>}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// SERIES GUIDE LAYOUT — Reference + TOC feel
// -------------------------------------------------------
function SeriesGuideLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  const name = decodeHtmlEntities(page.title);

  return (
    <div className="gnt-page gnt-series-guide">
      <div className="gnt-hero gnt-hero-gradient gnt-hero-center">
        <div className="gnt-container">
          <div className="gnt-section-label">Complete Series Guide</div>
          <h1 className="gnt-title gnt-title-lg">{name}</h1>
          {page.meta_description && (
            <p className="gnt-hero-sub">{page.meta_description}</p>
          )}
        </div>
      </div>

      <div className="gnt-container">
        <div className="gnt-wide-content">
          <div
            className="gnt-article-content article-content font-serif"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// DIRECTORY LAYOUT — Card Grid feel
// -------------------------------------------------------
function DirectoryLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  return (
    <div className="gnt-page gnt-directory">
      <div className="gnt-hero">
        <div className="gnt-container">
          <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>{decodeHtmlEntities(page.title)}</span>
          </nav>
          <h1 className="gnt-title gnt-title-xl">{decodeHtmlEntities(page.title)}</h1>
          {page.meta_description && (
            <p className="gnt-hero-sub">{page.meta_description}</p>
          )}
        </div>
      </div>

      <div className="gnt-container">
        <div className="gnt-wide-content">
          <div
            className="gnt-article-content article-content font-serif"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// SCHEDULE LAYOUT
// -------------------------------------------------------
function ScheduleLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  return (
    <div className="gnt-page gnt-schedule">
      <div className="gnt-hero">
        <div className="gnt-container">
          <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/page/schedules">Schedules</Link>
            <span>/</span>
            <span>{decodeHtmlEntities(page.title)}</span>
          </nav>
          <h1 className="gnt-title gnt-title-xl">{decodeHtmlEntities(page.title)}</h1>
        </div>
      </div>

      <div className="gnt-container">
        <div className="gnt-wide-content">
          <div
            className="gnt-article-content article-content font-serif"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// DEFAULT GNT LAYOUT (about, contact, staff, legal, etc.)
// -------------------------------------------------------
function DefaultGNTLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  const readingTime = estimateReadingTime(page.content || "");

  return (
    <div className="gnt-page gnt-default">
      <div className="gnt-container">
        <nav className="gnt-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>{decodeHtmlEntities(page.title)}</span>
        </nav>
        <header className="gnt-page-header">
          <h1 className="gnt-title gnt-title-lg">{decodeHtmlEntities(page.title)}</h1>
        </header>
        <div className="gnt-narrow-content">
          <div
            className="gnt-article-content article-content font-serif"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// HUB PAGE LAYOUT (beat pages with article feeds)
// -------------------------------------------------------
function HubPageLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  return (
    <div className="gnt-page gnt-hub">
      <div className="gnt-hero gnt-hero-gradient">
        <div className="gnt-container">
          <h1 className="gnt-title gnt-title-xl">{decodeHtmlEntities(page.title)}</h1>
          {page.meta_description && (
            <p className="gnt-hero-sub">{page.meta_description}</p>
          )}
        </div>
      </div>

      <div className="gnt-container">
        {contentHtml && contentHtml.trim().length > 0 && (
          <div className="gnt-hub-intro">
            <div
              className="gnt-article-content article-content font-serif"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        )}

        {hubPosts.length > 0 && (
          <div className="gnt-two-col gnt-hub-feed">
            <div className="gnt-main">
              {/* Lead story */}
              {hubPosts[0] && (
                <div className="gnt-lead-story">
                  <PostCard post={hubPosts[0]} showBeat={!page.hub_beat} />
                </div>
              )}
              {/* Rest of posts */}
              <div className="gnt-post-list">
                {hubPosts.slice(1).map((post) => (
                  <PostCard key={post.id} post={post} showBeat={!page.hub_beat} />
                ))}
              </div>
            </div>
            <aside className="gnt-sidebar">
              <div className="gnt-sidebar-section">
                <h3 className="gnt-sidebar-heading">Quick Links</h3>
                <div className="gnt-quick-links">
                  <Link href="/page/driver-directory" className="gnt-quick-link">Driver Directory</Link>
                  <Link href="/page/team-directory" className="gnt-quick-link">Team Directory</Link>
                  <Link href="/page/schedules" className="gnt-quick-link">Schedules</Link>
                  <Link href="/standings" className="gnt-quick-link">Standings</Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// ROUTER — picks the right layout based on page_type
// -------------------------------------------------------
export default function GNTPageLayout({ page, contentHtml, hubPosts }: GNTLayoutProps) {
  switch (page.page_type) {
    case "driver_profile":
      return <DriverProfileLayout page={page} contentHtml={contentHtml} hubPosts={hubPosts} />;
    case "team_profile":
      return <TeamProfileLayout page={page} contentHtml={contentHtml} hubPosts={hubPosts} />;
    case "track_guide":
      return <TrackGuideLayout page={page} contentHtml={contentHtml} hubPosts={hubPosts} />;
    case "series_guide":
      return <SeriesGuideLayout page={page} contentHtml={contentHtml} hubPosts={hubPosts} />;
    case "directory":
      return <DirectoryLayout page={page} contentHtml={contentHtml} hubPosts={hubPosts} />;
    case "schedule":
      return <ScheduleLayout page={page} contentHtml={contentHtml} hubPosts={hubPosts} />;
    case "hub":
      return <HubPageLayout page={page} contentHtml={contentHtml} hubPosts={hubPosts} />;
    default:
      return <DefaultGNTLayout page={page} contentHtml={contentHtml} hubPosts={hubPosts} />;
  }
}
