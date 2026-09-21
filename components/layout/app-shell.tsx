import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-canvas">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64">
        <Sidebar />
      </div>
      <div className="min-w-0 lg:pl-64">
        <Header navigationToggle={<MobileNav sidebar={<Sidebar />} />} />
        <main id="main-content" className="px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
