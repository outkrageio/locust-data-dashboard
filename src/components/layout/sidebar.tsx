"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, GitCompare, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Test Runs", href: "/test-runs", icon: BarChart3 },
  { name: "Live Monitoring", href: "/live", icon: Activity },
  { name: "Compare", href: "/compare", icon: GitCompare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-white shadow-xl border-r border-gray-100">
      <div className="flex h-20 items-center px-6 bg-gradient-to-r from-purple-600 to-blue-600">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Locust Dashboard
        </h1>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50 scale-105"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 p-4 bg-gray-50">
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          API: {process.env.NEXT_PUBLIC_API_URL}
        </p>
      </div>
    </div>
  );
}
