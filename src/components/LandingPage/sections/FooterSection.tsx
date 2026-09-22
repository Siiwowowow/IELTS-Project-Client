import Link from "next/link";
import {
  BookOpen,
  Globe2,
  GraduationCap,
  Headphones,
  Languages,
  Mic2,
  PenLine,
} from "lucide-react";
import Logo from "../../shared/Logo/Logo";

const FOOTER_GROUPS = [
  {
    title: "Platform",
    links: [
      { label: "IELTS", href: "#skills" },
      { label: "Vocabulary", href: "#vocabulary" },
      { label: "Daily Practice", href: "#daily-practice" },
      { label: "Mock Tests", href: "/mock-tests/full" },
      { label: "University", href: "#university" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Study Guides", href: "/blog" },
      { label: "IELTS Tips", href: "/blog" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/pricing" },
      { label: "Contact", href: "/pricing" },
      { label: "Privacy", href: "/pricing" },
      { label: "Terms", href: "/pricing" },
    ],
  },
];

const BACKGROUND_ICONS = [
  { icon: BookOpen, className: "left-[5%] top-[18%] -rotate-12 size-24" },
  { icon: Headphones, className: "left-[25%] bottom-[8%] rotate-8 size-18" },
  { icon: Mic2, className: "left-[47%] top-[12%] rotate-12 size-20" },
  { icon: PenLine, className: "left-[61%] bottom-[10%] -rotate-12 size-24" },
  { icon: GraduationCap, className: "right-[8%] top-[12%] rotate-8 size-28" },
  { icon: Languages, className: "right-[28%] top-[38%] -rotate-6 size-16" },
  { icon: Globe2, className: "right-[2%] bottom-[-8%] size-36" },
];

const SOCIALS = [
  {
    label: "YouTube",
    href: "https://youtube.com",
    path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.5 15.6V8.4L15.8 12l-6.3 3.6Z",
  },
  {
    label: "Facebook",
    href: "https://facebook.com",
    path: "M24 12.1a12 12 0 1 0-13.9 11.8v-8.4h-3v-3.4h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.3h3.3l-.5 3.4h-2.8v8.4A12 12 0 0 0 24 12.1Z",
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    path: "M12 2.2c3.2 0 3.6 0 4.9.1 3.2.1 4.7 1.7 4.9 4.9.1 1.2.1 1.6.1 4.8 0 3.2 0 3.6-.1 4.9-.2 3.2-1.7 4.7-4.9 4.9-1.3.1-1.7.1-4.9.1-3.2 0-3.6 0-4.9-.1-3.2-.2-4.7-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.5 4 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2ZM12 0C8.7 0 8.3 0 7 .1 2.6.3.2 2.7 0 7v10c.2 4.4 2.6 6.8 7 7h10c4.4-.2 6.8-2.6 7-7V7c-.2-4.4-2.6-6.8-7-7h-5Zm0 5.8A6.2 6.2 0 1 0 12 18.2 6.2 6.2 0 0 0 12 5.8Zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.8A1.4 1.4 0 1 0 18.4 7a1.4 1.4 0 0 0 0-2.8Z",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    path: "M20.5 3h-17A2.5 2.5 0 0 0 1 5.5v17A2.5 2.5 0 0 0 3.5 25h17a2.5 2.5 0 0 0 2.5-2.5v-17A2.5 2.5 0 0 0 20.5 3ZM7.5 21H4V9.7h3.5V21ZM5.8 8.2a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM20 21h-3.5v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H9.1V9.7h3.4v1.5h.1a3.7 3.7 0 0 1 3.3-1.8c3.6 0 4.2 2.3 4.2 5.4V21Z",
    viewBox: "0 0 26 28",
  },
];

export function FooterSection() {
  return (
    <footer className="relative overflow-hidden bg-[#070808] pb-8 pt-16 text-white sm:pt-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[8%] top-0 h-72 w-72 rounded-full bg-[#ef3d2f]/8 blur-[110px]" />
        <div className="absolute bottom-0 right-[8%] h-72 w-72 rounded-full bg-[#1769e8]/7 blur-[120px]" />
        {BACKGROUND_ICONS.map(({ icon: Icon, className }, index) => (
          <Icon
            key={index}
            className={`absolute stroke-[1.1] text-white/[0.045] ${className}`}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-7 lg:px-8">
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-12 md:gap-8 lg:pb-16">
          <div className="md:col-span-5">
            <div className="w-fit overflow-hidden">
              <Logo />
            </div>
            <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-white/55">
              Focused IELTS preparation for ambitious learners ready to build
              better English and reach their target score.
            </p>

            <div className="mt-7 flex items-center gap-3">
              {SOCIALS.map(({ label, href, path, viewBox = "0 0 24 24" }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center border border-white/12 bg-white/[0.03] text-white/60 transition-colors hover:border-[#ef3d2f] hover:bg-[#ef3d2f] hover:text-white"
                >
                  <svg
                    viewBox={viewBox}
                    className="size-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d={path} />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-white">
                  {group.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-white/48 transition-colors hover:text-[#ff4a3d]"
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

        <div className="flex flex-col gap-3 pt-7 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Engsight. All rights reserved.</p>
          <p className="uppercase tracking-[0.16em]">Learn · Practice · Improve</p>
        </div>
      </div>
    </footer>
  );
}
