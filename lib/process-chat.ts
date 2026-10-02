import type {
  Platform,
  ChatAnalysis,
  MessageStats,
  HourlyActivity,
  SignaturePhrase,
  SentimentData,
  CallData,
  CallInsights,
  RelationshipScores,
} from "./types"

interface RawMessage {
  sender: string
  content: string
  timestamp: number // Unix timestamp in ms
  callDuration?: number
  isCall?: boolean
  callType?: "audio" | "video"
}

// Common stop words to filter from signature phrases
const STOPWORDS = new Set([
  "the",
  "be",
  "to",
  "of",
  "and",
  "a",
  "in",
  "that",
  "have",
  "i",
  "it",
  "for",
  "not",
  "on",
  "with",
  "he",
  "as",
  "you",
  "do",
  "at",
  "this",
  "but",
  "his",
  "by",
  "from",
  "they",
  "we",
  "say",
  "her",
  "she",
  "or",
  "an",
  "will",
  "my",
  "one",
  "all",
  "would",
  "there",
  "their",
  "what",
  "so",
  "up",
  "out",
  "if",
  "about",
  "who",
  "get",
  "which",
  "go",
  "me",
  "when",
  "make",
  "can",
  "like",
  "time",
  "no",
  "just",
  "him",
  "know",
  "take",
  "people",
  "into",
  "year",
  "your",
  "good",
  "some",
  "could",
  "them",
  "see",
  "other",
  "than",
  "then",
  "now",
  "look",
  "only",
  "come",
  "its",
  "over",
  "think",
  "also",
  "back",
  "after",
  "use",
  "two",
  "how",
  "our",
  "work",
  "first",
  "well",
  "way",
  "even",
  "new",
  "want",
  "because",
  "any",
  "these",
  "give",
  "day",
  "most",
  "us",
  "are",
  "is",
  "was",
  "were",
  "has",
  "had",
  "am",
  "im",
  "dont",
  "did",
  "u",
  "ur",
  "ok",
  "okay",
  "lol",
  "yeah",
  "yes",
  "no",
  "oh",
  "hey",
  "hi",
  "message",
  "reacted",
  "liked",
  "sent",
  "photo",
  "video",
  "attachment",
  "sticker",
  "gif",
  "deleted",
  "missed",
  "call",
  "voice",
  "http",
  "https",
  "www",
  "com",
])

// Positive and negative word lists for simple sentiment analysis
const POSITIVE_WORDS = new Set([
  "love",
  "great",
  "awesome",
  "amazing",
  "wonderful",
  "fantastic",
  "excellent",
  "good",
  "best",
  "happy",
  "glad",
  "joy",
  "beautiful",
  "perfect",
  "nice",
  "cool",
  "fun",
  "enjoy",
  "excited",
  "thanks",
  "thank",
  "appreciate",
  "brilliant",
  "incredible",
  "outstanding",
  "superb",
  "terrific",
  "lovely",
  "pleasant",
  "delightful",
  "fabulous",
  "marvelous",
  "splendid",
  "glorious",
  "magnificent",
  "super",
  "yay",
  "wow",
  "haha",
  "hahaha",
  "lmao",
  "rofl",
  "sweet",
  "cute",
  "adorable",
  "hilarious",
])

const NEGATIVE_WORDS = new Set([
  "hate",
  "bad",
  "terrible",
  "awful",
  "horrible",
  "worst",
  "sad",
  "angry",
  "upset",
  "annoyed",
  "frustrated",
  "disappointed",
  "boring",
  "stupid",
  "dumb",
  "ugly",
  "wrong",
  "fail",
  "failed",
  "sucks",
  "suck",
  "poor",
  "weak",
  "pathetic",
  "ridiculous",
  "annoying",
  "irritating",
  "disgusting",
  "nasty",
  "gross",
  "ugh",
  "meh",
  "whatever",
  "tired",
  "exhausted",
  "stressed",
  "worried",
  "scared",
  "sorry",
  "apologize",
  "regret",
  "miss",
  "missed",
  "unfortunately",
  "sadly",
])

