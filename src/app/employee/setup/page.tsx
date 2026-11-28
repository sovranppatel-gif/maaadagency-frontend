"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { http, ApiError } from "@/lib/http";

let setupTokenCache: string | null = null;

function getSetupToken() {
  if (typeof window === "undefined") return "";
  if (setupTokenCache !== null) return setupTokenCache;
  setupTokenCache = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
  return setupTokenCache;
}

function subscribeToSetupToken() {
  if (typeof window !== "undefined") {
    if (setupTokenCache === null) {
      setupTokenCache = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    }
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  }
  return () => {};
}

export default function EmployeeSetupPage() {
  const token = useSyncExternalStore(subscribeToSetupToken, getSetupToken, () => "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This setup link is missing its token. Ask your Master Admin for a new link.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await http.post("/auth/employee-setup", { token, password }, { skipAuthRetry: true });
      setComplete(true);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Could not set your password. Ask your Master Admin for a new link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0e0f11] px-4 py-12 text-[#eceae4]">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <Image src="/images/logo.png" alt="Maa Ad Agency" width={180} height={80} className="h-12 w-auto" priority />
          <h1 className="mt-5 text-lg font-bold text-[#ffffff]">{complete ? "Password set" : "Set up your employee login"}</h1>
          <p className="mt-1 text-sm text-[#8b8d93]">{complete ? "Your one-time link has been used." : "Choose a new password. This link can be used only once."}</p>
        </div>
        {complete ? (
          <div className="rounded-2xl border border-[#26282d] bg-[#131417] p-6 text-center">
            <p className="text-sm text-[#c6c5c0]">Your password is ready. Sign in with your employee email and the password you just set.</p>
            <Link href="/employee/login" className="mt-5 inline-flex rounded-xl bg-[#c5161d] px-5 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#9c1116]">Go to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#26282d] bg-[#131417] p-6">
            {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">{error}</div>}
            {!token && <p className="text-sm text-amber-200">Checking the one-time setup link… If it remains missing, request a new one from your Master Admin.</p>}
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#8b8d93]">New password</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8d93]" />
                <input id="new-password" type={showPassword ? "text" : "password"} required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[#26282d] bg-[#1a1c20] py-2.5 pl-10 pr-10 text-sm text-[#ffffff] outline-none focus:border-accent" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8d93] hover:text-[#ffffff]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-[#8b8d93]">Use at least 12 characters.</p>
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#8b8d93]">Confirm password</label>
              <input id="confirm-password" type={showPassword ? "text" : "password"} required minLength={12} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-[#26282d] bg-[#1a1c20] px-3 py-2.5 text-sm text-[#ffffff] outline-none focus:border-accent" />
            </div>
            <button type="submit" disabled={submitting || !token} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5161d] py-3 text-sm font-bold text-[#ffffff] hover:bg-[#9c1116] disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Set Password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
