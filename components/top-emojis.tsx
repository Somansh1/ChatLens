import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopEmojisCardProps {
  emojis: { emoji: string; count: number }[]
}

export function TopEmojisCard({ emojis }: TopEmojisCardProps) {
  if (emojis.length === 0) return null

  const maxCount = emojis[0]?.count || 1

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Used Emojis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 justify-center">
          {emojis.map((item, index) => (
            <div
              key={item.emoji}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 min-w-[80px]"
            >
              <span className="text-4xl">{item.emoji}</span>
              <div className="text-center">
                <p className="font-semibold">{item.count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{index === 0 ? "Top emoji!" : `#${index + 1}`}</p>
              </div>
              <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