// Platform-specific parsers
function parseMessenger(data: unknown): RawMessage[] {
  const messages: RawMessage[] = []
  const json = data as {
    messages?: Array<{ sender_name?: string; content?: string; timestamp_ms?: number; call_duration?: number }>
  }

  if (!json.messages || !Array.isArray(json.messages)) {
    throw new Error("Invalid Messenger format: missing messages array")
  }

  const msgArray = json.messages
  for (let i = 0; i < msgArray.length; i++) {
    const msg = msgArray[i]
    if (!msg.content || !msg.sender_name) continue

    let content = msg.content
    let sender = msg.sender_name
    try {
      content = decodeURIComponent(escape(content))
      sender = decodeURIComponent(escape(sender))
    } catch {
      // Keep original
    }

    if (sender.toLowerCase().includes("meta ai")) continue
    if (content.startsWith("Reacted") || content.startsWith("Liked")) continue

    messages.push({
      sender,
      content,
      timestamp: msg.timestamp_ms || Date.now(),
      callDuration: msg.call_duration,
      isCall:
        content.toLowerCase().includes("call") ||
        content.toLowerCase().includes("voice") ||
        content.toLowerCase().includes("video"),
      callType: content.toLowerCase().includes("video")
        ? "video"
        : content.toLowerCase().includes("voice")
          ? "audio"
          : undefined,
    })
  }

  return messages.sort((a, b) => a.timestamp - b.timestamp)
}

function parseInstagram(data: unknown): RawMessage[] {
  return parseMessenger(data)
}

function parseWhatsApp(data: unknown): RawMessage[] {
  const messages: RawMessage[] = []
  const json = data as {
    messages?: Array<{
      sender?: string
      author?: string
      from?: string
      body?: string
      message?: string
      content?: string
      text?: string
      timestamp?: number | string
      date?: string
    }>
    chat?: Array<unknown>
  }

  const msgArray = json.messages || json.chat || (Array.isArray(data) ? (data as Array<unknown>) : [])

  for (let i = 0; i < msgArray.length; i++) {
    const m = msgArray[i] as Record<string, unknown>
    const sender = (m.sender || m.author || m.from || "Unknown") as string
    const content = (m.body || m.message || m.content || m.text || "") as string

    if (!content || content.length === 0) continue

    let timestamp: number
    if (typeof m.timestamp === "number") {
      timestamp = m.timestamp > 9999999999 ? m.timestamp : m.timestamp * 1000
    } else if (m.date) {
      timestamp = new Date(m.date as string).getTime()
    } else {
      timestamp = Date.now()
    }

    if (sender.toLowerCase().includes("system") || content.includes("Messages and calls are end-to-end encrypted"))
      continue

    messages.push({ sender, content, timestamp })
  }

  return messages.sort((a, b) => a.timestamp - b.timestamp)
}

function parseDiscord(data: unknown): RawMessage[] {
  const messages: RawMessage[] = []
  const json = data as {
    messages?: Array<{
      author?: { name?: string; username?: string }
      content?: string
      timestamp?: string
    }>
    channel?: { messages?: Array<unknown> }
  }

  const msgArray = json.messages || json.channel?.messages || (Array.isArray(data) ? (data as Array<unknown>) : [])

  for (let i = 0; i < msgArray.length; i++) {
    const m = msgArray[i] as Record<string, unknown>
    const author = m.author as { name?: string; username?: string } | undefined
    const sender = author?.name || author?.username || (m.author as string) || "Unknown"
    const content = (m.content as string) || ""

    if (!content || content.length === 0) continue

    let timestamp: number
    if (m.timestamp) {
      timestamp = new Date(m.timestamp as string).getTime()
    } else {
      timestamp = Date.now()
    }

    if (sender.toLowerCase().includes("bot")) continue

    messages.push({ sender, content, timestamp })
  }

  return messages.sort((a, b) => a.timestamp - b.timestamp)
}

