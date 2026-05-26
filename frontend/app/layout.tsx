import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "../components/Navbar";

export const metadata: Metadata = {
  title: "PredictFun — Onchain Football Conviction Market",
  description: "Make bold football calls, stake OKB, build your pundit reputation on X Layer.",
  openGraph: {
    title: "PredictFun",
    description: "Make bold football calls, stake OKB, build your pundit reputation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          <main className="max-w-6xl mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
