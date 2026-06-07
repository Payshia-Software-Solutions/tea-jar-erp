"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosDevice() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  return /iPad|iPhone|iPod/i.test(ua);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  // iOS Safari uses navigator.standalone; other browsers use display-mode media query.
  const nav = window.navigator as any;
  return Boolean(nav?.standalone) || window.matchMedia?.("(display-mode: standalone)")?.matches === true;
}

function getDismissUntil(): number {
  try {
    const raw = window.localStorage.getItem("pwa_install_dismissed_until");
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function setDismissForDays(days: number) {
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    window.localStorage.setItem("pwa_install_dismissed_until", String(until));
  } catch {
    // ignore
  }
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  const ios = useMemo(() => isIosDevice(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;

    const dismissedUntil = getDismissUntil();
    if (dismissedUntil && dismissedUntil > Date.now()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;

    const dismissedUntil = getDismissUntil();
    if (dismissedUntil && dismissedUntil > Date.now()) return;

    // Android/Chrome: show when we have the event. iOS: show helper banner.
    const shouldShow = Boolean(deferred) || ios;
    if (!shouldShow) return;

    const t = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(t);
  }, [deferred, ios]);

  if (!visible) return null;
  if (typeof window === "undefined") return null;
  if (isStandalone()) return null;

  const onClose = () => {
    setVisible(false);
    setDismissForDays(14);
  };

  const onInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const res = await deferred.userChoice;
      setDeferred(null);
      setVisible(false);
      // If they dismissed, don't nag too soon.
      setDismissForDays(res.outcome === "accepted" ? 60 : 14);
    } catch {
      setVisible(false);
      setDismissForDays(14);
    }
  };

  const title = deferred ? "Install BizzFlow" : "Add BizzFlow to Home Screen";
  const desc = deferred
    ? "Get faster access and offline-friendly loading."
    : "On iPhone/iPad: tap Share, then “Add to Home Screen”.";

  return (
    <div
      className={cn(
        "fixed bottom-3 left-3 right-3 z-50",
        "sm:left-auto sm:right-6 sm:max-w-[420px]"
      )}
    >
      <div className="rounded-2xl border bg-card/95 backdrop-blur shadow-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          {deferred ? (
            <Button size="sm" className="h-9" onClick={() => void onInstall()}>
              Install
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

