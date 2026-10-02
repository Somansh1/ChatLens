import { Panel, type Tone } from "@/components/panel"

interface TopEmojisCardProps {
  emojis: { emoji: string; count: number }[]
  tone?: Tone
  className?: string
  delay?: number
}

export function TopEmojisCard({ emojis, tone = "yellow", className, delay }: TopEmojisCardProps) {
  if (emojis.length === 0) return null
  const maxCount = emojis[0].count || 1

  return (
    <Panel title="Most used emojis" tone={tone} className={className} delay={delay}>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4 lg:justify-between">
        {emojis.map((item) => {
          // U+FE0F below asks for the colour glyph; the parser strips it, which turns hearts into outlines.
          // Scale each emoji by how often it is used, so the top one is visibly the biggest.
          const size = 2.5 + (item.count / maxCount) * 5
          return (
            <div key={item.emoji} className="flex flex-col items-center gap-1">
              <span style={{ fontSize: `${size}rem`, lineHeight: 1.1 }}>
                {item.emoji + String.fromCharCode(0xfe0f)}
              </span>
              <span className="text-sm font-semibold tabular-nums">{item.count.toLocaleString()}</span>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
