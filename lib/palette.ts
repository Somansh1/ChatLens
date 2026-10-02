// Colours for the two participants, in the order they appear in the analysis.
// They are CSS variables so each surface tone can supply a readable shade (see globals.css).
export const PERSON = ["var(--a)", "var(--b)"]

export const SENTIMENT = {
  positive: "#8fd44f",
  neutral: "#8a8474",
  negative: "#a8321f",
}

export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM"
  if (hour === 12) return "12 PM"
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`
}

export const firstName = (name?: string) => name?.split(" ")[0] ?? ""
