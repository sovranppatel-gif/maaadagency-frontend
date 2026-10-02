import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme";
import "./theme.css";

export const metadata: Metadata = {
  title: {
    default: "Master Admin | Maa Ad Agency",
    template: "%s | Master Admin",
  },
  robots: { index: false, follow: false },
};

// Root shell for everything under /master-admin, including /master-admin/login.
// The sidebar/header chrome and the "must be signed in" guard live one level
// down in (dashboard)/layout.tsx, which the login route intentionally sits
// outside of.
export default function MasterAdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
