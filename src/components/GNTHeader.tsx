"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/page/oreilly-auto-parts-series-guide", label: "O'Reilly Series", color: "text-gnt-accent hover:text-gnt-accent/80" },
  { href: "/page/cars-tour-guide", label: "CARS Tour", color: "text-gnt-gold hover:text-gnt-gold/80" },
  { href: "/page/virginia-triple-crown-guide", label: "Virginia Triple Crown", color: "text-[#2563eb] hover:text-[#2563eb]/80" },
  { href: "/page/schedules", label: "Schedules", color: "text-gnt-muted hover:text-gnt-text" },
  { href: "/opinion", label: "Columns", color: "text-gnt-muted hover:text-gnt-text" },
];

export default function GNTHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-gnt-surface/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gnt-rule">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo / site name — left */}
          <Link href="/" className="no-underline shrink-0">
            <span className="font-display text-xl md:text-2xl font-black text-gnt-text tracking-tight leading-none">
              Grand <span className="text-gnt-accent">National</span> Today
            </span>
          </Link>

          {/* Desktop nav — right */}
          <nav className="hidden md:flex items-center gap-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-sans text-xs font-semibold uppercase tracking-widest transition-colors no-underline ${link.color}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gnt-muted hover:text-gnt-text p-1"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              /* X icon */
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              /* Hamburger icon */
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-gnt-rule bg-gnt-surface">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`font-sans text-sm font-semibold uppercase tracking-widest transition-colors no-underline py-1 ${link.color}`}
              >
                {link.label}
              </Link>
            ))}
            {/* Secondary links on mobile */}
            <div className="border-t border-gnt-rule mt-2 pt-3 flex flex-col gap-2">
              <Link href="/racing" onClick={() => setMobileOpen(false)} className="font-sans text-xs uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors no-underline py-0.5">
                Latest News
              </Link>
              <Link href="/standings" onClick={() => setMobileOpen(false)} className="font-sans text-xs uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors no-underline py-0.5">
                Standings &amp; Stats
              </Link>
              <Link href="/features" onClick={() => setMobileOpen(false)} className="font-sans text-xs uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors no-underline py-0.5">
                Features
              </Link>
              <Link href="/page/driver-directory" onClick={() => setMobileOpen(false)} className="font-sans text-xs uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors no-underline py-0.5">
                Driver Directory
              </Link>
              <Link href="/page/team-directory" onClick={() => setMobileOpen(false)} className="font-sans text-xs uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors no-underline py-0.5">
                Team Directory
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
