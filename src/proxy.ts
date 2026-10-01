/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultDashboardRoute,
  getRouteOwner,
  isAuthRoute,
  UserRole,
} from "./lib/authUtils";

const BASE_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type AuthUser = {
  id: string;
  email: string;
  emailVerified?: boolean;
  needPasswordChange?: boolean;
  role: UserRole;
  status?: string;
  isDeleted?: boolean;
};

type RefreshedTokens = {
  accessToken: string;
  refreshToken?: string;
  sessionToken?: string | null;
};

const VALID_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"];

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

function parseJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getAuthUserFromToken(accessToken?: string): { user: AuthUser | null; isExpired: boolean } {
  if (!accessToken) return { user: null, isExpired: false };
  const payload = parseJwtPayload(accessToken);
  if (!payload) return { user: null, isExpired: false };

  const isExpired = Boolean(payload.exp && payload.exp * 1000 <= Date.now());
  const id = payload.userId || payload.id;
  const email = typeof payload.email === "string" ? payload.email : "";
  const role = payload.role as UserRole;

  if (!id || !email || !VALID_ROLES.includes(role)) {
    return { user: null, isExpired: false };
  }

  const user: AuthUser = {
    id,
    email,
    role,
    emailVerified: payload.emailVerified,
    needPasswordChange: payload.needPasswordChange,
    status: payload.status,
    isDeleted: payload.isDeleted,
  };

  return { user, isExpired };
}

async function refreshSession(
  refreshToken: string,
  sessionToken?: string
): Promise<RefreshedTokens | null> {
  if (!BASE_API_URL) return null;

  const cookieHeader = [
    `refreshToken=${refreshToken}`,
    sessionToken ? `better-auth.session_token=${sessionToken}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${BASE_API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const body = await response.json();
    return body.data ?? null;
  } catch (error) {
    console.error("Unable to refresh the session in proxy:", error);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathWithQuery = `${pathname}${request.nextUrl.search}`;
  const routeOwner = getRouteOwner(pathname);
  const isAuth = isAuthRoute(pathname);

  // Public pages do not need any auth evaluation.
  if (routeOwner === null && !isAuth) {
    return NextResponse.next();
  }

  let accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  let { user, isExpired } = getAuthUserFromToken(accessToken);
  let refreshedTokens: RefreshedTokens | null = null;
  let refreshTokenRejected = false;

  // If token is expired or missing, and refresh token is available, attempt refresh
  if ((!user || isExpired) && refreshToken) {
    refreshedTokens = await refreshSession(refreshToken, sessionToken);
    if (refreshedTokens?.accessToken) {
      accessToken = refreshedTokens.accessToken;
      const parsed = getAuthUserFromToken(accessToken);
      user = parsed.user;
      isExpired = parsed.isExpired;
    } else {
      refreshTokenRejected = true;
    }
  }

  const finish = (response: NextResponse) => {
    if (user && refreshedTokens) {
      response.cookies.set(
        "accessToken",
        refreshedTokens.accessToken,
        cookieOptions(60 * 60 * 24 * 3)
      );
      if (refreshedTokens.refreshToken) {
        response.cookies.set(
          "refreshToken",
          refreshedTokens.refreshToken,
          cookieOptions(60 * 60 * 24 * 7)
        );
      }
      if (refreshedTokens.sessionToken) {
        response.cookies.set(
          "better-auth.session_token",
          refreshedTokens.sessionToken,
          cookieOptions(60 * 60 * 24 * 3)
        );
      }
    } else if (refreshTokenRejected) {
      // ONLY clear cookies when refresh token was actively rejected
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      response.cookies.delete("better-auth.session_token");
      response.cookies.delete("__Secure-better-auth.session_token");
    }
    return response;
  };

  // 1. Password reset route logic
  if (pathname === "/reset-password") {
    const email = request.nextUrl.searchParams.get("email");
    if (email && (!user || user.needPasswordChange)) {
      return finish(NextResponse.next());
    }
    return finish(
      NextResponse.redirect(new URL(user ? "/" : "/login", request.url))
    );
  }

  // 2. Auth routes (e.g. /login, /register)
  if (isAuth) {
    if (user && !isExpired && pathname !== "/verify-email") {
      const redirectParam = request.nextUrl.searchParams.get("redirect");
      const destination =
        redirectParam && redirectParam.startsWith("/")
          ? redirectParam
          : getDefaultDashboardRoute(user.role);
      return finish(NextResponse.redirect(new URL(destination, request.url)));
    }
    return finish(NextResponse.next());
  }

  // 3. Not an auth route, but public route (fallback)
  if (routeOwner === null) {
    return finish(NextResponse.next());
  }

  // 4. Protected route, but user not logged in or token expired
  if (!user || isExpired) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathWithQuery);
    return finish(NextResponse.redirect(loginUrl));
  }

  // 5. User blocked or deleted
  if (user.status === "BLOCKED" || user.isDeleted) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "account_inactive");
    return finish(NextResponse.redirect(loginUrl));
  }

  // 6. Email verification
  if (user.emailVerified === false && pathname !== "/verify-email") {
    const verifyEmailUrl = new URL("/verify-email", request.url);
    verifyEmailUrl.searchParams.set("email", user.email);
    return finish(NextResponse.redirect(verifyEmailUrl));
  }

  // 7. Force password change
  if (user.needPasswordChange && pathname !== "/reset-password") {
    const resetPasswordUrl = new URL("/reset-password", request.url);
    resetPasswordUrl.searchParams.set("email", user.email);
    return finish(NextResponse.redirect(resetPasswordUrl));
  }

  // 8. Common protected routes
  if (routeOwner === "COMMON") {
    return finish(NextResponse.next());
  }

  // 9. Role-based access control
  const role = user.role;
  const hasAccess =
    (routeOwner === "ADMIN" && (role === "SUPER_ADMIN" || role === "ADMIN")) ||
    (routeOwner === "TEACHER" &&
      (role === "TEACHER" || role === "ADMIN" || role === "SUPER_ADMIN")) ||
    (routeOwner === "STUDENT" && role === "STUDENT");

  if (!hasAccess) {
    return finish(
      NextResponse.redirect(new URL(getDefaultDashboardRoute(role), request.url))
    );
  }

  return finish(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.well-known).*)",
  ],
};
