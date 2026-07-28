"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Users } from "lucide-react"

export function BranchCards() {
  const [branches, setBranches] = useState<any[]>([])
  const router = useRouter()
  useEffect(() => { fetch("/api/branches").then(r => r.json()).then(d => { const items = d.data || []; setBranches(items); fetch("/api/auth/me").then(r => r.json()).then(me => { if (me.data?.user?.role === "BRANCH_MANAGER" && items.length === 1) router.replace(`/dashboard/branches/${items[0]._id}` as never) }) }) }, [router])
  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{branches.map(branch => <Link key={branch._id} href={`/dashboard/branches/${branch._id}` as never} className="rounded-[2rem] border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="flex items-start justify-between"><div><h2 className="text-xl font-semibold">{branch.name}</h2><p className="mt-1 text-sm text-muted-foreground">{branch.code} · {branch.region}</p></div><span className={branch.isActive ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600" : "rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive"}>{branch.isActive ? "Active" : "Inactive"}</span></div><div className="mt-8 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-muted/50 p-3"><Users className="mb-2 size-4" />{branch.branchManager?.name || "Unassigned"}</div><div className="rounded-2xl bg-muted/50 p-3"><MapPin className="mb-2 size-4" />Performance details</div></div></Link>)}</div>
}
