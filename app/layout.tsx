import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://nexora.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Nexora | Türkçe Manga & Manhwa Okuma Platformu",
    template: "%s | Nexora",
  },
  description:
    "Nexora ile en güncel manga, manhwa ve webtoon serilerini Türkçe olarak ücretsiz okuyun. Yeni bölümler çıktığında Discord bildirimi alın, haftalık yayın takvimine göz atın.",
  keywords: [
    "nexora",
    "manga oku",
    "türkçe manga",
    "manhwa oku",
    "webtoon oku",
    "manga çeviri",
    "manga reader",
    "ücretsiz manga",
    "manga tr",
    "online manga",
    "manhwa türkçe",
    "manhua türkçe",
  ],
  authors: [{ name: "Nexora", url: BASE_URL }],
  creator: "Nexora",
  publisher: "Nexora",
  category: "Entertainment",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "tr-TR": `${BASE_URL}/tr`,
      "en-US": `${BASE_URL}/en`,
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    alternateLocale: "en_US",
    url: BASE_URL,
    siteName: "Nexora",
    title: "Nexora | Türkçe Manga & Manhwa Okuma Platformu",
    description:
      "Nexora ile en güncel manga, manhwa ve webtoon serilerini Türkçe olarak ücretsiz okuyun. Yeni bölümler çıktığında Discord bildirimi alın.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nexora - Türkçe Manga Platformu",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexora | Türkçe Manga & Manhwa Okuma Platformu",
    description:
      "Nexora ile en güncel manga, manhwa ve webtoon serilerini Türkçe olarak ücretsiz okuyun.",
    images: ["/og-image.png"],
    creator: "@nexoraapp",
    site: "@nexoraapp",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#030303" />
        <meta name="color-scheme" content="dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Nexora",
              url: BASE_URL,
              description:
                "Nexora ile en güncel manga, manhwa ve webtoon serilerini Türkçe olarak ücretsiz okuyun.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${BASE_URL}/mangalist?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
              inLanguage: "tr-TR",
              publisher: {
                "@type": "Organization",
                name: "Nexora",
                url: BASE_URL,
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
