import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cosmic Path — Astrology Readings & Personalized Horoscopes",
  description:
    "In-depth astrology readings, birth charts and personal horoscopes that guide you toward clarity.",
};

export const viewport = {
  themeColor: "#a4c2ba",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full ${dmSans.variable} ${outfit.variable}`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
