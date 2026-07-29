"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PENDING: "secondary",
  LAPSED: "destructive",
  CANCELLED: "destructive",
  EXPIRED: "outline",
  MATURED: "default",
  CLAIM_SETTLED: "default",
}

type Policy = {
  _id: string
  policyNumber: string
  customer?: { name: string }
  planName: string
  premiumAmount: number
  sumAssured: number
  status: string
  maturityDate: string
}

type PolicyTemplate = {
  _id: string
  name: string
  planName: string
  defaultTerm: number
  defaultSumAssured: number
  defaultCommissionPercent: number
}

export function PolicyManagement() {
  const [data, setData] = useState<Policy[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<PolicyTemplate[]>([])
  const [form, setForm] = useState<Record<string, string>>({
    premiumMode: "YEARLY",
    policyTerm: "10",
  })

  const load = async () => {
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    if (status) p.set("status", status)
    try {
      const r = await fetch(`/api/policies?${p}`)
      const j = await r.json()
      if (j.success) setData(j.data)
    } catch (err) {
      toast.error("Failed to load policies.")
    }
  }

  // Fetch templates when dialog opens
  useEffect(() => {
    if (open) {
      fetch("/api/settings/policy-templates")
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setTemplates(json.data)
          }
        })
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    load()
  }, [search, status])

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find((t) => t._id === templateId)
    if (template) {
      setForm((prev) => ({
        ...prev,
        planName: template.planName,
        policyTerm: String(template.defaultTerm),
        sumAssured: String(template.defaultSumAssured),
      }))
      toast.success(`Pre-filled: ${template.name}`)
    }
  }

  const maturity =
    form.startDate && form.policyTerm
      ? new Date(
          new Date(form.startDate).setFullYear(
            new Date(form.startDate).getFullYear() + Number(form.policyTerm)
          )
        ).toLocaleDateString()
      : "—"

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const r = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const j = await r.json()
      if (!j.success) {
        toast.error(j.error || "Failed to create policy.")
        return
      }
      setOpen(false)
      setForm({ premiumMode: "YEARLY", policyTerm: "10" })
      load()
      toast.success("Policy created successfully.")
    } catch (err) {
      toast.error("An error occurred.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-2">
        <div className="flex gap-2">
          <Input
            placeholder="Search policy number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-lg border bg-background px-3"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {Object.keys(colors).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => setOpen(true)}>Add policy</Button>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border bg-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              {["Policy #", "Customer", "Plan", "Premium", "Sum assured", "Status", "Maturity"].map((x) => (
                <th className="px-5 py-4" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr className="border-b" key={p._id}>
                <td className="px-5 py-4">
                  <a href={`/dashboard/policies/${p._id}`} className="font-medium hover:underline">
                    {p.policyNumber}
                  </a>
                </td>
                <td className="px-5 py-4">{p.customer?.name}</td>
                <td className="px-5 py-4">{p.planName}</td>
                <td className="px-5 py-4">₹{p.premiumAmount.toLocaleString()}</td>
                <td className="px-5 py-4">₹{p.sumAssured.toLocaleString()}</td>
                <td className="px-5 py-4">
                  <Badge variant={colors[p.status] || "outline"}>{p.status}</Badge>
                </td>
                <td className="px-5 py-4">{new Date(p.maturityDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl border bg-card p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Add policy</DialogTitle>
          </DialogHeader>

          <form onSubmit={submit} className="grid gap-4 mt-2">
            {templates.length > 0 && (
              <div className="space-y-1.5">
                <label htmlFor="tpl-select" className="text-xs font-semibold text-muted-foreground">Pre-fill from Template</label>
                <select
                  id="tpl-select"
                  className="w-full h-10 rounded-xl border bg-background px-3 text-sm focus:outline-none"
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Choose a template...</option>
                  {templates.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.planName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {[
              ["customerId", "Customer ID"],
              ["planName", "Plan name"],
              ["policyTerm", "Term (years)"],
              ["premiumAmount", "Premium amount"],
              ["sumAssured", "Sum assured"],
              ["startDate", "Start date"],
            ].map(([key, label]) => (
              <div className="space-y-1.5" key={key}>
                <label htmlFor={`form-${key}`} className="text-xs font-semibold text-muted-foreground">{label}</label>
                <Input
                  id={`form-${key}`}
                  type={key === "startDate" ? "date" : "text"}
                  placeholder={label}
                  value={form[key] || ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <label htmlFor="form-premiumMode" className="text-xs font-semibold text-muted-foreground">Premium Mode</label>
              <select
                id="form-premiumMode"
                className="w-full h-10 rounded-xl border bg-background px-3 text-sm focus:outline-none"
                value={form.premiumMode}
                onChange={(e) => setForm({ ...form, premiumMode: e.target.value })}
              >
                {["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY", "SINGLE"].map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-muted-foreground mt-1">Maturity date: {maturity}</p>
            <Button type="submit" className="rounded-full mt-2">Create policy</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
