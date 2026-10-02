"use client"

import type React from "react"
import { useState } from "react"
import { Panel, Tag, type Tone } from "@/components/panel"
import { formatHour } from "@/lib/palette"
import type { HourlyActivity } from "@/lib/types"

interface ActivityClockProps {
  data: HourlyActivity[]
  tone?: Tone
  className?: string
  delay?: number
}

const SIZE = 380
const CENTER = SIZE / 2
const INNER = 84
const MAX_LEN = 66

// 24-hour dial: one spoke per hour, longer and more opaque the busier the hour. The peak is highlighted.
export function ActivityClock({ data, tone = "ink", className, delay }: ActivityClockProps) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const peak = data.reduce((a, b) => (b.count > a.count ? b : a))
  // The centre of the dial shows the hovered hour, or the peak hour when nothing is hovered.
  const [hovered, setHovered] = useState<HourlyActivity | null>(null)
  const shown = hovered ?? peak

  const nightMessages = data.filter((d) => d.hour >= 22 || d.hour <= 4).reduce((sum, d) => sum + d.count, 0)
  const morningMessages = data.filter((d) => d.hour >= 5 && d.hour <= 10).reduce((sum, d) => sum + d.count, 0)
  const isNightOwl = nightMessages > morningMessages

  const point = (hour: number, radius: number) => {
    const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2
    return [CENTER + Math.cos(angle) * radius, CENTER + Math.sin(angle) * radius]
  }

  return (
    <Panel
      title="When you talk"
      aside={<Tag>{isNightOwl ? "Night owls" : "Early birds"}</Tag>}
      tone={tone}
      className={className}
      delay={delay}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto w-full max-w-[380px]"
        role="img"
        aria-label={`Messages by hour of day. Busiest hour is ${formatHour(peak.hour)}.`}
        onMouseLeave={() => setHovered(null)}
      >
        {data.map((d) => {
          const isPeak = d.hour === peak.hour
          const length = 5 + (d.count / max) * MAX_LEN
          const [x1, y1] = point(d.hour, INNER)
          const [x2, y2] = point(d.hour, INNER + length)
          return (
            <line
              key={d.hour}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isPeak ? "var(--yellow)" : "currentColor"}
              strokeWidth={11}
              opacity={isPeak || hovered === d ? 1 : 0.22 + (d.count / max) * 0.6}
              strokeDasharray={length}
              style={
                {
                  "--len": length,
                  animation: `grow-out 0.8s ${d.hour * 20}ms cubic-bezier(0.2,0.7,0.2,1) both`,
                } as React.CSSProperties
              }
            />
          )
        })}
        {/* Invisible full-length spokes, so short bars are as easy to hover or tap as long ones */}
        {data.map((d) => {
          const [x1, y1] = point(d.hour, INNER)
          const [x2, y2] = point(d.hour, INNER + MAX_LEN + 5)
          return (
            <line
              key={d.hour}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="transparent"
              strokeWidth={20}
              onMouseEnter={() => setHovered(d)}
              onClick={() => setHovered(d)}
            />
          )
        })}
        {[0, 6, 12, 18].map((hour) => {
          const [x, y] = point(hour, INNER + MAX_LEN + 24)
          return (
            <text
              key={hour}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="600"
              fill="currentColor"
              opacity="0.6"
            >
              {formatHour(hour)}
            </text>
          )
        })}
        <text
          x={CENTER}
          y={CENTER + 4}
          textAnchor="middle"
          fontSize="34"
          fontWeight="800"
          fill="currentColor"
          style={{ fontFamily: "var(--font-heavy)", letterSpacing: "-0.03em" }}
        >
          {formatHour(shown.hour)}
        </text>
        <text x={CENTER} y={CENTER + 24} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">
          {hovered
            ? `${hovered.count.toLocaleString()} MESSAGES`
            : total > 0
              ? `PEAK · ${Math.round((peak.count / total) * 100)}% OF MESSAGES`
              : ""}
        </text>
      </svg>
    </Panel>
  )
}
