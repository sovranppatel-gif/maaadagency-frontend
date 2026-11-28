"use client";

import Link from "next/link";
import Image from "next/image";
import { KeyRound } from "lucide-react";

export default function EmployeeForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0e0f11] px-4 py-12 text-[#eceae4]">
      <div className="w-full max-w-md rounded-2xl border border-[#26282d] bg-[#131417] p-7 text-center shadow-2xl">
        <Image src="/images/logo.png" alt="Maa Ad Agency" width={180} height={80} className="mx-auto h-12 w-auto" priority />
        <span className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1c20] text-[#eceae4]"><KeyRound className="h-5 w-5" /></span>
        <h1 className="mt-4 text-lg font-bold text-[#ffffff]">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-[#a9aaae]">
          For security, password reset links are issued by a Master Admin and shared privately. Contact your Master Admin and ask them to initiate a reset.
        </p>
        <Link href="/employee/login" className="mt-6 inline-flex rounded-xl bg-[#c5161d] px-5 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#9c1116]">Back to sign in</Link>
      </div>
    </main>
  );
}
