export type Platform = "whatsapp" | "instagram" | "messenger" | "discord"

export interface MessageStats {
  sender: string
  count: number
  wordCount: number
  avgWordsPerMessage: number
  emojiCount: number
}

export interface SentimentData {
  positive: number
  negative: number
  neutral: number
}

export interface HourlyActivity {
  hour: number
  count: number
}

export interface SignaturePhrase {
  phrase: string
  count: number
  sender: string
}

export interface CallData {
  caller: string
  callType: "audio" | "video"
  duration: number // in seconds
  timestamp: number
  wasAnswered: boolean
}

export interface CallInsights {
  totalCalls: number
  totalDuration: number // in seconds
  callsBySender: Record<string, number>
  durationBySender: Record<string, number>
  audioCalls: number
  videoCalls: number
  missedCalls: number
  rejectedCallsBySender: Record<string, number>
  answeredCalls: number
  longestCall: {
    duration: number
    date: string
    caller: string
  }
  callHourlyActivity: HourlyActivity[]
  averageCallDuration: number
}

export interface RelationshipScores {
  vibeCheckScore: number // 0-100
  vibeRating: string // "Amazing", "Great", etc.
  communicationStyle: {
    callVsText: number // percentage of calls vs text
    avgMessageLength: "short" | "medium" | "long"
    emojiUsage: "low" | "moderate" | "high"
    loveLanguage: string // "Words of Affirmation", "Quality Time", etc.
  }
  consistencyScore: number // 0-100
  consistencyStreak: number // current active days
  dailyActivityMap: Record<string, number> // date -> message count for heatmap
  energyMatch: {
    score: number // 0-100
    peakHourA: number
    peakHourB: number
    matchType: string // "Night Owls", "Early Birds", etc.
  }
}

export interface ChatAnalysis {
  platform: Platform
  participants: string[]
  dateRange: {
    start: string
    end: string
  }
  totalMessages: number
  totalDays: number
  messageStats: MessageStats[]
  sentimentBySender: Record<string, SentimentData>
  hourlyActivity: HourlyActivity[]
  signaturePhrases: SignaturePhrase[]
  longestStreak: {
    days: number
    startDate: string
    endDate: string
  }
  topEmojis: { emoji: string; count: number }[]
  avgResponseTime: number
  conversationStarters: Record<string, number>
  busiestDay: {
    date: string
    count: number
  }
  callInsights?: CallInsights
  relationshipScores?: RelationshipScores
}
