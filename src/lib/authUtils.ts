// src/lib/authUtils.ts

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";

export const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export const isAuthRoute = (pathname: string): boolean => {
  return authRoutes.some((route) => route === pathname);
};

export type RouteConfig = {
  exact: string[];
  pattern: RegExp[];
};

// Student Routes
export const studentRoutes: RouteConfig = {
  exact: ["/student/dashboard", "/student/courses", "/student/profile"],
  pattern: [/^\/student\/.*/],
};

// Teacher Routes
export const teacherRoutes: RouteConfig = {
  exact: ["/teacher/dashboard", "/teacher/courses"],
  pattern: [/^\/teacher\/.*/],
};

// Admin Routes
export const adminRoutes: RouteConfig = {
  exact: ["/admin/dashboard", "/admin/users", "/admin/settings", "/admin/courses"],
  pattern: [/^\/admin\/.*/],
};

// Common Protected Routes
export const commonProtectedRoutes: RouteConfig = {
  exact: ["/change-password"],
  pattern: [],
};

export const isRouteMatches = (pathname: string, routes: RouteConfig): boolean => {
  if (routes.exact.includes(pathname)) return true;
  return routes.pattern.some((pattern) => pattern.test(pathname));
};

export const getRouteOwner = (
  pathname: string
): "ADMIN" | "TEACHER" | "STUDENT" | "COMMON" | null => {
  if (isRouteMatches(pathname, adminRoutes)) return "ADMIN";
  if (isRouteMatches(pathname, teacherRoutes)) return "TEACHER";
  if (isRouteMatches(pathname, studentRoutes)) return "STUDENT";
  if (isRouteMatches(pathname, commonProtectedRoutes)) return "COMMON";
  return null;
};

// ✅ Role অনুযায়ী Dashboard Route
export const getDefaultDashboardRoute = (role: UserRole): string => {
  switch (role) {
    case "SUPER_ADMIN":
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

export const isValidRedirectForRole = (redirectPath: string, role: UserRole): boolean => {
  const sanitizedRedirectPath = redirectPath.split("?")[0] || redirectPath;
  const routeOwner = getRouteOwner(sanitizedRedirectPath);

  if (routeOwner === null || routeOwner === "COMMON") return true;

  // SUPER_ADMIN can access admin routes
  if (routeOwner === "ADMIN" && (role === "SUPER_ADMIN" || role === "ADMIN")) return true;
  if (routeOwner === role) return true;

  return false;
};

// ✅ লগইন বা রেজিস্ট্রেশনের পর রিডাইরেক্ট
export const getRedirectAfterLogin = (role: UserRole, redirectPath?: string): string => {
  // যদি redirectPath দেওয়া থাকে এবং valid হয়
  if (redirectPath && isValidRedirectForRole(redirectPath, role)) {
    return redirectPath;
  }
  // নাহলে রোল অনুযায়ী ডিফল্ট ড্যাশবোর্ড
  return getDefaultDashboardRoute(role);
};