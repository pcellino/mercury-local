"use client";

import { useState } from "react";

type Variant = "mercury" | "gnt";

interface Props {
  variant?: Variant;
  /** The publication slug — sent as context in the form, matched server-side via host header */
  publicationName?: string;
}

export default function SubscribeForm({
  variant = "mercury",
  publicationName,
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  if (variant === "gnt") {
    return (
      <div>
        <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-gnt-gold mb-3">
          Newsletter
        </p>
        {status === "success" ? (
          <p className="text-sm text-gnt-gold font-sans">
            You&apos;re in. We&apos;ll be in touch before the green flag.
          </p>
        ) : (
          <>
            <p className="text-sm text-gnt-muted font-sans mb-3 leading-relaxed">
              Race results, standings updates, and features — straight to your inbox.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={status === "loading"}
                className="w-full bg-gnt-surface border border-gnt-rule text-gnt-text placeholder-gnt-muted font-sans text-sm px-3 py-2 focus:outline-none focus:border-gnt-gold transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-gnt-accent hover:bg-gnt-gold text-white font-sans text-xs font-bold uppercase tracking-widest px-4 py-2.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {status === "loading" ? "Subscribing…" : "Subscribe"}
              </button>
              {status === "error" && (
                <p className="text-xs text-red-400 font-sans">{errorMsg}</p>
              )}
            </form>
          </>
        )}
      </div>
    );
  }

  // Mercury variant (Charlotte Mercury, etc.)
  return (
    <div>
      <p className="font-sans text-xs font-bold uppercase tracking-wider text-mercury-muted mb-3">
        Newsletter
      </p>
      {status === "success" ? (
        <p className="text-sm text-mercury-accent font-sans">
          {publicationName
            ? `You're subscribed to ${publicationName}.`
            : "You're subscribed. Thank you."}
        </p>
      ) : (
        <>
          <p className="text-sm text-mercury-muted font-sans mb-3 leading-relaxed">
            Local news, delivered. No algorithms, no noise.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={status === "loading"}
              className="w-full border border-mercury-rule text-mercury-ink placeholder-mercury-muted font-sans text-sm px-3 py-2 focus:outline-none focus:border-mercury-accent transition-colors bg-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-mercury-accent hover:bg-mercury-ink text-white font-sans text-xs font-bold uppercase tracking-wider px-4 py-2.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {status === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
            {status === "error" && (
              <p className="text-xs text-red-600 font-sans">{errorMsg}</p>
            )}
          </form>
        </>
      )}
    </div>
  );
}
