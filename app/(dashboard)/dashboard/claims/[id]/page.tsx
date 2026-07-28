"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Clock, Eye, CheckCircle, XCircle, DollarSign, Calendar, ShieldCheck, User } from "lucide-react"

type ClaimDetail = {
  _id: string
  claimNumber: string
  policy?: {
    _id: string
    policyNumber: string
    planName: string
    status: string
    premiumAmount: number
    sumAssured: number
    maturityDate: string
    agent?: { name: string }
    manager?: { name: string }
    branch?: { name: string }
  }
  customer?: {
    name: string
    email?: string
    mobile: string
  }
  claimType: string
  claimAmount: number
  description?: string
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "SETTLED"
  filedDate: string
  filedBy?: { name: string; role: string }
  approvedAmount?: number
  settledDate?: string
  rejectionReason?: string
  reviewedBy?: { name: string; role: string }
  updatedAt: string
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  UNDER_REVIEW: "bg-blue-500/15 text-blue-500 border-blue-500/20",
  APPROVED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  REJECTED: "bg-rose-500/15 text-rose-500 border-rose-500/20",
  SETTLED: "bg-purple-500/15 text-purple-500 border-purple-500/20",
}

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [claim, setClaim] = useState<ClaimDetail | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Inputs for actions
  const [approvedAmountInput, setApprovedAmountInput] = useState("")
  const [rejectionReasonInput, setRejectionReasonInput] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const res = await fetch(`/api/claims/${id}`)
      const json = await res.json()
      if (json.success) {
        setClaim(json.data)
        setApprovedAmountInput(json.data.claimAmount.toString())
      } else {
        alert(json.error || "Claim not found.")
      }
    } catch (err) {
      console.error("Error loading claim detail:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadUser = async () => {
    try {
      const res = await fetch("/api/auth/me")
      const json = await res.json()
      if (json.success) {
        setCurrentUser(json.data.user)
      }
    } catch (err) {
      console.error("Error fetching me:", err)
    }
  }

  useEffect(() => {
    loadData()
    loadUser()
  }, [id])

  const handleTransition = async (newStatus: string) => {
    setSubmitting(true)
    try {
      const payload: Record<string, any> = { status: newStatus }
      if (newStatus === "APPROVED") {
        payload.approvedAmount = Number(approvedAmountInput)
      }
      if (newStatus === "REJECTED") {
        if (!rejectionReasonInput.trim()) {
          alert("Rejection reason is required.")
          setSubmitting(false)
          return
        }
        payload.rejectionReason = rejectionReasonInput
      }

      const res = await fetch(`/api/claims/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        loadData()
      } else {
        alert(json.error || "Transition failed.")
      }
    } catch (err) {
      console.error("Error transition:", err)
      alert("An error occurred.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading claim details...</div>
  }

  if (!claim) {
    return <div className="flex h-64 items-center justify-center text-sm text-destructive">Claim not found.</div>
  }

  // Stepper calculations
  const steps = ["PENDING", "UNDER_REVIEW", "DECISION", "SETTLED"]
  
  const getStepStatus = (step: string) => {
    if (step === "PENDING") return "completed"
    if (step === "UNDER_REVIEW") {
      if (claim.status === "PENDING") return "upcoming"
      return "completed"
    }
    if (step === "DECISION") {
      if (claim.status === "PENDING" || claim.status === "UNDER_REVIEW") return "upcoming"
      return claim.status === "REJECTED" ? "rejected" : "completed"
    }
    if (step === "SETTLED") {
      if (claim.status === "SETTLED") return "completed"
      return "upcoming"
    }
    return "upcoming"
  }

  // Check if current user is branch manager or above
  const isManagerOrAbove = currentUser && ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER"].includes(currentUser.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/claims")} className="rounded-full">
          <ArrowLeft className="mr-2 size-4" /> Back to Claims
        </Button>
      </div>

      {/* Visual Stepper */}
      <Card className="rounded-[2rem] border border-border/50 bg-card/50 shadow-sm backdrop-blur-md p-6">
        <CardTitle className="mb-6 text-sm uppercase tracking-[0.2em] text-muted-foreground text-center">
          Claim Progress Tracker
        </CardTitle>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-4 max-w-4xl mx-auto">
          {steps.map((step, idx) => {
            const status = getStepStatus(step)
            const isLast = idx === steps.length - 1

            let colorClass = "bg-muted text-muted-foreground border-transparent"
            let lineClass = "bg-muted"
            let icon = <Clock className="size-5" />

            if (status === "completed") {
              colorClass = "bg-emerald-500 text-white border-emerald-600"
              lineClass = "bg-emerald-500"
              icon = <CheckCircle className="size-5" />
            } else if (status === "rejected") {
              colorClass = "bg-rose-500 text-white border-rose-600"
              lineClass = "bg-rose-500"
              icon = <XCircle className="size-5" />
            } else if (idx === 1 && claim.status === "UNDER_REVIEW") {
              colorClass = "bg-blue-500 text-white border-blue-600 ring-4 ring-blue-500/20"
              icon = <Eye className="size-5" />
            }

            // Human labels
            let label = "Pending"
            let dateLabel = claim.filedDate ? new Date(claim.filedDate).toLocaleDateString() : ""
            let actorLabel = claim.filedBy?.name || ""

            if (step === "UNDER_REVIEW") {
              label = "Under Review"
              dateLabel = claim.status !== "PENDING" && claim.reviewedBy ? new Date(claim.updatedAt).toLocaleDateString() : ""
              actorLabel = claim.status !== "PENDING" && claim.reviewedBy?.name ? claim.reviewedBy.name : ""
            } else if (step === "DECISION") {
              label = claim.status === "REJECTED" ? "Rejected" : "Approved"
              dateLabel = ["APPROVED", "REJECTED", "SETTLED"].includes(claim.status) ? new Date(claim.updatedAt).toLocaleDateString() : ""
              actorLabel = ["APPROVED", "REJECTED", "SETTLED"].includes(claim.status) && claim.reviewedBy?.name ? claim.reviewedBy.name : ""
            } else if (step === "SETTLED") {
              label = "Settled"
              dateLabel = claim.settledDate ? new Date(claim.settledDate).toLocaleDateString() : ""
              actorLabel = claim.settledDate && claim.reviewedBy?.name ? claim.reviewedBy.name : ""
            }

            return (
              <div key={step} className="flex-1 w-full flex items-start md:items-center gap-4 relative">
                <div className="flex items-center flex-col md:flex-row w-full">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${colorClass} transition-all duration-300`}>
                    {icon}
                  </div>
                  <div className="mt-2 md:mt-0 md:ml-4 text-left">
                    <p className="font-semibold text-sm leading-none">{label}</p>
                    {dateLabel && <p className="text-xs text-muted-foreground mt-1">{dateLabel}</p>}
                    {actorLabel && <p className="text-[10px] text-muted-foreground italic mt-0.5">by {actorLabel}</p>}
                  </div>
                  {!isLast && (
                    <div className={`hidden md:block h-0.5 flex-1 mx-4 ${lineClass} transition-all duration-300`} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Main Details and Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Details Cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Claim info */}
          <Card className="rounded-[1.5rem] border border-border/50 bg-card/50 shadow-sm backdrop-blur-md">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Claim Details</CardTitle>
                <Badge className={statusColors[claim.status]} variant="outline">
                  {claim.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 p-6 sm:grid-cols-2 text-sm">
              <div>
                <Label className="text-muted-foreground">Claim Number</Label>
                <p className="font-bold text-base mt-0.5">{claim.claimNumber}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Claim Type</Label>
                <p className="font-semibold text-base mt-0.5">{claim.claimType}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Requested Claim Amount</Label>
                <p className="font-bold text-base mt-0.5">₹{claim.claimAmount.toLocaleString()}</p>
              </div>
              {claim.approvedAmount !== undefined && claim.status !== "REJECTED" && (
                <div>
                  <Label className="text-muted-foreground">Approved Amount</Label>
                  <p className="font-bold text-emerald-600 text-base mt-0.5">
                    ₹{claim.approvedAmount.toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Date Filed</Label>
                <p className="font-medium mt-0.5">{new Date(claim.filedDate).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Filed By</Label>
                <p className="font-medium mt-0.5">
                  {claim.filedBy?.name || "—"} ({claim.filedBy?.role || "Staff"})
                </p>
              </div>
              {claim.description && (
                <div className="sm:col-span-2">
                  <Label className="text-muted-foreground">Claim Description</Label>
                  <p className="mt-1 whitespace-pre-line rounded-xl bg-muted/40 p-3 text-muted-foreground border border-border/20">
                    {claim.description}
                  </p>
                </div>
              )}
              {claim.rejectionReason && (
                <div className="sm:col-span-2">
                  <Label className="text-rose-500 font-semibold">Rejection Reason</Label>
                  <p className="mt-1 whitespace-pre-line rounded-xl bg-rose-500/10 text-rose-700 border border-rose-500/25 p-3 font-medium">
                    {claim.rejectionReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Policy info */}
          {claim.policy && (
            <Card className="rounded-[1.5rem] border border-border/50 bg-card/50 shadow-sm backdrop-blur-md">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-lg font-bold">Policy Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 p-6 sm:grid-cols-3 text-sm">
                <div>
                  <Label className="text-muted-foreground">Policy Number</Label>
                  <p className="font-semibold mt-0.5">
                    <a href={`/dashboard/policies/${claim.policy._id}`} className="text-primary hover:underline">
                      {claim.policy.policyNumber}
                    </a>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Plan Name</Label>
                  <p className="font-medium mt-0.5">{claim.policy.planName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Policy Status</Label>
                  <p className="mt-0.5">
                    <Badge variant="outline">{claim.policy.status}</Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Premium Amount</Label>
                  <p className="font-semibold mt-0.5">₹{claim.policy.premiumAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sum Assured</Label>
                  <p className="font-semibold mt-0.5">₹{claim.policy.sumAssured.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Maturity Date</Label>
                  <p className="font-medium mt-0.5">{new Date(claim.policy.maturityDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sales Agent</Label>
                  <p className="font-medium mt-0.5">{claim.policy.agent?.name || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Assigned Manager</Label>
                  <p className="font-medium mt-0.5">{claim.policy.manager?.name || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Branch</Label>
                  <p className="font-medium mt-0.5">{claim.policy.branch?.name || "—"}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Actions and Customer info */}
        <div className="space-y-6">
          {/* Customer info */}
          {claim.customer && (
            <Card className="rounded-[1.5rem] border border-border/50 bg-card/50 shadow-sm backdrop-blur-md">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="size-5 text-muted-foreground" /> Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-sm">
                <div>
                  <Label className="text-muted-foreground">Customer Name</Label>
                  <p className="font-semibold mt-0.5">{claim.customer.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Mobile Phone</Label>
                  <p className="font-medium mt-0.5">{claim.customer.mobile}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email Address</Label>
                  <p className="font-medium mt-0.5">{claim.customer.email || "No email"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Panel (Gated by Manager+) */}
          <Card className="rounded-[1.5rem] border border-border/50 bg-card/60 shadow-lg backdrop-blur-md">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="size-5 text-muted-foreground" /> Management Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {isManagerOrAbove ? (
                <div className="space-y-4">
                  {/* Status transitions */}
                  {claim.status === "PENDING" && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Change status to <b>UNDER REVIEW</b> to start investigating this claim.
                      </p>
                      <Button
                        onClick={() => handleTransition("UNDER_REVIEW")}
                        disabled={submitting}
                        className="w-full rounded-full"
                      >
                        Start Review
                      </Button>
                    </div>
                  )}

                  {claim.status === "UNDER_REVIEW" && (
                    <div className="space-y-4 divide-y divide-border/40">
                      {/* Approve action */}
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1.5">
                          <Label htmlFor="appAmount">Approved Amount (₹)</Label>
                          <Input
                            id="appAmount"
                            type="number"
                            value={approvedAmountInput}
                            onChange={(e) => setApprovedAmountInput(e.target.value)}
                            className="rounded-xl border-border/80"
                          />
                        </div>
                        <Button
                          onClick={() => handleTransition("APPROVED")}
                          disabled={submitting}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold"
                        >
                          Approve Claim
                        </Button>
                      </div>

                      {/* Reject action */}
                      <div className="space-y-3 pt-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="rejReason" className="text-rose-500">Rejection Reason</Label>
                          <Textarea
                            id="rejReason"
                            placeholder="Enter rejection reason..."
                            value={rejectionReasonInput}
                            onChange={(e) => setRejectionReasonInput(e.target.value)}
                            className="rounded-xl border-border/80"
                          />
                        </div>
                        <Button
                          onClick={() => handleTransition("REJECTED")}
                          disabled={submitting}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-full font-semibold"
                        >
                          Reject Claim
                        </Button>
                      </div>
                    </div>
                  )}

                  {claim.status === "APPROVED" && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Ready to finalize. Settling will lock this claim and set the Policy status to <b>CLAIM_SETTLED</b>.
                      </p>
                      <Button
                        onClick={() => handleTransition("SETTLED")}
                        disabled={submitting}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold"
                      >
                        Settle Claim
                      </Button>
                    </div>
                  )}

                  {claim.status === "REJECTED" && (
                    <p className="text-sm text-rose-500 font-medium text-center py-2">
                      This claim has been rejected and closed.
                    </p>
                  )}

                  {claim.status === "SETTLED" && (
                    <p className="text-sm text-emerald-600 font-medium text-center py-2">
                      This claim is settled. The policy is closed.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Only branch managers and above are authorized to review or approve claims.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
