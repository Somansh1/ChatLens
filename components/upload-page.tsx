"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Upload, MessageCircle, Instagram, MessageSquare, Hash, AlertCircle, FileText, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo, Shape } from "@/components/panel"
import type { Platform, ChatAnalysis, CallData } from "@/lib/types"
import { parseContent, mergeMessages, mergeCalls, analyzeMessages } from "@/lib/process-chat"
import { generateSampleChat } from "@/lib/sample-chat"

interface UploadPageProps {
  onAnalysisComplete: (data: ChatAnalysis) => void
}

const platforms: {
  id: Platform
  name: string
  icon: React.ReactNode
  hint: string
  multiFile?: boolean
  acceptTypes: string
  comingSoon?: boolean
}[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: <MessageCircle className="size-5" />,
    hint: "Open the chat, tap More, then Export chat (without media). Upload the .txt file.",
    acceptTypes: ".txt,.json",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="size-5" />,
    hint: "Download your information as JSON, then upload every message_*.json file from the chat folder.",
    multiFile: true,
    acceptTypes: ".json",
  },
  {
    id: "messenger",
    name: "Messenger",
    icon: <MessageSquare className="size-5" />,
    hint: "Download your information as JSON, then upload every message_*.json file from the chat folder.",
    multiFile: true,
    acceptTypes: ".json",
  },
  {
    id: "discord",
    name: "Discord",
    icon: <Hash className="size-5" />,
    hint: "Coming soon",
    acceptTypes: ".json",
    comingSoon: true,
  },
]

const steps = [
  { title: "Export", text: "Export a chat from WhatsApp, Instagram or Messenger." },
  { title: "Drop", text: "Drop the file below. Your browser reads it; nothing is uploaded." },
  { title: "Explore", text: "See who talks more, when, and what you say most." },
]

// Let the browser paint the progress text before the next heavy step runs.
const tick = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms))

