import type React from "react"
import { cn } from "@/lib/utils"

export type Tone = "ink" | "cream" | "yellow" | "coral" | "teal"

interface PanelProps {
  title?: string
  aside?: React.ReactNode
  tone?: Tone
  className?: string
  delay?: number
  children: React.ReactNode
}

// A flat colour block. The tone sets the fill and the readable text and chart colours on it.
export function Panel({ title, aside, tone = "ink", className, delay = 0, children }: PanelProps) {
  return (
    <section
      className={cn(`tone-${tone} block-surface reveal relative overflow-hidden p-6 sm:p-7`, className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {title && (
        <header className="mb-6 flex items-center justify-between gap-3">
          <h2 className="eyebrow">{title}</h2>
          {aside}
        </header>
      )}
      {children}
    </section>
  )
}

export function Tag({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("eyebrow inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1", className)}>
      {children}
    </span>
  )
}

// 12-point starburst: alternate between an outer and an inner radius around the centre.
const burst =
  "M" +
  Array.from({ length: 24 }, (_, i) => {
    const radius = i % 2 ? 36 : 50
    const angle = (i / 24) * Math.PI * 2
    return `${(50 + radius * Math.cos(angle)).toFixed(1)} ${(50 + radius * Math.sin(angle)).toFixed(1)}`
  }).join("L") +
  "z"

const SHAPES = {
  burst,
  ring: "M50 5a45 45 0 1 0 0 90 45 45 0 0 0 0-90zm0 24a21 21 0 1 1 0 42 21 21 0 0 1 0-42z",
  half: "M0 50a50 50 0 0 1 100 0z",
  bubble: "M10 8h80a8 8 0 0 1 8 8v48a8 8 0 0 1-8 8H42L22 92V72H10a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8z",
}

// Flat decorative shape, positioned by the caller. Purely visual.
export function Shape({
  kind,
  color = "var(--mark)",
  className,
}: {
  kind: keyof typeof SHAPES
  color?: string
  className?: string
}) {
  return (
    <svg viewBox="0 0 100 100" className={cn("pointer-events-none absolute", className)} aria-hidden="true">
      <path d={SHAPES[kind]} fill={color} fillRule="evenodd" />
    </svg>
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 100 100" className="size-7" aria-hidden="true">
        <path d={SHAPES.bubble} fill="var(--yellow)" />
        <path d="M30 50V34M50 56V26M70 50V34" stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" />
      </svg>
      <span className="display text-xl">ChatLens</span>
    </div>
  )
}
