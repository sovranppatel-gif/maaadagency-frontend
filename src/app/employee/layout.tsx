import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme";
import "./employee-theme.css";

export const metadata: Metadata = {
  title: {
    default: "Employee Portal | Maa Ad Agency",
    template: "%s | Employee Portal",
  },
  robots: { index: false, follow: false },
};

export default function EmployeeRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
