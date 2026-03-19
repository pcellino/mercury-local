"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { BeatConfig } from "@/lib/types";
import { decodeHtmlEntities } from "@/lib/content";

interface BeatDropdownNavProps {
  beats: BeatConfig[];
  hubsByBeat: Record<string, Array<{ slug: string; title: string }>>;
}

export default function BeatDropdownNav({ beats, hubsByBeat }: BeatDropdownNavProps) {
  const [openBeat, setOpenBeat] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
      className="flex items-center justify-center gap-0 py-3 overflow-x-auto border-b-2 border-mercury-ink"
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
                    onClick={() => setOpenBeat(openBeat === beat.slug ? null : beat.slug)}
                    className="text-mercury-muted hover:text-mercury-accent transition-colors -ml-1 px-1 py-1"
                    aria-label={`Show ${beat.label} guides`}
                    aria-expanded={openBeat === beat.slug}
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${openBeat === beat.slug ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </span>

                {/* Dropdown */}
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
                        href={`/page/${hub.slug}`}
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
