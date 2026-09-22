import { ImageResponse } from "next/og";

/**
 * The favicon, generated at build time rather than shipped as a .ico.
 *
 * This also closes a real bug in the previous build: with no icon route and
 * no /favicon.ico in `public`, every single page load produced a 404 in the
 * console. Harmless, but it trains everyone to ignore console errors, which
 * is how the errors that matter get missed.
 */

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1c120d",
          color: "#c9a15b",
          fontSize: 22,
          fontFamily: "Georgia, serif",
          letterSpacing: "0.02em",
          borderRadius: 4,
        }}
      >
        M
      </div>
    ),
    size
  );
}
