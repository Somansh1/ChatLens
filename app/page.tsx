"use client"

import { useState } from "react"
import Snowfall from "react-snowfall"
import { UploadPage } from "@/components/upload-page"
import { AnalysisDashboard } from "@/components/analysis-dashboard"
import type { ChatAnalysis } from "@/lib/types"

export default function Home() {
  const [analysisData, setAnalysisData] = useState<ChatAnalysis | null>(null)

  return (
    <>
      <Snowfall
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          zIndex: 50,
          pointerEvents: "none",
        }}
        snowflakeCount={150}
      />
      {analysisData ? (
        <AnalysisDashboard data={analysisData} onBack={() => setAnalysisData(null)} />
      ) : (
        <UploadPage onAnalysisComplete={setAnalysisData} />
      )}
    </>
  )
}