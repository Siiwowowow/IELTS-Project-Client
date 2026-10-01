"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getUserInfo, logoutUser } from "@/services/auth.services";
import { ICurrentUser } from "@/types/user.types";
import { authDebug } from "@/lib/authDebug";

interface AuthContextType {
  user: ICurrentUser | null;
  setUser: (user: ICurrentUser | null) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: ICurrentUser | null;
}) {
  const [user, setUser] = useState<ICurrentUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(!initialUser);
  const authRevision = useRef(0);

  const updateUser = useCallback((nextUser: ICurrentUser | null) => {
    authRevision.current += 1;
    setUser(nextUser);
    setIsLoading(false);
  }, []);

  // Keep the root layout static: session hydration happens after the shell is
  // visible and is retained by this provider during client-side navigation.
  useEffect(() => {
    if (initialUser) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const hydrationRevision = authRevision.current;
    authDebug.info("SESSION_HYDRATION_STARTED");
    void getUserInfo()
      .then((currentUser) => {
        if (cancelled) return;
        if (authRevision.current !== hydrationRevision) {
          authDebug.warn("STALE_SESSION_RESPONSE_IGNORED");
          return;
        }
        setUser(currentUser);
        setIsLoading(false);
        if (currentUser) {
          authDebug.info("SESSION_HYDRATED", { role: currentUser.role });
        } else {
          authDebug.warn("NO_ACTIVE_SESSION", {
            reason: "Backend returned no authenticated user",
          });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setIsLoading(false);
        authDebug.error("SESSION_HYDRATION_FAILED", {
          message: error instanceof Error ? error.message : "Unknown session error",
          errorType: error instanceof Error ? error.name : typeof error,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [initialUser]);

  const logout = useCallback(async () => {
    authDebug.info("LOGOUT_STARTED");
    updateUser(null);
    try {
      const success = await logoutUser();
      authDebug.info("LOGOUT_FINISHED", { success });
      window.location.href = "/login";
    } catch (error) {
      authDebug.error("LOGOUT_FAILED", {
        message: error instanceof Error ? error.message : "Unknown logout error",
      });
    }
  }, [updateUser]);

  const value = useMemo(
    () => ({ user, setUser: updateUser, logout, isLoading }),
    [user, updateUser, logout, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
