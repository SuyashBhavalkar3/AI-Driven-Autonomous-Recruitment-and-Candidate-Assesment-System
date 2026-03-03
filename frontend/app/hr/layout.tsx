"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Users,
  PlusCircle,
  LogOut,
  Menu,
  X,
  Home,
  HelpCircle,
  Settings,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { logout, getAuthToken } from "@/lib/auth";
import { getCurrentUser } from "@/lib/api";

const navItems = [
  { name: "Dashboard", href: "/hr", icon: Home },
  { name: "Jobs", href: "/hr/jobs", icon: Briefcase },
  { name: "Applicants", href: "/hr/applicants", icon: Users },
  { name: "Questions", href: "/hr/questions", icon: HelpCircle },
  { name: "Profile", href: "/hr/profile", icon: Settings },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const user = await getCurrentUser(token);
          setUserData(user);
        } catch (error) {
          console.error("Failed to load user data:", error);
        }
      }
    };
    loadUserData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-md"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo area with decorative element */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <Link href="/hr" className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg shadow-blue-500/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                HireFlow HR
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 shadow-sm"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
                  )}
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform group-hover:scale-110",
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User profile section */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-blue-500/20">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  {userData?.name?.charAt(0) || "HR"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {userData?.full_name || "Loading..."}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {userData?.email || ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-72">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}