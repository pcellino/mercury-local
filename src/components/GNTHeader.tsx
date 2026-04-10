"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const PRIMARY_NAV = [
  { href: "/racing", label: "Racing" },
  { href: "/features", label: "Features" },
  { href: "/standings", label: "Standings" },
  { href: "/page/schedules", label: "Schedules" },
];

const MORE_LINKS = [
  { href: "/opinion", label: "Columns" },
  { href: "/page/oreilly-auto-parts-series-guide", label: "O'Reilly Auto Parts Series" },
  { href: "/page/cars-tour-guide", label: "CARS Tour Guide" },
  { href: "/page/virginia-triple-crown-guide", label: "Virginia Triple Crown" },
  { href: "/page/driver-directory", label: "Driver Directory" },
  { href: "/page/team-directory", label: "Team Directory" },
  { href: "/page/about", label: "About" },
  { href: "/page/contact", label: "Contact" },
];

const MOBILE_NAV = [
  { href: "/racing", label: "Racing", section: "main" },
  { href: "/features", label: "Features", section: "main" },
  { href: "/standings", label: "Standings", section: "main" },
  { href: "/page/schedules", label: "Schedules", section: "main" },
  { href: "/opinion", label: "Columns", section: "main" },
  { href: "/page/oreilly-auto-parts-series-guide", label: "O'Reilly Auto Parts Series", section: "series" },
  { href: "/page/cars-tour-guide", label: "CARS Tour Guide", section: "series" },
  { href: "/page/virginia-triple-crown-guide", label: "Virginia Triple Crown", section: "series" },
  { href: "/page/driver-directory", label: "Driver Directory", section: "reference" },
  { href: "/page/team-directory", label: "Team Directory", section: "reference" },
  { href: "/page/about", label: "About", section: "reference" },
  { href: "/page/contact", label: "Contact", section: "reference" },
];

export default function GNTHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [moreOpen]);

  return (
    <header className="bg-gnt-surface/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gnt-rule">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo / site name — left */}
          <Link href="/" className="no-underline shrink-0">
            <span className="font-condensed text-2xl md:text-3xl font-bold uppercase tracking-wide text-gnt-text leading-none">
              Grand <span className="text-gnt-accent">National</span> Today
            </span>
          </Link>

          {/* Desktop nav — right */}
          <nav className="hidden md:flex items-center gap-5">
            {PRIMARY_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-condensed text-sm font-semibold uppercase tracking-wider text-gnt-muted hover:text-gnt-text transition-colors no-underline"
              >
                {link.label}
              </Link>
            ))}

            {/* More dropdown */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="font-condensed text-sm font-semibold uppercase tracking-wider text-gnt-muted hover:text-gnt-text transition-colors flex items-center gap-1"
                aria-expanded={moreOpen}
                aria-haspopup="true"
              >
                More
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {moreOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-gnt-surface border border-gnt-rule rounded shadow-xl z-50 py-2">
                  {MORE_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className="block px-4 py-2 text-sm font-sans text-gnt-text hover:bg-gnt-dark hover:text-gnt-gold transition-colors no-underline"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Search icon */}
            <Link
              href="/search"
              aria-label="Search"
              className="text-gnt-muted hover:text-gnt-text transition-colors ml-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gnt-muted hover:text-gnt-text p-1"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen(!mobileOpen)}
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
      </div>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-gnt-rule bg-gnt-surface">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {/* Main sections */}
            {MOBILE_NAV.filter((l) => l.section === "main").map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-sans text-sm font-semibold uppercase tracking-widest text-gnt-text hover:text-gnt-gold transition-colors no-underline py-2"
              >
                {link.label}
              </Link>
            ))}

            {/* Series guides */}
            <div className="border-t border-gnt-rule mt-2 pt-3">
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-gnt-gold mb-2">Series Guides</p>
              {MOBILE_NAV.filter((l) => l.section === "series").map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-sans text-xs uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors no-underline py-1.5 block"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Reference & utility */}
            <div className="border-t border-gnt-rule mt-2 pt-3">
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-gnt-gold mb-2">Reference</p>
              {MOBILE_NAV.filter((l) => l.section === "reference").map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-sans text-xs uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors no-underline py-1.5 block"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Search */}
            <div className="border-t border-gnt-rule mt-2 pt-3">
              <Link
                href="/search"
                onClick={() => setMobileOpen(false)}
                className="font-sans text-xs uppercase tracking-widest text-gnt-muted hover:text-gnt-text transition-colors no-underline py-1.5 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Search
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
