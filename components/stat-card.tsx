"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { Tone } from "@/components/panel"

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  tone?: Tone
  className?: string
  delay?: number
}

// Counts up to the leading number in `value` and keeps any suffix ("12 days", "3.4 min").
function useCountUp(value: string | number) {
  const text = String(value)
  const match = text.match(/^[\d,]*\.?\d+/)
  const target = match ? Number.parseFloat(match[0].replace(/,/g, "")) : null
  const [current, setCurrent] = useState(target === null ? null : 0)

  useEffect(() => {
    if (target === null) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(target)
      return
    }
    const start = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - start) / 1200)
      setCurrent(target * (1 - Math.pow(1 - t, 3)))
      if (t < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [target])

  if (target === null || current === null || !match) return { number: text, unit: "" }
  const decimals = match[0].includes(".") ? 1 : 0
  return {
    number: current.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    unit: text.slice(match[0].length).trim(),
  }
}

// One oversized number on a flat colour block.
export function StatCard({ title, value, subtitle, tone = "cream", className, delay = 0 }: StatCardProps) {
  const { number, unit } = useCountUp(value)

  return (
    <div
      className={cn(`tone-${tone} block-surface reveal flex min-h-44 flex-col justify-between p-5 sm:p-6`, className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="eyebrow">{title}</p>
      <div>
        <p className="display text-5xl tabular-nums sm:text-6xl">
          {number}
          {unit && <span className="ml-1.5 text-2xl sm:text-3xl">{unit}</span>}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}
