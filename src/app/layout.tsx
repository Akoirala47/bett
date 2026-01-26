import type { Metadata, Viewport } from "next";
import { StarField } from "@/components/StarField";
import "./globals.css";

export const metadata: Metadata = {
  title: "BETT",
  description: "Two-person goal tracking.",
  applicationName: "BETT",
  manifest: "/manifest.webmanifest",
  themeColor: "#e89840",
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
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StarField />
        {children}
      </body>
    </html>
  );
}
