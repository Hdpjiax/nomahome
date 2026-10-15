import type { Metadata } from "next";
import { Fraunces, Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./styles/tokens.css";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "NOMAHOME – Muebles y tecnología para vivir la casa",
  description: "Catálogo editorial de piezas únicas: muebles y tecnología del hogar desde Morelia.",
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/",
    siteName: "NOMAHOME",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NOMAHOME",
      },
    ],
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="es-MX"
      className={`${fraunces.variable} ${schibstedGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="bg-paper text-ink antialiased" style={{ colorScheme: "light" }}>
        {children}
      </body>
    </html>
  );
}
