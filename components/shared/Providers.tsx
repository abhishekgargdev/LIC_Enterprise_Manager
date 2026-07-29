"use client"

import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered successfully with scope:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err))
    }

    // 2. Listen for custom install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      const isDismissed = localStorage.getItem("pwaInstalledOrDismissed") === "true"

      if (!isStandalone && !isDismissed) {
        setInstallPrompt(e)
        setShowBanner(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem("pwaInstalledOrDismissed", "true")
    setShowBanner(false)
  }

  const handleInstallClick = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === "accepted") {
      localStorage.setItem("pwaInstalledOrDismissed", "true")
      setInstallPrompt(null)
      setShowBanner(false)
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Toaster richColors position="top-right" />
        {children}

        {/* Custom PWA Install Banner */}
        {showBanner && (
          <div className="fixed bottom-24 right-4 left-4 z-50 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl md:bottom-6 md:right-6 md:left-auto md:w-96 animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">Install LIC Enterprise App</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Access policies, agents, and customer lists directly from your home screen.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted cursor-pointer"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" className="rounded-full text-xs" onClick={handleDismiss}>
                Dismiss
              </Button>
              <Button size="sm" className="rounded-full text-xs font-semibold" onClick={handleInstallClick}>
                Install App
              </Button>
            </div>
          </div>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
