"use client"

import { useState, useEffect } from "react"
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
  ChevronLeft,
  ChevronRight,
  MailOpen,
} from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type NotificationItem = {
  _id: string
  type: string
  title: string
  message: string
  link: string
  isRead: boolean
  createdAt: string
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  PREMIUM_DUE: { icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10", label: "Premium Due" },
  POLICY_EXPIRING: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "Policy Expiring" },
  POLICY_LAPSED: { icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", label: "Policy Lapsed" },
  BIRTHDAY: { icon: Gift, color: "text-pink-500", bg: "bg-pink-500/10", label: "Birthday" },
  CLAIM_STATUS_CHANGE: { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", label: "Claim Status Update" },
  NEW_ASSIGNMENT: { icon: UserPlus, color: "text-purple-500", bg: "bg-purple-500/10", label: "New Assignment" },
  COMMISSION_CREDITED: { icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Commission" },
  LEAD_FOLLOWUP_DUE: { icon: Calendar, color: "text-orange-500", bg: "bg-orange-500/10", label: "Lead Follow-up" },
  PREMIUM_MISSED: { icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", label: "Premium Missed" },
  POLICY_MATURED: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Policy Matured" },
  CLAIM_SETTLED: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Claim Settled" },
}

export default function NotificationsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("")

  // Fetch notifications list
  const { data: queryData, isLoading } = useQuery({
    queryKey: ["notificationsList", page, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })
      if (typeFilter) {
        params.set("type", typeFilter)
      }
      const res = await fetch(`/api/notifications?${params}`)
      const json = await res.json()
      return json.success ? json : { data: [], pagination: { total: 0, pages: 1 } }
    },
  })

  // Mark all read mutation
  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/mark-all-read", { method: "POST" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] })
      queryClient.invalidateQueries({ queryKey: ["recentNotifications"] })
      queryClient.invalidateQueries({ queryKey: ["notificationsList"] })
    },
  })

  // Mark single read mutation
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] })
      queryClient.invalidateQueries({ queryKey: ["recentNotifications"] })
      queryClient.invalidateQueries({ queryKey: ["notificationsList"] })
    },
  })

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markRead.mutateAsync(item._id)
    }
    if (item.link) {
      router.push(item.link as any)
    }
  }

  // Load muted types from localStorage
  const [mutedTypes, setMutedTypes] = useState<string[]>([])
  useEffect(() => {
    const stored = localStorage.getItem("mutedNotifications")
    if (stored) {
      try {
        setMutedTypes(JSON.parse(stored))
      } catch (_) {}
    }
  }, [])

  const notifications: NotificationItem[] = (queryData?.data || []).filter(
    (n: NotificationItem) => !mutedTypes.includes(n.type)
  )
  const pagination = queryData?.pagination || { total: 0, pages: 1 }

  // Group notifications by Today, Yesterday, Earlier
  const getGroup = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return "Earlier"
    }
  }

  const groups = {
    Today: notifications.filter((n) => getGroup(n.createdAt) === "Today"),
    Yesterday: notifications.filter((n) => getGroup(n.createdAt) === "Yesterday"),
    Earlier: notifications.filter((n) => getGroup(n.createdAt) === "Earlier"),
  }

  const hasNotifications = notifications.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="View and manage in-app task alerts, reminders, and transaction histories."
        action={
          hasNotifications ? (
            <Button
              onClick={() => markAllRead.mutate()}
              variant="outline"
              className="rounded-full shadow-sm"
            >
              <MailOpen className="mr-2 size-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {/* Filter and Content Card */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Filter by type:</span>
          <select
            className="h-9 rounded-full border border-border bg-card px-4 text-xs font-semibold shadow-sm focus:outline-none"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1) // Reset to page 1 on filter change
            }}
          >
            <option value="">All Notification Types</option>
            <option value="PREMIUM_DUE">PREMIUM DUE</option>
            <option value="POLICY_EXPIRING">POLICY EXPIRING</option>
            <option value="POLICY_LAPSED">POLICY LAPSED</option>
            <option value="BIRTHDAY">BIRTHDAY REMINDERS</option>
            <option value="CLAIM_STATUS_CHANGE">CLAIM STATUS UPDATES</option>
            <option value="NEW_ASSIGNMENT">NEW ASSIGNMENTS</option>
            <option value="COMMISSION_CREDITED">COMMISSIONS</option>
            <option value="LEAD_FOLLOWUP_DUE">LEAD FOLLOW-UPS</option>
          </select>
        </div>

        {/* List Containers */}
        {isLoading ? (
          <div className="flex h-60 items-center justify-center text-sm text-muted-foreground bg-card/40 rounded-[2rem] border border-border/50">
            Loading notifications...
          </div>
        ) : hasNotifications ? (
          <div className="space-y-8">
            {Object.entries(groups).map(([groupTitle, list]) => {
              if (list.length === 0) return null

              return (
                <div key={groupTitle} className="space-y-3">
                  <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-muted-foreground px-4">
                    {groupTitle}
                  </h3>
                  <div className="grid gap-3">
                    {list.map((item) => {
                      const cfg = typeConfig[item.type] || {
                        icon: Bell,
                        color: "text-muted-foreground",
                        bg: "bg-muted/10",
                        label: "General Alert",
                      }
                      const Icon = cfg.icon

                      return (
                        <div
                          key={item._id}
                          onClick={() => handleNotificationClick(item)}
                          className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-[1.5rem] border transition-all cursor-pointer hover:bg-muted/10 ${
                            item.isRead
                              ? "bg-card/40 border-border/40 opacity-75"
                              : "bg-card border-border/60 shadow-sm font-semibold"
                          }`}
                        >
                          <div className="flex gap-4 items-start sm:items-center">
                            <div className={`p-3 rounded-2xl shrink-0 ${cfg.bg} ${cfg.color}`}>
                              <Icon className="size-5" />
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-foreground">{item.title}</p>
                                <Badge variant="outline" className="text-[10px] tracking-wider py-0 px-2 font-medium bg-muted/30">
                                  {cfg.label}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                                {item.message}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 text-xs text-muted-foreground shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/20">
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-4 text-sm text-muted-foreground">
                <span>
                  Page {page} of {pagination.pages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  >
                    <ChevronLeft className="mr-1 size-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={page === pagination.pages}
                    onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
                  >
                    Next <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-60 flex-col items-center justify-center gap-3 bg-card/40 rounded-[2rem] border border-border/50 text-center p-6">
            <Bell className="size-12 text-muted-foreground/40" />
            <div>
              <p className="font-semibold">No notifications found</p>
              <p className="text-sm text-muted-foreground mt-1">
                When reminders or alerts are triggered, they will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
