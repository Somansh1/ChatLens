"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts"
import type { MessageStats } from "@/lib/types"

interface MessageDistributionChartProps {
  data: MessageStats[]
}

const COLORS = ["#e11d48", "#8b5cf6"]

export function MessageDistributionChart({ data }: MessageDistributionChartProps) {
  const chartData = data.map((stat) => ({
    name: stat.sender,
    messages: stat.count,
    words: stat.wordCount,
  }))

  const total = data.reduce((sum, s) => sum + s.count, 0)

  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle>Message Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ color: "#1e293b" }}
              />
              <Bar dataKey="messages" radius={[0, 8, 8, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {data.map((stat, i) => (
            <div key={stat.sender} className="text-center p-4 rounded-xl bg-secondary/70 border border-border">
              <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: COLORS[i] }} />
              <p className="font-semibold text-foreground">{stat.sender}</p>
              <p className="text-3xl font-bold text-foreground">{((stat.count / total) * 100).toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">{stat.count.toLocaleString()} messages</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
