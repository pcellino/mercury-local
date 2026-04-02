import { ImageResponse } from "next/og";
import { resolveSlug } from "@/lib/domains";
import { headers } from "next/headers";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Per-publication favicon configuration.
 * Each publication gets a branded letter-mark with its own colors.
 */
const FAVICON_CONFIG: Record<
  string,
  { letters: string; bg: string; fg: string; fontSize: number }
> = {
  "charlotte-mercury": {
    letters: "M",
    bg: "#1a1a1a",
    fg: "#ffffff",
    fontSize: 22,
  },
  "farmington-mercury": {
    letters: "FM",
    bg: "#1a1a1a",
    fg: "#ffffff",
    fontSize: 14,
  },
  "strolling-ballantyne": {
    letters: "SB",
    bg: "#2d5016",
    fg: "#ffffff",
    fontSize: 14,
  },
  "strolling-firethorne": {
    letters: "SF",
    bg: "#7c2d12",
    fg: "#ffffff",
    fontSize: 14,
  },
  "grand-national-today": {
    letters: "GN",
    bg: "#1c1917",
    fg: "#dc2626",
    fontSize: 14,
  },
  "mercury-local": {
    letters: "ML",
    bg: "#1e40af",
    fg: "#ffffff",
    fontSize: 14,
  },
  "peter-cellino": {
    letters: "PC",
    bg: "#1a1a1a",
    fg: "#ffffff",
    fontSize: 14,
  },
};

const DEFAULT_CONFIG = {
  letters: "M",
  bg: "#1a1a1a",
  fg: "#ffffff",
  fontSize: 22,
};

export default async function Icon() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const slug = resolveSlug(host);
  const config = FAVICON_CONFIG[slug] || DEFAULT_CONFIG;

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
          borderRadius: "4px",
        }}
      >
        <span
          style={{
            color: config.fg,
            fontSize: config.fontSize,
            fontWeight: 900,
            fontFamily: "serif",
            letterSpacing: "-0.5px",
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
