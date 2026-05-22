export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(4, Math.max(1, score)) as PasswordStrength;
}

export const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"] as const;

export const strengthColors = [
  "bg-neutral-200",
  "bg-red-400",
  "bg-amber-400",
  "bg-blue-500",
  "bg-emerald-500",
] as const;
