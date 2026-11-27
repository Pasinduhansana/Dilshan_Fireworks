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
  title: "Dilshan Fireworks — Celebration Fireworks in Sri Lanka",
  description: "Safe, hand-picked fireworks and dazzling displays for celebrations across Sri Lanka. Make every night one to remember.",
};

export const viewport = {
  themeColor: "#a4c2ba",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full ${dmSans.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
