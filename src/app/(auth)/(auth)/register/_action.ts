/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

const BASE_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const REGISTER_TIMEOUT_MS = 15_000;

// ✅ IRegisterPayload বাদ — এখন সরাসরি FormData নেবে
export async function registerAction(formData: FormData) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REGISTER_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_API_URL}/auth/register`, {
      method: "POST",
      // ✅ Content-Type header দেবেন না — browser নিজে multipart/form-data set করবে
      body: formData,
      credentials: "include",
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Registration failed",
      };
    }

    return {
      success: true,
      message: data.message || "Registration successful. Please check your email for verification code.",
      data: data.data,
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    if (error?.name === "AbortError") {
      return {
        success: false,
        message: "Registration is taking too long. Please try again.",
      };
    }
    return {
      success: false,
      message: error.message || "An error occurred during registration",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}