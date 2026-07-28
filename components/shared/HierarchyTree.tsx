"use client"

import { useState } from "react"
import { ChevronDown, Users, Home, MapPin, UserCheck } from "lucide-react"

type AgentNode = {
  id: string
  name: string
  role: string
  isActive: boolean
}

type ManagerNode = {
  id: string
  name: string
  role: string
  isActive: boolean
  agentCount: number
  agents: AgentNode[]
}

type BranchNode = {
  id: string
  name: string
  code: string
  role: string
  region: string
  isActive: boolean
  branchManager: any
  counts: {
    agents: number
    active: number
    inactive: number
    customers: number
    policies: number
  }
  managers: ManagerNode[]
  agents: AgentNode[]
}

type RegionNode = {
  id: string
  name: string
  code: string
  isActive: boolean
  counts: {
    agents: number
    active: number
    inactive: number
    customers: number
    policies: number
  }
  branches: BranchNode[]
}

type HierarchyTreeProps = {
  tree: RegionNode[]
}

export function HierarchyTree({ tree }: HierarchyTreeProps) {
  const [openBranch, setOpenBranch] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {tree.map((region) => (
        <details
          key={region.id}
          className="overflow-hidden rounded-3xl border border-border bg-card"
          open
        >
          <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <Home className="size-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{region.name}</p>
                <p className="text-sm text-muted-foreground">Region code: {region.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{region.counts.active} active</span>
              <span>{region.counts.inactive} inactive</span>
              <span>{region.counts.agents} agents</span>
            </div>
          </summary>
          <div className="border-t border-border/70 px-6 py-4">
            {region.branches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No branches available.</p>
            ) : (
              <div className="space-y-4">
                {region.branches.map((branch) => (
                  <details key={branch.id} className="rounded-3xl border border-border bg-background/80">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
                          <MapPin className="size-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{branch.name}</p>
                          <p className="text-sm text-muted-foreground">Branch code: {branch.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{branch.counts.agents} agents</span>
                        <span>{branch.counts.active} active</span>
                        <span>{branch.counts.inactive} inactive</span>
                        <ChevronDown className="size-4" />
                      </div>
                    </summary>
                    <div className="space-y-3 border-t border-border/70 px-5 py-4">
                      {branch.managers.map((manager) => (
                        <details key={manager.id} className="rounded-3xl border border-border bg-card">
                          <summary className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left">
                            <div className="flex items-center gap-3">
                              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                                <UserCheck className="size-4" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{manager.name}</p>
                                <p className="text-sm text-muted-foreground">DO • {manager.agentCount} agents</p>
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">{manager.agents.length} agents</span>
                          </summary>
                          <div className="space-y-2 border-t border-border/70 px-4 py-3">
                            {manager.agents.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No agents assigned.</p>
                            ) : (
                              manager.agents.map((agent) => (
                                <div
                                  key={agent.id}
                                  className="rounded-2xl border border-border bg-background px-4 py-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="font-medium text-foreground">{agent.name}</p>
                                      <p className="text-sm text-muted-foreground">Agent</p>
                                    </div>
                                    <span className={agent.isActive ? "text-emerald-600" : "text-destructive"}>
                                      {agent.isActive ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </details>
                      ))}

                      {branch.agents.length > 0 && (
                        <div className="space-y-2 rounded-3xl border border-border bg-card p-4">
                          <p className="mb-3 text-sm font-semibold text-foreground">Unassigned agents</p>
                          {branch.agents.map((agent) => (
                            <div
                              key={agent.id}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3"
                            >
                              <div>
                                <p className="font-medium text-foreground">{agent.name}</p>
                                <p className="text-sm text-muted-foreground">Agent</p>
                              </div>
                              <span className={agent.isActive ? "text-emerald-600" : "text-destructive"}>
                                {agent.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  )
}
