import { ImageResponse } from "next/og";

import { SITE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE.name} — ${SITE.tagline}`;

/** Generated at request time so the card never drifts from the brand. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#14100d",
          backgroundImage:
            "radial-gradient(circle at 72% 28%, rgba(200,161,101,0.26) 0%, rgba(200,161,101,0.04) 42%, transparent 66%)",
          padding: "76px 84px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 54, height: 1, backgroundColor: "#c8a165" }} />
          <div
            style={{
              color: "#c8a165",
              fontSize: 20,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            Specialty coffee &amp; dessert bar
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#eae3d9", fontSize: 108, lineHeight: 1.02, letterSpacing: -3 }}>
            {SITE.tagline}
          </div>
          <div style={{ color: "#9a8f84", fontSize: 28, marginTop: 28, maxWidth: 760, lineHeight: 1.45 }}>
            Single-origin coffee roasted in small lots, desserts made each morning.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(200,161,101,0.24)",
            paddingTop: 30,
          }}
        >
          <div style={{ color: "#eae3d9", fontSize: 34, letterSpacing: 14, textTransform: "uppercase" }}>
            Mysa
          </div>
          <div style={{ color: "#9a8f84", fontSize: 22 }}>Hayes Valley, San Francisco</div>
        </div>
      </div>
    ),
    size
  );
}
