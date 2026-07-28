"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function RegionManagement({ initialRegions }: { initialRegions: any[] }) {
  const [regions, setRegions] = useState(initialRegions ?? [])
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const createRegion = useCallback(async () => {
    if (!name || !code) {
      toast.error("Name and code are required.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error || "Unable to create region.")
        return
      }
      setRegions((current) => [...current, data.data])
      setName("")
      setCode("")
      toast.success("Region created.")
    } catch (error) {
      toast.error("Failed to create region.")
    } finally {
      setIsLoading(false)
    }
  }, [name, code])

  const toggleActive = useCallback(async (regionId: string, active: boolean) => {
    try {
      const res = await fetch(`/api/regions/${regionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error || "Failed to update region.")
        return
      }
      setRegions((current) => current.map((item) => (item._id === regionId ? { ...item, isActive: data.data.isActive } : item)))
      if (data.warning) {
        toast.warn(data.warning)
      } else {
        toast.success("Region updated.")
      }
    } catch (error) {
      toast.error("Unable to update region.")
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm shadow-black/5">
        <CardHeader>
          <CardTitle>Region management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create, edit, and deactivate region offices. Regional admins may only manage their own region.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="region-name">Region name</Label>
              <Input
                id="region-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="South Zone"
              />
            </div>
            <div>
              <Label htmlFor="region-code">Region code</Label>
              <Input
                id="region-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="SOUTH"
              />
            </div>
          </div>
          <Button onClick={createRegion} disabled={isLoading}>
            {isLoading ? "Saving..." : "Create region"}
          </Button>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm shadow-black/5">
        <div className="grid grid-cols-5 gap-4 border-b border-border px-6 py-4 text-sm font-semibold text-muted-foreground">
          <span>Name</span>
          <span>Code</span>
          <span>Admin</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="space-y-2 p-4">
          {regions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No regions found.</p>
          ) : (
            regions.map((region) => (
              <div key={region._id} className="grid grid-cols-5 gap-4 rounded-3xl border border-border bg-background p-4">
                <div>
                  <p className="font-medium text-foreground">{region.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{region.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {region.regionalAdmin ? region.regionalAdmin.name : "Unassigned"}
                  </p>
                </div>
                <div>
                  <span className={region.isActive ? "text-emerald-600" : "text-destructive"}>
                    {region.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(region._id, !region.isActive)}
                  >
                    {region.isActive ? "Deactivate" : "Activate"}
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
