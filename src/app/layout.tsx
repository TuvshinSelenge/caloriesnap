import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/layout/SessionProvider";

export const metadata: Metadata = {
  title: "CalorieSnap – Track meals from a photo",
  description: "AI-powered calorie tracking. Take a photo, get instant estimates.",
};

export const viewport: Viewport = {
  themeColor: "#fffaf3",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#fffaf3] text-[#1f1f1f]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
