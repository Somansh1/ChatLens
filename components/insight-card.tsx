import { Panel, type Tone } from "@/components/panel"

export interface Award {
  title: string
  winner: string
  description: string
  color: string
}

interface AwardsProps {
  awards: Award[]
  tone?: Tone
  className?: string
  delay?: number
}

// The superlatives as one ruled list, with the winner's name set large in their colour.
export function Awards({ awards, tone = "ink", className, delay }: AwardsProps) {
  return (
    <Panel title="The awards" tone={tone} className={className} delay={delay}>
      <ul>
        {awards.map((award) => (
          <li
            key={award.title}
            className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-t border-line py-4 first:border-t-0 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">{award.title}</p>
              <p className="text-sm text-muted-foreground">{award.description}</p>
            </div>
            <p className="display text-4xl sm:text-5xl" style={{ color: award.color }}>
              {award.winner}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
