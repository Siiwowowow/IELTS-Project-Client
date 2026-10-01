import { cn } from "@/lib/utils";

export default function AccountLoadingState({
  compact = false,
  vertical = false,
}: {
  compact?: boolean;
  vertical?: boolean;
}) {
  if (vertical) {
    return (
      <div
        className="h-11 w-full animate-pulse rounded-xl bg-neutral-100"
        aria-label="Checking account session"
        role="status"
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 animate-pulse items-center gap-2",
        compact ? "h-8.5" : "h-9"
      )}
      aria-label="Checking account session"
      role="status"
    >
      <span
        className={cn(
          "rounded-full bg-neutral-200",
          compact ? "size-8" : "size-9"
        )}
      />
      {!compact && <span className="hidden h-3 w-14 rounded-full bg-neutral-100 xl:block" />}
    </div>
  );
}
