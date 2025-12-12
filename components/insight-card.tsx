import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface InsightCardProps {
  title: string
  value: string
  description: string
  variant?: "rose" | "amber" | "cyan" | "emerald" | "violet"
}

export function InsightCard({ title, value, description, variant = "rose" }: InsightCardProps) {
  const variants = {
    rose: "bg-rose-50 border-rose-200",
    amber: "bg-amber-50 border-amber-200",
    cyan: "bg-cyan-50 border-cyan-200",
    emerald: "bg-emerald-50 border-emerald-200",
    violet: "bg-violet-50 border-violet-200",
  }

  const iconColors = {
    rose: "text-rose-500",
    amber: "text-amber-500",
    cyan: "text-cyan-500",
    emerald: "text-emerald-500",
    violet: "text-violet-500",
  }

  return (
    <Card className={cn("border shadow-sm", variants[variant])}>
      <CardContent className="p-5">
        <p className={cn("text-sm font-medium mb-1", iconColors[variant])}>{title}</p>
        <p className="text-2xl font-bold mb-2 text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
