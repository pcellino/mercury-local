import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <h1 className="font-display text-5xl font-black text-mercury-ink">404</h1>
      <p className="text-mercury-muted text-lg mt-4">
        This page doesn&apos;t exist, or may have moved.
      </p>
      <Link
        href="/"
        className="inline-block mt-6 px-5 py-2.5 bg-mercury-accent text-white
                   rounded font-sans text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Back to homepage
      </Link>
    </div>
  );
}
