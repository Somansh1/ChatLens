"use client"

import type { ChatAnalysis } from "@/lib/types"
import { PERSON, firstName } from "@/lib/palette"
import { Logo, Panel, Shape } from "@/components/panel"
import { StatCard } from "@/components/stat-card"
import { HeadToHead } from "@/components/charts/message-distribution"
import { SentimentChart } from "@/components/charts/sentiment-chart"
import { ActivityClock } from "@/components/charts/activity-clock"
import { SignaturePhrasesCard } from "@/components/signature-phrases"
import { Awards } from "@/components/insight-card"
import { TopEmojisCard } from "@/components/top-emojis"
import { CallInsightsCard } from "@/components/call-insights-card"
import { VibePanel, EnergyPanel, HeatmapPanel } from "@/components/relationship-scores-card"

interface AnalysisDashboardProps {
  data: ChatAnalysis
  onBack: () => void
}

const PLATFORM_NAMES = { whatsapp: "WhatsApp", instagram: "Instagram", messenger: "Messenger", discord: "Discord" }
const HERO_TONES = ["coral", "teal"] as const

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function AnalysisDashboard({ data, onBack }: AnalysisDashboardProps) {
  const totalMessages = data.totalMessages
  const messagesPerDay = (totalMessages / data.totalDays).toFixed(1)
  const totalWords = data.messageStats.reduce((sum, s) => sum + s.wordCount, 0)
  const isPair = data.messageStats.length >= 2

  const topTexter = data.messageStats.reduce((a, b) => (a.count > b.count ? a : b))
  const textDifference = Math.abs(data.messageStats[0]?.count - (data.messageStats[1]?.count || 0))
  const textRatio = ((topTexter.count / totalMessages) * 100).toFixed(0)
  const emojiKing = data.messageStats.reduce((a, b) => (a.emojiCount > b.emojiCount ? a : b))
  const essayWriter = data.messageStats.reduce((a, b) => (a.avgWordsPerMessage > b.avgWordsPerMessage ? a : b))

  const starterEntries = Object.entries(data.conversationStarters)
  const topStarter =
    starterEntries.length > 0 ? starterEntries.reduce((a, b) => (a[1] > b[1] ? a : b)) : [data.participants[0], 0]

  const colorOf = (sender: string) => PERSON[Math.max(0, data.participants.indexOf(sender)) % PERSON.length]

  const comparison = () => {
    if (!isPair) return ""
    const ratio = data.messageStats[0].count / data.messageStats[1].count
    if (ratio > 1.5) return `${firstName(data.messageStats[0].sender)} is definitely the chatty one.`
    if (ratio < 0.67) return `${firstName(data.messageStats[1].sender)} keeps the conversation going.`
    return "You both pull your weight."
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-background px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Logo />
          <button
            onClick={onBack}
            className="h-9 rounded-full bg-cream px-4 text-sm font-semibold text-ink transition hover:bg-yellow"
          >
            New analysis
          </button>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-3">
          <p className="eyebrow reveal text-muted-foreground">
            {PLATFORM_NAMES[data.platform]} &middot; {data.dateRange.start} &ndash; {data.dateRange.end} &middot;{" "}
            {totalMessages.toLocaleString()} messages &middot; {comparison()}
          </p>

          {/* Hero: the two people as colour blocks, each as wide as their share of the messages */}
          <section className="reveal flex flex-col gap-3 sm:flex-row" aria-label="Message share">
            {data.messageStats.map((stat, i) => {
              const share = (stat.count / totalMessages) * 100
              return (
                <div
                  key={stat.sender}
                  className={`tone-${HERO_TONES[i % 2]} block-surface relative flex min-h-64 min-w-0 flex-col justify-between overflow-hidden p-6 sm:min-h-80 sm:p-8`}
                  style={{ flexGrow: stat.count, flexBasis: 0 }}
                >
                  <Shape
                    kind={i === 0 ? "ring" : "burst"}
                    className="-bottom-14 -right-10 size-56 opacity-15 sm:size-72"
                  />
                  <h1 className="display relative break-words text-5xl sm:text-7xl lg:text-8xl">
                    {firstName(stat.sender)}
                  </h1>
                  <div className="relative">
                    <p className="display text-7xl tabular-nums sm:text-8xl lg:text-9xl">{share.toFixed(0)}%</p>
                    <p className="mt-1 text-sm font-medium">
                      {stat.count.toLocaleString()} messages &middot; {stat.wordCount.toLocaleString()} words
                    </p>
                  </div>
                </div>
              )
            })}
          </section>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              title="Total messages"
              value={totalMessages.toLocaleString()}
              subtitle={`over ${data.totalDays.toLocaleString()} days`}
              tone="cream"
              delay={60}
            />
            <StatCard
              title="Messages per day"
              value={messagesPerDay}
              subtitle={Number(messagesPerDay) > 50 ? "Always connected" : "Quality over quantity"}
              tone="ink"
              delay={120}
            />
            <StatCard
              title="Longest streak"
              value={`${data.longestStreak.days} days`}
              subtitle="without missing a day"
              tone="yellow"
              delay={180}
            />
            {data.callInsights ? (
              <StatCard
                title="Total call time"
                value={formatDuration(data.callInsights.totalDuration)}
                subtitle={`${data.callInsights.totalCalls} calls made`}
                tone="ink"
                delay={240}
              />
            ) : (
              <StatCard
                title="Avg response time"
                value={`${data.avgResponseTime} min`}
                subtitle={
                  data.avgResponseTime < 5 ? "Lightning fast" : data.avgResponseTime < 15 ? "Pretty quick" : "Taking your time"
                }
                tone="ink"
                delay={240}
              />
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-12">
            <ActivityClock data={data.hourlyActivity} tone="ink" className="lg:col-span-5" />
            {isPair ? (
              <HeadToHead data={data} tone="cream" className="lg:col-span-7" delay={80} />
            ) : (
              <SignaturePhrasesCard
                phrases={data.signaturePhrases}
                participants={data.participants}
                className="lg:col-span-7"
                delay={80}
              />
            )}
          </div>

          {data.relationshipScores && (
            <div className="grid gap-3 lg:grid-cols-12">
              <VibePanel
                data={data.relationshipScores}
                participants={data.participants}
                tone="yellow"
                className="lg:col-span-5"
              />
              <div className="grid gap-3 lg:col-span-7">
                {isPair && (
                  <Awards
                    awards={[
                      {
                        title: "The chatterbox",
                        winner: firstName(topTexter.sender),
                        description: `${textRatio}% of all messages, ${textDifference.toLocaleString()} more than the other`,
                        color: colorOf(topTexter.sender),
                      },
                      {
                        title: "Emoji champion",
                        winner: firstName(emojiKing.sender),
                        description: `${emojiKing.emojiCount.toLocaleString()} emojis in total`,
                        color: colorOf(emojiKing.sender),
                      },
                      {
                        title: "The essay writer",
                        winner: firstName(essayWriter.sender),
                        description: `${essayWriter.avgWordsPerMessage} words per message on average`,
                        color: colorOf(essayWriter.sender),
                      },
                    ]}
                    delay={80}
                  />
                )}
                {isPair && (
                  <EnergyPanel data={data.relationshipScores} participants={data.participants} tone="ink" delay={120} />
                )}
              </div>
            </div>
          )}

          {data.relationshipScores && (
            <HeatmapPanel data={data.relationshipScores} participants={data.participants} tone="ink" />
          )}

          {data.callInsights && data.callInsights.totalCalls > 0 && (
            <CallInsightsCard data={data.callInsights} participants={data.participants} tone="cream" />
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            {isPair && <SignaturePhrasesCard phrases={data.signaturePhrases} participants={data.participants} tone="cream" />}
            <SentimentChart data={data.sentimentBySender} participants={data.participants} tone="ink" delay={80} />
          </div>

          <div className="grid gap-3 lg:grid-cols-12">
            <TopEmojisCard emojis={data.topEmojis} tone="yellow" className="lg:col-span-7" />
            <Panel title="More fun facts" tone="ink" className="lg:col-span-5" delay={80}>
              <dl>
                {[
                  {
                    label: "Conversation starter",
                    value: firstName(String(topStarter[0])),
                    note: `started ${Number(topStarter[1]).toLocaleString()} conversations`,
                  },
                  {
                    label: "Busiest day",
                    value: `${data.busiestDay.count.toLocaleString()} messages`,
                    note: `on ${data.busiestDay.date}`,
                  },
                  {
                    label: "Words exchanged",
                    value: totalWords.toLocaleString(),
                    note: totalWords > 100000 ? "about a novel's worth" : "and counting",
                  },
                ].map((fact) => (
                  <div key={fact.label} className="border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0">
                    <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                    <dd className="display mt-1 text-3xl">{fact.value}</dd>
                    <dd className="text-sm text-muted-foreground">{fact.note}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
        </div>
      </main>

      <footer className="border-t border-line px-6 py-5 text-center text-sm text-muted-foreground">
        Analyzed locally in your browser. Close this tab and it is gone.{" "}
        <button onClick={onBack} className="font-semibold text-yellow underline-offset-4 hover:underline">
          Analyze another chat
        </button>
      </footer>
    </div>
  )
}
