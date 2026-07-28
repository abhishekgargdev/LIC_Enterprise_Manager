"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const pretty = (value: unknown) => JSON.stringify(value ?? null, null, 2)

export function AuditLogTable() {
  const [logs, setLogs] = useState<any[]>([]), [open, setOpen] = useState<string | null>(null)
  const [entityType, setEntityType] = useState(""), [from, setFrom] = useState(""), [to, setTo] = useState("")
  useEffect(() => { const query = new URLSearchParams(); if (entityType) query.set("entityType", entityType); if (from) query.set("from", from); if (to) query.set("to", to); fetch(`/api/audit-logs?${query}`).then(r => r.json()).then(d => setLogs(d.data || [])) }, [entityType, from, to])
  return <div className="space-y-4 rounded-[2rem] border border-border bg-card p-5 shadow-sm shadow-black/5">
    <div className="flex flex-wrap gap-3"><Input className="w-48" value={entityType} onChange={e => setEntityType(e.target.value)} placeholder="Entity type" /><Input type="date" className="w-44" value={from} onChange={e => setFrom(e.target.value)} /><Input type="date" className="w-44" value={to} onChange={e => setTo(e.target.value)} /></div>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="p-3">Timestamp</th><th className="p-3">User</th><th className="p-3">Action</th><th className="p-3">Entity</th><th className="p-3">IP</th><th /></tr></thead><tbody>{logs.map(log => <><tr key={log._id} className="border-t border-border"><td className="p-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td><td className="p-3">{log.user?.name || "System"}</td><td className="p-3 font-medium">{log.action}</td><td className="p-3">{log.entityType}</td><td className="p-3 font-mono text-xs">{log.ipAddress || "—"}</td><td><Button variant="ghost" size="icon" onClick={() => setOpen(open === log._id ? null : log._id)}><ChevronDown className="size-4" /></Button></td></tr>{open === log._id && <tr key={`${log._id}-detail`} className="border-t border-border bg-muted/30"><td colSpan={6} className="p-4"><div className="grid gap-4 md:grid-cols-2"><div><p className="mb-2 font-medium">Before</p><pre className="overflow-auto rounded-xl bg-background p-3 text-xs">{pretty(log.oldValue)}</pre></div><div><p className="mb-2 font-medium">After</p><pre className="overflow-auto rounded-xl bg-background p-3 text-xs">{pretty(log.newValue)}</pre></div></div><p className="mt-3 text-xs text-muted-foreground">{log.userAgent || "No user agent captured"}</p></td></tr>}</>)}</tbody></table></div>
  </div>
}
