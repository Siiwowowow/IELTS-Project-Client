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
          className="h-9 rounded-lg bg-white px-4 text-red-600 shadow-sm hover:bg-red-50 font-bold"
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
            className="h-9 rounded-lg px-4 font-bold text-white hover:bg-white/10"
            asChild
          >
            <Link href="/login" onClick={onLinkClick}>
              Log in
            </Link>
          </Button>

          <Button
            size="sm"
            className="h-9 rounded-lg bg-white px-4 font-bold text-red-600 shadow-sm hover:bg-red-50"
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
