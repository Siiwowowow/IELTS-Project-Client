/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import {
  getRedirectAfterLogin,
  UserRole,
} from "@/lib/authUtils";

import { httpClient } from "@/lib/axios/httpClient";
import { ApiErrorResponse } from "@/types/api.types";
import { ILoginResponse } from "@/zod/auth.types";
import {
  ILoginPayload,
  loginZodSchema,
} from "@/zod/auth.validation";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const loginAction = async (
  payload: ILoginPayload,
  redirectPath?: string
): Promise<ILoginResponse | ApiErrorResponse> => {
  const requestId = crypto.randomUUID();
  const parsedPayload = loginZodSchema.safeParse(payload);

  if (!parsedPayload.success) {
    const firstError =
      parsedPayload.error.issues[0]?.message || "Invalid input";

    return {
      success: false,
      message: firstError,
      debug: { requestId, code: "VALIDATION_FAILED" },
    };
  }

  try {
    const response = await httpClient.post<ILoginResponse>(
      "/auth/login",
      parsedPayload.data
    );

    const { accessToken, refreshToken, token, user } = response.data;

    const { role, needPasswordChange, email } = user;

    // ✅ set cookies directly on the request cookieStore
    const threeDays = 3 * 24 * 60 * 60;
    const isProduction = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();

    const baseCookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
      maxAge: threeDays,
    };

    cookieStore.set("accessToken", accessToken, baseCookieOptions);
    cookieStore.set("refreshToken", refreshToken, {
      ...baseCookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days for refresh token
    });
    if (token) {
      cookieStore.set("better-auth.session_token", token, baseCookieOptions);
    }

    // ✅ password change flow
    if (needPasswordChange) {
      redirect(`/reset-password?email=${email}`);
    }

    // ✅ Role অনুযায়ী redirect logic
    const finalRedirect = getRedirectAfterLogin(
      role as UserRole,
      redirectPath
    );

    console.log(`✅ User role: ${role}, redirecting to: ${finalRedirect}`);

    return {
      success: true,
      redirectUrl: finalRedirect,
      user,
      debug: { requestId, code: "LOGIN_SUCCEEDED" },
    } as any;
  } catch (error: any) {
    const status = error?.response?.status as number | undefined;
    const backendMessage = error?.response?.data?.message;
    const code =
      error?.code === "ECONNABORTED"
        ? "BACKEND_TIMEOUT"
        : !error?.response
          ? "BACKEND_UNREACHABLE"
          : status === 401
            ? "INVALID_CREDENTIALS"
            : status === 403
              ? "ACCOUNT_FORBIDDEN"
              : "BACKEND_REJECTED_LOGIN";

    console.error("[IELTS Auth Server] Login failed", {
      requestId,
      code,
      status,
      message: backendMessage || error?.message,
    });

    // ✅ handle email not verified
    if (
      error?.response?.data?.message === "Email not verified"
    ) {
      redirect(`/verify-email?email=${payload.email}`);
    }

    return {
      success: false,
      message:
        backendMessage ||
        error.message ||
        "Login failed",
      debug: { requestId, code, status },
    };
  }
};
