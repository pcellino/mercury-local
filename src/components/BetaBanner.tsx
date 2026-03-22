// BetaBanner — Always the last h2 on every page.
// Mercury Local publications are in public beta. This banner signals that
// to readers and reinforces the independent, early-access spirit of the platform.

export default function BetaBanner() {
  return (
    <section className="mt-16 pt-6 border-t border-mercury-rule">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-mercury-accent">
          Always Last.. To Break News.. #Beta
        </h2>
        <p className="text-[11px] text-mercury-muted font-sans text-center md:text-right">
          Mercury Local is in public beta — independent, locally owned, and just getting started.
        </p>
      </div>
    </section>
  );
}
