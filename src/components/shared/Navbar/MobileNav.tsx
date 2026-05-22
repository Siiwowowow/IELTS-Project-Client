"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import UserAvatar from "./UserAvatar";

interface Props {
  onMenuOpen: () => void;
  drawerOpen?: boolean;
}

export default function MobileNav({ onMenuOpen, drawerOpen = false }: Props) {
  const { user } = useUser();

  return (
    <div className="flex h-16 w-full items-center justify-between gap-3 px-4 md:hidden">
      <Logo compact />

      <div className="flex items-center gap-2">
        {user ? (
          <UserAvatar compact />
        ) : (
          <Button
            size="sm"
            className="h-9 rounded-lg bg-ielts-red px-4 text-sm font-medium text-white shadow-sm hover:bg-ielts-red-dark"
            asChild
          >
            <Link href="/register">Sign up</Link>
          </Button>
        )}

        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          aria-controls="nav-mobile-drawer"
          className="flex size-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-700 transition-colors hover:border-ielts-red/30 hover:bg-ielts-red-light hover:text-ielts-red dark:border-neutral-700"
        >
          <Menu className="size-5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
