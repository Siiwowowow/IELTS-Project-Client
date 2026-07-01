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
    title: "প্ল্যাটফর্ম",
    links: [
      { label: "ড্যাশবোর্ড", href: "/user/dashboard" },
      { label: "মক টেস্ট", href: "/mock-tests" },
      { label: "অ্যানালিটিক্স", href: "/analytics" },
      { label: "প্যাকেজ ও মূল্য", href: "#pricing" },
    ],
  },
  {
    title: "প্র্যাকটিস মডিউল",
    links: [
      { label: "লিসেনিং", href: "/practice/listening" },
      { label: "রিডিং", href: "/practice/reading" },
      { label: "রাইটিং", href: "/practice/writing" },
      { label: "স্পিকিং", href: "/practice/speaking" },
      { label: "শব্দভাণ্ডার (Vocabulary)", href: "/practice/vocabulary" },
    ],
  },
  {
    title: "প্রতিষ্ঠান",
    links: [
      { label: "আমাদের সম্পর্কে", href: "/about" },
      { label: "ক্যারিয়ার", href: "/careers" },
      { label: "অংশীদারিত্ব (Partners)", href: "/partners" },
      { label: "প্রেস", href: "/press" },
    ],
  },
  {
    title: "রিসোর্স",
    links: [
      { label: "ব্লগ", href: "/blog" },
      { label: "স্টাডি গাইড", href: "/guides" },
      { label: "ব্যান্ড ক্যালকুলেটর", href: "/tools/band-calculator" },
      { label: "হেল্প সেন্টার", href: "/help" },
    ],
  },
  {
    title: "সহায়তা",
    links: [
      { label: "যোগাযোগ", href: "/contact" },
      { label: "সাধারণ জিজ্ঞাসা (FAQs)", href: "#faq" },
      { label: "সিস্টেম স্ট্যাটাস", href: "/status" },
    ],
  },
  {
    title: "আইনি বিষয়",
    links: [
      { label: "গোপনীয়তার নীতি", href: "/privacy" },
      { label: "ব্যবহারের শর্তাবলী", href: "/terms" },
      { label: "কুকি পলিসি", href: "/cookies" },
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
              কম্পিউটার-বেসড আইইএলটিএস প্রস্তুতির সেরা প্ল্যাটফর্ম — বিশ্বের যেকোনো স্থান থেকে রিয়েল পরীক্ষার মতো প্র্যাকটিস করুন।
            </p>

            <div className="mt-6 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-ielts-red" />
                support@ieltsprep.com
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-ielts-red" />
                +৪৪ ২০ ৭১২৩ ৪৫৬৭
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-ielts-red" />
                লন্ডন, যুক্তরাজ্য
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
            <h4 className="font-semibold text-white">আমাদের সাথে থাকুন</h4>
            <p className="mt-1 text-sm text-neutral-400">
              আইইএলটিএস টিপস, মক টেস্ট আপডেট এবং প্রস্তুতির কৌশল পান প্রতি সপ্তাহে।
            </p>
            <form className="mt-4 flex gap-2">
              <Input
                type="email"
                placeholder="আপনার ইমেইল দিন"
                className="h-10 flex-1 rounded-lg border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500"
              />
              <Button className="h-10 shrink-0 rounded-lg px-4 bg-ielts-red hover:bg-ielts-red-dark text-white">সাবস্ক্রাইব</Button>
            </form>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border border-neutral-800 px-4 py-2 text-xs text-neutral-400">
              অ্যাপ স্টোর — শীঘ্রই আসছে
            </div>
            <div className="rounded-lg border border-neutral-800 px-4 py-2 text-xs text-neutral-400">
              গুগল প্লে — শীঘ্রই আসছে
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-neutral-500">
          © ২০২৬ আইইএলটিএস প্রিপ (IELTS Prep)। সর্বস্বত্ব সংরক্ষিত। IELTS হলো ক্যামব্রিজ অ্যাসেসমেন্ট ইংলিশ, ব্রিটিশ কাউন্সিল এবং আইডিপি এডুকেশন অস্ট্রেলিয়ার নিবন্ধিত ট্রেডমার্ক।
        </p>
      </div>
    </footer>
  );
}
