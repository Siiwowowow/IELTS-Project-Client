import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProviders from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { AuthMainShell } from "@/components/Auth/AuthMainShell";
import { RouteProgressBar } from "@/components/shared/RouteProgressBar";
import { Toaster } from "sonner";

const anekBangla = localFont({
  src: "../../public/Font/AnekBangla-VariableFont_wdth,wght.ttf",
  variable: "--font-anek-bangla",
  display: "swap",
  // Auth routes use Inter, so preloading this root font there produces an
  // unused-font warning. The font still loads normally on routes that use it.
  preload: false,
});

export const metadata: Metadata = {
  title: "IELTS Prep | Computer-Based Practice",
  description:
    "Premium IELTS computer-based test preparation — practice like the real exam.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${anekBangla.variable} scroll-smooth`} data-scroll-behavior="smooth">
      <body className={`flex flex-col min-h-screen ${anekBangla.className} font-anek-bangla antialiased`}>
        <QueryProviders>
          <AuthProvider>
            <TooltipProvider>
              <Suspense fallback={null}>
                <RouteProgressBar />
              </Suspense>
              <AuthMainShell>{children}</AuthMainShell>
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </AuthProvider>
        </QueryProviders>
      </body>
    </html>
  );
}