// One WhatsApp message line. Covers both export styles:
//   Android: 15/10/25, 14:17 - Sender: text
//   iOS:     [10/15/25, 2:17:39 PM] Sender: text
// Date separators may be / . or -, seconds and AM/PM are optional.
const WHATSAPP_LINE =
  /^\[?(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{2,4}),?\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([ap])?\.?\s*(?:m\.?)?\]?\s*(?:-\s*)?([^:]+?):\s*(.*)$/i

// A line that starts with a timestamp. One that fails WHATSAPP_LINE has no sender, so it is a system notice.
const WHATSAPP_STAMP = /^\[?\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{2,4},?\s+\d{1,2}[:.]\d{2}/

// Placeholder lines WhatsApp writes instead of content.
const WHATSAPP_NOISE =
  /^(<Media omitted>|<attached: .+>|(image|video|audio|sticker|GIF|document|Contact card) omitted|This message was deleted\.?|You deleted this message\.?|Messages and calls are end-to-end encrypted.*)$/i

export function parseWhatsAppTxt(text: string): RawMessage[] {
  // Drop the BOM, the invisible direction marks iOS adds, and the narrow no-break space before AM/PM.
  const lines = text
    .replace(/[\uFEFF\u200E\u200F\u202A-\u202E]/g, "")
    .replace(/[\u202F\u00A0]/g, " ")
    .split(/\r?\n/)

  const rows: { parts: number[]; pm?: boolean; am?: boolean; sender: string; content: string }[] = []
  for (const line of lines) {
    const match = line.trim().match(WHATSAPP_LINE)
    if (match) {
      const [, d1, d2, d3, hh, mm, ss, meridiem, sender, content] = match
      rows.push({
        parts: [Number(d1), Number(d2), Number(d3), Number(hh), Number(mm), Number(ss || 0)],
        pm: meridiem?.toLowerCase() === "p",
        am: meridiem?.toLowerCase() === "a",
        sender: sender.trim(),
        content: content.trim(),
      })
    } else if (rows.length > 0 && line.trim() && !WHATSAPP_STAMP.test(line.trim())) {
      // A line without a timestamp continues the previous message.
      rows[rows.length - 1].content += `\n${line.trim()}`
    }
  }

  // Exports use the phone's date order. A value above 12 can only be a day, which settles it for the
  // whole file; if every date is ambiguous, assume month first.
  const dayFirst = rows.some((r) => r.parts[0] > 12 && r.parts[0] <= 31) && !rows.some((r) => r.parts[1] > 12)
  const yearFirst = rows.some((r) => r.parts[0] > 31)

  const messages: RawMessage[] = []
  for (const row of rows) {
    if (!row.content || WHATSAPP_NOISE.test(row.content)) continue

    const [a, b, c, hh, mm, ss] = row.parts
    const [year, month, day] = yearFirst ? [a, b, c] : dayFirst ? [c, b, a] : [c, a, b]
    const hour = row.pm ? (hh % 12) + 12 : row.am ? hh % 12 : hh
    const timestamp = new Date(year < 100 ? 2000 + year : year, month - 1, day, hour, mm, ss).getTime()
    if (Number.isNaN(timestamp)) continue

    messages.push({ sender: row.sender, content: row.content, timestamp })
  }

  return messages.sort((a, b) => a.timestamp - b.timestamp)
}

function analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
  const words = text.toLowerCase().split(/\s+/)
  let positiveScore = 0
  let negativeScore = 0

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, "")
    if (POSITIVE_WORDS.has(cleanWord)) positiveScore++
    if (NEGATIVE_WORDS.has(cleanWord)) negativeScore++
  }

  if (text.includes(":)") || text.includes(":D") || text.includes("<3")) positiveScore++
  if (text.includes(":(") || text.includes(":/")) negativeScore++

  if (positiveScore > negativeScore) return "positive"
  if (negativeScore > positiveScore) return "negative"
  return "neutral"
}

