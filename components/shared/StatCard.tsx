import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function StatCard({
  label,
  value,
  delta,
  description,
}: {
  label: string
  value: string
  delta?: string
  description?: string
}) {
  return (
    <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm shadow-black/5">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="mt-4 flex items-end justify-between gap-4">
        <div className="text-4xl font-semibold text-foreground">{value}</div>
        {delta ? (
          <div className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent-foreground">
            {delta}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
