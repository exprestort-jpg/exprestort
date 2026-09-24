import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Експрес-торт — крафтові коржі для домашніх тортів";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logo = await readFile(join(process.cwd(), "src/app/icon.png"));
const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fdf8f3",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 72,
          padding: "0 88px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 88, color: "#2a1a10", letterSpacing: -2 }}>
            Експрес-торт
          </div>
          <div
            style={{
              fontSize: 38,
              color: "#7a6355",
              marginTop: 20,
              lineHeight: 1.35,
            }}
          >
            Бісквітні, медові та шоколадні коржі власного випікання
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 44,
              padding: "16px 32px",
              borderRadius: 999,
              background: "#ffe2ce",
              color: "#d24400",
              fontSize: 30,
            }}
          >
            Відправляємо Новою Поштою того ж дня
          </div>
        </div>
        {/* biome-ignore lint/performance/noImgElement: satori rasterises raw JSX; next/image does not run here */}
        <img src={logoSrc} width={256} height={256} alt="" />
      </div>
      <div style={{ display: "flex", height: 18, background: "#ff5a00" }} />
    </div>,
    size,
  );
}
