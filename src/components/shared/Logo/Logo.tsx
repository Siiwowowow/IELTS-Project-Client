import Image from "next/image";
import Link from "next/link";
import logoImg from "../../../../public/logo/logo.png";
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
    >
      <div className="relative flex items-center">
        <Image
          src={logoImg}
          alt="IELTS Prep Logo"
          width={120}
          height={90}
          style={{ width: "auto", height: "auto" }}
          className={compact ? "h-10 w-auto max-h-10" : "h-14 w-auto max-h-14"}
          priority
        />
      </div>
    </Link>
  );
}
