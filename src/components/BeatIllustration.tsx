/**
 * Fallback editorial illustration for posts without hero images.
 * Shows a beat-specific pen-and-ink SVG in the style of WSJ/Atlantic hedcuts.
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
  ];
  const src = validBeats.includes(slug)
    ? `/beats/${slug}.svg`
    : "/beats/default.svg";

  return (
    <img
      src={src}
      alt=""
      role="presentation"
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}
