/* eslint-disable @typescript-eslint/no-explicit-any */
//src/proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { getDefaultDashboardRoute, getRouteOwner, isAuthRoute, UserRole } from "./lib/authUtils";
import { jwtUtils } from "./lib/jwtUtils";
import { isTokenExpiringSoon } from "./lib/tokenUtils";
import { getNewTokensWithRefreshToken, getUserInfo } from "./services/auth.services";

async function refreshTokenMiddleware(refreshToken: string, sessionToken?: string): Promise<any> {
  try {
    const refresh = await getNewTokensWithRefreshToken(refreshToken, sessionToken);
    return refresh;
  } catch (error) {
    console.error("Error refreshing token in middleware:", error);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  let tokenRefreshed = false;
  let refreshResult: any = null;
  let shouldClearCookies = false;

  const wrapResponse = (response: NextResponse) => {
    if (shouldClearCookies) {
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      response.cookies.delete("better-auth.session_token");
    } else if (tokenRefreshed && refreshResult) {
      if (refreshResult.accessToken) {
        response.cookies.set("accessToken", refreshResult.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24, // 1 day
        });
      }
      if (refreshResult.refreshToken) {
        response.cookies.set("refreshToken", refreshResult.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }
      if (refreshResult.token) {
        response.cookies.set("better-auth.session_token", refreshResult.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24, // 1 day
        });
      } else {
        response.cookies.delete("better-auth.session_token");
      }
    }
    return response;
  };

  try {
    const { pathname } = request.nextUrl;
    const pathWithQuery = `${pathname}${request.nextUrl.search}`;
    let accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;
    const sessionToken = request.cookies.get("better-auth.session_token")?.value;

    let decodedAccessToken = accessToken && jwtUtils.verifyToken(accessToken, process.env.JWT_ACCESS_SECRET as string).data;
    let isValidAccessToken = accessToken && jwtUtils.verifyToken(accessToken, process.env.JWT_ACCESS_SECRET as string).success;

    let userRole: UserRole | null = null;
    let rawUserRole: string | null = null;

    if (decodedAccessToken) {
      rawUserRole = decodedAccessToken.role;
      userRole = rawUserRole as UserRole;
    }

    const routeOwner = getRouteOwner(pathname);
    const isAuth = isAuthRoute(pathname);

    // ✅ If token is expired/missing but we have a valid refresh token, try to refresh it reactively
    if (!isValidAccessToken && refreshToken) {
      try {
        refreshResult = await refreshTokenMiddleware(refreshToken, sessionToken);
        if (refreshResult && refreshResult.accessToken) {
          accessToken = refreshResult.accessToken;
          decodedAccessToken = jwtUtils.verifyToken(accessToken!, process.env.JWT_ACCESS_SECRET as string).data;
          isValidAccessToken = true;
          tokenRefreshed = true;
          if (decodedAccessToken) {
            rawUserRole = decodedAccessToken.role;
            userRole = rawUserRole as UserRole;
          }
        } else {
          shouldClearCookies = true;
        }
      } catch (error) {
        console.error("Error refreshing expired token in middleware:", error);
        shouldClearCookies = true;
      }
    } else if (!isValidAccessToken && (accessToken || refreshToken)) {
      shouldClearCookies = true;
    }

    if (shouldClearCookies) {
      accessToken = undefined;
    }

    // ✅ Proactively refresh token if expiring soon (and was valid originally)
    if (isValidAccessToken && refreshToken && !tokenRefreshed && (await isTokenExpiringSoon(accessToken!))) {
      try {
        refreshResult = await refreshTokenMiddleware(refreshToken, sessionToken);
        if (refreshResult && refreshResult.accessToken) {
          accessToken = refreshResult.accessToken;
          decodedAccessToken = jwtUtils.verifyToken(accessToken!, process.env.JWT_ACCESS_SECRET as string).data;
          isValidAccessToken = true;
          tokenRefreshed = true;
          if (decodedAccessToken) {
            rawUserRole = decodedAccessToken.role;
            userRole = rawUserRole as UserRole;
          }
        }
      } catch (error) {
        console.error("Error refreshing token proactively:", error);
      }
    }

    // ✅ Rule 1: Logged-in users should not access auth pages
    if (isAuth && isValidAccessToken && pathname !== "/verify-email" && pathname !== "/reset-password") {
      return wrapResponse(NextResponse.redirect(new URL("/", request.url)));
    }

    // ✅ Rule 2: Reset password page
    if (pathname === "/reset-password") {
      const email = request.nextUrl.searchParams.get("email");

      if (accessToken && email) {
        const userInfo = await getUserInfo();
        if (userInfo?.needPasswordChange) {
          return wrapResponse(NextResponse.next());
        } else {
          return wrapResponse(NextResponse.redirect(new URL("/", request.url)));
        }
      }

      if (email) {
        return wrapResponse(NextResponse.next());
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathWithQuery);
      return wrapResponse(NextResponse.redirect(loginUrl));
    }

    // ✅ Rule 3: Public route -> allow
    if (routeOwner === null) {
      return wrapResponse(NextResponse.next());
    }

    // ✅ Rule 4: Not logged in but trying to access protected route -> redirect to login
    if (!accessToken || !isValidAccessToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathWithQuery);
      return wrapResponse(NextResponse.redirect(loginUrl));
    }

    // ✅ Rule 5: Email verification and password change enforcement
    if (accessToken) {
      const userInfo = await getUserInfo();
      if (userInfo) {
        // Email verification needed
        if (userInfo.emailVerified === false) {
          if (pathname !== "/verify-email") {
            const verifyEmailUrl = new URL("/verify-email", request.url);
            verifyEmailUrl.searchParams.set("email", userInfo.email);
            return wrapResponse(NextResponse.redirect(verifyEmailUrl));
          }
          return wrapResponse(NextResponse.next());
        }

        if (userInfo.emailVerified && pathname === "/verify-email") {
          return wrapResponse(NextResponse.redirect(new URL("/", request.url)));
        }

        // Password change needed
        if (userInfo.needPasswordChange) {
          if (pathname !== "/reset-password") {
            const resetPasswordUrl = new URL("/reset-password", request.url);
            resetPasswordUrl.searchParams.set("email", userInfo.email);
            return wrapResponse(NextResponse.redirect(resetPasswordUrl));
          }
          return wrapResponse(NextResponse.next());
        }

        if (!userInfo.needPasswordChange && pathname === "/reset-password") {
          return wrapResponse(NextResponse.redirect(new URL("/", request.url)));
        }
      } else {
        const response = routeOwner !== null
          ? NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathWithQuery)}`, request.url))
          : NextResponse.next();
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        response.cookies.delete("better-auth.session_token");
        return response;
      }
    }

    // ✅ Rule 6: Common protected route -> allow (Profile, Change Password etc.)
    if (routeOwner === "COMMON") {
      return wrapResponse(NextResponse.next());
    }

    // ✅ Rule 7: Role based access control for ADMIN, TEACHER, STUDENT
    if (routeOwner === "ADMIN") {
      // SUPER_ADMIN and ADMIN both can access admin routes
      if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
        return wrapResponse(NextResponse.redirect(new URL(getDefaultDashboardRoute(userRole as UserRole), request.url)));
      }
    }

    if (routeOwner === "TEACHER") {
      if (userRole !== "TEACHER") {
        return wrapResponse(NextResponse.redirect(new URL(getDefaultDashboardRoute(userRole as UserRole), request.url)));
      }
    }

    if (routeOwner === "STUDENT") {
      if (userRole !== "STUDENT") {
        return wrapResponse(NextResponse.redirect(new URL(getDefaultDashboardRoute(userRole as UserRole), request.url)));
      }
    }

    return wrapResponse(NextResponse.next());
  } catch (error) {
    console.error("Error in proxy middleware:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.well-known).*)',
  ],
};