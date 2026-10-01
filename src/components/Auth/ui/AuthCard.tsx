import { cn } from "@/lib/utils";

type AuthCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_55px_-28px_rgba(15,23,42,0.32)] backdrop-blur sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
