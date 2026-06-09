import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://nexora.app";

export const metadata: Metadata = {
  title: "Manga Kataloğu | Tüm Türkçe Çeviriler",
  description:
    "Nexora manga kataloğunda tüm Türkçe çeviri serilerini keşfedin. Manga, manhwa, manhua ve webtoon türlerinde yüzlerce seri. Türe, duruma veya isme göre filtreleyin.",
  keywords: [
    "türkçe manga listesi",
    "manga kataloğu",
    "manhwa listesi",
    "webtoon listesi",
    "manga filtrele",
    "nexora katalog",
    "türkçe çeviri",
    "manga oku ücretsiz",
  ],
  alternates: {
    canonical: `${BASE_URL}/mangalist`,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${BASE_URL}/mangalist`,
    siteName: "Nexora",
    title: "Manga Kataloğu | Tüm Türkçe Çeviriler – Nexora",
    description:
      "Nexora manga kataloğunda tüm Türkçe çeviri serilerini keşfedin. Manga, manhwa, manhua ve webtoon türlerinde yüzlerce seri.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nexora Manga Kataloğu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Manga Kataloğu | Tüm Türkçe Çeviriler – Nexora",
    description:
      "Nexora manga kataloğunda tüm Türkçe çeviri serilerini keşfedin.",
    images: ["/og-image.png"],
  },
};

export default function MangalistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
