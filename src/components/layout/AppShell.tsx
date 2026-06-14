"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileBottomNav } from "./MobileBottomNav";
import { signOut } from "next-auth/react";

const desktopNav = [
  { href: "/dashboard", label: "Today" },
  { href: "/history", label: "History" },
  { href: "/overview", label: "Overview" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop top nav */}
      <header className="hidden md:flex sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-[#fed7aa]/60">
        <div className="max-w-5xl mx-auto w-full px-6 flex items-center h-14 gap-8">
          <Link href="/dashboard" className="font-bold text-[#f97316] text-lg tracking-tight">
            CalorieSnap
          </Link>
          <nav className="flex gap-1 flex-1">
            {desktopNav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "px-3 py-1.5 text-sm rounded-lg transition-colors font-medium",
                    active
                      ? "bg-[#fff7ed] text-[#f97316]"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6">
          {children}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
