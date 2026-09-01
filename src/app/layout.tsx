import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "KokkuGuru — Video sisse, retsept välja",
  description:
    "KokkuGuru — muuda TikToki, Instagrami, YouTube'i ja Facebooki toiduvideod selgeteks samm-sammulisteks retseptideks. Facebooki video heli tuvastatakse ja tõlgitakse taustal AI-ga.",
  applicationName: "KokkuGuru",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23E8480F'/%3E%3Cpath d='M10 21c0-4.4 3-8 6-8s6 3.6 6 8H10z' fill='%23FAF4EA'/%3E%3Ccircle cx='16' cy='10' r='2.2' fill='%23FAF4EA'/%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#faf4ea",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="et">
      <body>{children}</body>
    </html>
  );
}
