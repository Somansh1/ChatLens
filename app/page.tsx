"use client"

import { useState } from "react"
import { UploadPage } from "@/components/upload-page"
import { AnalysisDashboard } from "@/components/analysis-dashboard"
import type { ChatAnalysis } from "@/lib/types"

export default function Home() {
  const [analysisData, setAnalysisData] = useState<ChatAnalysis | null>(null)

  return analysisData ? (
    <AnalysisDashboard data={analysisData} onBack={() => setAnalysisData(null)} />
  ) : (
    <UploadPage onAnalysisComplete={setAnalysisData} />
  )
}
