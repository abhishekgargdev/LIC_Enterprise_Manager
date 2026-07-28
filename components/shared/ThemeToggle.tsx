"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, SunMedium, Laptop } from "lucide-react"

const iconMap = {
  light: SunMedium,
  dark: Moon,
  system: Laptop,
} as const

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <Button variant="outline" size="icon" aria-label="Toggle theme">
        <Laptop className="size-4" />
      </Button>
    )
  }

  const currentTheme = theme === "system" ? systemTheme ?? "system" : theme
  const Icon = iconMap[currentTheme as keyof typeof iconMap] ?? Laptop

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => {
        if (currentTheme === "dark") {
          setTheme("light")
        } else if (currentTheme === "light") {
          setTheme("system")
        } else {
          setTheme("dark")
        }
      }}
    >
      <Icon className="size-4" />
    </Button>
  )
}