function extractPhrases(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))

  const phrases: string[] = []
  phrases.push(...words)

  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`)
  }

  return phrases
}

function countEmojis(text: string): number {
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu
  const matches = text.match(emojiRegex)
  return matches ? matches.length : 0
}

function extractCallsFromMessenger(data: unknown): CallData[] {
  const calls: CallData[] = []
  const json = data as {
    messages?: Array<{ sender_name?: string; content?: string; timestamp_ms?: number; call_duration?: number }>
  }

  if (!json.messages || !Array.isArray(json.messages)) {
    return calls
  }

  const msgArray = json.messages
  for (let i = 0; i < msgArray.length; i++) {
    const msg = msgArray[i]
    const content = msg.content || ""

    // Check if this is a call message
    const isAudioCall = content.toLowerCase().includes("audio call") || content.toLowerCase().includes("voice call")
    const isVideoCall = content.toLowerCase().includes("video call") || content.toLowerCase().includes("video chat")

    if (isAudioCall || isVideoCall) {
      let sender = msg.sender_name || "Unknown"
      try {
        sender = decodeURIComponent(escape(sender))
      } catch {
        // Keep original
      }

      const duration = msg.call_duration || 0

      calls.push({
        caller: sender,
        callType: isVideoCall ? "video" : "audio",
        duration: duration,
        timestamp: msg.timestamp_ms || Date.now(),
        wasAnswered: duration > 0,
      })
    }
  }

  return calls
}

function analyzeCallData(calls: CallData[], participants: string[]): CallInsights | undefined {
  if (calls.length === 0) return undefined

  const callsBySender: Record<string, number> = {}
  const durationBySender: Record<string, number> = {}
  const rejectedCallsBySender: Record<string, number> = {}
  const callHourlyMap = new Map<number, number>()

  for (let i = 0; i < 24; i++) {
    callHourlyMap.set(i, 0)
  }

  let totalDuration = 0
  let audioCalls = 0
  let videoCalls = 0
  let missedCalls = 0
  let answeredCalls = 0
  let longestCall = { duration: 0, date: "", caller: "" }

  for (const call of calls) {
    // Count by sender (who initiated)
    callsBySender[call.caller] = (callsBySender[call.caller] || 0) + 1
    durationBySender[call.caller] = (durationBySender[call.caller] || 0) + call.duration

    // Count call types
    if (call.callType === "video") {
      videoCalls++
    } else {
      audioCalls++
    }

    if (!call.wasAnswered) {
      missedCalls++
      // Find the other participant who didn't answer
      const otherPerson = participants.find((p) => p !== call.caller) || "Unknown"
      rejectedCallsBySender[otherPerson] = (rejectedCallsBySender[otherPerson] || 0) + 1
    } else {
      answeredCalls++
    }

    // Total duration
    totalDuration += call.duration

    // Longest call
    if (call.duration > longestCall.duration) {
      longestCall = {
        duration: call.duration,
        date: new Date(call.timestamp).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        caller: call.caller,
      }
    }

    // Hourly activity
    const hour = new Date(call.timestamp).getHours()
    callHourlyMap.set(hour, (callHourlyMap.get(hour) || 0) + 1)
  }

  const callHourlyActivity: HourlyActivity[] = []
  for (let h = 0; h < 24; h++) {
    callHourlyActivity.push({ hour: h, count: callHourlyMap.get(h) || 0 })
  }

  const averageCallDuration = answeredCalls > 0 ? Math.round(totalDuration / answeredCalls) : 0

  return {
    totalCalls: calls.length,
    totalDuration,
    callsBySender,
    durationBySender,
    audioCalls,
    videoCalls,
    missedCalls,
    rejectedCallsBySender,
    answeredCalls,
    longestCall,
    callHourlyActivity,
    averageCallDuration,
  }
}

function calculateRelationshipScores(
  messages: RawMessage[],
  messageStats: MessageStats[],
  hourlyActivity: HourlyActivity[],
  sentimentBySender: Record<string, SentimentData>,
  dailyMessages: Map<string, number>,
  calls?: CallData[],
): RelationshipScores | undefined {
  if (messageStats.length < 2) return undefined

  const participants = messageStats.map((s) => s.sender)

  // Calculate Vibe Check Score (0-100)
  // Based on: message balance, sentiment positivity, response patterns
  const messageBalance =
    Math.min(messageStats[0].count, messageStats[1].count) / Math.max(messageStats[0].count, messageStats[1].count)

  const avgPositiveSentiment =
    Object.values(sentimentBySender).reduce((sum, s) => sum + s.positive, 0) / Object.values(sentimentBySender).length

  const emojiRatio =
    (messageStats[0].emojiCount + messageStats[1].emojiCount) / (messageStats[0].count + messageStats[1].count)

  const vibeCheckScore = Math.round(
    messageBalance * 30 + // 30% weight for balance
      avgPositiveSentiment * 0.5 + // 50% weight for positive sentiment
      Math.min(emojiRatio * 100, 20), // 20% weight for emoji usage, capped at 20
  )

  const vibeRating =
    vibeCheckScore >= 80
      ? "Amazing Vibes!"
      : vibeCheckScore >= 60
        ? "Great Connection"
        : vibeCheckScore >= 40
          ? "Good Friends"
          : vibeCheckScore >= 20
            ? "Getting There"
            : "Just Starting"

  // Communication Style / Love Language
  const totalMessages = messageStats[0].count + messageStats[1].count
  const totalCallTime = calls ? calls.reduce((sum, c) => sum + c.duration, 0) : 0
  const callVsText =
    totalCallTime > 0 ? Math.round((totalCallTime / 60 / (totalCallTime / 60 + totalMessages)) * 100) : 0

  const avgWordsPerMsg = (messageStats[0].avgWordsPerMessage + messageStats[1].avgWordsPerMessage) / 2
  const avgMessageLength: "short" | "medium" | "long" =
    avgWordsPerMsg < 5 ? "short" : avgWordsPerMsg < 15 ? "medium" : "long"

  const totalEmojis = messageStats[0].emojiCount + messageStats[1].emojiCount
  const emojiUsage: "low" | "moderate" | "high" = emojiRatio < 0.1 ? "low" : emojiRatio < 0.3 ? "moderate" : "high"

  // Determine love language based on patterns
  let loveLanguage = "Quality Time"
  if (callVsText > 30) {
    loveLanguage = "Quality Time (Calls)"
  } else if (avgMessageLength === "long") {
    loveLanguage = "Words of Affirmation"
  } else if (emojiUsage === "high") {
    loveLanguage = "Acts of Expression"
  } else if (totalMessages / dailyMessages.size > 50) {
    loveLanguage = "Constant Connection"
  }

  // Consistency Score (0-100)
  const totalDays = dailyMessages.size
  const sortedDates = Array.from(dailyMessages.keys()).sort()

  if (sortedDates.length < 2) {
    return {
      vibeCheckScore,
      vibeRating,
      communicationStyle: { callVsText, avgMessageLength, emojiUsage, loveLanguage },
      consistencyScore: 100,
      consistencyStreak: 1,
      dailyActivityMap: Object.fromEntries(dailyMessages),
      energyMatch: { score: 100, peakHourA: 12, peakHourB: 12, matchType: "In Sync" },
    }
  }

  const firstDate = new Date(sortedDates[0])
  const lastDate = new Date(sortedDates[sortedDates.length - 1])
  const daySpan = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const consistencyScore = Math.round((totalDays / daySpan) * 100)

  // Current streak
  let currentStreak = 1
  const today = new Date().toISOString().split("T")[0]
  for (let i = sortedDates.length - 1; i > 0; i--) {
    const currDate = new Date(sortedDates[i])
    const prevDate = new Date(sortedDates[i - 1])
    const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays === 1) {
      currentStreak++
    } else {
      break
    }
  }

  // Energy Match - compare peak activity hours per person
  const hourlyByPerson: Record<string, Map<number, number>> = {}
  for (const p of participants) {
    hourlyByPerson[p] = new Map()
    for (let h = 0; h < 24; h++) {
      hourlyByPerson[p].set(h, 0)
    }
  }

  for (const msg of messages) {
    const hour = new Date(msg.timestamp).getHours()
    const personMap = hourlyByPerson[msg.sender]
    if (personMap) {
      personMap.set(hour, (personMap.get(hour) || 0) + 1)
    }
  }

  const getPeakHour = (hourMap: Map<number, number>) => {
    let peakHour = 12
    let peakCount = 0
    for (const [hour, count] of hourMap) {
      if (count > peakCount) {
        peakCount = count
        peakHour = hour
      }
    }
    return peakHour
  }

  const peakHourA = getPeakHour(hourlyByPerson[participants[0]] || new Map())
  const peakHourB = getPeakHour(hourlyByPerson[participants[1]] || new Map())

  const hourDiff = Math.abs(peakHourA - peakHourB)
  const energyMatchScore = Math.round(Math.max(0, 100 - hourDiff * 8))

  const isNightOwlA = peakHourA >= 21 || peakHourA <= 4
  const isNightOwlB = peakHourB >= 21 || peakHourB <= 4
  const isEarlyBirdA = peakHourA >= 5 && peakHourA <= 9
  const isEarlyBirdB = peakHourB >= 5 && peakHourB <= 9

  let matchType = "Different Schedules"
  if (hourDiff <= 2) {
    if (isNightOwlA && isNightOwlB) matchType = "Night Owls Together"
    else if (isEarlyBirdA && isEarlyBirdB) matchType = "Early Birds"
    else matchType = "Perfectly In Sync"
  } else if (hourDiff <= 4) {
    matchType = "Close Enough"
  } else if ((isNightOwlA && isEarlyBirdB) || (isNightOwlB && isEarlyBirdA)) {
    matchType = "Opposite Schedules"
  }

  return {
    vibeCheckScore,
    vibeRating,
    communicationStyle: { callVsText, avgMessageLength, emojiUsage, loveLanguage },
    consistencyScore,
    consistencyStreak: currentStreak,
    dailyActivityMap: Object.fromEntries(dailyMessages),
    energyMatch: {
      score: energyMatchScore,
      peakHourA,
      peakHourB,
      matchType,
    },
  }
}

export function parseContent(content: string, platform: Platform): { messages: RawMessage[]; calls: CallData[] } {
  // Try to detect if it's WhatsApp TXT format
  if (platform === "whatsapp") {
    // A JSON export starts with a brace or bracket followed by JSON; anything else is the text export.
    const looksLikeTxt = !/^\s*[{\[]\s*["{\[\]}]/.test(content)
    if (looksLikeTxt) {
      return { messages: parseWhatsAppTxt(content), calls: [] }
    }
  }

  // Try JSON parsing
  try {
    const jsonData = JSON.parse(content)
    let messages: RawMessage[]
    let calls: CallData[] = []

    switch (platform) {
      case "messenger":
        messages = parseMessenger(jsonData)
        calls = extractCallsFromMessenger(jsonData)
        break
      case "instagram":
        messages = parseInstagram(jsonData)
        calls = extractCallsFromMessenger(jsonData)
        break
      case "whatsapp":
        messages = parseWhatsApp(jsonData)
        break
      case "discord":
        messages = parseDiscord(jsonData)
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    return { messages, calls }
  } catch (e) {
    if (platform === "whatsapp") {
      return { messages: parseWhatsAppTxt(content), calls: [] }
    }
    throw e
  }
}

export function mergeMessages(allMessages: RawMessage[][]): RawMessage[] {
  const merged: RawMessage[] = []
  for (const arr of allMessages) {
    for (const msg of arr) {
      merged.push(msg)
    }
  }

  // Sort by timestamp
  merged.sort((a, b) => a.timestamp - b.timestamp)

  // Remove duplicates iteratively
  const seen = new Set<string>()
  const unique: RawMessage[] = []

  for (const msg of merged) {
    const key = `${msg.timestamp}-${msg.sender}-${msg.content.slice(0, 50)}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(msg)
    }
  }

  return unique
}

