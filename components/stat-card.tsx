"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  color?: "primary" | "accent" | "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"
}

export function StatCard({ title, value, subtitle, icon, color = "primary" }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<string | number>(typeof value === "number" ? 0 : value)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const numericValue = typeof value === "string" ? Number.parseFloat(value.replace(/,/g, "")) : value

    if (typeof numericValue === "number" && !isNaN(numericValue)) {
      const duration = 1500
      const steps = 60
      const stepTime = duration / steps
      const increment = numericValue / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= numericValue) {
          setDisplayValue(value)
          clearInterval(timer)
        } else {
          if (typeof value === "string" && value.includes(",")) {
            setDisplayValue(Math.floor(current).toLocaleString())
          } else if (typeof value === "string" && value.includes(".")) {
            setDisplayValue(current.toFixed(1))
          } else {
            setDisplayValue(Math.floor(current).toLocaleString())
          }
        }
      }, stepTime)

      return () => clearInterval(timer)
    } else {
      setDisplayValue(value)
    }
  }, [value, isVisible])

  const colorClasses = {
    primary: "bg-rose-100 text-rose-600",
    accent: "bg-pink-100 text-pink-600",
    "chart-1": "bg-rose-100 text-rose-600",
    "chart-2": "bg-violet-100 text-violet-600",
    "chart-3": "bg-teal-100 text-teal-600",
    "chart-4": "bg-amber-100 text-amber-600",
    "chart-5": "bg-indigo-100 text-indigo-600",
  }

  return (
    <Card ref={cardRef} className="overflow-hidden shadow-sm border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", colorClasses[color])}>{icon}</div>
        </div>
        <p className="text-3xl font-bold tracking-tight text-foreground">{displayValue}</p>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
}
