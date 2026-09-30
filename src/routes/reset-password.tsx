import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { logSecurityEventFn } from "@/lib/security.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, LockKeyhole } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Kelvora" },
      {
        name: "description",
        content: "Choose a new password for your Kelvora account and sign back in securely.",
      },
      { property: "og:title", content: "Set a new password — Kelvora" },
      {
        property: "og:description",
        content: "Complete your Kelvora password reset.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Helper to extract query or hash parameters
    function parseAuthParams(): {
      code: string | null;
      error: string | null;
      errorDescription: string | null;
      type: string | null;
    } {
      if (typeof window === "undefined") {
        return { code: null, error: null, errorDescription: null, type: null };
      }
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);

      const code = searchParams.get("code") || hashParams.get("code");
      const error = searchParams.get("error") || hashParams.get("error");
      const errorDescription =
        searchParams.get("error_description") || hashParams.get("error_description");
      const type = searchParams.get("type") || hashParams.get("type");

      return { code, error, errorDescription, type };
    }

    async function initAuthRecovery() {
      const { code, error, errorDescription } = parseAuthParams();

      if (error || errorDescription) {
        if (!cancelled) {
          setErrorMessage(
            errorDescription ||
              (error === "access_denied"
                ? "This password recovery link has already been used or has expired."
                : `Authentication error: ${error}`),
          );
          setValidLink(false);
          setReady(true);
        }
        return;
      }

      // If PKCE authorization code is present in URL, exchange it for a session
      if (code) {
        try {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn("[ResetPassword] Code exchange error:", exchangeError);
            if (!cancelled) {
              setErrorMessage(exchangeError.message);
              setValidLink(false);
              setReady(true);
            }
            return;
          }
          if (exchangeData.user && !cancelled) {
            setValidLink(true);
            setEmail(exchangeData.user.email ?? null);
            setReady(true);
            return;
          }
        } catch (e) {
          console.error("[ResetPassword] Unexpected code exchange failure:", e);
        }
      }

      // Check current user session (e.g., implicit hash fragment flow)
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (data.user) {
        setValidLink(true);
        setEmail(data.user.email ?? null);
        setReady(true);
        return;
      }

      // Allow a brief grace period for background hash parsing by Supabase JS client
      const timer = setTimeout(async () => {
        if (cancelled) return;
        const secondCheck = await supabase.auth.getUser();
        if (cancelled) return;
        setValidLink(Boolean(secondCheck.data.user));
        setEmail(secondCheck.data.user?.email ?? null);
        setReady(true);
      }, 750);

      return () => clearTimeout(timer);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (session?.user) {
          setValidLink(true);
          setEmail(session.user.email ?? null);
          setReady(true);
        }
      }
    });

    void initAuthRecovery();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("Those passwords don't match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await logSecurityEventFn({
        data: { event: "password_reset_completed", ...(email ? { email } : {}) },
      }).catch(() => undefined);

      // Force other active sessions to sign in again for security
      await supabase.auth.signOut({ scope: "global" }).catch(() => undefined);
      setDone(true);
      toast.success("Password successfully updated!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "We couldn't update your password. Please request a new reset link.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Shell title="Password updated">
        <div className="text-center py-4 space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-xs text-slate-600">
            Your password has been changed successfully. For your security, all active sessions were
            signed out.
          </p>
          <Button className="mt-4 h-11 w-full bg-[#0B1457] hover:bg-[#0001FF] text-xs font-semibold" onClick={() => navigate({ to: "/auth" })}>
            Proceed to Sign In
          </Button>
        </div>
      </Shell>
    );
  }

  if (!ready) {
    return (
      <Shell title="Validating Security Link">
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B1457] border-t-transparent" />
          <p className="text-xs text-muted-foreground">Verifying authorization token…</p>
        </div>
      </Shell>
    );
  }

  if (!validLink) {
    return (
      <Shell title="Link Expired or Invalid">
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Reset Authorization Failed</p>
              <p className="mt-0.5 text-[11px] opacity-90">
                {errorMessage ||
                  "Password reset links expire after 1 hour and can only be used once for audit security."}
              </p>
            </div>
          </div>
          <Button className="h-11 w-full bg-[#0B1457] hover:bg-[#0001FF] text-xs font-semibold" onClick={() => navigate({ to: "/auth" })}>
            Request Fresh Reset Link
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Set a New Password">
      <p className="mt-1 text-xs text-slate-500">
        Choose a secure password for <strong>{email ?? "your account"}</strong> (minimum 6 characters).
      </p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              id="new-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="h-11 pl-9 text-xs"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              id="confirm-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="h-11 pl-9 text-xs"
              placeholder="••••••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="h-11 w-full bg-[#0B1457] hover:bg-[#0001FF] text-xs font-semibold cursor-pointer"
        >
          {busy ? "Updating Credentials…" : "Confirm & Update Password"}
        </Button>
      </form>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-4 justify-center">
          <div className="h-8 w-8 rounded-lg bg-[#0B1457] flex items-center justify-center text-white font-black text-xs">
            KV
          </div>
          <span className="font-display text-xl tracking-wider text-slate-900 font-bold">
            Kelvora
          </span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
