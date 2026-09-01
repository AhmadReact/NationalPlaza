import { ImageResponse } from "next/og";

export const alt = "National Electronics — Pakistan's trusted electronics store since 1946";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0e1650 0%, #1d2f8b 55%, #1c3ad9 100%)",
          color: "white",
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#1d31b0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 800,
              color: "#fbbf24",
            }}
          >
            N
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>National Electronics</div>
            <div
              style={{
                marginTop: 4,
                fontSize: 16,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "#fbbf24",
              }}
            >
              Trusted since 1946
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.15 }}>
            Shop genuine home appliances across Pakistan
          </div>
          <div style={{ marginTop: 24, fontSize: 24, color: "rgba(255,255,255,0.78)" }}>
            Official warranty · Nationwide delivery · Cash on delivery
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
