import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProviders from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { AuthMainShell } from "@/components/Auth/AuthMainShell";
import { Toaster } from "sonner";
import { getUserInfo } from "@/services/auth.services";

export const dynamic = "force-dynamic";

const anekBangla = localFont({
  src: "../../public/Font/AnekBangla-VariableFont_wdth,wght.ttf",
  variable: "--font-anek-bangla",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserInfo();

  return (
    <html lang="en" suppressHydrationWarning className={`${anekBangla.variable} ${geistSans.variable} ${geistMono.variable} ${inter.variable} scroll-smooth`} data-scroll-behavior="smooth">
      <body className={`flex flex-col min-h-screen ${anekBangla.className} font-anek-bangla antialiased`}>
        <QueryProviders>
          <AuthProvider initialUser={user}>
            <TooltipProvider>
              <AuthMainShell>{children}</AuthMainShell>
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </AuthProvider>
        </QueryProviders>
      </body>
    </html>
  );
}
