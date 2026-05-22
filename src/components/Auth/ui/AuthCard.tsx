import { cn } from "@/lib/utils";

type AuthCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] sm:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}
