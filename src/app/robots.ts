import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://purseflow.vercel.app"; 
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", // Block API routes from indexing
          "/settings/", // Block settings pages (user-specific)
          "/profile", // Block profile page (user-specific)
          "/reset-password", // Block password reset pages
          "/forgot-password", // Block forgot password pages
          "/dashboard", // Block dashboard (requires authentication)
          "/expenses", // Block expenses (requires authentication)
          "/reports", // Block reports (requires authentication)
          "/_next/", // Block Next.js internal files
          "/admin/", // Block admin pages if any
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
