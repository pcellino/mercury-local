/**
 * Fallback editorial illustration for posts without hero images.
 * Dark engraving-style SVGs with gold line art on navy background.
 */

interface BeatIllustrationProps {
  beat: string | null;
  className?: string;
}

export default function BeatIllustration({ beat, className = "" }: BeatIllustrationProps) {
  const slug = beat || "default";
  const validBeats = [
    "government", "police", "education", "elections", "business",
    "community", "opinion", "culture", "sports", "development",
    "wellness", "lifestyle", "dining",
    "racing", "features", "standings", "vtc",
  ];
  const src = validBeats.includes(slug)
    ? `/beats/${slug}.svg`
    : "/beats/default.svg";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt=""
        role="presentation"
        loading="lazy"
        decoding="async"
        className="w-full h-auto"
        style={{ minHeight: "100px" }}
      />
    </div>
  );
}
