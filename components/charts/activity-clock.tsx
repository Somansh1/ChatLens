"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import type { HourlyActivity } from "@/lib/types"

interface ActivityClockProps {
  data: HourlyActivity[]
}

export function ActivityClock({ data }: ActivityClockProps) {
  const chartData = data.map((item) => ({
    hour: item.hour,
    label: `${item.hour.toString().padStart(2, "0")}:00`,
    messages: item.count,
  }))

  const sorted = [...data].sort((a, b) => b.count - a.count)
  const peakHour = sorted[0].hour
  const quietHour = sorted[sorted.length - 1].hour

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM"
    if (hour === 12) return "12 PM"
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`
  }

  const nightMessages = data.filter((d) => d.hour >= 22 || d.hour <= 4).reduce((sum, d) => sum + d.count, 0)
  const morningMessages = data.filter((d) => d.hour >= 5 && d.hour <= 10).reduce((sum, d) => sum + d.count, 0)
  const isNightOwl = nightMessages > morningMessages

  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle>When You Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickFormatter={(hour) => (hour % 6 === 0 ? formatHour(hour) : "")}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelFormatter={(hour) => formatHour(hour as number)}
                formatter={(value: number) => [`${value} messages`, ""]}
              />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#e11d48"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMessages)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Peak Hour</p>
            <p className="font-semibold text-foreground">{formatHour(peakHour)}</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary border border-border">
            <p className="text-xs text-muted-foreground mb-1">Quietest Hour</p>
            <p className="font-semibold text-foreground">{formatHour(quietHour)}</p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-accent/10 text-center border border-accent/20">
          <p className="text-sm text-foreground">
            {isNightOwl
              ? "You're both night owls! Most messages are sent after dark."
              : "Early birds! You prefer chatting in the morning hours."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
