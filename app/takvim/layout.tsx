import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://nexora.app";

export const metadata: Metadata = {
  title: "Haftalık Yayın Takvimi | Manga Çıkış Günleri",
  description:
    "Nexora haftalık manga yayın takvimi: hangi günler hangi manga serileri çıkıyor? Favori serilerinizin yeni bölüm tarihlerini takip edin.",
  keywords: [
    "manga takvimi",
    "manga çıkış günleri",
    "haftalık manga",
    "yeni bölüm",
    "manga programı",
    "nexora takvim",
  ],
  alternates: {
    canonical: `${BASE_URL}/takvim`,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${BASE_URL}/takvim`,
    siteName: "Nexora",
    title: "Haftalık Yayın Takvimi | Manga Çıkış Günleri – Nexora",
    description:
      "Nexora haftalık manga yayın takvimi: hangi günler hangi manga serileri çıkıyor? Favori serilerinizin yeni bölüm tarihlerini takip edin.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nexora Haftalık Yayın Takvimi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Haftalık Yayın Takvimi – Nexora",
    description: "Nexora haftalık manga yayın takvimini görüntüleyin.",
    images: ["/og-image.png"],
  },
};

export default function TakvimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
