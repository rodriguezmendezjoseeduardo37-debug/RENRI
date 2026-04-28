import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { SkipLinks } from "@/components/skip-links";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "font-sans antialiased"
        )}
      >
        <Providers>
          <SkipLinks />
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
