import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { Header } from "@/components/header";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Application Scout",
  description: "Summer 2027 ML / DS / AI / CV internship tracker — no auto-apply.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
