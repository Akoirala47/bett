import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { StarField } from "@/components/StarField";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BETT",
  description: "Two-person goal tracking.",
  applicationName: "BETT",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "BETT",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#030406",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <StarField />
        {children}
      </body>
    </html>
  );
}