export function mergeCalls(allCalls: CallData[][]): CallData[] {
  const merged: CallData[] = []
  for (const arr of allCalls) {
    for (const call of arr) {
      merged.push(call)
    }
  }

  merged.sort((a, b) => a.timestamp - b.timestamp)

  // Remove duplicates
  const seen = new Set<string>()
  const unique: CallData[] = []

  for (const call of merged) {
    const key = `${call.timestamp}-${call.caller}-${call.duration}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(call)
    }
  }

  return unique
}

export function analyzeMessages(messages: RawMessage[], platform: Platform, calls?: CallData[]): ChatAnalysis {
  if (messages.length === 0) {
    throw new Error("No messages found in the file(s). Please check the format.")
  }

  const participantSet = new Set<string>()
  for (const m of messages) {
    participantSet.add(m.sender)
  }
  const participants = Array.from(participantSet).slice(0, 10)

  let minTimestamp = messages[0].timestamp
  let maxTimestamp = messages[0].timestamp
  for (const m of messages) {
    if (m.timestamp < minTimestamp) minTimestamp = m.timestamp
    if (m.timestamp > maxTimestamp) maxTimestamp = m.timestamp
  }

  const startDate = new Date(minTimestamp)
  const endDate = new Date(maxTimestamp)
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

  const statsMap = new Map<
    string,
    {
      count: number
      wordCount: number
      emojiCount: number
      sentiments: { positive: number; negative: number; neutral: number }
      phrases: Map<string, number>
      conversationsStarted: number
    }
  >()

  for (const p of participants) {
    statsMap.set(p, {
      count: 0,
      wordCount: 0,
      emojiCount: 0,
      sentiments: { positive: 0, negative: 0, neutral: 0 },
      phrases: new Map(),
      conversationsStarted: 0,
    })
  }

  const hourlyMap = new Map<number, number>()
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, 0)
  }

  const dailyMessages = new Map<string, number>()
  const emojiCounts = new Map<string, number>()
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu

  let prevTimestamp = 0
  let prevSender = ""

  const phrasesSampleRate = messages.length > 10000 ? 10 : messages.length > 5000 ? 5 : 3

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const stats = statsMap.get(msg.sender)
    if (!stats) continue

    stats.count++

    const words = msg.content.split(/\s+/).filter((w) => w.length > 0)
    stats.wordCount += words.length
    stats.emojiCount += countEmojis(msg.content)

    const sentiment = analyzeSentiment(msg.content)
    stats.sentiments[sentiment]++

    if (i % phrasesSampleRate === 0) {
      const phrases = extractPhrases(msg.content)
      for (const phrase of phrases) {
        stats.phrases.set(phrase, (stats.phrases.get(phrase) || 0) + 1)
      }
    }

    const hour = new Date(msg.timestamp).getHours()
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)

    const dateKey = new Date(msg.timestamp).toISOString().split("T")[0]
    dailyMessages.set(dateKey, (dailyMessages.get(dateKey) || 0) + 1)

    // Extract emojis - sample for large files
    if (i % 2 === 0 || messages.length < 5000) {
      const emojis = msg.content.match(emojiRegex) || []
      for (const emoji of emojis) {
        emojiCounts.set(emoji, (emojiCounts.get(emoji) || 0) + 1)
      }
    }

    const timeSinceLastMessage = msg.timestamp - prevTimestamp
    if (timeSinceLastMessage > 4 * 60 * 60 * 1000 || prevSender === "") {
      stats.conversationsStarted++
    }

    prevTimestamp = msg.timestamp
    prevSender = msg.sender
  }

  const messageStats: MessageStats[] = participants
    .map((sender) => {
      const stats = statsMap.get(sender)!
      return {
        sender,
        count: stats.count,
        wordCount: stats.wordCount,
        avgWordsPerMessage: stats.count > 0 ? Math.round((stats.wordCount / stats.count) * 10) / 10 : 0,
        emojiCount: stats.emojiCount,
      }
    })
    .sort((a, b) => b.count - a.count)

  const sentimentBySender: Record<string, SentimentData> = {}
  for (const [sender, stats] of statsMap) {
    const total = stats.sentiments.positive + stats.sentiments.negative + stats.sentiments.neutral
    if (total > 0) {
      sentimentBySender[sender] = {
        positive: Math.round((stats.sentiments.positive / total) * 100),
        negative: Math.round((stats.sentiments.negative / total) * 100),
        neutral: Math.round((stats.sentiments.neutral / total) * 100),
      }
    } else {
      sentimentBySender[sender] = { positive: 33, negative: 33, neutral: 34 }
    }
  }

  const hourlyActivity: HourlyActivity[] = []
  for (let h = 0; h < 24; h++) {
    hourlyActivity.push({ hour: h, count: hourlyMap.get(h) || 0 })
  }

  const allPhrases: SignaturePhrase[] = []
  for (const [sender, stats] of statsMap) {
    const phraseEntries: [string, number][] = []
    for (const [phrase, count] of stats.phrases) {
      if (count >= 3 && phrase.length > 3) {
        phraseEntries.push([phrase, count])
      }
    }
    phraseEntries.sort((a, b) => b[1] - a[1])
    const top10 = phraseEntries.slice(0, 10)
    for (const [phrase, count] of top10) {
      allPhrases.push({ phrase, count, sender })
    }
  }
  allPhrases.sort((a, b) => b.count - a.count)
  const signaturePhrases = allPhrases.slice(0, 12)

  const sortedDates = Array.from(dailyMessages.keys()).sort()
  let longestStreak = 0
  let currentStreak = 1
  let streakStart = sortedDates[0] || ""
  let longestStreakStart = streakStart
  let longestStreakEnd = streakStart

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1])
    const currDate = new Date(sortedDates[i])
    const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      currentStreak++
    } else {
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak
        longestStreakStart = streakStart
        longestStreakEnd = sortedDates[i - 1]
      }
      currentStreak = 1
      streakStart = sortedDates[i]
    }
  }
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak
    longestStreakStart = streakStart
    longestStreakEnd = sortedDates[sortedDates.length - 1] || streakStart
  }

  const topEmojis: { emoji: string; count: number }[] = []
  const emojiEntries = Array.from(emojiCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  for (const [emoji, count] of emojiEntries) {
    topEmojis.push({ emoji, count })
  }

  let totalResponseTime = 0
  let responseCount = 0
  const sampleSize = Math.min(messages.length, 2000)
  for (let i = 1; i < sampleSize; i++) {
    if (messages[i].sender !== messages[i - 1].sender) {
      const responseTime = (messages[i].timestamp - messages[i - 1].timestamp) / (1000 * 60)
      if (responseTime > 0 && responseTime < 60) {
        totalResponseTime += responseTime
        responseCount++
      }
    }
  }
  const avgResponseTime = responseCount > 0 ? Math.round((totalResponseTime / responseCount) * 10) / 10 : 5

  const conversationStarters: Record<string, number> = {}
  for (const [sender, stats] of statsMap) {
    conversationStarters[sender] = stats.conversationsStarted
  }

  let busiestDay = { date: "", count: 0 }
  for (const [date, count] of dailyMessages) {
    if (count > busiestDay.count) {
      busiestDay = { date, count }
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  const callInsights = calls && calls.length > 0 ? analyzeCallData(calls, participants) : undefined

  const relationshipScores = calculateRelationshipScores(
    messages,
    messageStats.slice(0, 2),
    hourlyActivity,
    sentimentBySender,
    dailyMessages,
    calls,
  )

  return {
    platform,
    participants: participants.slice(0, 2),
    dateRange: {
      start: formatDate(startDate.toISOString().split("T")[0]),
      end: formatDate(endDate.toISOString().split("T")[0]),
    },
    totalMessages: messages.length,
    totalDays,
    messageStats: messageStats.slice(0, 2),
    sentimentBySender,
    hourlyActivity,
    signaturePhrases,
    longestStreak: {
      days: longestStreak,
      startDate: formatDate(longestStreakStart),
      endDate: formatDate(longestStreakEnd),
    },
    topEmojis,
    avgResponseTime,
    conversationStarters,
    busiestDay: {
      date: formatDate(busiestDay.date),
      count: busiestDay.count,
    },
    callInsights,
    relationshipScores, // Include relationship scores in output
  }
}
