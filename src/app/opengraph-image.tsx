import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

// Branded social-share card. Auto-used for OpenGraph + Twitter previews.
export const runtime = "edge";
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const EMBLEM = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 48 48'>
    <polygon points='24,4 42,14 42,34 24,44 6,34 6,14' fill='#16181d' stroke='#e4002b' stroke-width='3'/>
    <polygon points='24,10 37,17.5 37,30.5 24,38 11,30.5 11,17.5' fill='none' stroke='#3a3f4b' stroke-width='1.5'/>
    <path d='M15 30 L31 15' stroke='#e4002b' stroke-width='4' stroke-linecap='round'/>
    <text x='24' y='29' text-anchor='middle' font-family='Arial' font-weight='700' font-size='13' fill='#ffffff'>NAZ</text>
  </svg>`,
)}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#16181d",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", height: 14, width: "100%", position: "absolute", top: 0, backgroundColor: "#e4002b" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={EMBLEM} width={180} height={180} alt="" />
        <div style={{ display: "flex", marginTop: 28, fontSize: 76, fontWeight: 800, letterSpacing: -1 }}>
          <span style={{ color: "#e4002b" }}>NOVA</span>
          <span style={{ color: "#ffffff" }}>&nbsp;A-TO-Z PARTS</span>
        </div>
        <div style={{ display: "flex", marginTop: 12, fontSize: 34, color: "#b6bbc4" }}>
          {SITE.tagline}
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 24, color: "#6b7280" }}>
          novaatozparts.com
        </div>
      </div>
    ),
    { ...size },
  );
}
