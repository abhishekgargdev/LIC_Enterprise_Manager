"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { Shield, Sparkles, User, Settings, Table, Bell, Palette, Plus, Trash2, Check, X } from "lucide-react"

// Types
type UserProfile = {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
  phone?: string
}

type CommissionRule = {
  _id: string
  appliesTo: "GLOBAL" | "BRANCH" | "PLAN"
  branch?: { _id: string; name: string } | string
  planName?: string
  agentPercent: number
  managerPercent: number
  branchPercent: number
  effectiveFrom: string
  isActive: boolean
}

type PolicyTemplate = {
  _id: string
  name: string
  planName: string
  defaultTerm: number
  defaultSumAssured: number
  defaultCommissionPercent: number
}

type PermissionRow = {
  module: string
  SUPER_ADMIN: string
  REGIONAL_ADMIN: string
  BRANCH_MANAGER: string
  DEVELOPMENT_OFFICER: string
  AGENT: string
}

const NOTIFICATION_TYPES = [
  { key: "PREMIUM_DUE", label: "Premium Due Reminders", description: "Alerts when a client's policy premium installment is due soon." },
  { key: "POLICY_EXPIRING", label: "Policy Expiring", description: "Alerts for policies approaching maturity or termination." },
  { key: "POLICY_LAPSED", label: "Policy Lapsed Alerts", description: "Urgent alerts when grace periods expire without payment." },
  { key: "BIRTHDAY", label: "Customer Birthdays", description: "Friendly client relationship reminders for birthdays." },
  { key: "CLAIM_STATUS_CHANGE", label: "Claims Status Updates", description: "Alerts for claim stage progressions or settlements." },
  { key: "NEW_ASSIGNMENT", label: "New Client/Policy Assignments", description: "Notifications when a lead or policy is reassigned to you." },
  { key: "COMMISSION_CREDITED", label: "Commission Credits", description: "Instant notification when premium payouts post to your balance." },
  { key: "LEAD_FOLLOWUP_DUE", label: "Lead Follow-up Tasks", description: "Reminders of scheduled sales leads outreach." },
]

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("profile")

  // --- 1. Fetch Current User Session ---
  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me")
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to load profile")
      return json.data.user
    },
  })

  const isAdmin = user && ["SUPER_ADMIN", "REGIONAL_ADMIN"].includes(user.role)

  // --- Tab: Profile Form State ---
  const [profileName, setProfileName] = useState("")
  const [profilePhone, setProfilePhone] = useState("")
  const [profileAvatar, setProfileAvatar] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "")
      setProfilePhone(user.phone || "")
      setProfileAvatar(user.avatarUrl || "")
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.")
      return
    }

    setProfileSaving(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          avatarUrl: profileAvatar,
          oldPassword: newPassword ? oldPassword : undefined,
          newPassword: newPassword ? newPassword : undefined,
        }),
      })

      const json = await res.json()
      if (json.success) {
        toast.success("Profile updated successfully.")
        setOldPassword("")
        setNewPassword("")
        setConfirmPassword("")
        queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] })
        queryClient.invalidateQueries({ queryKey: ["currentUser"] }) // Header updates too
      } else {
        toast.error(json.error || "Profile update failed.")
      }
    } catch (err) {
      toast.error("An unexpected error occurred.")
    } finally {
      setProfileSaving(false)
    }
  }

  // --- Tab: Notifications State ---
  const [mutedTypes, setMutedTypes] = useState<string[]>([])
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mutedNotifications")
      if (stored) {
        try {
          setMutedTypes(JSON.parse(stored))
        } catch (_) {}
      }
    }
  }, [])

  const toggleMuteNotification = (typeKey: string) => {
    let next: string[]
    if (mutedTypes.includes(typeKey)) {
      next = mutedTypes.filter((t) => t !== typeKey)
      toast.success("Notification type unmuted.")
    } else {
      next = [...mutedTypes, typeKey]
      toast.success("Notification type muted.")
    }
    setMutedTypes(next)
    localStorage.setItem("mutedNotifications", JSON.stringify(next))
    // Trigger window event so header query can update if needed
    window.dispatchEvent(new Event("storage"))
  }

  // --- Tab: Commission Rules CRUD ---
  const { data: rules, isLoading: rulesLoading } = useQuery<CommissionRule[]>({
    queryKey: ["commissionRules"],
    queryFn: async () => {
      const res = await fetch("/api/settings/commission-rules")
      const json = await res.json()
      return json.success ? json.data : []
    },
    enabled: !!isAdmin,
  })

  const [ruleType, setRuleType] = useState<"GLOBAL" | "BRANCH" | "PLAN">("GLOBAL")
  const [ruleBranch, setRuleBranch] = useState("")
  const [rulePlan, setRulePlan] = useState("")
  const [ruleAgentPct, setRuleAgentPct] = useState(15)
  const [ruleManagerPct, setRuleManagerPct] = useState(5)
  const [ruleBranchPct, setRuleBranchPct] = useState(2)
  const [ruleSaving, setRuleSaving] = useState(false)

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ruleAgentPct + ruleManagerPct + ruleBranchPct > 100) {
      toast.error("Total commission percentages cannot exceed 100%.")
      return
    }

    setRuleSaving(true)
    try {
      const res = await fetch("/api/settings/commission-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appliesTo: ruleType,
          branch: ruleType === "BRANCH" ? ruleBranch : undefined,
          planName: ruleType === "PLAN" ? rulePlan : undefined,
          agentPercent: Number(ruleAgentPct),
          managerPercent: Number(ruleManagerPct),
          branchPercent: Number(ruleBranchPct),
          effectiveFrom: new Date(),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Commission rule created.")
        setRuleBranch("")
        setRulePlan("")
        queryClient.invalidateQueries({ queryKey: ["commissionRules"] })
      } else {
        toast.error(json.error || "Failed to create commission rule.")
      }
    } catch (err) {
      toast.error("An error occurred.")
    } finally {
      setRuleSaving(false)
    }
  }

  const handleToggleRuleActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/settings/commission-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(active ? "Rule activated." : "Rule deactivated.")
        queryClient.invalidateQueries({ queryKey: ["commissionRules"] })
      } else {
        toast.error(json.error || "Failed to update rule.")
      }
    } catch (err) {
      toast.error("An error occurred.")
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this commission rule?")) return
    try {
      const res = await fetch(`/api/settings/commission-rules/${id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Rule deleted.")
        queryClient.invalidateQueries({ queryKey: ["commissionRules"] })
      } else {
        toast.error(json.error || "Failed to delete rule.")
      }
    } catch (err) {
      toast.error("An error occurred.")
    }
  }

  // --- Tab: Policy Templates CRUD ---
  const { data: templates, isLoading: templatesLoading } = useQuery<PolicyTemplate[]>({
    queryKey: ["policyTemplates"],
    queryFn: async () => {
      const res = await fetch("/api/settings/policy-templates")
      const json = await res.json()
      return json.success ? json.data : []
    },
    enabled: !!isAdmin,
  })

  const [tplName, setTplName] = useState("")
  const [tplPlan, setTplPlan] = useState("JEEVAN_ANAND")
  const [tplTerm, setTplTerm] = useState(15)
  const [tplSA, setTplSA] = useState(500000)
  const [tplComm, setTplComm] = useState(15)
  const [tplSaving, setTplSaving] = useState(false)

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tplName.trim()) {
      toast.error("Template name is required.")
      return
    }

    setTplSaving(true)
    try {
      const res = await fetch("/api/settings/policy-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tplName,
          planName: tplPlan,
          defaultTerm: Number(tplTerm),
          defaultSumAssured: Number(tplSA),
          defaultCommissionPercent: Number(tplComm),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Policy template created.")
        setTplName("")
        queryClient.invalidateQueries({ queryKey: ["policyTemplates"] })
      } else {
        toast.error(json.error || "Failed to create template.")
      }
    } catch (err) {
      toast.error("An error occurred.")
    } finally {
      setTplSaving(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return
    try {
      const res = await fetch(`/api/settings/policy-templates/${id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Template deleted.")
        queryClient.invalidateQueries({ queryKey: ["policyTemplates"] })
      } else {
        toast.error(json.error || "Failed to delete template.")
      }
    } catch (err) {
      toast.error("An error occurred.")
    }
  }

  // --- Tab: Roles & Permissions Matrix ---
  const { data: permissionMatrix, isLoading: matrixLoading } = useQuery<PermissionRow[]>({
    queryKey: ["rolesPermissionsMatrix"],
    queryFn: async () => {
      const res = await fetch("/api/settings/roles-permissions")
      const json = await res.json()
      return json.success ? json.data : []
    },
    enabled: !!isAdmin,
  })

  if (userLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading configuration shell…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Configure profile details, notification alerts, and system-wide RBAC defaults.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-muted/80 p-1.5 rounded-3xl w-fit">
          <TabsTrigger value="profile" className="rounded-full px-5 py-2.5 text-xs font-semibold gap-1.5">
            <User className="size-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-full px-5 py-2.5 text-xs font-semibold gap-1.5">
            <Palette className="size-3.5" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-full px-5 py-2.5 text-xs font-semibold gap-1.5">
            <Bell className="size-3.5" /> Notifications
          </TabsTrigger>

          {isAdmin && (
            <>
              <TabsTrigger value="commission" className="rounded-full px-5 py-2.5 text-xs font-semibold gap-1.5">
                <Sparkles className="size-3.5" /> Commission Rules
              </TabsTrigger>
              <TabsTrigger value="templates" className="rounded-full px-5 py-2.5 text-xs font-semibold gap-1.5">
                <Settings className="size-3.5" /> Policy Templates
              </TabsTrigger>
              <TabsTrigger value="permissions" className="rounded-full px-5 py-2.5 text-xs font-semibold gap-1.5">
                <Table className="size-3.5" /> Roles & Permissions
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <Card className="rounded-[2.5rem] border border-border p-6 shadow-lg shadow-black/5 bg-card">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Update your personal information and change your password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Full Name</Label>
                    <Input id="profile-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email Address (Read-Only)</Label>
                    <Input id="profile-email" value={user?.email || ""} disabled className="bg-muted/40 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">Phone Number</Label>
                    <Input id="profile-phone" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-avatar">Avatar URL</Label>
                    <Input id="profile-avatar" value={profileAvatar} onChange={(e) => setProfileAvatar(e.target.value)} placeholder="https://example.com/avatar.jpg" />
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Change Password</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="old-pw">Current Password</Label>
                      <Input id="old-pw" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="••••••" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-pw">New Password</Label>
                      <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pw">Confirm New Password</Label>
                      <Input id="confirm-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••" />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={profileSaving} className="rounded-full px-6 py-2.5">
                  {profileSaving ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPEARANCE TAB */}
        <TabsContent value="appearance">
          <Card className="rounded-[2.5rem] border border-border p-6 shadow-lg shadow-black/5 bg-card">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the application theme.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b last:border-none">
                <div>
                  <p className="font-semibold text-sm">Theme Mode</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark display preferences.</p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications">
          <Card className="rounded-[2.5rem] border border-border p-6 shadow-lg shadow-black/5 bg-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Mute or unmute specific in-app alert types.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 divide-y divide-border/40">
              {NOTIFICATION_TYPES.map((t, idx) => {
                const isMuted = mutedTypes.includes(t.key)
                return (
                  <div key={t.key} className={`flex items-center justify-between py-4 ${idx === 0 ? "pt-0" : ""}`}>
                    <div className="pr-4">
                      <p className="font-semibold text-sm">{t.label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{t.description}</p>
                    </div>
                    <Button
                      variant={isMuted ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleMuteNotification(t.key)}
                      className="rounded-full min-w-[90px]"
                    >
                      {isMuted ? (
                        <>
                          <X className="mr-1.5 size-3.5" /> Muted
                        </>
                      ) : (
                        <>
                          <Check className="mr-1.5 size-3.5" /> Active
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMMISSION RULES TAB (Admin+) */}
        {isAdmin && (
          <TabsContent value="commission" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="rounded-[2.5rem] border p-6 bg-card lg:col-span-1">
                <CardHeader>
                  <CardTitle>Add Rule</CardTitle>
                  <CardDescription>Configure dynamic commission share splits.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateRule} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="rule-applies">Applies To</Label>
                      <select
                        id="rule-applies"
                        value={ruleType}
                        onChange={(e) => setRuleType(e.target.value as any)}
                        className="w-full h-10 rounded-xl border bg-background px-3 text-sm focus:outline-none"
                      >
                        <option value="GLOBAL">Global Default</option>
                        <option value="BRANCH">Specific Branch</option>
                        <option value="PLAN">Specific Plan</option>
                      </select>
                    </div>

                    {ruleType === "BRANCH" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="rule-branch">Branch Code</Label>
                        <Input id="rule-branch" value={ruleBranch} onChange={(e) => setRuleBranch(e.target.value.toUpperCase())} placeholder="e.g. MUM-S" required />
                      </div>
                    )}

                    {ruleType === "PLAN" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="rule-plan">Plan Name</Label>
                        <Input id="rule-plan" value={rulePlan} onChange={(e) => setRulePlan(e.target.value.toUpperCase())} placeholder="e.g. JEEVAN_ANAND" required />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="rule-ag">Agent Share (%)</Label>
                      <Input id="rule-ag" type="number" min={0} max={100} value={ruleAgentPct} onChange={(e) => setRuleAgentPct(Number(e.target.value))} required />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="rule-mgr">Manager (DO) Share (%)</Label>
                      <Input id="rule-mgr" type="number" min={0} max={100} value={ruleManagerPct} onChange={(e) => setRuleManagerPct(Number(e.target.value))} required />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="rule-br">Branch Share (%)</Label>
                      <Input id="rule-br" type="number" min={0} max={100} value={ruleBranchPct} onChange={(e) => setRuleBranchPct(Number(e.target.value))} required />
                    </div>

                    <Button type="submit" disabled={ruleSaving} className="w-full rounded-full mt-2">
                      <Plus className="mr-1.5 size-4" /> Save Rule
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border p-6 bg-card lg:col-span-2">
                <CardHeader>
                  <CardTitle>Active Commission Rules</CardTitle>
                  <CardDescription>Rules defining how premiums are split among stakeholders upon payout.</CardDescription>
                </CardHeader>
                <CardContent>
                  {rulesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading rules...</p>
                  ) : !rules || rules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No commission rules seeded yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-3xl border bg-background">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <tr>
                            <th className="p-4">Applies To</th>
                            <th className="p-4">Agent %</th>
                            <th className="p-4">DO %</th>
                            <th className="p-4">Branch %</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {rules.map((rule) => (
                            <tr key={rule._id} className="hover:bg-muted/10 transition-colors">
                              <td className="p-4 font-semibold text-foreground">
                                {rule.appliesTo}
                                {rule.appliesTo === "BRANCH" && ` (${typeof rule.branch === "object" ? (rule.branch as any).code : rule.branch})`}
                                {rule.appliesTo === "PLAN" && ` (${rule.planName})`}
                              </td>
                              <td className="p-4">{rule.agentPercent}%</td>
                              <td className="p-4">{rule.managerPercent}%</td>
                              <td className="p-4">{rule.branchPercent}%</td>
                              <td className="p-4">
                                <Badge variant={rule.isActive ? "default" : "secondary"}>
                                  {rule.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full px-3"
                                  onClick={() => handleToggleRuleActive(rule._id, !rule.isActive)}
                                >
                                  {rule.isActive ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleDeleteRule(rule._id)}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* POLICY TEMPLATES TAB (Admin+) */}
        {isAdmin && (
          <TabsContent value="templates" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="rounded-[2.5rem] border p-6 bg-card lg:col-span-1">
                <CardHeader>
                  <CardTitle>Create Template</CardTitle>
                  <CardDescription>Define pre-filled templates to simplify policy provisioning.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTemplate} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tpl-name">Template Name</Label>
                      <Input id="tpl-name" value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. Jeevan Anand Starter" required />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tpl-plan">Plan Type</Label>
                      <select
                        id="tpl-plan"
                        value={tplPlan}
                        onChange={(e) => setTplPlan(e.target.value)}
                        className="w-full h-10 rounded-xl border bg-background px-3 text-sm focus:outline-none"
                      >
                        <option value="JEEVAN_ANAND">Jeevan Anand</option>
                        <option value="JEEVAN_LAKSHYA">Jeevan Lakshya</option>
                        <option value="JEEVAN_UMANG">Jeevan Umang</option>
                        <option value="JEEVAN_LABH">Jeevan Labh</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tpl-term">Default Term (Years)</Label>
                      <Input id="tpl-term" type="number" min={5} value={tplTerm} onChange={(e) => setTplTerm(Number(e.target.value))} required />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tpl-sa">Default Sum Assured (₹)</Label>
                      <Input id="tpl-sa" type="number" min={50000} value={tplSA} onChange={(e) => setTplSA(Number(e.target.value))} required />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tpl-comm">Default Commission (%)</Label>
                      <Input id="tpl-comm" type="number" min={0} max={100} value={tplComm} onChange={(e) => setTplComm(Number(e.target.value))} required />
                    </div>

                    <Button type="submit" disabled={tplSaving} className="w-full rounded-full mt-2">
                      <Plus className="mr-1.5 size-4" /> Save Template
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border p-6 bg-card lg:col-span-2">
                <CardHeader>
                  <CardTitle>Policy Templates</CardTitle>
                  <CardDescription>Pre-defined policy fields for agents/managers when issuing new coverage.</CardDescription>
                </CardHeader>
                <CardContent>
                  {templatesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading templates...</p>
                  ) : !templates || templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No policy templates created yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-3xl border bg-background">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Plan</th>
                            <th className="p-4">Term</th>
                            <th className="p-4">Sum Assured</th>
                            <th className="p-4">Comm %</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {templates.map((tpl) => (
                            <tr key={tpl._id} className="hover:bg-muted/10 transition-colors">
                              <td className="p-4 font-semibold text-foreground">{tpl.name}</td>
                              <td className="p-4"><Badge variant="outline">{tpl.planName}</Badge></td>
                              <td className="p-4">{tpl.defaultTerm} Years</td>
                              <td className="p-4">₹{tpl.defaultSumAssured.toLocaleString()}</td>
                              <td className="p-4">{tpl.defaultCommissionPercent}%</td>
                              <td className="p-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleDeleteTemplate(tpl._id)}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* ROLES & PERMISSIONS MATRIX (Admin+) */}
        {isAdmin && (
          <TabsContent value="permissions">
            <Card className="rounded-[2.5rem] border border-border p-6 shadow-lg shadow-black/5 bg-card">
              <CardHeader>
                <CardTitle>RBAC Matrix Reference</CardTitle>
                <CardDescription>
                  Read-only module access rules defining system permission levels. To modify roles, contact database administrators.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matrixLoading ? (
                  <p className="text-sm text-muted-foreground">Loading matrix...</p>
                ) : !permissionMatrix || permissionMatrix.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Reference data unavailable.</p>
                ) : (
                  <div className="overflow-x-auto rounded-3xl border bg-background">
                    <table className="w-full text-left text-sm min-w-[900px]">
                      <thead className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <tr>
                          <th className="p-4">System Module</th>
                          <th className="p-4">Super Admin</th>
                          <th className="p-4">Regional Admin</th>
                          <th className="p-4">Branch Mgr</th>
                          <th className="p-4">Dev Officer</th>
                          <th className="p-4">Agent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {permissionMatrix.map((row, idx) => (
                          <tr key={idx} className="hover:bg-muted/10 transition-colors">
                            <td className="p-4 font-semibold text-foreground">{row.module}</td>
                            <td className="p-4 text-xs font-medium text-indigo-600 dark:text-indigo-400">{row.SUPER_ADMIN}</td>
                            <td className="p-4 text-xs text-muted-foreground">{row.REGIONAL_ADMIN}</td>
                            <td className="p-4 text-xs text-muted-foreground">{row.BRANCH_MANAGER}</td>
                            <td className="p-4 text-xs text-muted-foreground">{row.DEVELOPMENT_OFFICER}</td>
                            <td className="p-4 text-xs text-muted-foreground">{row.AGENT}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
