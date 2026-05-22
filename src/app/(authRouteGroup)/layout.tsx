import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-auth",
  display: "swap",
});

export default function AuthRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} font-[family-name:var(--font-auth)]`}>
      {children}
    </div>
  );
}
