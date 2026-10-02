import { Panel, type Tone } from "@/components/panel"
import { PERSON, firstName } from "@/lib/palette"
import type { SignaturePhrase } from "@/lib/types"

interface SignaturePhrasesCardProps {
  phrases: SignaturePhrase[]
  participants: string[]
  tone?: Tone
  className?: string
  delay?: number
}

// Phrases set as type: the most used is the largest, each in its speaker's colour.
export function SignaturePhrasesCard({ phrases, participants, tone = "cream", className, delay }: SignaturePhrasesCardProps) {
  if (phrases.length === 0) return null
  const maxCount = Math.max(...phrases.map((p) => p.count), 1)

  return (
    <Panel title="Signature phrases" tone={tone} className={className} delay={delay}>
      <ol>
        {phrases.slice(0, 6).map((phrase) => {
          const color = PERSON[Math.max(0, participants.indexOf(phrase.sender)) % PERSON.length]
          const size = 1.25 + (phrase.count / maxCount) * 1.5
          return (
            <li
              key={`${phrase.sender}-${phrase.phrase}`}
              className="flex items-baseline justify-between gap-4 border-t border-line py-2.5 first:border-t-0 first:pt-0"
            >
              <span className="display min-w-0 truncate" style={{ color, fontSize: `${size}rem`, lineHeight: 1.05 }}>
                {phrase.phrase}
              </span>
              <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                {firstName(phrase.sender)} &middot; {phrase.count}&times;
              </span>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
