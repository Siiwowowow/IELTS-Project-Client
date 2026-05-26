// components/shared/Navbar/utils.ts

export const getDashboardRoute = (role?: string): string => {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/admin/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "TEACHER":
      return "/teacher/dashboard";
    case "STUDENT":
      return "/student/dashboard";
    default:
      return "/";
  }
};

export const getInitials = (name?: string, email?: string): string => {
  if (name) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return "U";
};

export const isActivePath = (pathname: string, href: string): boolean => {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
};

export const formatPrice = (price: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

export const getCartTotal = (items: { price: number; quantity: number }[]): number =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);