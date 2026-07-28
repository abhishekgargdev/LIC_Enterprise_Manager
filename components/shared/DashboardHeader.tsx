"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Bell,
  FileText,
  Clock,
  AlertTriangle,
  Gift,
  UserPlus,
  DollarSign,
  Calendar,
  Check,
  CheckCircle,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import type { UserRole } from "@/lib/permissions"

interface DashboardHeaderProps {
  role: UserRole
}

type NotificationItem = {
  _id: string
  type: string
  title: string
  message: string
  link: string
  isRead: boolean
  createdAt: string
}

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  PREMIUM_DUE: { icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
  POLICY_EXPIRING: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  POLICY_LAPSED: { icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10" },
  BIRTHDAY: { icon: Gift, color: "text-pink-500", bg: "bg-pink-500/10" },
  CLAIM_STATUS_CHANGE: { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
  NEW_ASSIGNMENT: { icon: UserPlus, color: "text-purple-500", bg: "bg-purple-500/10" },
  COMMISSION_CREDITED: { icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  LEAD_FOLLOWUP_DUE: { icon: Calendar, color: "text-orange-500", bg: "bg-orange-500/10" },
  PREMIUM_MISSED: { icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10" },
  POLICY_MATURED: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  CLAIM_SETTLED: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 1. Fetch unread count (polls every 30s)
  const { data: countData } = useQuery({
    queryKey: ["unreadNotificationsCount"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count")
      const json = await res.json()
      return json.success ? json.count : 0
    },
    refetchInterval: 30000,
  })

  // 2. Fetch 5 most recent notifications (polls every 30s)
  const { data: listData } = useQuery({
    queryKey: ["recentNotifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=5")
      const json = await res.json()
      return json.success ? json.data : []
    },
    refetchInterval: 30000,
  })

  const unreadCount = countData || 0
  const recentNotifications: NotificationItem[] = listData || []

  // 3. Mark all read mutation
  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/mark-all-read", { method: "POST" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] })
      queryClient.invalidateQueries({ queryKey: ["recentNotifications"] })
    },
  })

  // 4. Mark single read mutation
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] })
      queryClient.invalidateQueries({ queryKey: ["recentNotifications"] })
    },
  })

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markRead.mutateAsync(item._id)
    }
    setIsOpen(false)
    if (item.link) {
      router.push(item.link)
    }
  }

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur-sm md:px-8">
      <div className="flex items-center gap-3">
        <div className="rounded-3xl bg-accent/10 px-3 py-2 text-sm font-medium text-accent-foreground">
          Internal Staff Shell
        </div>
        <p className="text-sm text-muted-foreground">Role: {role.replace("_", " ")}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Bell Dropdown wrapper */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:text-foreground hover:scale-[1.03] active:scale-95 ${
              isOpen ? "text-foreground border-primary/30" : ""
            }`}
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-4 ring-background animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 rounded-[1.5rem] border border-border/80 bg-card p-4 shadow-2xl backdrop-blur-md z-50 animate-in fade-in-50 slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                <h4 className="font-bold text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <Check className="size-3.5" /> Mark all read
                  </button>
                )}
              </div>

              {/* Notification items */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {recentNotifications.length > 0 ? (
                  recentNotifications.map((item) => {
                    const cfg = typeConfig[item.type] || {
                      icon: Bell,
                      color: "text-muted-foreground",
                      bg: "bg-muted/10",
                    }
                    const Icon = cfg.icon

                    return (
                      <div
                        key={item._id}
                        onClick={() => handleNotificationClick(item)}
                        className={`flex gap-3 items-start p-2.5 rounded-xl border text-left cursor-pointer transition-all hover:bg-muted/20 ${
                          item.isRead
                            ? "bg-transparent border-transparent opacity-75"
                            : "bg-muted/30 border-border/40 font-medium"
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${cfg.bg} ${cfg.color}`}>
                          <Icon className="size-4" />
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <p className="font-semibold text-foreground line-clamp-1">{item.title}</p>
                          <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No recent notifications.
                  </div>
                )}
              </div>

              {/* View all footer */}
              <div className="border-t border-border/40 pt-2 mt-3 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    router.push("/dashboard/notifications")
                  }}
                  className="text-xs text-primary hover:underline font-semibold w-full"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />

        <div className="hidden items-center gap-3 rounded-3xl border border-border bg-card px-3 py-2 md:flex">
          <Avatar>
            <AvatarFallback>SA</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Super Admin</p>
            <p className="text-xs text-muted-foreground">super_admin@lic.local</p>
          </div>
        </div>
      </div>
    </header>
  )
}
