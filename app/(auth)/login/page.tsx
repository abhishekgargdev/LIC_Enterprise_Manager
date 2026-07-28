"use client"

import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
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
    await new Promise((resolve) => setTimeout(resolve, 500))
    toast.success("Login placeholder submitted. Auth workflows will be connected next.")
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md rounded-[2rem] border border-border bg-card px-6 py-8 shadow-sm shadow-black/5">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to the LIC Enterprise Management System.</CardDescription>
        </CardHeader>
        <CardContent className="mt-6 space-y-5">
          <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password ? (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Continue"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            This is a placeholder login for the current foundation build.
            <br />
            <Link href="/dashboard" className="text-accent underline hover:no-underline">
              Preview dashboard
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
