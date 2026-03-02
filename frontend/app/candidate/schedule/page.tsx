"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type NotificationType = "success" | "warning" | "info";

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  action: { label: string; link: string };
}

const notifications: Notification[] = [
  {
    id: 1,
    type: "success",
    title: "Application Accepted",
    message:
      "Your application for Senior Frontend Developer at TechCorp has been accepted. Schedule your assessment now.",
    time: "2 hours ago",
    read: false,
    action: { label: "Schedule Assessment", link: "/candidate/applications" },
  },
  {
    id: 2,
    type: "info",
    title: "Interview Scheduled",
    message:
      "Your AI interview for Full Stack Engineer at InnovateLabs is scheduled for tomorrow at 2:00 PM.",
    time: "5 hours ago",
    read: false,
    action: { label: "View Details", link: "/candidate/applications" },
  },
  {
    id: 3,
    type: "warning",
    title: "Assessment Deadline Approaching",
    message:
      "Your assessment for Backend Developer position is due in 2 days. Complete it soon.",
    time: "1 day ago",
    read: true,
    action: { label: "Start Assessment", link: "/candidate/assessment" },
  },
  {
    id: 4,
    type: "success",
    title: "Offer Received",
    message:
      "Congratulations! CloudTech has extended an offer for the DevOps Engineer position.",
    time: "2 days ago",
    read: true,
    action: { label: "View Offer", link: "/candidate/applications" },
  },
  {
    id: 5,
    type: "info",
    title: "New Job Match",
    message: "We found 3 new jobs that match your profile. Check them out!",
    time: "3 days ago",
    read: true,
    action: { label: "Browse Jobs", link: "/candidate/jobs" },
  },
];

const typeConfig: Record<
  NotificationType,
  { icon: typeof CheckCircle; color: string; bg: string }
> = {
  success: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  warning: {
    icon: AlertCircle,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
};

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Notification[]>([]);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(notifications);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Generate decorative particles
  useEffect(() => {
    const newParticles: React.ReactNode[] = [];
    for (let i = 0; i < 15; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      newParticles.push(
        <div
          key={`dot-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-[#B8915C]/10 dark:bg-[#B8915C]/5"
          style={{ top: `${top}%`, left: `${left}%`, filter: "blur(1px)" }}
        />
      );
    }
    setParticles(newParticles);
  }, []);

  // GSAP entrance animations
  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".notification-card", {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setItems((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden">
      {/* Decorative particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles}
      </div>

      <div ref={containerRef} className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="font-serif text-4xl font-medium text-[#2D2A24] dark:text-white mb-2 flex items-center gap-2">
              Notifications
              <Sparkles className="h-6 w-6 text-[#B8915C] animate-pulse" />
            </h1>
            <p className="text-[#5A534A] dark:text-slate-400">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
            >
              Mark all as read
            </Button>
          )}
        </motion.div>

        {/* Notifications list */}
        <div className="space-y-3">
          {loading ? (
            // Skeleton loaders
            [...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-pulse"
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#D6CDC2] dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-[#D6CDC2] dark:bg-slate-700 rounded" />
                      <div className="h-3 w-48 bg-[#D6CDC2] dark:bg-slate-700 rounded" />
                      <div className="h-3 w-24 bg-[#D6CDC2] dark:bg-slate-700 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : items.length === 0 ? (
            <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20">
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-[#A69A8C] mx-auto mb-4" />
                <h3 className="font-serif text-xl text-[#2D2A24] dark:text-white mb-2">
                  No notifications
                </h3>
                <p className="text-[#5A534A] dark:text-slate-400">
                  You're all caught up! We'll notify you when something new arrives.
                </p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {items.map((notification) => {
                const config = typeConfig[notification.type];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={notification.id}
                    className="notification-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -2 }}
                  >
                    <Card
                      className={`border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20 hover:shadow-2xl transition-all duration-300 ${
                        !notification.read ? "ring-2 ring-[#B8915C]/20" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className={`p-2 rounded-lg ${config.bg} h-fit`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-1">
                              <h3 className="font-semibold text-[#2D2A24] dark:text-white">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <Badge className="bg-[#B8915C]/10 text-[#B8915C] border-none">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#5A534A] dark:text-slate-400 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#A69A8C]">
                                {notification.time}
                              </span>
                              <div className="flex gap-2">
                                {notification.action && (
                                  <Link href={notification.action.link}>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                                    >
                                      {notification.action.label}
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[#A69A8C] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}