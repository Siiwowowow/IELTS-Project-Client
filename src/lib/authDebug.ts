type AuthDebugDetails = Record<string, unknown>;

const prefix = "[IELTS Auth]";

export const authDebug = {
  info(event: string, details: AuthDebugDetails = {}) {
    console.info(prefix, event, {
      time: new Date().toISOString(),
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      ...details,
    });
  },
  warn(event: string, details: AuthDebugDetails = {}) {
    console.warn(prefix, event, {
      time: new Date().toISOString(),
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      ...details,
    });
  },
  error(event: string, details: AuthDebugDetails = {}) {
    console.error(prefix, event, {
      time: new Date().toISOString(),
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      ...details,
    });
  },
};
