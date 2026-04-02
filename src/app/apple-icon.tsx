import { ImageResponse } from "next/og";
import { resolveSlug } from "@/lib/domains";
import { headers } from "next/headers";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Per-publication apple-touch-icon configuration.
 * Larger version of the favicon with rounded corners for iOS home screens.
 */
const ICON_CONFIG: Record<
  string,
  { letters: string; bg: string; fg: string; fontSize: number }
> = {
  "charlotte-mercury": {
    letters: "M",
    bg: "#1a1a1a",
    fg: "#ffffff",
    fontSize: 120,
  },
  "farmington-mercury": {
    letters: "FM",
    bg: "#1a1a1a",
    fg: "#ffffff",
    fontSize: 72,
  },
  "strolling-ballantyne": {
    letters: "SB",
    bg: "#2d5016",
    fg: "#ffffff",
    fontSize: 72,
  },
  "strolling-firethorne": {
    letters: "SF",
    bg: "#7c2d12",
    fg: "#ffffff",
    fontSize: 72,
  },
  "grand-national-today": {
    letters: "GN",
    bg: "#1c1917",
    fg: "#dc2626",
    fontSize: 72,
  },
  "mercury-local": {
    letters: "ML",
    bg: "#1e40af",
    fg: "#ffffff",
    fontSize: 72,
  },
  "peter-cellino": {
    letters: "PC",
    bg: "#1a1a1a",
    fg: "#ffffff",
    fontSize: 72,
  },
};

const DEFAULT_CONFIG = {
  letters: "M",
  bg: "#1a1a1a",
  fg: "#ffffff",
  fontSize: 120,
};

export default async function AppleIcon() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const slug = resolveSlug(host);
  const config = ICON_CONFIG[slug] || DEFAULT_CONFIG;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: config.bg,
          borderRadius: "32px",
        }}
      >
        <span
          style={{
            color: config.fg,
            fontSize: config.fontSize,
            fontWeight: 900,
            fontFamily: "serif",
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          {config.letters}
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
