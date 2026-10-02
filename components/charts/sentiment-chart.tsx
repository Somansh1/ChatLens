import { Panel, type Tone } from "@/components/panel"
import { PERSON, SENTIMENT, firstName } from "@/lib/palette"
import type { SentimentData } from "@/lib/types"

interface SentimentChartProps {
  data: Record<string, SentimentData>
  participants: string[]
  tone?: Tone
  className?: string
  delay?: number
}

const KEYS = ["positive", "neutral", "negative"] as const

export function SentimentChart({ data, participants, tone = "ink", className, delay }: SentimentChartProps) {
  const people = participants.filter((p) => data[p])
  if (people.length === 0) return null
  const happiest = people.reduce((a, b) => (data[b].positive > data[a].positive ? b : a))

  return (
    <Panel title="Conversation vibes" tone={tone} className={className} delay={delay}>
      <div className="space-y-6">
        {people.map((person, i) => (
          <div key={person}>
            <div className="mb-2 flex items-end justify-between">
              <span className="display text-3xl" style={{ color: PERSON[i] }}>
                {firstName(person)}
              </span>
              <span className="text-sm text-muted-foreground">
                <span className="text-base font-semibold text-current">{data[person].positive}%</span> positive
              </span>
            </div>
            <div
              className="flex h-6 gap-0.5"
              role="img"
              aria-label={`${person}: ${data[person].positive}% positive, ${data[person].neutral}% neutral, ${data[person].negative}% negative`}
            >
              {KEYS.map((key) => (
                <div
                  key={key}
                  title={`${key}: ${data[person][key]}%`}
                  style={{
                    width: `${data[person][key]}%`,
                    background: SENTIMENT[key],
                    transformOrigin: "left",
                    animation: "grow-x 0.9s cubic-bezier(0.2,0.7,0.2,1) both",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {KEYS.map((key) => (
          <span key={key} className="flex items-center gap-1.5 capitalize">
            <span className="size-2.5" style={{ background: SENTIMENT[key] }} />
            {key}
          </span>
        ))}
      </div>

      {people.length > 1 && (
        <p className="mt-6 border-t border-line pt-4 text-sm">
          <span className="font-semibold">{firstName(happiest)}</span> is the more positive texter.
          <span className="text-muted-foreground"> Scored from a word list, so sarcasm slips through.</span>
        </p>
      )}
    </Panel>
  )
}
