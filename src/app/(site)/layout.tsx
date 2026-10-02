import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { MobileStickyBar } from "@/components/layout/MobileStickyBar";

// The public marketing site's shell (navbar, footer, floating actions).
// Kept in its own route group so /master-admin can use a completely
// different app shell without inheriting any of this.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell flex min-h-screen flex-col overflow-x-clip">
      <a
        href="#main"
        className="sr-only z-[70] rounded-full bg-brand-dark px-5 py-3 text-sm font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1 pb-20 sm:pb-0">
        {children}
      </main>
      <Footer />
      <FloatingActions />
      <MobileStickyBar />
    </div>
  );
}
