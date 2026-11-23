import { AuthProvider } from "@/lib/auth-context";

export default function EmployeeRootLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
