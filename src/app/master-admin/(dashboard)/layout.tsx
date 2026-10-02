"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { DirectoryProvider } from "@/lib/directory";
import { AdminShell } from "@/components/master-admin/AdminShell";

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
      <Image src="/images/logo.png" alt="Maa Ad Agency" width={140} height={62} className="h-10 w-auto" priority />
      <div className="h-0.5 w-32 overflow-hidden rounded-full bg-border">
        <div className="h-full w-1/3 animate-[loaderbar_1s_ease-in-out_infinite] rounded-full bg-accent" />
      </div>
      <style>{`
        @keyframes loaderbar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}

// Every dashboard route lives inside this route group (URL still resolves to
// e.g. /master-admin/leads — route groups don't add a path segment). This is
// the auth boundary: unauthenticated visitors are bounced to the login page,
// which sits outside the group and therefore doesn't get the sidebar/header
// or this guard.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/master-admin/login");
  }, [loading, user, router]);

  if (loading || !user) return <FullScreenLoader />;

  return (
    <DirectoryProvider>
      <AdminShell>{children}</AdminShell>
    </DirectoryProvider>
  );
}
