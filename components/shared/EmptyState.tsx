import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <Card className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-card p-10 text-center shadow-sm shadow-black/5">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="mt-6">
        {actionLabel && actionHref ? (
          <Link href={actionHref as any} className="inline-block">
            <Button>{actionLabel}</Button>
          </Link>
        ) : null}
      </CardContent>
    </Card>
  )
}
