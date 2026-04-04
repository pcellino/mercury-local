"use client";

/**
 * Global error boundary for the App Router.
 *
 * Catches unhandled errors thrown by server components (e.g., a failed
 * Supabase query in a page component). Without this file, errors bubble
 * to Next.js's default error page which exposes stack traces in development
 * and shows a generic error in production.
 *
 * Must be a Client Component ("use client") per Next.js requirements.
 */

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to console in dev; swap for a real error service (Sentry, etc.) if needed
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <h1 className="font-display text-4xl font-black text-mercury-ink">
        Something went wrong
      </h1>
      <p className="text-mercury-muted text-lg mt-4 font-serif">
        We had trouble loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-block mt-6 px-5 py-2.5 bg-mercury-accent text-white
                   rounded font-sans text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
