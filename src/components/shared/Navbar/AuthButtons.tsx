import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onLinkClick?: () => void;
  orientation?: "horizontal" | "vertical";
  showDashboard?: boolean;
  dashboardHref?: string;
}

export default function AuthButtons({
  onLinkClick,
  orientation = "horizontal",
  showDashboard = false,
  dashboardHref = "/dashboard",
}: Props) {
  return (
    <div
      className={cn(
        "flex gap-2.5",
        orientation === "vertical" ? "flex-col w-full" : "items-center"
      )}
    >
      {showDashboard ? (
        <Button
          size="sm"
          className={cn(
            "h-9 rounded-full bg-neutral-950 px-4 text-xs font-semibold text-white shadow-2xs hover:bg-neutral-800 transition-all",
            orientation === "vertical" && "w-full rounded-xl"
          )}
          asChild
        >
          <Link href={dashboardHref} onClick={onLinkClick}>
            Dashboard
          </Link>
        </Button>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 rounded-full px-3.5 text-xs font-bold text-neutral-900 hover:text-black hover:bg-neutral-100 transition-all cursor-pointer",
              orientation === "vertical" && "w-full justify-start rounded-xl"
            )}
            asChild
          >
            <Link href="/login" onClick={onLinkClick}>
              Log in
            </Link>
          </Button>

          <Button
            size="sm"
            className={cn(
              "h-9 rounded-full bg-red-600 px-4.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition-all",
              orientation === "vertical" && "w-full rounded-xl"
            )}
            asChild
          >
            <Link href="/register" onClick={onLinkClick}>
              Register
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
