"use client";

import { useState } from "react";
import Link from "next/link";
import type { BeatConfig } from "@/lib/types";

interface SimpleNavProps {
  beats: BeatConfig[];
}

export default function SimpleNav({ beats }: SimpleNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    ...beats.map((beat) => ({ href: `/${beat.slug}`, label: beat.label })),
    { href: "/page/about", label: "About" },
    { href: "/page/contact", label: "Contact" },
  ];

  return (
    <div className="border-b-2 border-mercury-ink">
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center justify-center gap-6 py-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-sans font-semibold text-mercury-ink hover:text-mercury-accent transition-colors uppercase tracking-wide"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Mobile nav */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-muted">
            Menu
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
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 font-sans text-sm font-semibold uppercase tracking-wide text-mercury-ink hover:text-mercury-accent transition-colors no-underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
