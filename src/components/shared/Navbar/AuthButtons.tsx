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
          className="h-9 rounded-lg bg-ielts-red px-4 text-white shadow-sm hover:bg-ielts-red-dark font-medium"
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
            className="h-9 rounded-lg px-4 font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            asChild
          >
            <Link href="/login" onClick={onLinkClick}>
              Log in
            </Link>
          </Button>

          <Button
            size="sm"
            className="h-9 rounded-lg bg-ielts-red px-4 font-medium text-white shadow-sm hover:bg-ielts-red-dark"
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
