// Builds a fictional WhatsApp TXT export so visitors can try the app without their own data.
// The text goes through the same parser and analysis as a real upload.

const A = "Aarav"
const B = "Mira"

// Relative weight of each hour of the day (0-23): quiet mornings, busy late evenings.
const HOUR_WEIGHTS = [5, 2, 1, 0, 0, 0, 1, 3, 5, 4, 3, 3, 5, 6, 4, 3, 4, 6, 8, 10, 13, 15, 14, 9]

const OPENERS = ["good morning ☀️", "hey you", "guess what happened", "you awake?", "coffee later? ☕", "missed you today"]
const LINES_A = [
  "on my way",
  "on my way, save me a seat",
  "that movie was amazing",
  "no way 😂",
  "no way that actually happened",
  "sounds perfect",
  "ugh traffic is terrible today",
  "love that idea",
  "haha you are the best",
  "sorry, running late again",
  "pizza tonight? 🍕",
  "this week has been exhausting",
  "great news, I got the tickets 🎉",
  "call you in ten",
  "so proud of you",
]
const LINES_B = [
  "tell me everything, I want the full story with all the details",
  "honestly that sounds wonderful, I am so happy for you 😊",
  "long day at work but the presentation went really well",
  "good night, sleep well 🌙",
  "good night ❤️",
  "can't wait for the weekend, we should go hiking if the weather is nice",
  "that is hilarious 😂😂",
  "I was thinking about what you said and I think you are right",
  "sad that the trip got cancelled, but we can plan another one soon",
  "you always make me laugh ❤️",
  "thank you for today, it was perfect ✨",
  "worried about the exam tomorrow, wish me luck",
  "pizza tonight sounds perfect 🍕",
  "bad signal here, will text when I am home",
  "beautiful sunset on the way back 🌅",
]

// Small deterministic PRNG so the sample looks the same on every visit.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateSampleChat(days = 150): string {
  const rand = mulberry32(42)
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)]
  const totalWeight = HOUR_WEIGHTS.reduce((a, b) => a + b, 0)
  const pickHour = () => {
    let r = rand() * totalWeight
    for (let h = 0; h < 24; h++) {
      r -= HOUR_WEIGHTS[h]
      if (r < 0) return h
    }
    return 21
  }

  const start = new Date(2025, 0, 6)
  const lines: string[] = []

  for (let d = 0; d < days; d++) {
    if (rand() < 0.08) continue // the occasional silent day breaks up streaks
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d)
    const weekend = date.getDay() === 0 || date.getDay() === 6
    const count = Math.floor((weekend ? 26 : 14) + rand() * 18)

    const stamps = Array.from({ length: count }, () => pickHour() * 60 + Math.floor(rand() * 60)).sort((x, y) => x - y)
    let sender = rand() < 0.6 ? A : B

    stamps.forEach((minutes, i) => {
      const text = i === 0 ? pick(OPENERS) : sender === A ? pick(LINES_A) : pick(LINES_B)
      const yy = String(date.getFullYear()).slice(2)
      const hh = String(Math.floor(minutes / 60)).padStart(2, "0")
      const mm = String(minutes % 60).padStart(2, "0")
      lines.push(`${date.getMonth() + 1}/${date.getDate()}/${yy}, ${hh}:${mm} - ${sender}: ${text}`)
      // Aarav sends more, shorter messages; Mira replies with fewer, longer ones.
      sender = rand() < (sender === A ? 0.42 : 0.72) ? A : B
    })
  }

  return lines.join("\n")
}
