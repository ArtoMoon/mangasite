import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://nexora.app";

interface Props {
  params: Promise<{ id: string; chapterId: string }>;
}

async function getChapterData(mangaId: string, chapterId: string) {
  try {
    const [mangaRes, chapterRes] = await Promise.all([
      fetch(`${BASE_URL}/api/mangas/${mangaId}`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${BASE_URL}/api/chapters/${chapterId}`, {
        next: { revalidate: 3600 },
      }),
    ]);
    const mangaCT = mangaRes.headers.get("content-type") || "";
    const chapterCT = chapterRes.headers.get("content-type") || "";
    const manga = mangaRes.ok && mangaCT.includes("application/json")
      ? await mangaRes.json()
      : null;
    const chapter = chapterRes.ok && chapterCT.includes("application/json")
      ? await chapterRes.json()
      : null;
    return { manga, chapter };
  } catch {
    return { manga: null, chapter: null };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, chapterId } = await params;
  const { manga, chapter } = await getChapterData(id, chapterId);

  if (!manga || !chapter) {
    return {
      title: "Bölüm Bulunamadı",
      description: "İstenen bölüm bulunamadı.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${chapter.title} – ${manga.title} | Nexora`;
  const description = `${manga.title} serisinin ${chapter.title} bölümünü Nexora'da Türkçe okuyun.`;
  const canonicalUrl = `${BASE_URL}/mangalist/${id}/chapters/${chapterId}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "article",
      locale: "tr_TR",
      url: canonicalUrl,
      siteName: "Nexora",
      title,
      description,
      images: [
        {
          url: manga.coverImage || "/og-image.png",
          width: 400,
          height: 600,
          alt: `${manga.title} – ${chapter.title}`,
        },
      ],
      publishedTime: chapter.createdAt,
      section: "Manga",
      tags: manga.genres || [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [manga.coverImage || "/og-image.png"],
    },
  };
}

export default function ChapterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
