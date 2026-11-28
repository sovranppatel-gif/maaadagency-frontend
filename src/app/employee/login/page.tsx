"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/http";

export default function EmployeeLoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace(user.role === "EMPLOYEE" ? "/employee/dashboard" : "/master-admin");
  }, [loading, user, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const signedInUser = await login(email.trim(), password);
      router.replace(signedInUser.role === "EMPLOYEE" ? "/employee/dashboard" : "/master-admin");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0e0f11] px-4 py-12 text-[#eceae4]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/images/logo.png" alt="Maa Ad Agency" width={180} height={80} className="h-14 w-auto" priority />
          <h1 className="mt-6 text-lg font-bold text-[#ffffff]">Employee Sign In</h1>
          <p className="mt-1 text-sm text-[#8b8d93]">Use the login email and password set through your private invitation link.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#26282d] bg-[#131417] p-6 shadow-2xl">
          {error && <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">{error}</div>}
          <div className="mb-4">
            <label htmlFor="employee-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#8b8d93]">Email address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8d93]" />
              <input
                id="employee-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[#26282d] bg-[#1a1c20] py-2.5 pl-10 pr-3 text-sm text-[#ffffff] outline-none placeholder:text-[#5d6066] focus:border-accent"
                placeholder="name@example.com"
              />
            </div>
          </div>
          <div className="mb-5">
            <label htmlFor="employee-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#8b8d93]">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8d93]" />
              <input
                id="employee-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#26282d] bg-[#1a1c20] py-2.5 pl-10 pr-10 text-sm text-[#ffffff] outline-none placeholder:text-[#5d6066] focus:border-accent"
                placeholder="Your password"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8d93] hover:text-[#ffffff]">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5161d] py-3 text-sm font-bold text-[#ffffff] hover:bg-[#9c1116] disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
          <div className="mt-4 text-center">
            <Link href="/employee/forgot-password" className="text-sm font-semibold text-[#c6c5c0] underline underline-offset-4 hover:text-[#ffffff]">Forgot password?</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
