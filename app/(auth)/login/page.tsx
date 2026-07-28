"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginForm) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      })

      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || "Login failed")
        return
      }

      toast.success("Logged in successfully")
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast.error("An error occurred. Please try again.")
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md rounded-[2rem] border border-border bg-card shadow-lg shadow-black/10">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground">
              L
            </div>
            <div>
              <p className="font-semibold text-foreground">LIC Enterprise</p>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </div>
          <div>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your email and password to access the system.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@lic.local"
                {...register("email")}
                disabled={isSubmitting}
                className="rounded-lg"
              />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                {...register("password")}
                disabled={isSubmitting}
                className="rounded-lg"
              />
              {errors.password ? (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              ) : null}
            </div>
            <Button
              type="submit"
              className="w-full rounded-lg"
              disabled={isSubmitting}
            >
              <LogIn className="mr-2 size-4" />
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 rounded-lg bg-accent/10 p-4 text-sm text-accent-foreground">
            <p className="font-semibold">Demo credentials (seed required):</p>
            <p className="mt-2 truncate text-xs">Email: <code className="font-mono">admin@lic.local</code></p>
            <p className="truncate text-xs">Password: <code className="font-mono">seedPassword123</code> (after seed-admin)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
