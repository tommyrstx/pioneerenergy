import type { Metadata, Viewport } from "next";
import { themeInitScript } from "@/components/theme";
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
    <html lang="en-GB" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
