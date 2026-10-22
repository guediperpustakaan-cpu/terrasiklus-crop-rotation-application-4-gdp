import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TrakteerWidget } from "@/components/trakteer-widget";
import "./globals.css";

export const metadata: Metadata = {
  title: "TerraSiklus — Tanah sehat, panen lebih hebat",
  description:
    "Rencanakan rotasi tanaman, kelola petak kebun, dan pantau kesehatan tanah. Ruang tumbuh yang lebih bijak untuk pekebun Indonesia.",
  applicationName: "TerraSiklus",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link
          rel="preload"
          href="/fonts/jakarta.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Langsung ke konten
        </a>
        {children}
        <TrakteerWidget />
      </body>
    </html>
  );
}
