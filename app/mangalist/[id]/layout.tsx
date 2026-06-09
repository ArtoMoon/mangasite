import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://nexora.app";

interface Props {
  params: Promise<{ id: string }>;
}

async function getManga(id: string) {
  try {
    const res = await fetch(`${BASE_URL}/api/mangas/${id}`, {
      next: { revalidate: 3600 }, // 1 saatte bir yenile
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const manga = await getManga(id);

  if (!manga) {
    return {
      title: "Manga Bulunamadı",
      description: "İstenen manga bulunamadı veya kaldırılmış olabilir.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${manga.title} – Türkçe Manga Oku`;
  const description =
    manga.description
      ? `${manga.description.slice(0, 155)}...`
      : `${manga.title} serisini Nexora'da Türkçe okuyun. ${manga.chapterCount || 0} bölüm mevcut.`;

  const canonicalUrl = `${BASE_URL}/mangalist/${id}`;
  const coverImage = manga.coverImage || "/og-image.png";

  return {
    title,
    description,
    keywords: [
      manga.title,
      `${manga.title} türkçe`,
      `${manga.title} oku`,
      manga.author,
      ...(manga.genres || []),
      "manga oku",
      "nexora",
    ].filter(Boolean),
    authors: manga.author ? [{ name: manga.author }] : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "book",
      locale: "tr_TR",
      url: canonicalUrl,
      siteName: "Nexora",
      title,
      description,
      images: [
        {
          url: coverImage,
          width: 400,
          height: 600,
          alt: `${manga.title} kapak görseli`,
        },
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${manga.title} – Nexora`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [coverImage],
    },
  };
}

export default function MangaDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
