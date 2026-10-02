import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono, Inter } from "next/font/google";
import { site } from "@/data/site";
import { themeInitScript } from "@/lib/theme-script";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Master Admin UI + numeric fonts. Not preloaded: the public site never uses
// them, so they only download once an admin page renders text in them.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const title = `${site.name} | Advertising & Branding Agency in Raipur`;

// Icons and the share image come from the file conventions in this folder
// (favicon.ico, icon.png, apple-icon.png, opengraph-image.jpg), so they are
// intentionally not repeated here.
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: site.name,
    title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the admin theme script sets data-theme on
    // <html> before React hydrates.
    <html lang="en" className={`${archivo.variable} ${inter.variable} ${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-white font-sans text-brand-dark antialiased">
        {children}
      </body>
    </html>
  );
}
