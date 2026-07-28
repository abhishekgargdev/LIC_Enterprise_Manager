"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Customer = {
  _id: string
  name: string
  mobile: string
  email?: string
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
  agent?: { name: string }
  branch?: { name: string; code: string }
  nominee?: { name?: string; relation?: string; dob?: string }
}

type Policy = {
  _id: string
  policyNumber: string
  planName: string
  status: string
  premiumAmount: number
  sumAssured: number
  maturityDate: string
}

type Premium = {
  _id: string
  policy?: { policyNumber: string }
  dueDate: string
  amount: number
  status: string
  paidDate?: string
}

type Claim = {
  _id: string
  claimNumber: string
  policy?: { policyNumber: string }
  claimType: string
  claimAmount: number
  status: string
  filedDate: string
}

const policyColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PENDING: "secondary",
  LAPSED: "destructive",
  CANCELLED: "destructive",
  EXPIRED: "outline",
  MATURED: "default",
  CLAIM_SETTLED: "default",
}

const claimColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  UNDER_REVIEW: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  SETTLED: "default",
}

const premiumColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PAID: "default",
  DUE: "secondary",
  OVERDUE: "destructive",
  MISSED: "destructive",
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [error, setError] = useState("")

  const [policies, setPolicies] = useState<Policy[]>([])
  const [premiums, setPremiums] = useState<Premium[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [loadingLists, setLoadingLists] = useState(true)

  useEffect(() => {
    // Fetch customer details
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCustomer(data.data)
        } else {
          setError(data.error || "Customer not found")
        }
      })

    // Fetch related lists
    const loadLists = async () => {
      try {
        // Fetch policies
        const policiesRes = await fetch(`/api/policies`)
        const policiesJson = await policiesRes.json()
        let custPolicies: Policy[] = []

        if (policiesJson.success) {
          custPolicies = policiesJson.data.filter(
            (p: any) => p.customer?._id === id || p.customer === id
          )
          setPolicies(custPolicies)
        }

        // Fetch claims
        const claimsRes = await fetch(`/api/claims?customerId=${id}`)
        const claimsJson = await claimsRes.json()
        if (claimsJson.success) {
          setClaims(claimsJson.data)
        }

        // Fetch premiums
        if (custPolicies.length > 0) {
          const premiumsRes = await fetch(`/api/premiums`)
          const premiumsJson = await premiumsRes.json()
          if (premiumsJson.success) {
            const policyIds = custPolicies.map((p) => p._id)
            const custPremiums = premiumsJson.data.filter((pr: any) =>
              policyIds.includes(pr.policy?._id || pr.policy)
            )
            setPremiums(custPremiums)
          }
        }
      } catch (err) {
        console.error("Error loading related lists:", err)
      } finally {
        setLoadingLists(false)
      }
    }

    loadLists()
  }, [id])

  if (error) return <p className="text-destructive p-6 font-semibold">{error}</p>
  if (!customer) return <p className="text-muted-foreground p-6">Loading customer…</p>

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => history.back()} className="rounded-full">
        Back to customers
      </Button>

      {/* Customer Header card */}
      <Card className="rounded-[2rem] border border-border bg-card/60 backdrop-blur-md shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">{customer.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {customer.mobile} · {customer.email || "No email"}
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 text-sm sm:grid-cols-3 border-t border-border/40 pt-6">
          <div>
            <p className="font-semibold text-muted-foreground uppercase tracking-wider text-xs mb-1">Address</p>
            <p className="font-medium text-card-foreground">
              {customer.address.line1}
              {customer.address.line2 ? `, ${customer.address.line2}` : ""}, {customer.address.city},{" "}
              {customer.address.state} {customer.address.pincode}
            </p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground uppercase tracking-wider text-xs mb-1">Sales Agent</p>
            <p className="font-medium text-card-foreground">{customer.agent?.name || "—"}</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground uppercase tracking-wider text-xs mb-1">Nominee</p>
            <p className="font-medium text-card-foreground">
              {customer.nominee?.name || "—"}
              {customer.nominee?.relation ? ` · ${customer.nominee.relation}` : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Related Lists Tabs */}
      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList className="rounded-full p-1 bg-muted/80">
          <TabsTrigger value="policies" className="rounded-full px-5">Policies</TabsTrigger>
          <TabsTrigger value="premium" className="rounded-full px-5">Premium history</TabsTrigger>
          <TabsTrigger value="claims" className="rounded-full px-5">Claims</TabsTrigger>
        </TabsList>

        {/* Policies tab */}
        <TabsContent value="policies">
          <div className="overflow-hidden rounded-[2rem] border bg-card text-sm shadow-sm">
            {loadingLists ? (
              <div className="p-8 text-center text-muted-foreground">Loading policies...</div>
            ) : (
              <table className="w-full text-left">
                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Policy #</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3 text-right">Premium</th>
                    <th className="px-5 py-3 text-right">Sum Assured</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Maturity Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {policies.length > 0 ? (
                    policies.map((p) => (
                      <tr key={p._id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-primary">
                          <a href={`/dashboard/policies/${p._id}`} className="hover:underline">
                            {p.policyNumber}
                          </a>
                        </td>
                        <td className="px-5 py-3.5 font-medium">{p.planName}</td>
                        <td className="px-5 py-3.5 text-right font-semibold">
                          ₹{p.premiumAmount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold">
                          ₹{p.sumAssured.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={policyColors[p.status] || "outline"}>{p.status}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {new Date(p.maturityDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                        No policies associated with this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Premium tab */}
        <TabsContent value="premium">
          <div className="overflow-hidden rounded-[2rem] border bg-card text-sm shadow-sm">
            {loadingLists ? (
              <div className="p-8 text-center text-muted-foreground">Loading premium records...</div>
            ) : (
              <table className="w-full text-left">
                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Policy #</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {premiums.length > 0 ? (
                    premiums.map((pr) => (
                      <tr key={pr._id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-3.5 font-semibold">
                          {pr.policy?.policyNumber || "—"}
                        </td>
                        <td className="px-5 py-3.5 font-medium">
                          {new Date(pr.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold">
                          ₹{pr.amount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={premiumColors[pr.status] || "outline"}>{pr.status}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {pr.paidDate ? new Date(pr.paidDate).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                        No premium payment schedule found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Claims tab */}
        <TabsContent value="claims">
          <div className="overflow-hidden rounded-[2rem] border bg-card text-sm shadow-sm">
            {loadingLists ? (
              <div className="p-8 text-center text-muted-foreground">Loading claims...</div>
            ) : (
              <table className="w-full text-left">
                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Claim #</th>
                    <th className="px-5 py-3">Policy #</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 text-right">Claim Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Filed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {claims.length > 0 ? (
                    claims.map((c) => (
                      <tr key={c._id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-primary">
                          <a href={`/dashboard/claims/${c._id}`} className="hover:underline">
                            {c.claimNumber}
                          </a>
                        </td>
                        <td className="px-5 py-3.5 font-semibold">
                          {c.policy?.policyNumber || "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline">{c.claimType}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold">
                          ₹{c.claimAmount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={claimColors[c.status] || "outline"}>{c.status}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {new Date(c.filedDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                        No claims filed for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
