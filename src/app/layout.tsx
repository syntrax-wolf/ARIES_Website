import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ARIES — IIT Delhi",
    template: "%s | ARIES IIT Delhi",
  },
  description:
    "ARIES, the official AI & ML club of IIT Delhi. Research. Build. Deploy. Impact.",
  icons: {
    apple: "/images/brand/logo-navy.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
