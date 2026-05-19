import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProviders from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import Navbar from "@/components/shared/Navbar/Navbar";
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

export const metadata: Metadata = {
  title: "BetterAuth",
  description: "Secure Authentication Portal",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserInfo();

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen font-poppins antialiased">
        <QueryProviders>
          <AuthProvider initialUser={user}>
            <TooltipProvider>
              <Navbar />
              <main className="flex-1 shrink-0 p-4">{children}
                <Toaster richColors position="top-right" />
              </main>
            </TooltipProvider>
          </AuthProvider>
        </QueryProviders>
      </body>
    </html>
  );
}
