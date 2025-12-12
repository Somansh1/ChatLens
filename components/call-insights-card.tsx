"use client"

import { Phone, Video, PhoneMissed, Trophy, Clock, PhoneIncoming } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CallInsights } from "@/lib/types"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"

interface CallInsightsCardProps {
  data: CallInsights
  participants: string[]
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function formatHour(hour: number): string {
  if (hour === 0) return "12am"
  if (hour === 12) return "12pm"
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`
}

export function CallInsightsCard({ data, participants }: CallInsightsCardProps) {
  // Find who makes most calls
  const callChampion = Object.entries(data.callsBySender).sort((a, b) => b[1] - a[1])[0]
  const ghostChampion = Object.entries(data.rejectedCallsBySender || {}).sort((a, b) => b[1] - a[1])[0]

  // Video vs Voice pie data
  const callTypeData = [
    { name: "Voice Calls", value: data.audioCalls, color: "#f472b6" },
    { name: "Video Calls", value: data.videoCalls, color: "#a78bfa" },
  ]

  // Call initiator bar data
  const initiatorData = Object.entries(data.callsBySender).map(([name, count]) => ({
    name: name.split(" ")[0],
    calls: count,
  }))

  // Peak call hours
  const peakHour = data.callHourlyActivity.reduce((a, b) => (a.count > b.count ? a : b))
  const isNightOwl = peakHour.hour >= 21 || peakHour.hour <= 5

  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5 text-primary" />
          Call Highlights ({data.answeredCalls} answered, {data.missedCalls} missed)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Call Champion */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">Call Champion</span>
            </div>
            <p className="font-semibold text-amber-900 truncate">{callChampion?.[0]?.split(" ")[0] || "N/A"}</p>
            <p className="text-xs text-amber-600">{callChampion?.[1] || 0} calls initiated</p>
          </div>

          {/* Marathon Call */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Marathon Call</span>
            </div>
            <p className="font-semibold text-purple-900">{formatDuration(data.longestCall.duration)}</p>
            <p className="text-xs text-purple-600">{data.longestCall.date}</p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <PhoneMissed className="h-4 w-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-700">Ghost Detector</span>
            </div>
            <p className="font-semibold text-slate-900">{data.missedCalls} missed</p>
            <p className="text-xs text-slate-600">
              {ghostChampion && ghostChampion[1] > 0
                ? `${ghostChampion[0].split(" ")[0]} didn't pick up ${ghostChampion[1]}x`
                : "Everyone answers!"}
            </p>
          </div>

          {/* Total Talk Time */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <PhoneIncoming className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Total Talk Time</span>
            </div>
            <p className="font-semibold text-emerald-900">{formatDuration(data.totalDuration)}</p>
            <p className="text-xs text-emerald-600">Avg: {formatDuration(data.averageCallDuration)}/call</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Video vs Voice */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Camera On vs Off</span>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={callTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {callTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} calls`, name]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-400" /> Voice ({data.audioCalls})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" /> Video ({data.videoCalls})
              </span>
            </div>
          </div>

          {/* Who Dials First */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Who Dials First?</span>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={initiatorData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={60}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} calls`, "Initiated"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="calls" fill="#f472b6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Call Time Pattern */}
        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">When Do You Call?</span>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {isNightOwl ? "Night Owl Callers" : "Daytime Chatters"}
            </span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.callHourlyActivity}>
                <XAxis
                  dataKey="hour"
                  tickFormatter={formatHour}
                  tick={{ fontSize: 9, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} calls`, ""]}
                  labelFormatter={(hour) => formatHour(hour as number)}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#a78bfa" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Peak calling time: {formatHour(peakHour.hour)} ({peakHour.count} calls)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
