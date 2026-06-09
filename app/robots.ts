import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://nexora.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/mangalist", "/mangalist/", "/takvim"],
        disallow: [
          "/api/",
          "/admin/",
          "/profile/",
          "/_next/",
          "/scratch/",
        ],
      },
      {
        // Google özelinde ek optimizasyon
        userAgent: "Googlebot",
        allow: ["/"],
        disallow: ["/api/", "/admin/", "/profile/"],
        crawlDelay: 1,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
