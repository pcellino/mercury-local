"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { BeatConfig } from "@/lib/types";
import { decodeHtmlEntities } from "@/lib/content";

interface BeatDropdownNavProps {
  beats: BeatConfig[];
  hubsByBeat: Record<string, Array<{ slug: string; title: string }>>;
  publicationSlug?: string;
}

// Team pages render at /sports/{slug}, not /page/{slug}
const SPORTS_TEAM_SLUGS = new Set(["hornets", "panthers", "charlotte-fc", "carolina-ascent-fc", "knights", "checkers", "nascar"]);

// -------------------------------------------------------
// Consolidated nav config — publication-specific
// Publications not listed here use the default flat beat nav.
// -------------------------------------------------------
interface NavGroup {
  label: string;
  href: string;
  /** Beat slugs whose hub pages should appear in this group's dropdown */
  childBeats: string[];
  /** Additional links to show in the dropdown (sub-beat links) */
  childLinks?: Array<{ label: string; href: string }>;
}

const NAV_GROUPS: Record<string, NavGroup[]> = {
  "charlotte-mercury": [
    {
      label: "Government",
      href: "/government",
      childBeats: ["government", "elections"],
      childLinks: [
        { label: "All Government", href: "/government" },
        { label: "Elections", href: "/elections" },
      ],
    },
    {
      label: "Sports",
      href: "/sports",
      childBeats: ["sports"],
    },
    {
      label: "News",
      href: "/business",
      childBeats: ["business", "education", "community", "culture"],
      childLinks: [
        { label: "Business", href: "/business" },
        { label: "Education", href: "/education" },
        { label: "Community", href: "/community" },
        { label: "Culture", href: "/culture" },
      ],
    },
    {
      label: "Opinion",
      href: "/opinion",
      childBeats: ["opinion"],
    },
  ],
};

