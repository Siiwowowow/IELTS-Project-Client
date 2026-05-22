import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProviders from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { AuthMainShell } from "@/components/Auth/AuthMainShell";
import { Toaster } from "sonner";
import { getUserInfo } from "@/services/auth.services";

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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserInfo();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} scroll-smooth`}>
      <body className="flex flex-col min-h-screen font-poppins antialiased">
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
