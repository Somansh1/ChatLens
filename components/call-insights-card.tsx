import { Panel, Tag, type Tone } from "@/components/panel"
import { PERSON, firstName, formatHour } from "@/lib/palette"
import type { CallInsights } from "@/lib/types"

interface CallInsightsCardProps {
  data: CallInsights
  participants: string[]
  tone?: Tone
  className?: string
  delay?: number
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function CallInsightsCard({ data, participants, tone = "cream", className, delay }: CallInsightsCardProps) {
  const callChampion = Object.entries(data.callsBySender).sort((a, b) => b[1] - a[1])[0]
  const ghostChampion = Object.entries(data.rejectedCallsBySender || {}).sort((a, b) => b[1] - a[1])[0]
  const peakHour = data.callHourlyActivity.reduce((a, b) => (a.count > b.count ? a : b))
  const maxHourly = Math.max(peakHour.count, 1)
  const isNightOwl = peakHour.hour >= 21 || peakHour.hour <= 5
  const typeTotal = Math.max(data.audioCalls + data.videoCalls, 1)
  const maxCalls = Math.max(...Object.values(data.callsBySender), 1)

  const facts = [
    {
      label: "Total talk time",
      value: formatDuration(data.totalDuration),
      note: `${formatDuration(data.averageCallDuration)} per call`,
    },
    { label: "Marathon call", value: formatDuration(data.longestCall.duration), note: data.longestCall.date },
    {
      label: "Call champion",
      value: firstName(callChampion?.[0]) || "N/A",
      note: `${callChampion?.[1] || 0} calls started`,
    },
    {
      label: "Missed",
      value: `${data.missedCalls}`,
      note:
        ghostChampion && ghostChampion[1] > 0
          ? `${firstName(ghostChampion[0])} didn't pick up ${ghostChampion[1]}×`
          : "Everyone answers",
    },
  ]

  return (
    <Panel
      title="Call highlights"
      aside={
        <Tag>
          {data.answeredCalls} answered &middot; {data.missedCalls} missed
        </Tag>
      }
      tone={tone}
      className={className}
      delay={delay}
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="display mt-1 truncate text-4xl sm:text-5xl">{fact.value}</dd>
            <dd className="mt-1 truncate text-sm text-muted-foreground">{fact.note}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-7 grid gap-8 border-t border-line pt-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold">Who dials first?</p>
          <div className="space-y-3">
            {Object.entries(data.callsBySender).map(([name, count]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{firstName(name)}</span>
                  <span className="text-muted-foreground tabular-nums">{count} calls</span>
                </div>
                <div className="h-3 bg-track">
                  <div
                    className="h-full"
                    style={{
                      width: `${(count / maxCalls) * 100}%`,
                      background: PERSON[Math.max(0, participants.indexOf(name)) % PERSON.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mb-2 mt-6 text-sm font-semibold">Camera on vs off</p>
          <div className="flex h-3 gap-0.5">
            <div className="bg-mark" style={{ width: `${(data.audioCalls / typeTotal) * 100}%` }} />
            <div className="flex-1 bg-mark opacity-40" />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Voice ({data.audioCalls})</span>
            <span>Video ({data.videoCalls})</span>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">When do you call?</p>
            <Tag>{isNightOwl ? "Night owl callers" : "Daytime callers"}</Tag>
          </div>
          <div className="flex h-28 items-end gap-[3px]">
            {data.callHourlyActivity.map((d) => (
              <div
                key={d.hour}
                title={`${formatHour(d.hour)}: ${d.count} calls`}
                className="flex-1 bg-mark"
                style={{
                  height: `${Math.max(4, (d.count / maxHourly) * 100)}%`,
                  opacity: d.hour === peakHour.hour ? 1 : 0.35,
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            {[0, 6, 12, 18, 23].map((hour) => (
              <span key={hour}>{formatHour(hour)}</span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Peak calling time: {formatHour(peakHour.hour)} ({peakHour.count} calls)
          </p>
        </div>
      </div>
    </Panel>
  )
}
