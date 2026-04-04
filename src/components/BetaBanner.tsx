// Tagline — the only thing under the title on every news publication page.
export default function BetaBanner({ tagline }: { tagline?: string | null }) {
  if (!tagline) return null;
  return (
    <h2 className="font-sans text-[10px] font-bold italic uppercase tracking-widest text-mercury-accent text-center mt-2">
      {tagline}
    </h2>
  );
}
