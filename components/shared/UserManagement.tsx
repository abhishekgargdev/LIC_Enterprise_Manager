"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Copy, MoreHorizontal, Plus, UserRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type User = { _id: string; name: string; email: string; role: string; employeeCode?: string; agentCode?: string; branch?: string; manager?: { _id: string; name: string } | null; isActive: boolean; joiningDate?: string; phone?: string }
const roleLabels: Record<string, string> = { REGIONAL_ADMIN: "Regional Admin", BRANCH_MANAGER: "Branch Manager", DEVELOPMENT_OFFICER: "Development Officer", AGENT: "Agent" }
const formSchema = z.object({ name: z.string().min(2, "Enter a name"), email: z.email("Enter a valid email"), phone: z.string().optional(), role: z.string().min(1, "Select a role"), branch: z.string().optional(), managerId: z.string().optional() })
type FormValues = z.infer<typeof formSchema>

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [creatableRoles, setCreatableRoles] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [branchFilter, setBranchFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<User | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) as any, defaultValues: { name: "", email: "", phone: "", role: "", branch: "", managerId: "" } })
  const selectedRole = form.watch("role")

  const load = async () => {
    const params = new URLSearchParams(); if (query) params.set("search", query); if (roleFilter) params.set("role", roleFilter); if (branchFilter) params.set("branch", branchFilter); if (statusFilter) params.set("status", statusFilter)
    const response = await fetch(`/api/users?${params}`); const result = await response.json()
    if (result.success) { setUsers(result.data); setCreatableRoles(result.meta?.creatableRoles ?? []) } else toast.error(result.error || "Unable to load users.")
  }
  useEffect(() => { const timer = setTimeout(load, 180); return () => clearTimeout(timer) }, [query, roleFilter, branchFilter, statusFilter])
  const managers = useMemo(() => users.filter((user) => user.role === "DEVELOPMENT_OFFICER" && user.isActive), [users])

  async function create(values: FormValues) {
    const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }); const result = await response.json()
    if (!result.success) return toast.error(result.error || "Unable to create user.")
    setOpen(false); form.reset(); setTemporaryPassword(result.temporaryPassword); await load(); toast.success("User created.")
  }
  async function setActive(user: User, active: boolean) {
    const response = await fetch(`/api/users/${user._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: active }) }); const result = await response.json()
    if (!result.success) return toast.error(result.error || "Unable to update user.")
    await load(); toast.success(active ? "User reactivated." : "User deactivated.")
  }
  async function edit(user: User) {
    const name = window.prompt("Name", user.name)
    if (!name?.trim()) return
    const phone = window.prompt("Phone", user.phone || "")
    const response = await fetch(`/api/users/${user._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), phone: phone || "" }) }); const result = await response.json()
    if (!result.success) return toast.error(result.error || "Unable to update user.")
    await load(); toast.success("User updated.")
  }
  async function transfer(user: User) {
    const managerId = window.prompt("Enter the target Development Officer ID:")
    if (!managerId) return
    const manager = managers.find((item) => item._id === managerId)
    if (!manager) return toast.error("Choose a Development Officer listed in this workspace.")
    const response = await fetch("/api/hierarchy/transfer-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: user._id, newManagerId: managerId, newBranchCode: manager.branch }) }); const result = await response.json()
    if (!result.success) return toast.error(result.error || "Transfer failed."); await load(); toast.success("Agent transferred.")
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or code" className="w-64" /><Input value={branchFilter} onChange={(event) => setBranchFilter(event.target.value.toUpperCase())} placeholder="Branch code" className="w-32" /><select className="rounded-lg border bg-background px-3 text-sm" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All roles</option>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select className="rounded-lg border bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
      {creatableRoles.length > 0 && <Button onClick={() => setOpen(true)}><Plus className="size-4" />Add user</Button>}
    </div>
    <div className="overflow-x-auto rounded-[2rem] border border-border bg-card shadow-sm shadow-black/5"><table className="w-full min-w-[900px] text-sm"><thead className="border-b text-left text-muted-foreground"><tr>{["Name", "Role", "Code", "Branch", "Manager", "Status", "Joined", ""].map((heading) => <th className="px-5 py-4 font-medium" key={heading}>{heading}</th>)}</tr></thead><tbody>{users.length ? users.map((user) => <tr className="border-b last:border-0" key={user._id}><td className="px-5 py-4"><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></td><td className="px-5 py-4"><Badge variant="secondary">{roleLabels[user.role] ?? user.role}</Badge></td><td className="px-5 py-4 font-mono text-xs">{user.agentCode || user.employeeCode || "—"}</td><td className="px-5 py-4">{user.branch || "—"}</td><td className="px-5 py-4">{user.manager?.name || "—"}</td><td className="px-5 py-4"><Badge variant={user.isActive ? "default" : "destructive"}>{user.isActive ? "Active" : "Inactive"}</Badge></td><td className="px-5 py-4 text-muted-foreground">{user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : "—"}</td><td className="px-5 py-4"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}><MoreHorizontal className="size-4" /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setProfile(user)}>View profile</DropdownMenuItem><DropdownMenuItem onClick={() => edit(user)}>Edit</DropdownMenuItem><DropdownMenuItem onClick={() => setActive(user, !user.isActive)}>{user.isActive ? "Deactivate" : "Reactivate"}</DropdownMenuItem>{user.role === "AGENT" && <DropdownMenuItem onClick={() => transfer(user)}>Transfer</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></td></tr>) : <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">No staff match these filters.</td></tr>}</tbody></table></div>

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Add user</DialogTitle><DialogDescription>A temporary password is shown once after this user is created.</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={form.handleSubmit(create)}><div className="grid gap-2"><Label>Name</Label><Input {...form.register("name")} /><p className="text-xs text-destructive">{form.formState.errors.name?.message}</p></div><div className="grid gap-2"><Label>Email</Label><Input type="email" {...form.register("email")} /><p className="text-xs text-destructive">{form.formState.errors.email?.message}</p></div><div className="grid gap-2"><Label>Phone</Label><Input {...form.register("phone")} /></div><div className="grid gap-2"><Label>Role</Label><select className="h-9 rounded-lg border bg-background px-3" {...form.register("role")}><option value="">Select role</option>{creatableRoles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></div>{["BRANCH_MANAGER", "DEVELOPMENT_OFFICER"].includes(selectedRole) && <div className="grid gap-2"><Label>Branch code</Label><Input placeholder="e.g. MUM-S" {...form.register("branch")} /></div>}{selectedRole === "AGENT" && <div className="grid gap-2"><Label>Development Officer</Label><select className="h-9 rounded-lg border bg-background px-3" {...form.register("managerId")}><option value="">Select manager</option>{managers.map((manager) => <option key={manager._id} value={manager._id}>{manager.name} · {manager.branch}</option>)}</select></div>}<DialogFooter><Button type="submit">Create user</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={Boolean(temporaryPassword)} onOpenChange={(value) => !value && setTemporaryPassword(null)}><DialogContent><DialogHeader><DialogTitle>Temporary password</DialogTitle><DialogDescription>Copy this now. It will not be displayed again.</DialogDescription></DialogHeader><div className="flex items-center justify-between rounded-lg bg-muted p-3 font-mono">{temporaryPassword}<Button variant="ghost" size="icon-sm" onClick={() => { navigator.clipboard.writeText(temporaryPassword || ""); toast.success("Password copied.") }}><Copy className="size-4" /></Button></div></DialogContent></Dialog>
    <Dialog open={Boolean(profile)} onOpenChange={(value) => !value && setProfile(null)}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><UserRound className="size-5" />{profile?.name}</DialogTitle><DialogDescription>{profile?.email} · {roleLabels[profile?.role || ""]}</DialogDescription></DialogHeader><div className="grid grid-cols-3 gap-3 text-center text-sm"><div className="rounded-lg bg-muted p-3"><p className="font-semibold">—</p><p className="text-muted-foreground">Customers</p></div><div className="rounded-lg bg-muted p-3"><p className="font-semibold">—</p><p className="text-muted-foreground">Policies</p></div><div className="rounded-lg bg-muted p-3"><p className="font-semibold">—</p><p className="text-muted-foreground">Commission</p></div></div><p className="text-xs text-muted-foreground">Performance statistics will populate when customer, policy, and commission modules are connected.</p></DialogContent></Dialog>
  </div>
}
