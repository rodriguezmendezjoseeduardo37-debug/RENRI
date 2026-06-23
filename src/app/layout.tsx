import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { SkipLinks } from "@/components/skip-links";
import { AdSense } from "@/components/adsense";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "RENRI — Gestión para Profesionistas",
  description: "Citas, turnos, pagos y clientes en una sola plataforma para profesionistas y negocios de México.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: 'RENRI — Gestión para Profesionistas',
    description: 'Citas, turnos, pagos y clientes en una sola plataforma.',
    url: 'https://renri.vercel.app',
    siteName: 'RENRI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RENRI',
    description: 'Gestión para profesionistas y negocios de México.',
  },
  other: {
    "google-adsense-account": "ca-pub-1980082261486602",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link href="https://db.onlinewebfonts.com/c/bb5de19d87c09a95216dc6ccd96e37c6?family=Nimbus+Sans+TW01" rel="stylesheet" type="text/css" />
      </head>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "font-sans antialiased relative bg-background text-foreground"
        )}
      >
        <div className="fixed inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-[-1]"></div>
        <Providers>
          <SkipLinks />
          <div className="relative z-0">
            {children}
          </div>
          <Toaster richColors position="top-right" />
        </Providers>
        <AdSense />
      </body>
    </html>
  );
}
