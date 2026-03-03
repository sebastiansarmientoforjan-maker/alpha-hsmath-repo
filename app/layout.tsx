import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientAuthProvider } from "@/components/ClientAuthProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alpha Math Living Research Repository",
  description: "Educational research platform for mathematics learning analytics and investigation management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <ClientAuthProvider>{children}</ClientAuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
