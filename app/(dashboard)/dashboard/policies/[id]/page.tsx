"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Detail = {
  _id: string
  policyNumber: string
  planName: string
  status: string
  premiumAmount: number
  sumAssured: number
  maturityDate: string
  customer?: { name: string }
  agent?: { _id: string; name: string }
  manager?: { _id: string; name: string }
  branch?: { _id: string; name: string }
}

type History = {
  _id: string
  field: string
  oldValue: string
  newValue: string
  changedAt: string
  changedBy?: { name: string }
}

type Claim = {
  _id: string
  claimNumber: string
  claimType: string
  claimAmount: number
  status: string
  filedDate: string
}

const claimColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  UNDER_REVIEW: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  SETTLED: "default",
}

export default function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [policy, setPolicy] = useState<Detail | null>(null)
  const [auditHistory, setAuditHistory] = useState<History[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  
  // Dialog state
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    claimType: "MATURITY",
    claimAmount: "",
    description: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const loadPolicy = () => {
    fetch(`/api/policies/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setPolicy(j.data)
          setAuditHistory(j.history)
        }
      })
  }

  const loadClaims = () => {
    fetch(`/api/claims?policyId=${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setClaims(j.data)
        }
      })
  }

  const load = () => {
    loadPolicy()
    loadClaims()
  }

  useEffect(load, [id])

  async function change() {
    const status = prompt("New status (ACTIVE, LAPSED, EXPIRED, MATURED, CANCELLED, CLAIM_SETTLED)")
    if (!status) return
    const r = await fetch(`/api/policies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const j = await r.json()
    if (!j.success) return alert(j.error)
    load()
  }

  async function reassign() {
    const agentId = prompt("Target agent ID")
    if (!agentId) return
    const r = await fetch(`/api/policies/${id}/reassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    })
    const j = await r.json()
    if (!j.success) return alert(j.error)
    load()
  }

  const handleFileClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          policyId: id,
          claimType: form.claimType,
          claimAmount: Number(form.claimAmount),
          description: form.description,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setOpen(false)
        setForm({
          claimType: "MATURITY",
          claimAmount: "",
          description: "",
        })
        load()
      } else {
        alert(json.error || "Failed to file claim.")
      }
    } catch (err) {
      console.error(err)
      alert("An unexpected error occurred.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!policy) return <p className="text-muted-foreground p-6">Loading policy…</p>

  const isEligibleForClaims = ["ACTIVE", "MATURED"].includes(policy.status)

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => history.back()} className="rounded-full">
        Back to policies
      </Button>

      {/* Policy Details Summary */}
      <section className="rounded-[2rem] border bg-card p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{policy.policyNumber}</h1>
            <p className="text-muted-foreground">{policy.customer?.name} · {policy.planName}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className="px-3 py-1 font-medium">{policy.status}</Badge>
            <Button size="sm" onClick={change} className="rounded-full">Change status</Button>
            <Button size="sm" variant="outline" onClick={reassign} className="rounded-full">Reassign policy</Button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 text-xs text-muted-foreground">
          Sold by:{" "}
          <a href="/dashboard/policy-assignment" className="rounded-full border px-2 py-1 hover:bg-muted">
            {policy.agent?.name || "Agent"}
          </a>{" "}
          →{" "}
          <a href="/dashboard/policy-assignment" className="rounded-full border px-2 py-1 hover:bg-muted">
            {policy.manager?.name || "Manager"}
          </a>{" "}
          →{" "}
          <a href="/dashboard/policy-assignment" className="rounded-full border px-2 py-1 hover:bg-muted">
            {policy.branch?.name || "Branch"}
          </a>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-sm border-t border-border/40 pt-4">
          <p>
            Premium<br />
            <b className="text-base">₹{policy.premiumAmount.toLocaleString()}</b>
          </p>
          <p>
            Sum assured<br />
            <b className="text-base">₹{policy.sumAssured.toLocaleString()}</b>
          </p>
          <p>
            Maturity<br />
            <b className="text-base">{new Date(policy.maturityDate).toLocaleDateString()}</b>
          </p>
        </div>
      </section>

      {/* Timeline Audit History */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Policy status timeline</h2>
        {auditHistory.length ? (
          <div className="space-y-4">
            {auditHistory.map((item) => (
              <div key={item._id} className="border-l-2 border-primary/30 pl-4 text-sm relative">
                <span className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-primary" />
                <span className="font-semibold">{item.field}</span>: {String(item.oldValue)} →{" "}
                <span className="font-semibold text-primary">{String(item.newValue)}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.changedBy?.name || "Staff"} · {new Date(item.changedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
        )}
      </section>

      {/* Tabs list */}
      <Tabs defaultValue="premiums" className="space-y-4">
        <TabsList className="rounded-full p-1 bg-muted/80">
          <TabsTrigger value="premiums" className="rounded-full px-5">Premiums</TabsTrigger>
          <TabsTrigger value="commission" className="rounded-full px-5">Commission</TabsTrigger>
          <TabsTrigger value="claims" className="rounded-full px-5">Claims</TabsTrigger>
        </TabsList>

        <TabsContent value="premiums" className="rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
          Premium records will appear when Module 8 is connected.
        </TabsContent>

        <TabsContent value="commission" className="rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
          Commission records will appear when Module 10 is connected.
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Policy Claims
            </h3>
            {isEligibleForClaims ? (
              <Button onClick={() => setOpen(true)} size="sm" className="rounded-full">
                File Claim
              </Button>
            ) : (
              <p className="text-xs text-amber-500 font-medium">
                Claims can only be filed on ACTIVE or MATURED policies.
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card text-sm shadow-sm">
            <table className="w-full text-left">
              <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Claim #</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Filed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {claims.length > 0 ? (
                  claims.map((c) => (
                    <tr key={c._id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-primary">
                        <a href={`/dashboard/claims/${c._id}`} className="hover:underline">
                          {c.claimNumber}
                        </a>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline">{c.claimType}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold">
                        ₹{c.claimAmount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={claimColors[c.status] || "outline"}>{c.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {new Date(c.filedDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      No claims filed for this policy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* File Claim Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">File Claim for {policy.policyNumber}</DialogTitle>
            <DialogDescription>
              Submit a structured claim request. You are filing against Policy: {policy.policyNumber}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFileClaimSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="policyClaimType">Claim Type</Label>
                <select
                  id="policyClaimType"
                  value={form.claimType}
                  onChange={(e) => setForm({ ...form, claimType: e.target.value })}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none"
                >
                  <option value="MATURITY">MATURITY</option>
                  <option value="DEATH">DEATH</option>
                  <option value="SURRENDER">SURRENDER</option>
                  <option value="RIDER">RIDER</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="policyClaimAmount">Claim Amount (₹)</Label>
                <Input
                  id="policyClaimAmount"
                  type="number"
                  placeholder="Enter amount"
                  required
                  value={form.claimAmount}
                  onChange={(e) => setForm({ ...form, claimAmount: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="policyClaimDescription">Description / Details</Label>
              <Textarea
                id="policyClaimDescription"
                placeholder="Explain claim context..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-24 rounded-xl"
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
