import { cn } from "@/lib/utils";

type GlassCardProps = React.ComponentProps<"div"> & {
  variant?: "light" | "dark";
};

export function GlassCard({
  className,
  variant = "light",
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        variant === "light" ? "hp-glass" : "hp-glass-dark text-white",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
