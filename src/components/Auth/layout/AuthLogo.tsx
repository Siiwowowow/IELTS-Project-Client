import Logo from "@/components/shared/Logo/Logo";

export function AuthLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={inverse ? "inline-flex rounded-xl bg-white/95 px-3 py-1 shadow-sm" : "inline-flex"}>
      <Logo compact />
    </div>
  );
}
