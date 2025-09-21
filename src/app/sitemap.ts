import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://purseflow.vercel.app"; 

    return [
        {
            url: `${baseUrl}`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/forgot-password`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/dashboard`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/expenses`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/expenses/categories`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/reports`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/reports/daily`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/reports/weekly`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/reports/monthly`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/reports/category-analysis`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/profile`,
            lastModified: new Date(),
        },
    ];
}
