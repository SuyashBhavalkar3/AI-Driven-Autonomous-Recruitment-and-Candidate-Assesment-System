// app/candidate/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Briefcase,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { logout, getUserData, getAuthToken } from "@/lib/auth";
import { getCurrentUser } from "@/lib/api";

const navItems = [
  { name: "Dashboard", href: "/candidate", icon: Home },
  { name: "Jobs", href: "/candidate/jobs", icon: Search },
  { name: "Applications", href: "/candidate/applications", icon: FileText },
  { name: "Notifications", href: "/candidate/schedule", icon: Bell },
  { name: "Profile", href: "/candidate/profile", icon: Settings },
];

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          console.error('Failed to load user data:', error);
        }
      }
    };
    loadUserData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Floating orbs background */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-20 left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="fixed bottom-20 right-10 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl -z-10"
      />

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              HireFlow
            </Link>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {userData?.name || 'Loading...'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {userData?.email || ''}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-500" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn("transition-all duration-200", "lg:pl-64")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}