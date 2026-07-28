"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Download,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

type ReportType =
  | "agent-performance"
  | "branch-performance"
  | "policy-report"
  | "expired-policies"
  | "premium-collection"
  | "customer-growth"
  | "claim-report"

const reportTypes: { id: ReportType; label: string; desc: string }[] = [
  { id: "agent-performance", label: "Agent Performance", desc: "Policies sold, collections, and commission summaries." },
  { id: "branch-performance", label: "Branch Performance", desc: "Agent counts, sales volumes, and premium totals by branch." },
  { id: "policy-report", label: "New Policies Issued", desc: "Details of all newly registered policies." },
  { id: "expired-policies", label: "Expired & Lapsed", desc: "Policies that are currently lapsed or expired." },
  { id: "premium-collection", label: "Premium Collections", desc: "Invoices paid, late fees, and receipt collections." },
  { id: "customer-growth", label: "Customer Acquisition", desc: "New customer growth trends over time." },
  { id: "claim-report", label: "Claims History", desc: "Claims filed, settled, and status breakdowns." },
]

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("agent-performance")
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split("T")[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0])
  const [branch, setBranch] = useState("")
  const [agent, setAgent] = useState("")

  // Fetch current user role
  const { data: userJson } = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me")
      return res.json()
    },
  })
  const user = userJson?.success ? userJson.data : null

  // Fetch branch options
  const { data: branchJson } = useQuery({
    queryKey: ["reportBranchOptions"],
    queryFn: async () => {
      const res = await fetch("/api/branches")
      return res.json()
    },
    enabled: !!user && ["SUPER_ADMIN", "REGIONAL_ADMIN"].includes(user.role),
  })
  const branches = branchJson?.success ? branchJson.data : []

  // Fetch agent options
  const { data: agentJson } = useQuery({
    queryKey: ["reportAgentOptions", branch],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (branch) params.set("branch", branch)
      const res = await fetch(`/api/users?role=AGENT&${params}`)
      return res.json()
    },
    enabled: !!user && ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER"].includes(user.role),
  })
  const agents = agentJson?.success ? agentJson.data : []

  // Fetch report data
  const { data: reportJson, isLoading } = useQuery({
    queryKey: ["reportData", activeReport, from, to, branch, agent],
    queryFn: async () => {
      const params = new URLSearchParams({ from, to })
      if (branch) params.set("branch", branch)
      if (agent) params.set("agent", agent)
      const res = await fetch(`/api/reports/${activeReport}?${params}`)
      return res.json()
    },
  })
  const reportData = reportJson?.success ? reportJson.data : []

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    const params = new URLSearchParams({
      type: activeReport,
      format,
      from,
      to,
    })
    if (branch) params.set("branch", branch)
    if (agent) params.set("agent", agent)

    window.open(`/api/reports/export?${params}`)
  }

  // Render active chart
  const renderChart = () => {
    if (!reportData || reportData.length === 0) return null

    if (activeReport === "agent-performance") {
      const chartData = reportData.slice(0, 8).map((d: any) => ({
        name: d.agentName,
        value: d.premiumCollected,
      }))
      return (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip formatter={(val: any) => [`₹${val.toLocaleString()}`, "Premium Collected"]} />
            <Bar dataKey="value" fill="var(--color-primary, #0f3d91)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (activeReport === "branch-performance") {
      const chartData = reportData.map((d: any) => ({
        name: d.branchName,
        value: d.premiumCollected,
      }))
      return (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip formatter={(val: any) => [`₹${val.toLocaleString()}`, "Premium Collected"]} />
            <Bar dataKey="value" fill="var(--color-accent, #6366f1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (activeReport === "customer-growth") {
      const chartData = reportData.map((d: any) => ({
        name: d.date,
        count: d.customersAdded,
      }))
      return (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="var(--color-accent, #6366f1)" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (activeReport === "premium-collection") {
      // Group by paid date
      const grouped: Record<string, number> = {}
      reportData.forEach((d: any) => {
        const date = new Date(d.paidDate).toLocaleDateString()
        grouped[date] = (grouped[date] || 0) + d.amountPaid
      })
      const chartData = Object.entries(grouped).map(([date, amt]) => ({ name: date, value: amt }))
      return (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip formatter={(val: any) => [`₹${val.toLocaleString()}`, "Premium Amount"]} />
            <Area type="monotone" dataKey="value" stroke="var(--color-primary, #0f3d91)" fill="var(--color-primary-light, #0f3d9120)" />
          </AreaChart>
        </ResponsiveContainer>
      )
    }

    // Default policy, claims, expired bar counts
    const statusCounts: Record<string, number> = {}
    reportData.forEach((d: any) => {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1
    })
    const chartData = Object.entries(statusCounts).map(([status, cnt]) => ({ name: status, count: cnt }))
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
          <YAxis stroke="var(--muted-foreground)" fontSize={11} />
          <Tooltip />
          <Bar dataKey="count" fill="var(--color-accent, #6366f1)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // Get preview headers
  const getHeaders = () => {
    switch (activeReport) {
      case "agent-performance":
        return ["Agent Name", "Agent Code", "Policies Sold", "Premium Collected", "Commissions Earned"]
      case "branch-performance":
        return ["Branch Name", "Branch Code", "Total Agents", "Total Policies", "Premium Collected"]
      case "policy-report":
        return ["Policy Number", "Customer Name", "Agent Name", "Plan Name", "Sum Assured", "Premium Amount", "Start Date", "Status"]
      case "expired-policies":
        return ["Policy Number", "Customer Name", "Agent Name", "Plan Name", "Maturity Date", "Status"]
      case "premium-collection":
        return ["Receipt Number", "Policy Number", "Amount Paid", "Paid Date", "Payment Mode"]
      case "customer-growth":
        return ["Date", "Customers Added"]
      case "claim-report":
        return ["Claim Number", "Policy Number", "Customer Name", "Claim Type", "Amount", "Filed Date", "Status"]
      default:
        return []
    }
  }

  const renderTableRows = () => {
    if (!reportData || reportData.length === 0) {
      return (
        <tr>
          <td colSpan={10} className="py-12 text-center text-sm text-muted-foreground bg-muted/5">
            No records matched your filters.
          </td>
        </tr>
      )
    }

    return reportData.map((row: any, idx: number) => {
      switch (activeReport) {
        case "agent-performance":
          return (
            <tr key={row._id || idx} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
              <td className="py-4 font-bold text-foreground">{row.agentName}</td>
              <td className="py-4 text-muted-foreground">{row.agentCode}</td>
              <td className="py-4 text-right font-medium">{row.policiesSold}</td>
              <td className="py-4 text-right font-bold text-foreground">₹{row.premiumCollected.toLocaleString()}</td>
              <td className="py-4 text-right font-bold text-emerald-500">₹{row.commissionsEarned.toLocaleString()}</td>
            </tr>
          )
        case "branch-performance":
          return (
            <tr key={row._id || idx} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
              <td className="py-4 font-bold text-foreground">{row.branchName}</td>
              <td className="py-4 text-muted-foreground">{row.branchCode}</td>
              <td className="py-4 text-right font-medium">{row.totalAgents}</td>
              <td className="py-4 text-right font-medium">{row.totalPolicies}</td>
              <td className="py-4 text-right font-bold text-emerald-500">₹{row.premiumCollected.toLocaleString()}</td>
            </tr>
          )
        case "policy-report":
          return (
            <tr key={row._id || idx} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
              <td className="py-4 font-bold text-foreground">{row.policyNumber}</td>
              <td className="py-4 font-medium text-foreground">{row.customerName}</td>
              <td className="py-4 text-muted-foreground">{row.agentName}</td>
              <td className="py-4 text-muted-foreground">{row.planName}</td>
              <td className="py-4 text-right">₹{row.sumAssured.toLocaleString()}</td>
              <td className="py-4 text-right font-bold">₹{row.premiumAmount.toLocaleString()}</td>
              <td className="py-4">{new Date(row.startDate).toLocaleDateString()}</td>
              <td className="py-4">
                <Badge variant="outline" className="text-[10px] tracking-wider py-0.5 px-2 font-medium">
                  {row.status}
                </Badge>
              </td>
            </tr>
          )
        case "expired-policies":
          return (
            <tr key={row._id || idx} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
              <td className="py-4 font-bold text-foreground">{row.policyNumber}</td>
              <td className="py-4 font-medium text-foreground">{row.customerName}</td>
              <td className="py-4 text-muted-foreground">{row.agentName}</td>
              <td className="py-4 text-muted-foreground">{row.planName}</td>
              <td className="py-4">{new Date(row.maturityDate).toLocaleDateString()}</td>
              <td className="py-4">
                <Badge variant="destructive" className="text-[10px] tracking-wider py-0.5 px-2 font-medium">
                  {row.status}
                </Badge>
              </td>
            </tr>
          )
        case "premium-collection":
          return (
            <tr key={row._id || idx} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
              <td className="py-4 font-bold text-foreground">{row.receiptNumber}</td>
              <td className="py-4 text-muted-foreground">{row.policyNumber}</td>
              <td className="py-4 text-right font-bold text-emerald-500">₹{row.amountPaid.toLocaleString()}</td>
              <td className="py-4">{new Date(row.paidDate).toLocaleDateString()}</td>
              <td className="py-4 text-muted-foreground font-medium">{row.paymentMode}</td>
            </tr>
          )
        case "customer-growth":
          return (
            <tr key={idx} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
              <td className="py-4 font-medium text-foreground">{row.date}</td>
              <td className="py-4 text-right font-bold text-foreground">{row.customersAdded}</td>
            </tr>
          )
        case "claim-report":
          return (
            <tr key={row._id || idx} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
              <td className="py-4 font-bold text-foreground">{row.claimNumber}</td>
              <td className="py-4 text-muted-foreground">{row.policyNumber}</td>
              <td className="py-4 font-medium text-foreground">{row.customerName}</td>
              <td className="py-4 text-muted-foreground">{row.claimType}</td>
              <td className="py-4 text-right font-bold">₹{row.claimAmount.toLocaleString()}</td>
              <td className="py-4">{new Date(row.filedDate).toLocaleDateString()}</td>
              <td className="py-4">
                <Badge variant="outline" className="text-[10px] tracking-wider py-0.5 px-2 font-medium">
                  {row.status}
                </Badge>
              </td>
            </tr>
          )
        default:
          return null
      }
    })
  }

  const tableHeaders = getHeaders()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports Hub"
        description="Filter, preview, visualize and export key performance, policy, and transaction reports."
      />

      {/* Filter and selector grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Left selector */}
        <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm xl:col-span-1">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="size-4 text-primary" /> Reports List
            </CardTitle>
            <CardDescription>Select the report dataset to preview.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 space-y-2 mt-2">
            {reportTypes.map((type) => {
              // Hide branch performance for agents
              if (type.id === "branch-performance" && user?.role === "AGENT") return null

              return (
                <button
                  key={type.id}
                  onClick={() => setActiveReport(type.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all hover:bg-muted/20 ${
                    activeReport === type.id
                      ? "border-primary bg-primary/5 font-semibold text-primary"
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  <p className="font-bold text-foreground text-[13px]">{type.label}</p>
                  <p className="mt-0.5 opacity-90 line-clamp-1">{type.desc}</p>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Right Preview, Chart and Filters */}
        <div className="xl:col-span-3 space-y-6">
          {/* Filter Bar */}
          <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider inline-flex items-center gap-1">
                  <Calendar className="size-3" /> From Date
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-9 w-40 rounded-full border border-border bg-card px-4 text-xs font-semibold shadow-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider inline-flex items-center gap-1">
                  <Calendar className="size-3" /> To Date
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-9 w-40 rounded-full border border-border bg-card px-4 text-xs font-semibold shadow-sm focus:outline-none"
                />
              </div>

              {/* Branch dropdown - only visible for Admins */}
              {user && ["SUPER_ADMIN", "REGIONAL_ADMIN"].includes(user.role) && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Branch Filter
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => {
                      setBranch(e.target.value)
                      setAgent("") // Reset agent selection
                    }}
                    className="h-9 w-44 rounded-full border border-border bg-card px-4 text-xs font-semibold shadow-sm focus:outline-none"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b: any) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Agent dropdown - visible for admins, managers, DOs */}
              {user && ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER"].includes(user.role) && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Agent Filter
                  </label>
                  <select
                    value={agent}
                    onChange={(e) => setAgent(e.target.value)}
                    className="h-9 w-44 rounded-full border border-border bg-card px-4 text-xs font-semibold shadow-sm focus:outline-none"
                  >
                    <option value="">All Agents</option>
                    {agents.map((ag: any) => (
                      <option key={ag._id} value={ag._id}>
                        {ag.name} ({ag.agentCode || "Staff"})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </Card>

          {/* Visual charts */}
          {reportData && reportData.length > 0 && (
            <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <CardHeader className="px-0 pt-0 mb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <TrendingUp className="size-4 text-primary" /> Visual Analytics
                </CardTitle>
                <CardDescription>Visual representation of the preview data.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {renderChart()}
              </CardContent>
            </Card>
          )}

          {/* Preview Table */}
          <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <CardHeader className="px-0 pt-0 mb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <FileText className="size-4 text-primary" /> Data Preview
                </CardTitle>
                <CardDescription>Live preview showing matching report data.</CardDescription>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExport("pdf")}
                  size="sm"
                  variant="outline"
                  className="rounded-full shadow-sm text-xs font-semibold"
                  disabled={reportData.length === 0}
                >
                  <Download className="mr-1 size-3.5" /> PDF
                </Button>
                <Button
                  onClick={() => handleExport("excel")}
                  size="sm"
                  variant="outline"
                  className="rounded-full shadow-sm text-xs font-semibold"
                  disabled={reportData.length === 0}
                >
                  <Download className="mr-1 size-3.5" /> Excel
                </Button>
                <Button
                  onClick={() => handleExport("csv")}
                  size="sm"
                  variant="outline"
                  className="rounded-full shadow-sm text-xs font-semibold"
                  disabled={reportData.length === 0}
                >
                  <Download className="mr-1 size-3.5" /> CSV
                </Button>
              </div>
            </CardHeader>

            <CardContent className="px-0 pb-0">
              {isLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading preview data...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {tableHeaders.map((header) => (
                          <th
                            key={header}
                            className={`pb-3 ${
                              ["Premium Collected", "Commissions Earned", "Sum Assured", "Premium Amount", "Amount Paid", "Amount", "Customers Added"].includes(
                                header
                              )
                                ? "text-right"
                                : ""
                            }`}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>{renderTableRows()}</tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
