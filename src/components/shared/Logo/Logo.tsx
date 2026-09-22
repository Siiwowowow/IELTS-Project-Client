import Image from "next/image";
import Link from "next/link";
import logoImg from "../../../../public/logo/logo.png";
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
    >
      <div>
        <Image
          src={logoImg}
          alt="IELTS Prep Logo"
          width={120}
          height={90}
          className={compact ? "h-auto w-24" : "h-auto w-30"}
          priority
        />
      </div> 

  
    </Link>
  );
}
