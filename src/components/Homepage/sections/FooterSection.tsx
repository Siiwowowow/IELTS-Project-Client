import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
  IconBrandYoutube,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "Dashboard", href: "/user/dashboard" },
      { label: "Mock Tests", href: "/mock-tests" },
      { label: "Analytics", href: "/analytics" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Practice Modules",
    links: [
      { label: "Listening", href: "/practice/listening" },
      { label: "Reading", href: "/practice/reading" },
      { label: "Writing", href: "/practice/writing" },
      { label: "Speaking", href: "/practice/speaking" },
      { label: "Vocabulary", href: "/practice/vocabulary" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Partners", href: "/partners" },
      { label: "Press", href: "/press" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Study Guides", href: "/guides" },
      { label: "Band Calculator", href: "/tools/band-calculator" },
      { label: "Help Centre", href: "/help" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "FAQs", href: "#faq" },
      { label: "System Status", href: "/status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];

const socials = [
  { icon: IconBrandX, href: "#", label: "X" },
  { icon: IconBrandLinkedin, href: "#", label: "LinkedIn" },
  { icon: IconBrandFacebook, href: "#", label: "Facebook" },
  { icon: IconBrandInstagram, href: "#", label: "Instagram" },
  { icon: IconBrandYoutube, href: "#", label: "YouTube" },
];

export function FooterSection() {
  return (
    <footer className="bg-neutral-950 text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="text-2xl font-bold text-white">
              IELTS<span className="text-ielts-red">Prep</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
              Premium computer-based IELTS preparation — practice like the real
              exam, anywhere in the world.
            </p>

            <div className="mt-6 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-ielts-red" />
                support@ieltsprep.com
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-ielts-red" />
                +44 20 7123 4567
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-ielts-red" />
                London, United Kingdom
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-3">
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-white">{col.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-neutral-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-neutral-800 pt-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <h4 className="font-semibold text-white">Stay updated</h4>
            <p className="mt-1 text-sm text-neutral-400">
              IELTS tips, mock test releases, and study strategies — weekly.
            </p>
            <form className="mt-4 flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                className="h-10 flex-1 rounded-lg border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500"
              />
              <Button className="h-10 shrink-0 rounded-lg px-4">Subscribe</Button>
            </form>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border border-neutral-800 px-4 py-2 text-xs text-neutral-400">
              App Store — Coming Soon
            </div>
            <div className="rounded-lg border border-neutral-800 px-4 py-2 text-xs text-neutral-400">
              Google Play — Coming Soon
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-neutral-500">
          © 2026 IELTS Prep. All rights reserved. IELTS is
          a registered trademark of Cambridge Assessment English, the British
          Council, and IDP Education Australia.
        </p>
      </div>
    </footer>
  );
}
