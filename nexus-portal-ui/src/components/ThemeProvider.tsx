"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Global Fetch Interceptor for API Requests
if (typeof window !== "undefined" && !window.__nexus_fetch_intercepted) {
  window.__nexus_fetch_intercepted = true;
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    let url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    // Inject Bearer token to all BizzFlow API calls
    if (url.includes("/api/")) {
      const token = localStorage.getItem("nexus_token");
      if (token) {
        init = init || {};
        init.headers = init.headers || {};
        init.credentials = init.credentials || "include";

        if (init.headers instanceof Headers) {
          if (!init.headers.has("Authorization")) {
            init.headers.append("Authorization", `Bearer ${token}`);
          }
        } else if (Array.isArray(init.headers)) {
          const hasAuth = init.headers.some(([k]) => k.toLowerCase() === "authorization");
          if (!hasAuth) {
            init.headers.push(["Authorization", `Bearer ${token}`]);
          }
        } else {
          const hasAuth = Object.keys(init.headers).some(k => k.toLowerCase() === "authorization");
          if (!hasAuth) {
            init.headers = {
              ...init.headers,
              "Authorization": `Bearer ${token}`
            };
          }
        }
      }
    }
    return originalFetch.call(this, input, init);
  };
}

declare global {
  interface Window {
    __nexus_fetch_intercepted?: boolean;
  }
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
