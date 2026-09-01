import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e1650",
          borderRadius: 40,
          color: "#fbbf24",
          fontSize: 108,
          fontWeight: 800,
          letterSpacing: -4,
        }}
      >
        N
      </div>
    ),
    { ...size },
  );
}
