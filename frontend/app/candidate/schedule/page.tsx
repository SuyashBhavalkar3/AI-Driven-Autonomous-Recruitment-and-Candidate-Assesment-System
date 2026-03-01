"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertCircle, Info, Calendar, Trash2 } from "lucide-react";

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
    message: "Your application for Senior Frontend Developer at TechCorp has been accepted. Schedule your assessment now.",
    time: "2 hours ago",
    read: false,
    action: { label: "Schedule Assessment", link: "/candidate/applications" },
  },
  {
    id: 2,
    type: "info",
    title: "Interview Scheduled",
    message: "Your AI interview for Full Stack Engineer at InnovateLabs is scheduled for tomorrow at 2:00 PM.",
    time: "5 hours ago",
    read: false,
    action: { label: "View Details", link: "/candidate/applications" },
  },
  {
    id: 3,
    type: "warning",
    title: "Assessment Deadline Approaching",
    message: "Your assessment for Backend Developer position is due in 2 days. Complete it soon.",
    time: "1 day ago",
    read: true,
    action: { label: "Start Assessment", link: "/candidate/assessment" },
  },
  {
    id: 4,
    type: "success",
    title: "Offer Received",
    message: "Congratulations! CloudTech has extended an offer for the DevOps Engineer position.",
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

const typeConfig: Record<NotificationType, { icon: typeof CheckCircle; color: string; bg: string }> = {
  success: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
  warning: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
};

export default function NotificationsPage() {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Notifications</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <Button variant="outline" size="sm">
            Mark all as read
          </Button>
        </div>

        <div className="space-y-3">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;

            return (
              <Card
                key={notification.id}
                className={`border-slate-200 dark:border-slate-800 ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={`p-2 rounded-lg ${config.bg} h-fit`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{notification.title}</h3>
                        {!notification.read && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{notification.time}</span>
                        <div className="flex gap-2">
                          {notification.action && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={notification.action.link}>{notification.action.label}</a>
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-slate-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
