import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

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
  description: "Citas, turnos, pagos y clientes en una sola plataforma para profesionistas y PYMEs de México.",
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
    description: 'Gestión para profesionistas y PYMEs de México.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "font-sans antialiased"
        )}
      >
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
