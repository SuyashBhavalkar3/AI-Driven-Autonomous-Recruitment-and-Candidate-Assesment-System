"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
  Bell,
  FileText,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getAuthToken, logout } from "@/lib/auth";
import { getCurrentUser } from "@/lib/api";

/* ------------------ Types ------------------ */
interface User {
  full_name: string;
  email: string;
  avatar?: string;
}

/* ------------------ Nav ------------------ */
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
  const pathname = usePathname();
  const router = useRouter();

  const sidebarRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ------------------ Load user ------------------ */
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const token = getAuthToken();
        if (!token) return;

        const data = await getCurrentUser(token);
        if (mounted) setUser(data);
      } catch (err) {
        console.error("User fetch failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------ GSAP ------------------ */
  useEffect(() => {
    if (!loading && navRef.current) {
      gsap.fromTo(
        navRef.current.children,
        { x: -16, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
        }
      );
    }
  }, [loading]);

  /* ------------------ Close sidebar on route ------------------ */
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  /* ------------------ Logout ------------------ */
  const handleLogout = async () => {
    await logout();
    router.push("/");
  };
const isActiveRoute = (href: string) => {
  if (href === "/candidate") {
    return pathname === "/candidate";
  }
  return pathname.startsWith(href);
};
  return (
    <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950">
      {/* Mobile menu */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setSidebarOpen((p) => !p)}
        >
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r bg-white/70 backdrop-blur-xl transition-transform",
          "dark:bg-slate-900/70",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col p-6">
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center gap-2">
            <span className="text-3xl font-serif text-[#2D2A24] dark:text-white">
              HireFlow
            </span>
            <Sparkles className="h-5 w-5 text-[#B8915C]" />
          </Link>

          {/* Nav */}
          <nav ref={navRef} className="flex-1 space-y-1">
            {navItems.map((item) => {
             const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
                    active
                      ? "bg-[#B8915C] text-white"
                      : "hover:bg-[#F1E9E0] dark:hover:bg-slate-800"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="mt-6 border-t pt-6">
            <div className="flex items-center gap-3 rounded-xl bg-white/50 p-3 dark:bg-slate-800/50">
              <Avatar>
                {loading ? (
                  <Skeleton className="h-10 w-10 rounded-full" />
                ) : (
                  <>
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>
                      {user?.full_name?.[0] ?? "U"}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>

              <div className="min-w-0 flex-1">
                {loading ? (
                  <>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </>
                ) : (
                  <>
                    <p className="truncate text-sm font-medium">
                      {user?.full_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </>
                )}
              </div>

              <Button size="icon" variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}