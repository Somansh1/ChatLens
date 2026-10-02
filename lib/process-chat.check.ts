// Self-check for the WhatsApp text parser. Run with: npx tsx lib/process-chat.check.ts
import assert from "node:assert"
import { parseWhatsAppTxt } from "./process-chat"

const at = (y: number, mo: number, d: number, h: number, mi: number, s = 0) => new Date(y, mo - 1, d, h, mi, s).getTime()

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
