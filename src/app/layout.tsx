import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppLayout } from "@/components/app-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://purseflow.vercel.app"),
  keywords: [
    "purseflow",
    "purseflow expense tracker",
    "purseflow budget app",
    "purseflow money management",
    "purseflow financial tracker",
    "purseflow expense manager",
    "purseflow budget planner",
    "purseflow-sand",
    "purseflow vercel",
    "expense tracker",
    "budget app",
    "money management",
    "financial tracker",
    "expense manager",
    "budget planner",
    "personal finance",
    "expense tracking",
    "budget management",
    "financial planning",
    "money tracker",
    "expense analytics",
    "budget control",
    "financial dashboard",
    "expense reports",
    "budget analysis",
    "spending tracker",
    "financial wellness",
    "expense categorization",
    "budget goals",
  ],
  title: {
    default: "PurseFlow",
    template: `%s | PurseFlow`,
  },
  description:
    "PurseFlow - Track expenses, manage budgets, and gain financial insights with our intuitive expense tracker and budget management app.",
  openGraph: {
    title: "PurseFlow",
    description:
      "PurseFlow - Track expenses, manage budgets, and gain financial insights with our intuitive expense tracker and budget management app.",
    url: "https://purseflow.vercel.app",
    siteName: "PurseFlow",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og_image.png",
        width: 1200,
        height: 600,
        alt: "PurseFlow - Expense Tracker & Budget Management App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@purseflow",
    title: "PurseFlow | Expense Tracker & Budget Management App",
    description:
      "PurseFlow - Track expenses, manage budgets, and gain financial insights with our intuitive expense tracker and budget management app.",
    images: ["/og_image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
        <meta name="google-adsense-account" content="ca-pub-3057643117380889" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="canonical" href="https://purseflow.vercel.app" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