// -------------------------------------------------------
// Grouped Nav (consolidated — e.g. CLT Mercury)
// -------------------------------------------------------
function GroupedNav({
  groups,
  hubsByBeat,
}: {
  groups: NavGroup[];
  hubsByBeat: Record<string, Array<{ slug: string; title: string }>>;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      ref={navRef}
      className="relative z-40 hidden md:flex items-center justify-center gap-0 py-3 border-b-2 border-mercury-ink"
    >
      {groups.map((group, i) => {
        // Collect hub pages for all child beats in this group
        const groupHubs: Array<{ slug: string; title: string }> = [];
        for (const beatSlug of group.childBeats) {
          const hubs = hubsByBeat[beatSlug];
          if (hubs) {
            for (const hub of hubs) {
              groupHubs.push(hub);
            }
          }
        }

        const hasChildLinks = group.childLinks && group.childLinks.length > 0;
        const hasHubs = groupHubs.length > 0;
        const hasDropdown = hasChildLinks || hasHubs;

        return (
          <span key={group.label} className="flex items-center">
            {i > 0 && (
              <span className="text-mercury-rule mx-1 text-xs">|</span>
            )}

            {hasDropdown ? (
              <span className="relative">
                <span className="flex items-center">
                  <Link
                    href={group.href}
                    className="px-2 py-1 text-sm font-sans font-semibold text-mercury-ink hover:text-mercury-accent transition-colors whitespace-nowrap uppercase tracking-wide"
                  >
                    {group.label}
                  </Link>
                  <button
                    onClick={() =>
                      setOpenGroup(openGroup === group.label ? null : group.label)
                    }
                    className="text-mercury-muted hover:text-mercury-accent transition-colors -ml-1 px-1 py-1"
                    aria-label={`Show ${group.label} sections`}
                    aria-expanded={openGroup === group.label}
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${
                        openGroup === group.label ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </span>

                {/* Dropdown */}
                {openGroup === group.label && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-mercury-rule shadow-lg z-50 min-w-[220px]">
                    {/* Child beat links (sub-sections) */}
                    {group.childLinks?.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-sm font-sans font-semibold text-mercury-ink hover:bg-stone-50 hover:text-mercury-accent transition-colors"
                        onClick={() => setOpenGroup(null)}
                      >
                        {link.label}
                      </Link>
                    ))}

                    {/* Divider between beats and hub pages */}
                    {hasChildLinks && hasHubs && (
                      <div className="border-t border-mercury-rule" />
                    )}

                    {/* Hub pages */}
                    {groupHubs.map((hub) => (
                      <Link
                        key={hub.slug}
                        href={
                          SPORTS_TEAM_SLUGS.has(hub.slug)
                            ? `/sports/${hub.slug}`
                            : `/page/${hub.slug}`
                        }
                        className="block px-4 py-2 text-sm font-sans text-mercury-muted hover:bg-stone-50 hover:text-mercury-accent transition-colors"
                        onClick={() => setOpenGroup(null)}
                      >
                        {decodeHtmlEntities(hub.title)}
                      </Link>
                    ))}
                  </div>
                )}
              </span>
            ) : (
              <Link
                href={group.href}
                className="px-2 py-1 text-sm font-sans font-semibold text-mercury-ink hover:text-mercury-accent transition-colors whitespace-nowrap uppercase tracking-wide"
              >
                {group.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

// -------------------------------------------------------
// Flat Nav (default — FM, SB, and any other publication)
// -------------------------------------------------------
function FlatNav({
  beats,
  hubsByBeat,
}: {
  beats: BeatConfig[];
  hubsByBeat: Record<string, Array<{ slug: string; title: string }>>;
}) {
  const [openBeat, setOpenBeat] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenBeat(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      ref={navRef}
      className="relative z-40 hidden md:flex items-center justify-center gap-0 py-3 border-b-2 border-mercury-ink"
    >
      {beats.map((beat, i) => {
        const hubs = hubsByBeat[beat.slug];
        const hasDropdown = hubs && hubs.length > 0;

        return (
          <span key={beat.slug} className="flex items-center">
            {i > 0 && (
              <span className="text-mercury-rule mx-1 text-xs">|</span>
            )}

            {hasDropdown ? (
              <span className="relative">
                <span className="flex items-center">
                  <Link
                    href={`/${beat.slug}`}
                    className="px-2 py-1 text-sm font-sans font-semibold text-mercury-ink hover:text-mercury-accent transition-colors whitespace-nowrap uppercase tracking-wide"
                  >
                    {beat.label}
                  </Link>
                  <button
                    onClick={() =>
                      setOpenBeat(openBeat === beat.slug ? null : beat.slug)
                    }
                    className="text-mercury-muted hover:text-mercury-accent transition-colors -ml-1 px-1 py-1"
                    aria-label={`Show ${beat.label} guides`}
                    aria-expanded={openBeat === beat.slug}
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${
                        openBeat === beat.slug ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </span>

                {openBeat === beat.slug && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-mercury-rule shadow-lg z-50 min-w-[200px]">
                    <Link
                      href={`/${beat.slug}`}
                      className="block px-4 py-2 text-sm font-sans font-semibold text-mercury-ink hover:bg-stone-50 hover:text-mercury-accent transition-colors border-b border-mercury-rule"
                      onClick={() => setOpenBeat(null)}
                    >
                      All {beat.label} Coverage
                    </Link>
                    {hubs.map((hub) => (
                      <Link
                        key={hub.slug}
                        href={
                          SPORTS_TEAM_SLUGS.has(hub.slug)
                            ? `/sports/${hub.slug}`
                            : `/page/${hub.slug}`
                        }
                        className="block px-4 py-2 text-sm font-sans text-mercury-ink hover:bg-stone-50 hover:text-mercury-accent transition-colors"
                        onClick={() => setOpenBeat(null)}
                      >
                        {decodeHtmlEntities(hub.title)}
                      </Link>
                    ))}
                  </div>
                )}
              </span>
            ) : (
              <Link
                href={`/${beat.slug}`}
                className="px-2 py-1 text-sm font-sans font-semibold text-mercury-ink hover:text-mercury-accent transition-colors whitespace-nowrap uppercase tracking-wide"
              >
                {beat.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

// -------------------------------------------------------
// Mobile Nav — hamburger toggle with slide-down menu
// -------------------------------------------------------
function MobileNav({
  beats,
  hubsByBeat,
  groups,
}: {
  beats: BeatConfig[];
  hubsByBeat: Record<string, Array<{ slug: string; title: string }>>;
  groups?: NavGroup[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Build the links for mobile: either from groups (CLT Mercury) or flat beats
  const mobileLinks: Array<{
    label: string;
    href: string;
    hubs: Array<{ slug: string; title: string }>;
  }> = [];

  if (groups) {
    for (const group of groups) {
      const groupHubs: Array<{ slug: string; title: string }> = [];
      for (const beatSlug of group.childBeats) {
        const hubs = hubsByBeat[beatSlug];
        if (hubs) groupHubs.push(...hubs);
      }
      mobileLinks.push({ label: group.label, href: group.href, hubs: groupHubs });
    }
  } else {
    for (const beat of beats) {
      const hubs = hubsByBeat[beat.slug] || [];
      mobileLinks.push({ label: beat.label, href: `/${beat.slug}`, hubs });
    }
  }

  return (
    <div className="md:hidden border-b-2 border-mercury-ink">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-muted">
          Sections
        </span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-mercury-muted hover:text-mercury-ink transition-colors p-1"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <nav className="px-4 pb-4 flex flex-col gap-1">
          {mobileLinks.map((section) => (
            <div key={section.href}>
              <Link
                href={section.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 font-sans text-sm font-semibold uppercase tracking-wide text-mercury-ink hover:text-mercury-accent transition-colors no-underline"
              >
                {section.label}
              </Link>
              {section.hubs.length > 0 && (
                <div className="pl-4 pb-1">
                  {section.hubs.map((hub) => (
                    <Link
                      key={hub.slug}
                      href={
                        SPORTS_TEAM_SLUGS.has(hub.slug)
                          ? `/sports/${hub.slug}`
                          : `/page/${hub.slug}`
                      }
                      onClick={() => setMobileOpen(false)}
                      className="block py-1.5 font-sans text-sm text-mercury-muted hover:text-mercury-accent transition-colors no-underline"
                    >
                      {decodeHtmlEntities(hub.title)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}

// -------------------------------------------------------
// Main export — picks grouped or flat based on publication
// -------------------------------------------------------
export default function BeatDropdownNav({
  beats,
  hubsByBeat,
  publicationSlug,
}: BeatDropdownNavProps) {
  const groups = publicationSlug ? NAV_GROUPS[publicationSlug] : undefined;

  return (
    <>
      {/* Mobile nav — visible below md breakpoint */}
      <MobileNav beats={beats} hubsByBeat={hubsByBeat} groups={groups} />

      {/* Desktop nav — visible at md and above */}
      {groups ? (
        <GroupedNav groups={groups} hubsByBeat={hubsByBeat} />
      ) : (
        <FlatNav beats={beats} hubsByBeat={hubsByBeat} />
      )}
    </>
  );
}
