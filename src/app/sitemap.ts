import type { MetadataRoute } from "next";
import { site } from "@/data/site";

// The public site is a single landing page; admin routes are excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
