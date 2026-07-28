"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Customer = { name: string; mobile: string; email?: string; address: { line1: string; line2?: string; city: string; state: string; pincode: string }; agent?: { name: string }; branch?: { name: string; code: string }; nominee?: { name?: string; relation?: string } }
export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>(); const [customer, setCustomer] = useState<Customer | null>(null); const [error, setError] = useState("")
  useEffect(() => { fetch(`/api/customers/${id}`).then((r) => r.json()).then((data) => data.success ? setCustomer(data.data) : setError(data.error || "Customer not found")) }, [id])
  if (error) return <p className="text-destructive">{error}</p>; if (!customer) return <p className="text-muted-foreground">Loading customer…</p>
  return <div className="space-y-6"><Button variant="outline" onClick={() => history.back()}>Back to customers</Button><Card><CardHeader><CardTitle>{customer.name}</CardTitle><p className="text-sm text-muted-foreground">{customer.mobile} · {customer.email || "No email"}</p></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-3"><div><p className="text-muted-foreground">Address</p><p>{customer.address.line1}, {customer.address.city}, {customer.address.state} {customer.address.pincode}</p></div><div><p className="text-muted-foreground">Agent</p><p>{customer.agent?.name || "—"}</p></div><div><p className="text-muted-foreground">Nominee</p><p>{customer.nominee?.name || "—"}{customer.nominee?.relation ? ` · ${customer.nominee.relation}` : ""}</p></div></CardContent></Card><Tabs defaultValue="policies"><TabsList><TabsTrigger value="policies">Policies</TabsTrigger><TabsTrigger value="premium">Premium history</TabsTrigger><TabsTrigger value="claims">Claims</TabsTrigger></TabsList>{["policies", "premium", "claims"].map((tab) => <TabsContent value={tab} key={tab} className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{tab === "policies" ? "Policies will appear here when Module 6 is connected." : `${tab === "premium" ? "Premium history" : "Claims"} will appear here when its module is connected.`}</TabsContent>)}</Tabs></div>
}
