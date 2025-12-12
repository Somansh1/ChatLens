"use client"

import { ArrowLeft, MessageCircle, Calendar, Clock, Flame, Users, TrendingUp, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChatAnalysis } from "@/lib/types"
import { StatCard } from "@/components/stat-card"
import { MessageDistributionChart } from "@/components/charts/message-distribution"
import { SentimentChart } from "@/components/charts/sentiment-chart"
import { ActivityClock } from "@/components/charts/activity-clock"
import { SignaturePhrasesCard } from "@/components/signature-phrases"
import { InsightCard } from "@/components/insight-card"
import { TopEmojisCard } from "@/components/top-emojis"
import { CallInsightsCard } from "@/components/call-insights-card"
import { RelationshipScoresCard } from "@/components/relationship-scores-card"

interface AnalysisDashboardProps {
  data: ChatAnalysis
  onBack: () => void
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    return `${mins}m`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function AnalysisDashboard({ data, onBack }: AnalysisDashboardProps) {
  const totalMessages = data.totalMessages
  const messagesPerDay = (totalMessages / data.totalDays).toFixed(1)

  const topTexter = data.messageStats.reduce((a, b) => (a.count > b.count ? a : b))
  const textDifference = Math.abs(data.messageStats[0]?.count - (data.messageStats[1]?.count || 0))
  const textRatio = ((topTexter.count / totalMessages) * 100).toFixed(0)

  const emojiKing = data.messageStats.reduce((a, b) => (a.emojiCount > b.emojiCount ? a : b))
  const essayWriter = data.messageStats.reduce((a, b) => (a.avgWordsPerMessage > b.avgWordsPerMessage ? a : b))

  const starterEntries = Object.entries(data.conversationStarters)
  const topStarter =
    starterEntries.length > 0 ? starterEntries.reduce((a, b) => (a[1] > b[1] ? a : b)) : [data.participants[0], 0]

  const getComparisonText = () => {
    if (data.messageStats.length < 2) return ""
    const ratio = data.messageStats[0].count / data.messageStats[1].count
    if (ratio > 1.5) return `${data.messageStats[0].sender} is definitely the chatty one!`
    if (ratio < 0.67) return `${data.messageStats[1].sender} keeps the conversation going!`
    return "You both contribute equally to the chat!"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 sticky top-0 bg-card/95 backdrop-blur-sm z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-xl">ChatLens</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
              <Users className="h-4 w-4" />
              <span>{data.participants.join(" & ")}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Summary Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Your Conversation Story</h1>
            <p className="text-muted-foreground">
              {data.dateRange.start} to {data.dateRange.end} ({data.totalDays} days)
            </p>
            {data.messageStats.length >= 2 && (
              <p className="text-sm text-primary font-medium mt-2">{getComparisonText()}</p>
            )}
          </div>

          {/* Top Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Messages"
              value={totalMessages.toLocaleString()}
              subtitle={totalMessages > 10000 ? "Wow, you two talk A LOT!" : "A solid conversation history!"}
              icon={<MessageCircle className="h-5 w-5" />}
              color="primary"
            />
            <StatCard
              title="Messages per Day"
              value={messagesPerDay}
              subtitle={Number(messagesPerDay) > 50 ? "Always connected!" : "Quality over quantity"}
              icon={<Calendar className="h-5 w-5" />}
              color="accent"
            />
            <StatCard
              title="Longest Streak"
              value={`${data.longestStreak.days} days`}
              subtitle="Without missing a day"
              icon={<Flame className="h-5 w-5" />}
              color="chart-4"
            />
            {data.callInsights ? (
              <StatCard
                title="Total Call Time"
                value={formatDuration(data.callInsights.totalDuration)}
                subtitle={`${data.callInsights.totalCalls} calls made`}
                icon={<Phone className="h-5 w-5" />}
                color="chart-3"
              />
            ) : (
              <StatCard
                title="Avg Response Time"
                value={`${data.avgResponseTime} min`}
                subtitle={
                  data.avgResponseTime < 5
                    ? "Lightning fast!"
                    : data.avgResponseTime < 15
                      ? "Pretty quick!"
                      : "Taking your time"
                }
                icon={<Clock className="h-5 w-5" />}
                color="chart-3"
              />
            )}
          </div>

          {/* Fun Insights Row */}
          {data.messageStats.length >= 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InsightCard
                title="The Chatterbox"
                value={topTexter.sender}
                description={`Sent ${textRatio}% of all messages (${textDifference.toLocaleString()} more than the other)`}
                variant="rose"
              />
              <InsightCard
                title="Emoji Champion"
                value={emojiKing.sender}
                description={`Used ${emojiKing.emojiCount.toLocaleString()} emojis in total`}
                variant="amber"
              />
              <InsightCard
                title="The Essay Writer"
                value={essayWriter.sender}
                description={`Averages ${essayWriter.avgWordsPerMessage} words per message`}
                variant="cyan"
              />
            </div>
          )}

          {data.relationshipScores && (
            <RelationshipScoresCard data={data.relationshipScores} participants={data.participants} />
          )}

          {data.callInsights && data.callInsights.totalCalls > 0 && (
            <CallInsightsCard data={data.callInsights} participants={data.participants} />
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MessageDistributionChart data={data.messageStats} />
            {data.participants.length >= 2 && (
              <SentimentChart data={data.sentimentBySender} participants={data.participants} />
            )}
          </div>

          {/* Activity Clock & Signature Phrases */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityClock data={data.hourlyActivity} />
            <SignaturePhrasesCard phrases={data.signaturePhrases} />
          </div>

          {/* Emojis Card */}
          {data.topEmojis.length > 0 && <TopEmojisCard emojis={data.topEmojis} />}

          {/* Bottom Insights */}
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                More Fun Facts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1 p-4 rounded-xl bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Conversation Starter</p>
                  <p className="text-xl font-semibold text-foreground">{topStarter[0]}</p>
                  <p className="text-sm text-muted-foreground">Started {topStarter[1]} conversations</p>
                </div>
                <div className="space-y-1 p-4 rounded-xl bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Busiest Day Ever</p>
                  <p className="text-xl font-semibold text-foreground">{data.busiestDay.count} messages</p>
                  <p className="text-sm text-muted-foreground">on {data.busiestDay.date}</p>
                </div>
                <div className="space-y-1 p-4 rounded-xl bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Total Words Exchanged</p>
                  <p className="text-xl font-semibold text-foreground">
                    {data.messageStats.reduce((sum, s) => sum + s.wordCount, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.messageStats.reduce((sum, s) => sum + s.wordCount, 0) > 100000
                      ? "That's like reading several novels!"
                      : "Meaningful conversations!"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 mt-8 bg-card">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          Analyze another chat?{" "}
          <button onClick={onBack} className="text-primary hover:underline font-medium">
            Upload a new file
          </button>
        </div>
      </footer>
    </div>
  )
}
