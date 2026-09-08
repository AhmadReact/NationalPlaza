import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt =
  "National Electronics — Pakistan's trusted electronics store since 1946";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0e1650 0%, #1d2f8b 55%, #1c3ad9 100%)",
          color: "white",
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "white",
            borderRadius: 16,
            padding: "18px 28px",
            width: 560,
          }}
        >
          <img src={logoSrc} width={504} height={62} alt="" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.15 }}>
            Shop genuine home appliances across Pakistan
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 24,
              color: "rgba(255,255,255,0.78)",
            }}
          >
            Official warranty · Delivery across Punjab · Cash on delivery
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
