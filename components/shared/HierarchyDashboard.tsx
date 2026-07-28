"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { HierarchyTree } from "@/components/shared/HierarchyTree"

type AgentOption = {
  id: string
  name: string
  branchCode: string
  managerId?: string
}

type ManagerOption = {
  id: string
  name: string
  branchCode: string
}

type BranchOption = {
  code: string
  name: string
}

type HierarchyDashboardProps = {
  tree: any[]
}

export function HierarchyDashboard({ tree }: HierarchyDashboardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [agentId, setAgentId] = useState("")
  const [managerId, setManagerId] = useState("")
  const [branchCode, setBranchCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const options = useMemo(() => {
    const agents: AgentOption[] = []
    const managers: ManagerOption[] = []
    const branches: BranchOption[] = []

    tree.forEach((region) => {
      region.branches.forEach((branch) => {
        branches.push({ code: branch.code, name: branch.name })
        branch.managers.forEach((manager) => {
          managers.push({ id: manager.id, name: manager.name, branchCode: branch.code })
          manager.agents.forEach((agent) => {
            agents.push({ id: agent.id, name: agent.name, branchCode: branch.code, managerId: manager.id })
          })
        })
        branch.agents.forEach((agent) => {
          agents.push({ id: agent.id, name: agent.name, branchCode: branch.code })
        })
      })
    })

    return { agents, managers, branches }
  }, [tree])

  const handleTransfer = async () => {
    if (!agentId || !managerId || !branchCode) {
      toast.error("Select an agent, target branch and target manager.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/hierarchy/transfer-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, newManagerId: managerId, newBranchCode: branchCode }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error || "Transfer failed.")
        return
      }
      toast.success("Agent transfer requested.")
      setIsOpen(false)
      setAgentId("")
      setManagerId("")
      setBranchCode("")
    } catch (error) {
      toast.error("Unable to transfer agent.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1fr_330px]">
        <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm shadow-black/5">
          <CardHeader>
            <CardTitle>Organization hierarchy</CardTitle>
            <p className="text-sm text-muted-foreground">
              View the Head Office → Regional → Branch → DO → Agent tree within your access scope.
            </p>
          </CardHeader>
          <CardContent>
            <HierarchyTree tree={tree} />
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm shadow-black/5">
          <CardHeader>
            <CardTitle>Transfer agent</CardTitle>
            <p className="text-sm text-muted-foreground">
              Move agents between managers and branches with an audit trail.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>Open transfer dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer agent</DialogTitle>
                  <DialogDescription>
                    Choose the agent, branch and new manager for the transfer.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="agent-select">Agent</Label>
                    <Select value={agentId} onValueChange={setAgentId}>
                      <SelectTrigger id="agent-select">
                        <SelectValue>{agentId ? options.agents.find((item) => item.id === agentId)?.name : "Select agent"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {options.agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>{`${agent.name} (${agent.branchCode})`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch-select">Branch</Label>
                    <Select value={branchCode} onValueChange={setBranchCode}>
                      <SelectTrigger id="branch-select">
                        <SelectValue>{branchCode ? `${branchCode}` : "Select branch"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {options.branches.map((branch) => (
                          <SelectItem key={branch.code} value={branch.code}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager-select">Manager</Label>
                    <Select value={managerId} onValueChange={setManagerId}>
                      <SelectTrigger id="manager-select">
                        <SelectValue>{managerId ? options.managers.find((item) => item.id === managerId)?.name : "Select manager"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {options.managers
                          .filter((manager) => manager.branchCode === branchCode || branchCode === "")
                          .map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>{`${manager.name} (${manager.branchCode})`}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleTransfer} disabled={isSubmitting}>
                    {isSubmitting ? "Transferring..." : "Confirm transfer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <div className="rounded-3xl border border-border bg-background p-4 text-sm text-muted-foreground">
              Select a branch first to filter the destination managers.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
