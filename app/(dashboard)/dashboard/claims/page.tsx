"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ShieldAlert, CheckCircle2, AlertCircle, FileText, Plus } from "lucide-react"

type Claim = {
  _id: string
  claimNumber: string
  policy?: { _id: string; policyNumber: string; planName: string }
  customer?: { name: string }
  claimType: "MATURITY" | "DEATH" | "SURRENDER" | "RIDER"
  claimAmount: number
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "SETTLED"
  filedDate: string
}

type Policy = {
  _id: string
  policyNumber: string
  planName: string
  status: string
  customer?: { name: string }
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  UNDER_REVIEW: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  SETTLED: "default",
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  // Form states
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    policyId: "",
    claimType: "MATURITY",
    claimAmount: "",
    description: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const loadClaims = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (typeFilter) params.set("type", typeFilter)
      
      const res = await fetch(`/api/claims?${params}`)
      const json = await res.json()
      if (json.success) {
        setClaims(json.data)
      }
    } catch (err) {
      console.error("Error loading claims:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadPolicies = async () => {
    try {
      const res = await fetch("/api/policies")
      const json = await res.json()
      if (json.success) {
        // Only ACTIVE or MATURED policies are eligible for claims
        const eligible = json.data.filter((p: Policy) => ["ACTIVE", "MATURED"].includes(p.status))
        setPolicies(eligible)
      }
    } catch (err) {
      console.error("Error loading policies:", err)
    }
  }

  useEffect(() => {
    loadClaims()
  }, [statusFilter, typeFilter])

  useEffect(() => {
    if (open) {
      loadPolicies()
    }
  }, [open])

  const handleFileClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.policyId) {
      alert("Please select a policy.")
      return
    }
    if (!form.claimAmount || Number(form.claimAmount) <= 0) {
      alert("Please enter a valid claim amount.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId: form.policyId,
          claimType: form.claimType,
          claimAmount: Number(form.claimAmount),
          description: form.description,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setOpen(false)
        setForm({
          policyId: "",
          claimType: "MATURITY",
          claimAmount: "",
          description: "",
        })
        loadClaims()
      } else {
        alert(json.error || "Failed to file claim.")
      }
    } catch (err) {
      console.error("Error filing claim:", err)
      alert("An unexpected error occurred.")
    } finally {
      setSubmitting(false)
    }
  }

  // Filter claims dynamically by search query (claim number, policy number, or customer name)
  const filteredClaims = claims.filter((c) => {
    const query = search.toLowerCase()
    return (
      c.claimNumber.toLowerCase().includes(query) ||
      (c.policy?.policyNumber || "").toLowerCase().includes(query) ||
      (c.customer?.name || "").toLowerCase().includes(query)
    )
  })

  // Calculate statistics
  const totalCount = claims.length
  const pendingCount = claims.filter((c) => c.status === "PENDING" || c.status === "UNDER_REVIEW").length
  const settledCount = claims.filter((c) => c.status === "SETTLED" || c.status === "APPROVED").length
  const rejectedCount = claims.filter((c) => c.status === "REJECTED").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Claims Management"
        description="Track and review insurance policy claims from filing to final settlement."
        action={
          <Button onClick={() => setOpen(true)} className="rounded-full px-5 py-6 font-medium shadow-sm hover:scale-[1.02] transition-transform">
            <Plus className="mr-2 size-5" /> File Claim
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="rounded-[1.5rem] border border-border/50 bg-card/60 backdrop-blur-md">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-500">
              <FileText className="size-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Claims</p>
              <h3 className="text-2xl font-bold">{totalCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border border-border/50 bg-card/60 backdrop-blur-md">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500">
              <AlertCircle className="size-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending Review</p>
              <h3 className="text-2xl font-bold">{pendingCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border border-border/50 bg-card/60 backdrop-blur-md">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Approved/Settled</p>
              <h3 className="text-2xl font-bold">{settledCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border border-border/50 bg-card/60 backdrop-blur-md">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-500">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Rejected Claims</p>
              <h3 className="text-2xl font-bold">{rejectedCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 max-w-md items-center gap-2">
            <Input
              placeholder="Search Claim #, Policy #, or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full bg-card/50 px-4 py-2 border-border/50 shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-full border border-border/50 bg-card/50 px-3 text-sm shadow-sm focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="SETTLED">SETTLED</option>
            </select>

            <select
              className="h-9 rounded-full border border-border/50 bg-card/50 px-3 text-sm shadow-sm focus:outline-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="MATURITY">MATURITY</option>
              <option value="DEATH">DEATH</option>
              <option value="SURRENDER">SURRENDER</option>
              <option value="RIDER">RIDER</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-card/50 shadow-sm backdrop-blur-md">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Loading claims...
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="bg-muted/40">
                  <th className="px-6 py-4">Claim #</th>
                  <th className="px-6 py-4">Policy #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Filed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredClaims.length > 0 ? (
                  filteredClaims.map((c) => (
                    <tr key={c._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">
                        <a href={`/dashboard/claims/${c._id}`} className="hover:underline">
                          {c.claimNumber}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {c.policy ? (
                          <a href={`/dashboard/policies/${c.policy._id}`} className="hover:underline">
                            {c.policy.policyNumber}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium">{c.customer?.name || "—"}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-medium tracking-wide">
                          {c.claimType}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        ₹{c.claimAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusColors[c.status] || "outline"}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(c.filedDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No claims found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* File Claim Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">File New Claim</DialogTitle>
            <DialogDescription>
              Submit a structured claim request against an eligible policy.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFileClaim} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="policySelect">Select Policy</Label>
              <select
                id="policySelect"
                value={form.policyId}
                onChange={(e) => setForm({ ...form, policyId: e.target.value })}
                required
                className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-sm focus:outline-none"
              >
                <option value="">-- Choose Active or Matured Policy --</option>
                {policies.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.policyNumber} ({p.customer?.name} - {p.planName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="claimType">Claim Type</Label>
                <select
                  id="claimType"
                  value={form.claimType}
                  onChange={(e) => setForm({ ...form, claimType: e.target.value })}
                  className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-sm focus:outline-none"
                >
                  <option value="MATURITY">MATURITY</option>
                  <option value="DEATH">DEATH</option>
                  <option value="SURRENDER">SURRENDER</option>
                  <option value="RIDER">RIDER</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="claimAmount">Claim Amount (₹)</Label>
                <Input
                  id="claimAmount"
                  type="number"
                  placeholder="Enter amount"
                  required
                  value={form.claimAmount}
                  onChange={(e) => setForm({ ...form, claimAmount: e.target.value })}
                  className="rounded-xl border-border/80"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Claim Details / Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the claim context, details, and requirements..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-24 rounded-xl border-border/80"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-full px-6 font-semibold">
                {submitting ? "Submitting..." : "Submit Claim"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
