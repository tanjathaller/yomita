import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";

import { getSiteUrl } from "@/lib/site-url";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Nur Hero-Desktop-Überschrift: editorial/wellness, Rest bleibt Geist. */
const heroDisplay = Cormorant_Garamond({
  variable: "--font-hero-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Yoga",
    template: "%s",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} ${heroDisplay.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col overflow-x-clip">
        {children}
      </body>
    </html>
  );
}
