import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexora - Türkçe ve İngilizce Manga Platformu | Read Manga Online",
  description: "Nexora ile en güncel manga ve webtoon serilerini Türkçe ve İngilizce dillerinde ücretsiz okuyun. Discord entegrasyonu ile yeni bölümlerden anında haberdar olun. / Read the latest manga and webtoon series in Turkish and English for free on Nexora. Get instant notifications via Discord.",
  keywords: "nexora, manga, manga oku, read manga, türkçe manga, english manga, manga reader, webtoon, manga çeviri, nexora manga, manga tr, manga en",
  alternates: {
    canonical: "https://nexora.app", // example production url
    languages: {
      "tr-TR": "https://nexora.app/tr",
      "en-US": "https://nexora.app/en",
    },
  },
};

import Providers from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
