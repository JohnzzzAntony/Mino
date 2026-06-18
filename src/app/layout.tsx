import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MINO Suppliers — Eco-Friendly Hygiene Solutions",
  description: "B2B eco-friendly paper products. Soft. Sustainable. Responsible. Custom pricing, net terms, and a portal built for procurement teams.",
  keywords: ["MINO", "eco-friendly", "paper products", "B2B", "wholesale", "sustainable", "bath tissue", "paper towels", "napkins"],
  authors: [{ name: "MINO Suppliers" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "MINO Suppliers",
    description: "Eco-Friendly Hygiene Solutions. Soft. Sustainable. Responsible.",
    siteName: "MINO Suppliers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MINO Suppliers",
    description: "Eco-Friendly Hygiene Solutions. Soft. Sustainable. Responsible.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
