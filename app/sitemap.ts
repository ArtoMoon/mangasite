import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://nexora.app";

async function getMangas(): Promise<{ _id: string; updatedAt?: string }[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/mangas`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    // Build sırasında API erişilemez olabilir — JSON döndüğünden emin ol
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const mangas = await getMangas();

  const mangaEntries: MetadataRoute.Sitemap = mangas.map((manga) => ({
    url: `${BASE_URL}/mangalist/${manga._id}`,
    lastModified: manga.updatedAt ? new Date(manga.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: {
          "tr-TR": `${BASE_URL}/?lang=tr`,
          "en-US": `${BASE_URL}/?lang=en`,
        },
      },
    },
    {
      url: `${BASE_URL}/mangalist`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      alternates: {
        languages: {
          "tr-TR": `${BASE_URL}/mangalist?lang=tr`,
          "en-US": `${BASE_URL}/mangalist?lang=en`,
        },
      },
    },
    {
      url: `${BASE_URL}/takvim`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...mangaEntries,
  ];
}
