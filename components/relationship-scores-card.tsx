"use client"

import { useState } from "react"
import { Panel, Shape, Tag, type Tone } from "@/components/panel"
import { PERSON, firstName, formatHour } from "@/lib/palette"
import type { RelationshipScores } from "@/lib/types"

interface ScoreProps {
  data: RelationshipScores
  participants: string[]
  tone?: Tone
  className?: string
  delay?: number
}

// The score is the artwork: one huge numeral with a flat progress bar under it.
export function VibePanel({ data, tone = "yellow", className, delay }: ScoreProps) {
  const style = data.communicationStyle
  const facts = [
    { label: "Love language", value: style.loveLanguage },
    { label: "Message style", value: style.avgMessageLength },
    { label: "Emoji usage", value: style.emojiUsage },
    ...(style.callVsText > 0 ? [{ label: "Calls vs text", value: `${style.callVsText}%` }] : []),
  ]

  return (
    <Panel title="Vibe check" aside={<Tag>{data.vibeRating}</Tag>} tone={tone} className={className} delay={delay}>
      <Shape kind="burst" className="-bottom-12 -right-12 size-44 opacity-15" />
      <p className="display text-[7rem] tabular-nums sm:text-[9rem]" aria-label={`Score ${data.vibeCheckScore} out of 100`}>
        {data.vibeCheckScore}
        <span className="ml-2 text-2xl font-semibold tracking-normal">/ 100</span>
      </p>
      <div className="mt-3 h-3 bg-track">
        <div
          className="h-full bg-mark"
          style={{
            width: `${data.vibeCheckScore}%`,
            transformOrigin: "left",
            animation: "grow-x 1.1s cubic-bezier(0.2,0.7,0.2,1) both",
          }}
        />
      </div>
      <dl className="relative mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="font-semibold capitalize">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <p className="relative mt-4 text-xs text-muted-foreground">
        A playful score from positivity, balance and consistency. Not a scientific measure.
      </p>
    </Panel>
  )
}

export function EnergyPanel({ data, participants, tone = "ink", className, delay }: ScoreProps) {
  const match = data.energyMatch
  const peaks = [match.peakHourA, match.peakHourB]

  return (
    <Panel title="Energy match" aside={<Tag>{match.matchType}</Tag>} tone={tone} className={className} delay={delay}>
      <p className="display text-7xl tabular-nums sm:text-8xl">{match.score}%</p>
      <p className="mt-2 text-sm text-muted-foreground">overlap in the hours you are each most active</p>

      {/* 24-hour track with each person's peak hour marked: first person above, second below */}
      <div className="relative mx-[8%] mt-14 h-1 bg-track">
        {peaks.map((hour, i) => (
          <div
            key={i}
            className={`absolute flex -translate-x-1/2 items-center ${i === 0 ? "-top-8 flex-col" : "-top-1.5 flex-col-reverse"}`}
            style={{ left: `${(hour / 23) * 100}%` }}
          >
            <span className="my-1 whitespace-nowrap text-xs font-semibold" style={{ color: PERSON[i] }}>
              {firstName(participants[i])} &middot; {formatHour(hour)}
            </span>
            <span className="size-4 rounded-full" style={{ background: PERSON[i] }} />
          </div>
        ))}
      </div>
      <div className="mx-[8%] mt-10 flex justify-between text-[11px] text-muted-foreground">
        {[0, 6, 12, 18, 23].map((hour) => (
          <span key={hour}>{formatHour(hour)}</span>
        ))}
      </div>
    </Panel>
  )
}

const WEEKS = 26
const DAY = 24 * 60 * 60 * 1000

export function HeatmapPanel({ data, tone = "ink", className, delay }: ScoreProps) {
  const [hover, setHover] = useState<{ w: number; d: number } | null>(null)
  const keys = Object.keys(data.dailyActivityMap).sort()
  if (keys.length === 0) return null
  const max = Math.max(...Object.values(data.dailyActivityMap), 1)

  // Build whole weeks (Sunday first) ending on the week of the last message.
  const last = new Date(`${keys[keys.length - 1]}T00:00:00Z`)
  const end = last.getTime() + (6 - last.getUTCDay()) * DAY
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const time = end - ((WEEKS - 1 - w) * 7 + (6 - d)) * DAY
      const key = new Date(time).toISOString().split("T")[0]
      return { key, count: data.dailyActivityMap[key] || 0, future: time > last.getTime() }
    }),
  )

  const active = hover && !weeks[hover.w][hover.d].future ? weeks[hover.w][hover.d] : null

  return (
    <Panel
      title="Consistency"
      aside={data.consistencyStreak > 1 ? <Tag>{data.consistencyStreak} day streak</Tag> : undefined}
      tone={tone}
      className={className}
      delay={delay}
    >
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:items-end">
        <div>
          <p className="display text-7xl tabular-nums sm:text-8xl">{data.consistencyScore}%</p>
          <p className="mt-2 text-sm text-muted-foreground">consistency score across the whole chat</p>
        </div>
        <div>
          <div
            className="relative flex gap-[3px] sm:gap-1"
            role="img"
            aria-label="Daily message activity for the last 26 weeks"
            onMouseLeave={() => setHover(null)}
          >
            {weeks.map((week, w) => (
              <div key={w} className="flex flex-1 flex-col gap-[3px] sm:gap-1">
                {week.map((day, d) => (
                  <div
                    key={day.key}
                    onMouseEnter={() => setHover({ w, d })}
                    onClick={() => setHover({ w, d })}
                    className="aspect-square w-full"
                    style={{
                      ...(day.future
                        ? { opacity: 0 }
                        : day.count === 0
                          ? { background: "var(--track)" }
                          : { background: "var(--yellow)", opacity: 0.3 + (day.count / max) * 0.7 }),
                      ...(active === day ? { opacity: 1, outline: "2px solid var(--cream)", outlineOffset: 1 } : {}),
                    }}
                  />
                ))}
              </div>
            ))}

            {/* Readout for the hovered day. It sits below the top rows and above the rest, and is pinned
                to the nearer edge at either end so it never leaves the grid. */}
            {active && hover && (
              <div
                className="pointer-events-none absolute z-10 whitespace-nowrap rounded-xl bg-cream px-3.5 py-2.5 text-ink"
                style={{
                  ...(hover.d < 3
                    ? { top: `calc(${((hover.d + 1) / 7) * 100}% + 6px)` }
                    : { bottom: `calc(${((7 - hover.d) / 7) * 100}% + 6px)` }),
                  ...(hover.w < 4
                    ? { left: `${(hover.w / WEEKS) * 100}%` }
                    : hover.w > WEEKS - 5
                      ? { right: `${((WEEKS - 1 - hover.w) / WEEKS) * 100}%` }
                      : { left: `${((hover.w + 0.5) / WEEKS) * 100}%`, transform: "translateX(-50%)" }),
                }}
              >
                <p className="eyebrow opacity-60">
                  {new Date(`${active.key}T00:00:00Z`).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
                <p className="display mt-1 text-3xl tabular-nums">
                  {active.count.toLocaleString()}
                  <span className="ml-1.5 text-sm font-semibold tracking-normal">
                    {active.count === 1 ? "message" : "messages"}
                  </span>
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Last 26 weeks, one square per day</span>
            <span className="flex items-center gap-1">
              Less
              {[0.3, 0.55, 0.8, 1].map((o) => (
                <span key={o} className="size-3 bg-yellow" style={{ opacity: o }} />
              ))}
              More
            </span>
          </div>
        </div>
      </div>
    </Panel>
  )
}
