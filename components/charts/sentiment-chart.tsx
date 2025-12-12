"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { SentimentData } from "@/lib/types"

interface SentimentChartProps {
  data: Record<string, SentimentData>
  participants: string[]
}

const SENTIMENT_COLORS = {
  positive: "#10b981",
  neutral: "#94a3b8",
  negative: "#f43f5e",
}

export function SentimentChart({ data, participants }: SentimentChartProps) {
  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle>Conversation Vibes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {participants.map((participant) => {
            const sentiment = data[participant]
            const chartData = [
              { name: "Positive", value: sentiment.positive },
              { name: "Neutral", value: sentiment.neutral },
              { name: "Negative", value: sentiment.negative },
            ]

            return (
              <div key={participant} className="text-center">
                <p className="font-medium mb-2 text-foreground">{participant}</p>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={SENTIMENT_COLORS[entry.name.toLowerCase() as keyof typeof SENTIMENT_COLORS]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value: number) => [`${value}%`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-3 text-xs mt-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {sentiment.positive}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    {sentiment.neutral}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    {sentiment.negative}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-primary/10 text-center border border-primary/20">
          <p className="text-sm text-foreground">
            {data[participants[0]].positive > data[participants[1]].positive
              ? `${participants[0]} tends to be more positive in conversations!`
              : `${participants[1]} tends to be more positive in conversations!`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
