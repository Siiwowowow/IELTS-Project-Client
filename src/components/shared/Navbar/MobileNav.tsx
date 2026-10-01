"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import Logo from "../Logo/Logo";
import UserAvatar from "./UserAvatar";
import AccountLoadingState from "./AccountLoadingState";

interface Props {
  onMenuOpen: () => void;
  drawerOpen?: boolean;
}

export default function MobileNav({ onMenuOpen, drawerOpen = false }: Props) {
  const { user, isLoading } = useUser();

  return (
    <div className="flex h-18 w-full items-center justify-between gap-3 px-4 md:hidden">
      <Logo compact />

      <div className="flex items-center gap-2">
        {isLoading ? (
          <AccountLoadingState compact />
        ) : user ? (
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
          className="flex size-9 items-center justify-center rounded-xl border border-neutral-300 bg-white text-neutral-900 transition-colors hover:bg-neutral-100 cursor-pointer shadow-xs"
        >
          <Menu className="size-4.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
