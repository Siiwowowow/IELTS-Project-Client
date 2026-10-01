import Link from "next/link";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
  IconBrandYoutube,
} from "@tabler/icons-react";
import Logo from "../Logo/Logo";

const footerNavigation = {
  practice: [
    { label: "Listening", href: "/practice/listening" },
    { label: "Reading", href: "/practice/reading" },
    { label: "Writing", href: "/practice/writing" },
    { label: "Speaking", href: "/practice/speaking" },
    { label: "Vocabulary", href: "/practice/vocabulary" },
  ],
  tests: [
    { label: "Full Mock Tests", href: "/mock-tests/full" },
    { label: "Timed Tests", href: "/mock-tests/sections" },
    { label: "Band Predictor", href: "/mock-tests/predictor" },
    { label: "Pricing Plans", href: "/pricing" },
  ],
  resources: [
    { label: "Blog & Tips", href: "/blog" },
    { label: "Band Calculator", href: "/#band-calculator" },
    { label: "Student Dashboard", href: "/dashboard" },
    { label: "Help & FAQ", href: "/pricing" },
  ],
  legal: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

const socials = [
  { icon: IconBrandX, href: "https://x.com", label: "X" },
  { icon: IconBrandLinkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: IconBrandFacebook, href: "https://facebook.com", label: "Facebook" },
  { icon: IconBrandInstagram, href: "https://instagram.com", label: "Instagram" },
  { icon: IconBrandYoutube, href: "https://youtube.com", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white text-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6 lg:gap-10">
          {/* Brand info - Spans 2 cols */}
          <div className="col-span-2 flex flex-col justify-between">
            <div>
              <Logo />
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-neutral-500">
                The modern computer-delivered IELTS preparation platform with authentic exam simulation, AI-guided scoring, and comprehensive practice.
              </p>
            </div>

            {/* Social Icons */}
            <div className="mt-5 flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links: 4 Columns */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Practice</h4>
            <ul className="mt-3 space-y-2">
              {footerNavigation.practice.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs font-medium text-neutral-600 transition-colors hover:text-red-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Tests & Pricing</h4>
            <ul className="mt-3 space-y-2">
              {footerNavigation.tests.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs font-medium text-neutral-600 transition-colors hover:text-red-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Resources</h4>
            <ul className="mt-3 space-y-2">
              {footerNavigation.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs font-medium text-neutral-600 transition-colors hover:text-red-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Company</h4>
            <ul className="mt-3 space-y-2">
              {footerNavigation.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs font-medium text-neutral-600 transition-colors hover:text-red-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-neutral-100 pt-6 text-[11px] text-neutral-400 sm:flex-row">
          <p>© {new Date().getFullYear()} IELTS Prep. All rights reserved.</p>
          <p className="text-center sm:text-right">
            IELTS® is a registered trademark of Cambridge University Press & Assessment, the British Council, and IDP Education Australia.
          </p>
        </div>
      </div>
    </footer>
  );
}
