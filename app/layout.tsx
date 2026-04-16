import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MTO-Hub | Managerial Trainer Organization",
    template: "%s | MTO-Hub",
  },
  description:
    "Portal internal Managerial Trainer Organization (MTO) — Manajemen anggota, absensi, dan penilaian performa terpadu.",
  keywords: ["MTO", "Managerial Trainer Organization", "portal", "absensi", "MOTM"],
  authors: [{ name: "MTO INTI 25/26" }],
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
