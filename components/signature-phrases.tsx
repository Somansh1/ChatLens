"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SignaturePhrase } from "@/lib/types"

interface SignaturePhrasesCardProps {
  phrases: SignaturePhrase[]
}

export function SignaturePhrasesCard({ phrases }: SignaturePhrasesCardProps) {
  const maxCount = Math.max(...phrases.map((p) => p.count))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signature Phrases</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {phrases.slice(0, 6).map((phrase, index) => (
            <div key={phrase.phrase} className="flex items-center gap-3">
              <div
                className={cn(
                  "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  index === 0
                    ? "bg-primary/20 text-primary"
                    : index === 1
                      ? "bg-chart-2/20 text-chart-2"
                      : "bg-secondary text-muted-foreground",
                )}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium truncate">"{phrase.phrase}"</p>
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">{phrase.count}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        index === 0 ? "bg-primary" : index === 1 ? "bg-chart-2" : "bg-muted-foreground/50",
                      )}
                      style={{ width: `${(phrase.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{phrase.sender}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          These phrases define your unique conversation style
        </p>
      </CardContent>
    </Card>
  )
}
