import { Panel, type Tone } from "@/components/panel"
import { PERSON, firstName } from "@/lib/palette"
import type { ChatAnalysis } from "@/lib/types"

interface HeadToHeadProps {
  data: ChatAnalysis
  tone?: Tone
  className?: string
  delay?: number
}

// Mirrored bars comparing the two participants on each metric.
export function HeadToHead({ data, tone = "cream", className, delay }: HeadToHeadProps) {
  const [a, b] = data.messageStats
  if (!a || !b) return null

  const rows = [
    { label: "Messages", values: [a.count, b.count] },
    { label: "Words", values: [a.wordCount, b.wordCount] },
    { label: "Words per message", values: [a.avgWordsPerMessage, b.avgWordsPerMessage] },
    { label: "Emojis", values: [a.emojiCount, b.emojiCount] },
    {
      label: "Conversations started",
      values: [data.conversationStarters[a.sender] || 0, data.conversationStarters[b.sender] || 0],
    },
    {
      label: "Positive messages",
      values: [data.sentimentBySender[a.sender]?.positive || 0, data.sentimentBySender[b.sender]?.positive || 0],
      suffix: "%",
    },
  ]

  return (
    <Panel title="Head to head" tone={tone} className={className} delay={delay}>
      <div className="display mb-5 flex justify-between text-3xl sm:text-4xl">
        <span style={{ color: PERSON[0] }}>{firstName(a.sender)}</span>
        <span style={{ color: PERSON[1] }}>{firstName(b.sender)}</span>
      </div>
      <div className="space-y-4">
        {rows.map((row) => {
          const max = Math.max(...row.values, 1)
          return (
            <div key={row.label}>
              <div className="mb-1.5 flex items-baseline justify-between tabular-nums">
                <span className="font-semibold">
                  {row.values[0].toLocaleString()}
                  {row.suffix}
                </span>
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="font-semibold">
                  {row.values[1].toLocaleString()}
                  {row.suffix}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {row.values.map((value, i) => (
                  <div key={i} className={`flex h-3.5 bg-track ${i === 0 ? "justify-end" : ""}`}>
                    <div
                      className="h-full"
                      style={{
                        width: `${(value / max) * 100}%`,
                        background: PERSON[i],
                        transformOrigin: i === 0 ? "right" : "left",
                        animation: "grow-x 0.9s cubic-bezier(0.2,0.7,0.2,1) both",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
