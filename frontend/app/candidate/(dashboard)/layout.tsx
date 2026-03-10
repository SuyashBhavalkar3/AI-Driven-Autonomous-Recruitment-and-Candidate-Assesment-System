"use client";

import { useEffect, useRef, useState } from "react";
import { removeAuthToken } from "@/lib/auth";
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
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAuthToken, logout } from "@/lib/auth";
import { getCurrentUser } from "@/lib/api";
import { calculateProfileCompletion } from "@/lib/profileCompletion";

/* ------------------ Types ------------------ */
interface User {
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  resume?: string;
  experiences?: any[];
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
  const profileCardRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ------------------ Load user ------------------ */
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const token = getAuthToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        const data = await getCurrentUser(token);

        if (mounted) {
          setUser(data);
        }

      } catch (err) {
        removeAuthToken();
        router.replace("/login");
        return;
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [router]);

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

  // Calculate profile completion
  const profileStatus = calculateProfileCompletion({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.location || "",
    bio: user?.bio || "",
    skills: user?.skills || [],
    resume: user?.resume || "",
    experiences: user?.experiences || [],
  });

  // Get completion message based on percentage
  const getCompletionMessage = (percentage: number) => {
    if (percentage < 30) return "Start building your profile";
    if (percentage < 60) return "Keep going! You're making progress";
    if (percentage < 90) return "Almost there! Just a few more details";
    return "Great job! Your profile is complete";
  };

  // Get next step based on missing fields
  const getNextStep = () => {
    const missingFields = profileStatus.missingFields;
    if (missingFields.includes("resume")) return "Upload your resume";
    if (missingFields.includes("skills")) return "Add your skills";
    if (missingFields.includes("experience")) return "Add work experience";
    if (missingFields.includes("location")) return "Add your location";
    return "Complete your profile";
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950">
      {/* Mobile menu */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setSidebarOpen((p) => !p)}
          className="bg-white/80 backdrop-blur-sm border-[#D6CDC2]"
        >
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-80 border-r bg-white/70 backdrop-blur-xl transition-transform",
          "dark:bg-slate-900/70 dark:border-slate-800",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col p-6">
          {/* Logo */}
          <Link href="/candidate" className="mb-8 flex items-center gap-2">
            <span className="text-3xl font-serif text-[#2D2A24] dark:text-white">
              HireFlow
            </span>
            <Sparkles className="h-5 w-5 text-[#B8915C]" />
          </Link>

          {/* Profile Completion Card - Always visible */}
          <motion.div
            ref={profileCardRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Link href="/candidate/profile">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#B8915C]/10 to-[#9F7A4F]/5 p-4 border border-[#B8915C]/20 hover:border-[#B8915C]/40 transition-all duration-300 cursor-pointer group">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#B8915C]/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#9F7A4F]/10 rounded-full blur-xl" />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {profileStatus.percentage === 100 ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                      <h3 className="font-medium text-[#2D2A24] dark:text-white">
                        Profile Completion
                      </h3>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "border-none",
                        profileStatus.percentage === 100 
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" 
                          : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"
                      )}
                    >
                      {profileStatus.percentage}%
                    </Badge>
                  </div>

                  <Progress 
                    value={profileStatus.percentage} 
                    className="h-2 mb-3 bg-[#D6CDC2]/30"
                    indicatorClassName={cn(
                      profileStatus.percentage === 100 
                        ? "bg-emerald-500" 
                        : "bg-gradient-to-r from-[#B8915C] to-[#9F7A4F]"
                    )}
                  />

                  <p className="text-xs text-[#5A534A] dark:text-slate-400 mb-2">
                    {getCompletionMessage(profileStatus.percentage)}
                  </p>

                  {profileStatus.percentage < 100 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#B8915C]">
                        Next: {getNextStep()}
                      </span>
                      <ArrowRight className="h-4 w-4 text-[#B8915C] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}

                  {/* Missing fields summary */}
                  {profileStatus.missingFields.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#D6CDC2]/20">
                      <p className="text-xs text-[#A69A8C] mb-2">Missing:</p>
                      <div className="flex flex-wrap gap-1">
                        {profileStatus.missingFields.slice(0, 3).map((field) => (
                          <Badge 
                            key={field}
                            variant="outline" 
                            className="text-[10px] bg-white/50 border-[#D6CDC2]/30 text-[#5A534A]"
                          >
                            {field}
                          </Badge>
                        ))}
                        {profileStatus.missingFields.length > 3 && (
                          <Badge variant="outline" className="text-[10px] bg-white/50 border-[#D6CDC2]/30">
                            +{profileStatus.missingFields.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Nav */}
          <nav ref={navRef} className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200",
                    active
                      ? "bg-[#B8915C] text-white shadow-md"
                      : "text-[#4A443C] hover:bg-[#F1E9E0] dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    active ? "text-white" : "text-[#A69A8C]"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="mt-6 border-t border-[#D6CDC2]/30 pt-6">
            <div className="flex items-center gap-3 rounded-xl bg-white/50 p-3 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300">
              <Avatar className="ring-2 ring-[#B8915C]/20">
                {loading ? (
                  <Skeleton className="h-10 w-10 rounded-full" />
                ) : (
                  <>
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-[#B8915C]/10 text-[#B8915C]">
                      {user?.name?.[0] ?? "U"}
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
                    <p className="truncate text-sm font-medium text-[#2D2A24] dark:text-white">
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-[#5A534A] dark:text-slate-400">
                      {user?.email}
                    </p>
                  </>
                )}
              </div>

              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleLogout}
                className="text-[#A69A8C] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="lg:pl-80">
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