export function UploadPage({ onAnalysisComplete }: UploadPageProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>("whatsapp")
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [processingProgress, setProcessingProgress] = useState<string>("")

  const selectedPlatformData = platforms.find((p) => p.id === selectedPlatform)

  const handleFilesSelected = (files: File[]) => {
    if (!selectedPlatform) {
      setError("Please select a platform first")
      return
    }
    setError(null)

    if (selectedPlatformData?.multiFile) {
      setUploadedFiles((prev) => [...prev, ...files])
    } else {
      setUploadedFiles(files.slice(0, 1))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) handleFilesSelected(files)
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const analyze = async (sources: { name: string; read: () => Promise<string> }[], platform: Platform) => {
    setIsProcessing(true)
    setError(null)

    try {
      const allMessages: Array<{ sender: string; content: string; timestamp: number }> = []
      const allCalls: CallData[] = []

      for (let i = 0; i < sources.length; i++) {
        setProcessingProgress(`Reading ${sources[i].name} (${i + 1} of ${sources.length})...`)
        await tick()
        const text = await sources[i].read()

        try {
          const { messages, calls } = parseContent(text, platform)
          for (const msg of messages) allMessages.push(msg)
          for (const call of calls) allCalls.push(call)
        } catch (err) {
          console.warn(`Failed to parse ${sources[i].name}:`, err)
        }
      }

      if (allMessages.length === 0) {
        throw new Error("No valid messages found in the uploaded file(s). Please check the format.")
      }

      setProcessingProgress(`Analyzing ${allMessages.length.toLocaleString()} messages...`)
      await tick(50)

      const analysis = analyzeMessages(mergeMessages([allMessages]), platform, mergeCalls([allCalls]))

      if (analysis.totalMessages < 10) {
        throw new Error("Not enough messages found. Please make sure you uploaded the correct chat export file(s).")
      }

      onAnalysisComplete(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file(s)")
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
      setProcessingProgress("")
    }
  }

  const processFiles = () => {
    if (!selectedPlatform || uploadedFiles.length === 0) {
      setError("Please select a platform and upload at least one file")
      return
    }
    analyze(
      uploadedFiles.map((file) => ({ name: file.name, read: () => file.text() })),
      selectedPlatform,
    )
  }

  const runSample = () => analyze([{ name: "sample chat", read: async () => generateSampleChat() }], "whatsapp")

  // "?demo" opens straight into the sample analysis, for sharing a link to a live example.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("demo")) runSample()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) handleFilesSelected(Array.from(files))
    e.target.value = ""
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo />
          <p className="eyebrow hidden text-muted-foreground sm:block">Runs entirely in your browser</p>
        </div>
      </header>

      <main className="flex-1 px-4 pb-16 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-3">
          {/* Hero */}
          <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
            <div className="reveal flex flex-col justify-between gap-10 py-6 lg:py-10">
              <h1 className="display text-balance text-6xl sm:text-7xl lg:text-[6.5rem]">
                Your chat,
                <br />
                by the{" "}
                <span className="relative inline-block whitespace-nowrap px-2 text-ink">
                  <span className="absolute inset-x-0 bottom-[0.06em] top-[0.12em] -rotate-1 bg-yellow" aria-hidden="true" />
                  <span className="relative">numbers.</span>
                </span>
              </h1>
              <div>
                <p className="max-w-lg text-pretty text-lg text-muted-foreground">
                  Drop in a WhatsApp, Instagram or Messenger export and find out who texts more, when you talk and what
                  you say most. The file never leaves your device.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <button
                    onClick={runSample}
                    disabled={isProcessing}
                    className="h-14 rounded-full bg-yellow px-8 text-lg font-semibold text-ink transition hover:bg-cream disabled:opacity-60"
                  >
                    {isProcessing ? "Analyzing..." : "Try a sample chat"}
                  </button>
                  <a href="#upload" className="font-semibold underline decoration-2 underline-offset-4 hover:text-yellow">
                    or upload your own
                  </a>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  The sample is a made-up chat, generated in your browser and run through the real analysis.
                </p>
              </div>
            </div>

            <HeroMosaic />
          </div>

          {/* How it works: a ruled, numbered row rather than three cards */}
          <ol className="reveal grid gap-x-8 border-y border-line sm:grid-cols-3" style={{ animationDelay: "80ms" }}>
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-4 border-line py-5 max-sm:border-t max-sm:first:border-t-0">
                <span className="display text-4xl text-yellow">{i + 1}</span>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Uploader */}
          <section
            id="upload"
            className="tone-cream block-surface reveal scroll-mt-6 p-6 sm:p-8"
            style={{ animationDelay: "140ms" }}
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
              <div>
                <h2 className="display text-4xl sm:text-5xl">Upload your own</h2>
                <p className="eyebrow mb-3 mt-6 text-muted-foreground">Where is the chat from?</p>
                <div className="grid grid-cols-2 gap-2">
                  {platforms.map((platform) => {
                    const active = selectedPlatform === platform.id
                    return (
                      <button
                        key={platform.id}
                        onClick={() => {
                          setSelectedPlatform(platform.id)
                          setError(null)
                          setUploadedFiles([])
                        }}
                        disabled={platform.comingSoon}
                        aria-pressed={active}
                        className={cn(
                          "flex items-center gap-2.5 rounded-full border-2 px-4 py-2.5 text-left text-sm font-semibold transition",
                          platform.comingSoon
                            ? "cursor-not-allowed border-line opacity-40"
                            : active
                              ? "border-ink bg-ink text-cream"
                              : "border-line hover:border-ink",
                        )}
                      >
                        {platform.icon}
                        {platform.name}
                        {platform.comingSoon && <span className="ml-auto text-xs font-normal">Soon</span>}
                      </button>
                    )
                  })}
                </div>
                {selectedPlatformData && (
                  <p className="mt-4 border-t border-line pt-4 text-sm text-muted-foreground">
                    <span className="font-semibold text-ink">How to export: </span>
                    {selectedPlatformData.hint}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="file-upload"
                  className={cn(
                    "flex h-full min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
                    isDragging ? "border-ink bg-yellow" : "border-ink/40 hover:border-ink",
                    isProcessing && "pointer-events-none opacity-60",
                    !selectedPlatform && "cursor-not-allowed opacity-50",
                    uploadedFiles.length > 0 && "h-auto min-h-0 py-6",
                  )}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  {isProcessing ? (
                    <div className="mb-3 size-8 animate-spin rounded-full border-[3px] border-ink border-t-transparent" />
                  ) : (
                    <Upload className="mb-3 size-8" />
                  )}
                  <p className="text-lg font-semibold" aria-live="polite">
                    {isProcessing ? processingProgress || "Analyzing your chats..." : "Drop your chat export here"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {!selectedPlatform
                      ? "Select a platform to get started"
                      : selectedPlatformData?.multiFile
                        ? "or click to browse. You can select several files at once"
                        : "or click to browse"}
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    accept={selectedPlatformData?.acceptTypes || ".json,.txt"}
                    multiple={selectedPlatformData?.multiFile}
                    className="sr-only"
                    onChange={handleFileSelect}
                    disabled={isProcessing || !selectedPlatform}
                  />
                </label>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <p className="font-semibold">
                        {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} selected
                      </p>
                      {selectedPlatformData?.multiFile && (
                        <label
                          htmlFor="add-more-files"
                          className="flex cursor-pointer items-center gap-1 text-xs font-semibold underline underline-offset-2"
                        >
                          <Plus className="size-3" /> Add more
                          <input
                            id="add-more-files"
                            type="file"
                            accept={selectedPlatformData.acceptTypes}
                            multiple
                            className="sr-only"
                            onChange={handleFileSelect}
                          />
                        </label>
                      )}
                    </div>
                    <ul className="max-h-32 overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between border-t border-line py-2 text-sm"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <FileText className="size-4 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </span>
                          <button onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`} className="ml-2">
                            <X className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={processFiles}
                      disabled={isProcessing}
                      className="mt-3 h-12 w-full rounded-full bg-ink font-semibold text-cream transition hover:bg-coral hover:text-ink disabled:opacity-60"
                    >
                      {isProcessing ? "Processing..." : "Analyze chat"}
                    </button>
                  </div>
                )}

                {error && (
                  <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl bg-coral p-4 text-sm text-ink">
                    <AlertCircle className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Unable to process file</p>
                      <p className="mt-1">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-line px-6 py-5 text-center text-sm text-muted-foreground">
        Your chats never leave this device. Parsing and analysis run locally in JavaScript.
      </footer>
    </div>
  )
}

// Poster-style preview of what the analysis shows. The figures are illustrative.
function HeroMosaic() {
  const hours = [2, 1, 1, 1, 1, 2, 3, 4, 4, 3, 4, 5, 5, 4, 4, 5, 6, 8, 10, 12, 14, 12, 8, 4]
  return (
    <div
      className="reveal grid min-h-80 grid-cols-5 sm:min-h-[26rem] grid-rows-[1.25fr_1fr] gap-3"
      style={{ animationDelay: "60ms" }}
      aria-hidden="true"
    >
      <div className="tone-coral block-surface relative col-span-3 flex flex-col justify-between overflow-hidden p-5">
        <Shape kind="ring" className="-bottom-12 -right-10 size-48 opacity-15" />
        <p className="eyebrow">Who texts more</p>
        <p className="display relative text-6xl sm:text-8xl">58%</p>
      </div>
      <div className="tone-teal block-surface relative col-span-2 flex flex-col justify-between overflow-hidden p-5">
        <Shape kind="burst" className="-right-8 -top-8 size-32 opacity-15" />
        <p className="eyebrow">&nbsp;</p>
        <p className="display relative text-4xl sm:text-6xl">42%</p>
      </div>
      <div className="tone-ink block-surface col-span-2 flex flex-col justify-between p-5">
        <p className="eyebrow text-muted-foreground">Peak hour</p>
        <div className="flex h-14 items-end gap-[3px]">
          {hours.map((h, i) => (
            <div key={i} className="flex-1" style={{ height: `${h * 7}%`, background: h === 14 ? "var(--yellow)" : "var(--track)" }} />
          ))}
        </div>
        <p className="display text-4xl">9 PM</p>
      </div>
      <div className="tone-yellow block-surface col-span-3 flex flex-col justify-between p-5">
        <p className="eyebrow">Vibe check</p>
        <div className="flex items-end justify-between">
          <p className="display text-6xl sm:text-8xl">87</p>
          <p className="text-2xl leading-none sm:text-4xl">😂❤️🍕</p>
        </div>
      </div>
    </div>
  )
}
