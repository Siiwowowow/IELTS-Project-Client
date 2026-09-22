"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import Logo from "../Logo/Logo";
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
            className="h-8.5 rounded-full bg-red-600 px-3.5 text-xs font-semibold text-white shadow-2xs hover:bg-red-700 transition-all"
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
          className="flex size-9 items-center justify-center rounded-xl border border-neutral-200/80 bg-neutral-50/60 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
        >
          <Menu className="size-4.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
