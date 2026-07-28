"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { StatCard } from "@/components/shared/StatCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RevenueTrendChart, BranchPerformanceChart } from "@/components/shared/DashboardCharts"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ShieldAlert,
  ArrowRight,
} from "lucide-react"

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Hello")
  const [formattedDate, setFormattedDate] = useState("")

  useEffect(() => {
    const hr = new Date().getHours()
    if (hr < 12) setGreeting("Good morning")
    else if (hr < 17) setGreeting("Good afternoon")
    else setGreeting("Good evening")

    setFormattedDate(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    )
  }, [])

  // Fetch current user
  const { data: userJson, isLoading: userLoading } = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me")
      return res.json()
    },
  })

  // Fetch summary
  const { data: summaryJson, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/summary")
      return res.json()
    },
  })

  const user = userJson?.success ? userJson.data : null
  const summary = summaryJson?.success ? summaryJson.data : null

  if (userLoading || summaryLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 w-1/3 rounded-2xl bg-muted animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-[2rem] bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 rounded-[2rem] bg-muted animate-pulse" />
          <div className="h-80 rounded-[2rem] bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  if (!user || !summary) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <ShieldAlert className="size-12 text-rose-500" />
        <p className="font-semibold text-lg">Unable to load dashboard data</p>
        <p className="text-sm text-muted-foreground">Please sign in again or contact admin.</p>
      </div>
    )
  }

  const role = user.role
  const name = user.name

  return (
    <div className="space-y-8">
      {/* Greeting Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {greeting}, {name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>
      </div>

      {/* RENDER SUPER ADMIN / REGIONAL ADMIN */}
      {(role === "SUPER_ADMIN" || role === "REGIONAL_ADMIN") && (
        <div className="space-y-8">
          {/* KPI grid (2 cols mobile, 4 cols desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {summary.kpis.map((kpi: any) => (
              <StatCard key={kpi.label} label={kpi.label} value={kpi.value} href={kpi.href} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-bold">Premium Collection Trend</CardTitle>
                <CardDescription>Monthly paid premiums (last 6 months)</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0 pt-4">
                <RevenueTrendChart data={summary.revenueTrend} />
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-bold">
                  {role === "SUPER_ADMIN" ? "Top Performing Branches" : "Branch Comparison"}
                </CardTitle>
                <CardDescription>Highest collecting branches in scope</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0 pt-4">
                <BranchPerformanceChart data={summary.branchChartData} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* RENDER BRANCH MANAGER */}
      {role === "BRANCH_MANAGER" && (
        <div className="space-y-8">
          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {summary.kpis.map((kpi: any) => (
              <StatCard key={kpi.label} label={kpi.label} value={kpi.value} href={kpi.href} />
            ))}
          </div>

          {/* Leaderboard Table */}
          <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <CardHeader className="px-0 pt-0 mb-4">
              <CardTitle className="text-lg font-bold">Top Performing Agents</CardTitle>
              <CardDescription>Leaderboard of agents in your branch by total collections</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="pb-3">Agent Name</th>
                      <th className="pb-3">Agent Code</th>
                      <th className="pb-3 text-right">Policies Sold</th>
                      <th className="pb-3 text-right">Premium Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.leaderboard && summary.leaderboard.length > 0 ? (
                      summary.leaderboard.map((agent: any) => (
                        <tr key={agent._id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                          <td className="py-4.5 font-bold text-foreground">
                            <Link href={`/dashboard/users/${agent._id}` as any} className="hover:underline text-primary">
                              {agent.name}
                            </Link>
                          </td>
                          <td className="py-4.5 text-muted-foreground">{agent.code || "—"}</td>
                          <td className="py-4.5 text-right font-medium">{agent.policiesCount}</td>
                          <td className="py-4.5 text-right font-bold text-emerald-500">₹{agent.premiumCollected.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          No agent performance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* RENDER DEVELOPMENT OFFICER */}
      {role === "DEVELOPMENT_OFFICER" && (
        <div className="space-y-8">
          {/* KPI grid (2 cols mobile, 4 cols desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {summary.kpis.map((kpi: any) => (
              <StatCard key={kpi.label} label={kpi.label} value={kpi.value} href={kpi.href} />
            ))}
          </div>

          {/* Leaderboard Table */}
          <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <CardHeader className="px-0 pt-0 mb-4">
              <CardTitle className="text-lg font-bold">Agent Team Performance</CardTitle>
              <CardDescription>Productivity leaderboard of agents managed by you</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="pb-3">Agent Name</th>
                      <th className="pb-3">Agent Code</th>
                      <th className="pb-3 text-right">Policies Sold</th>
                      <th className="pb-3 text-right">Premium Collected</th>
                      <th className="pb-3 text-right">Commissions Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.leaderboard && summary.leaderboard.length > 0 ? (
                      summary.leaderboard.map((agent: any) => (
                        <tr key={agent._id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                          <td className="py-4.5 font-bold text-foreground">
                            <Link href={`/dashboard/users/${agent._id}` as any} className="hover:underline text-primary">
                              {agent.name}
                            </Link>
                          </td>
                          <td className="py-4.5 text-muted-foreground">{agent.code || "—"}</td>
                          <td className="py-4.5 text-right font-medium">{agent.policiesCount}</td>
                          <td className="py-4.5 text-right font-bold text-foreground">₹{agent.premiumCollected.toLocaleString()}</td>
                          <td className="py-4.5 text-right font-bold text-emerald-500">₹{agent.commissionEarned.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No active agents assigned.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* RENDER AGENT */}
      {role === "AGENT" && (
        <div className="space-y-8">
          {/* KPI grid (2 cols mobile, 4 cols desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {summary.kpis.map((kpi: any) => (
              <StatCard key={kpi.label} label={kpi.label} value={kpi.value} href={kpi.href} />
            ))}
          </div>

          {/* Today's Action Lists (Renewals Due + Follow-ups Due) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Renewals Due Today */}
            <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <CardHeader className="px-0 pt-0 mb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Renewals Due Today</CardTitle>
                  <CardDescription>Active policy renewals due for follow-up</CardDescription>
                </div>
                <Link
                  href="/dashboard/premiums?status=DUE"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full inline-flex items-center gap-1")}
                >
                  View all <ArrowRight className="size-4" />
                </Link>
              </CardHeader>
              <CardContent className="px-0 pb-0 space-y-3">
                {summary.renewals && summary.renewals.length > 0 ? (
                  summary.renewals.map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/10 transition-colors"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{r.policyNumber}</span>
                          <span className="text-muted-foreground">({r.planName})</span>
                        </div>
                        <p className="text-muted-foreground">Customer: <span className="font-semibold text-foreground">{r.customerName}</span></p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-xs font-bold text-rose-500">₹{r.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Due: {new Date(r.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No renewals due today.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Follow-ups Due Today */}
            <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <CardHeader className="px-0 pt-0 mb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Lead Follow-ups Today</CardTitle>
                  <CardDescription>Prospect lead tasks with deadlines today</CardDescription>
                </div>
                <Link
                  href="/dashboard/leads"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full inline-flex items-center gap-1")}
                >
                  View all <ArrowRight className="size-4" />
                </Link>
              </CardHeader>
              <CardContent className="px-0 pb-0 space-y-3">
                {summary.followups && summary.followups.length > 0 ? (
                  summary.followups.map((f: any) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/10 transition-colors"
                    >
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-foreground">{f.name}</p>
                        <p className="text-muted-foreground">Mobile: <span className="font-semibold text-foreground">{f.mobile}</span></p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                          {f.stage}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground">Due: {new Date(f.nextFollowUpDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No lead follow-ups due today.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
