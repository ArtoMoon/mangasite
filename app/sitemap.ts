import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://nexora.app";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: {
          "tr-TR": `${baseUrl}/?lang=tr`,
          "en-US": `${baseUrl}/?lang=en`,
        },
      },
    },
    {
      url: `${baseUrl}/mangalist`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      alternates: {
        languages: {
          "tr-TR": `${baseUrl}/mangalist?lang=tr`,
          "en-US": `${baseUrl}/mangalist?lang=en`,
        },
      },
    },
  ];
}
