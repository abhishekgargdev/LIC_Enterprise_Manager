"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export function BranchManagement({ initialBranches }: { initialBranches: any[] }) {
  const [branches, setBranches] = useState(initialBranches ?? [])
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [region, setRegion] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const createBranch = useCallback(async () => {
    if (!name || !code || !region) {
      toast.error("Name, code, and region are required.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, region, address }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error || "Unable to create branch.")
        return
      }
      setBranches((current) => [...current, data.data])
      setName("")
      setCode("")
      setRegion("")
      setAddress("")
      toast.success("Branch created.")
    } catch (error) {
      toast.error("Failed to create branch.")
    } finally {
      setIsLoading(false)
    }
  }, [name, code, region, address])

  const toggleActive = useCallback(async (branchId: string, active: boolean) => {
    try {
      const res = await fetch(`/api/branches/${branchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error || "Failed to update branch.")
        return
      }
      setBranches((current) => current.map((item) => (item._id === branchId ? { ...item, isActive: data.data.isActive } : item)))
      if (data.warning) {
        toast.warn(data.warning)
      } else {
        toast.success("Branch updated.")
      }
    } catch (error) {
      toast.error("Unable to update branch.")
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm shadow-black/5">
        <CardHeader>
          <CardTitle>Branch management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create and manage branch offices in your region. Branch admins may deactivate branches when no active users remain.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="branch-name">Branch name</Label>
              <Input id="branch-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Mumbai South" />
            </div>
            <div>
              <Label htmlFor="branch-code">Branch code</Label>
              <Input id="branch-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="MUM-S" />
            </div>
            <div>
              <Label htmlFor="branch-region">Region code</Label>
              <Input id="branch-region" value={region} onChange={(event) => setRegion(event.target.value.toUpperCase())} placeholder="SOUTH" />
            </div>
            <div>
              <Label htmlFor="branch-address">Address</Label>
              <Input id="branch-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="123 Marine Drive" />
            </div>
          </div>
          <Button onClick={createBranch} disabled={isLoading}>
            {isLoading ? "Saving..." : "Create branch"}
          </Button>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm shadow-black/5">
        <div className="grid grid-cols-6 gap-4 border-b border-border px-6 py-4 text-sm font-semibold text-muted-foreground">
          <span>Name</span>
          <span>Code</span>
          <span>Region</span>
          <span>Manager</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="space-y-2 p-4">
          {branches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No branches found.</p>
          ) : (
            branches.map((branch) => (
              <div key={branch._id} className="grid grid-cols-6 gap-4 rounded-3xl border border-border bg-background p-4">
                <div>
                  <p className="font-medium text-foreground">{branch.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{branch.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{branch.region}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {branch.branchManager ? branch.branchManager.name : "Unassigned"}
                  </p>
                </div>
                <div>
                  <span className={branch.isActive ? "text-emerald-600" : "text-destructive"}>
                    {branch.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => toggleActive(branch._id, !branch.isActive)}>
                    {branch.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
