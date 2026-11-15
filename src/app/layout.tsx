import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lighting Hub · Search performance snapshot",
  description: "Confidential report prepared for Pioneer Energy (Singapore) Pte Ltd.",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
