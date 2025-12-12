"use client"

import { Heart, Sparkles, Calendar, Clock, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RelationshipScores } from "@/lib/types"

interface RelationshipScoresCardProps {
  data: RelationshipScores
  participants: string[]
}

function formatHour(hour: number): string {
  if (hour === 0) return "12am"
  if (hour === 12) return "12pm"
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`
}

export function RelationshipScoresCard({ data, participants }: RelationshipScoresCardProps) {
  // Generate mini heatmap data (last 30 days or available data)
  const sortedDates = Object.keys(data.dailyActivityMap).sort().slice(-35)
  const maxActivity = Math.max(...Object.values(data.dailyActivityMap), 1)

  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-muted/30"
    const ratio = count / maxActivity
    if (ratio > 0.75) return "bg-primary"
    if (ratio > 0.5) return "bg-primary/70"
    if (ratio > 0.25) return "bg-primary/40"
    return "bg-primary/20"
  }

  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-primary" />
          Relationship Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Row - Main Scores */}
        <div className="grid grid-cols-2 gap-4">
          {/* Vibe Check Score */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 border border-pink-200 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-pink-500" />
              <span className="text-sm font-medium text-pink-700">Vibe Check</span>
            </div>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#fce7f3" strokeWidth="8" fill="none" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="url(#vibeGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${data.vibeCheckScore * 2.51} 251`}
                />
                <defs>
                  <linearGradient id="vibeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute text-2xl font-bold text-pink-600">{data.vibeCheckScore}</span>
            </div>
            <p className="text-sm font-semibold text-pink-600 mt-2">{data.vibeRating}</p>
          </div>

          {/* Communication Style / Love Language */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border border-violet-200">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-5 w-5 text-violet-500" />
              <span className="text-sm font-medium text-violet-700">Your Love Language</span>
            </div>
            <p className="text-lg font-bold text-violet-900 mb-3">{data.communicationStyle.loveLanguage}</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-violet-600">Message Style</span>
                <span className="font-medium text-violet-800 capitalize">
                  {data.communicationStyle.avgMessageLength}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-violet-600">Emoji Usage</span>
                <span className="font-medium text-violet-800 capitalize">{data.communicationStyle.emojiUsage}</span>
              </div>
              {data.communicationStyle.callVsText > 0 && (
                <div className="flex justify-between">
                  <span className="text-violet-600">Call Preference</span>
                  <span className="font-medium text-violet-800">{data.communicationStyle.callVsText}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Consistency Score with Heatmap */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">Consistency Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-emerald-600">{data.consistencyScore}%</span>
              {data.consistencyStreak > 1 && (
                <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  {data.consistencyStreak} day streak
                </span>
              )}
            </div>
          </div>

          {/* Mini Heatmap */}
          <div className="mt-4">
            <p className="text-xs text-emerald-600 mb-2">Recent Activity</p>
            <div className="flex flex-wrap gap-1">
              {sortedDates.map((date) => (
                <div
                  key={date}
                  className={`w-3 h-3 rounded-sm ${getIntensityClass(data.dailyActivityMap[date] || 0)}`}
                  title={`${date}: ${data.dailyActivityMap[date] || 0} messages`}
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-1 mt-2 text-xs text-emerald-600">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-primary/20" />
              <div className="w-3 h-3 rounded-sm bg-primary/40" />
              <div className="w-3 h-3 rounded-sm bg-primary/70" />
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Energy Match */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-700">Energy Match</span>
            </div>
            <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
              {data.energyMatch.matchType}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Person A */}
            <div className="flex-1 text-center">
              <p className="text-xs text-amber-600 mb-1 truncate">{participants[0]?.split(" ")[0]}</p>
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                <span className="text-sm font-semibold text-amber-800">{formatHour(data.energyMatch.peakHourA)}</span>
              </div>
            </div>

            {/* Match Indicator */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="#fef3c7" strokeWidth="6" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#f59e0b"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${data.energyMatch.score * 1.76} 176`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-amber-600">
                  {data.energyMatch.score}%
                </span>
              </div>
            </div>

            {/* Person B */}
            <div className="flex-1 text-center">
              <p className="text-xs text-amber-600 mb-1 truncate">{participants[1]?.split(" ")[0]}</p>
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                <span className="text-sm font-semibold text-amber-800">{formatHour(data.energyMatch.peakHourB)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
