// Self-check for the WhatsApp text parser. Run with: npx tsx lib/process-chat.check.ts
import assert from "node:assert"
import { analyzeMessages, mergeMessages, parseWhatsAppTxt } from "./process-chat"

const at = (y: number, mo: number, d: number, h: number, mi: number, s = 0) => new Date(y, mo - 1, d, h, mi, s).getTime()

// Runs each case, reports every failure, then exits non-zero if any failed.
let failed = 0
const check = (name: string, fn: () => void) => {
  try {
    fn()
  } catch (e) {
    failed++
    console.error(`FAIL ${name}:`, (e as Error).message.split(/\r?\n/)[0])
  }
}

const CRLF = String.fromCharCode(13, 10)
const NARROW_SPACE = String.fromCharCode(0x202f) // iOS puts this before AM/PM
const LTR_MARK = String.fromCharCode(0x200e) // iOS puts this before attachment lines

// iOS: brackets, seconds, AM/PM, invisible marks, a multi-line message, a sender-less system line.
const ios = parseWhatsAppTxt(
  [
    "Messages and calls are end-to-end encrypted.",
    `[10/15/25, 2:17:39${NARROW_SPACE}PM] Asha: first line`,
    "second line",
    `${LTR_MARK}[10/15/25, 2:18:02 PM] Asha: ${LTR_MARK}image omitted`,
    "[10/16/25, 9:00:00 AM] Asha changed the group name",
    "[10/17/25, 12:05:00 AM] You: ok: fine",
  ].join(CRLF),
)
assert.deepStrictEqual(ios, [
  { sender: "Asha", content: "first line\nsecond line", timestamp: at(2025, 10, 15, 14, 17, 39) },
  { sender: "You", content: "ok: fine", timestamp: at(2025, 10, 17, 0, 5) },
])

// Android: day first, 24-hour clock, dash separator. 3/11 is ambiguous alone; 15/10 settles day-first.
const android = parseWhatsAppTxt(
  [
    "15/10/2025, 14:17 - Messages and calls are end-to-end encrypted. Tap to learn more.",
    "15/10/2025, 14:17 - Asha: hello",
    "3/11/2025, 09:00 - Ravi: hi",
    "3/11/2025, 09:01 - Ravi: <Media omitted>",
  ].join("\n"),
)
assert.deepStrictEqual(
  android.map((m) => [m.sender, m.content, m.timestamp]),
  [
    ["Asha", "hello", at(2025, 10, 15, 14, 17)],
    ["Ravi", "hi", at(2025, 11, 3, 9, 0)],
  ],
)

// Other separators: dots in dates, lower-case am/pm.
const dotted = parseWhatsAppTxt("15.10.25, 9:05 pm - Asha: hey")
assert.strictEqual(dotted[0].timestamp, at(2025, 10, 15, 21, 5))

console.log("whatsapp parser checks passed")

// Bug 1: one order everywhere. Mira speaks first but Theo sends more, so Theo must be first in
// participants, messageStats and the peak hours, whatever order people first appear in.
check("bug 1 order", () => {
  const chat = [
    { sender: "Mira", content: "morning", timestamp: at(2025, 3, 1, 8, 0) },
    { sender: "Theo", content: "late one", timestamp: at(2025, 3, 1, 22, 0) },
    { sender: "Theo", content: "another", timestamp: at(2025, 3, 1, 22, 10) },
    { sender: "Mira", content: "hello again", timestamp: at(2025, 3, 2, 8, 5) },
    { sender: "Theo", content: "night", timestamp: at(2025, 3, 2, 22, 5) },
    { sender: "Theo", content: "owl", timestamp: at(2025, 3, 2, 22, 30) },
    { sender: "Theo", content: "yes", timestamp: at(2025, 3, 3, 22, 45) },
  ]
  const a = analyzeMessages(chat, "whatsapp")
  assert.deepStrictEqual(a.participants, ["Theo", "Mira"])
  assert.deepStrictEqual(a.messageStats.map((s) => s.sender), a.participants)
  assert.strictEqual(a.relationshipScores?.energyMatch.peakHourA, 22) // Theo
  assert.strictEqual(a.relationshipScores?.energyMatch.peakHourB, 8) // Mira
})

// Bug 2: per-day numbers use local calendar dates. Built with local-time constructors, so it holds
// in any time zone; run it under TZ=Asia/Kolkata and TZ=America/Los_Angeles too.
check("bug 2 local days", () => {
  const chat = [
    { sender: "Asha", content: "just past midnight", timestamp: at(2025, 3, 5, 0, 15) },
    { sender: "Ravi", content: "still up", timestamp: at(2025, 3, 5, 0, 45) },
    { sender: "Asha", content: "late evening", timestamp: at(2025, 3, 5, 23, 50) },
    { sender: "Ravi", content: "next day", timestamp: at(2025, 3, 6, 0, 30) },
    { sender: "Asha", content: "third day", timestamp: at(2025, 3, 7, 0, 30) },
    { sender: "Ravi", content: "skip a day", timestamp: at(2025, 3, 9, 23, 30) },
  ]
  const a = analyzeMessages(chat, "whatsapp")
  assert.deepStrictEqual(a.relationshipScores?.dailyActivityMap, {
    "2025-03-05": 3,
    "2025-03-06": 1,
    "2025-03-07": 1,
    "2025-03-09": 1,
  })
  assert.strictEqual(a.busiestDay.date, "Mar 5, 2025")
  assert.strictEqual(a.busiestDay.count, 3)
  assert.strictEqual(a.longestStreak.days, 3)
  assert.strictEqual(a.longestStreak.startDate, "Mar 5, 2025")
  assert.strictEqual(a.longestStreak.endDate, "Mar 7, 2025")
  assert.strictEqual(a.dateRange.start, "Mar 5, 2025")
  assert.strictEqual(a.dateRange.end, "Mar 9, 2025")
  assert.strictEqual(a.relationshipScores?.consistencyScore, 80) // 4 active days of a 5-day span
})

// Bug 3: repeats inside one file are real; the same message in two overlapping files is not.
check("bug 3 dedupe", () => {
  const m = (content: string, ts: number) => ({ sender: "Asha", content, timestamp: ts })
  const minute = at(2025, 3, 5, 10, 0) // an export without seconds cannot tell these apart
  const twice = [m("ok", minute), m("ok", minute)]
  assert.strictEqual(mergeMessages([twice]).length, 2)
  assert.strictEqual(mergeMessages([[m("ok", minute)], [m("ok", minute)]]).length, 1) // overlap

  const f1 = [m("a", minute), m("ok", minute + 60000), m("ok", minute + 60000)]
  const f2 = [m("ok", minute + 60000), m("ok", minute + 60000), m("b", minute + 120000)]
  assert.deepStrictEqual(
    mergeMessages([f1, f2]).map((x) => x.content),
    ["a", "ok", "ok", "b"],
  )

  // Same text a few seconds apart (an export with seconds) stays two messages, even across files.
  assert.strictEqual(mergeMessages([[m("hey", minute)], [m("hey", minute + 5000)]]).length, 2)
})

if (failed) process.exit(1)
console.log("analysis checks passed")
