"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, MessageCircle, Instagram, MessageSquare, Hash, AlertCircle, FileText, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Platform, ChatAnalysis, CallData } from "@/lib/types"
import { parseContent, mergeMessages, mergeCalls, analyzeMessages } from "@/lib/process-chat"

interface UploadPageProps {
  onAnalysisComplete: (data: ChatAnalysis) => void
}

const platforms: {
  id: Platform
  name: string
  icon: React.ReactNode
  color: string
  hint: string
  multiFile?: boolean
  acceptTypes: string
  comingSoon?: boolean
}[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: <MessageCircle className="h-6 w-6" />,
    color: "bg-emerald-100 text-emerald-600 border-emerald-300",
    hint: "Export chat as TXT from WhatsApp",
    acceptTypes: ".txt,.json",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="h-6 w-6" />,
    color: "bg-pink-100 text-pink-600 border-pink-300",
    hint: "Upload all message_*.json files",
    multiFile: true,
    acceptTypes: ".json",
  },
  {
    id: "messenger",
    name: "Messenger",
    icon: <MessageSquare className="h-6 w-6" />,
    color: "bg-blue-100 text-blue-600 border-blue-300",
    hint: "Upload all message_*.json files",
    multiFile: true,
    acceptTypes: ".json",
  },
  {
    id: "discord",
    name: "Discord",
    icon: <Hash className="h-6 w-6" />,
    color: "bg-indigo-100 text-indigo-600 border-indigo-300",
    hint: "Coming soon",
    acceptTypes: ".json",
    comingSoon: true,
  },
]

export function UploadPage({ onAnalysisComplete }: UploadPageProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [processingProgress, setProcessingProgress] = useState<string>("")

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFilesSelected(files)
      }
    },
    [selectedPlatform],
  )

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

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const processFiles = async () => {
    if (!selectedPlatform || uploadedFiles.length === 0) {
      setError("Please select a platform and upload at least one file")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const allMessages: Array<{ sender: string; content: string; timestamp: number }> = []
      const allCalls: CallData[] = []

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        setProcessingProgress(`Reading file ${i + 1} of ${uploadedFiles.length}...`)
        await new Promise((resolve) => setTimeout(resolve, 10))

        const text = await file.text()

        try {
          setProcessingProgress(`Parsing ${file.name}...`)
          await new Promise((resolve) => setTimeout(resolve, 10))

          const { messages, calls } = parseContent(text, selectedPlatform)

          if (messages.length > 0) {
            for (const msg of messages) {
              allMessages.push(msg)
            }
          }

          if (calls.length > 0) {
            for (const call of calls) {
              allCalls.push(call)
            }
          }
        } catch (err) {
          console.warn(`Failed to parse ${file.name}:`, err)
        }
      }

      if (allMessages.length === 0) {
        throw new Error("No valid messages found in the uploaded file(s). Please check the format.")
      }

      setProcessingProgress(`Merging ${allMessages.length.toLocaleString()} messages...`)
      await new Promise((resolve) => setTimeout(resolve, 50))

      const uniqueMessages = mergeMessages([allMessages])
      const uniqueCalls = mergeCalls([allCalls])

      setProcessingProgress(`Analyzing ${uniqueMessages.length.toLocaleString()} messages...`)
      await new Promise((resolve) => setTimeout(resolve, 50))

      const analysis = analyzeMessages(uniqueMessages, selectedPlatform, uniqueCalls)

      if (analysis.totalMessages < 10) {
        throw new Error("Not enough messages found. Please make sure you uploaded the correct chat export file(s).")
      }

      onAnalysisComplete(analysis)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process file(s)"
      setError(errorMessage)
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
      setProcessingProgress("")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFilesSelected(Array.from(files))
    }
    e.target.value = ""
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 bg-card">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-xl">ChatLens</span>
          </div>
          <p className="text-sm text-muted-foreground hidden sm:block">Discover patterns in your conversations</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-balance">See your chats in a whole new light</h1>
            <p className="text-lg text-muted-foreground text-pretty max-w-xl mx-auto">
              Upload your chat export and discover fascinating insights about your messaging patterns, favorite phrases,
              and conversation dynamics.
            </p>
          </div>

          {/* Platform Selection */}
          <div className="mb-8">
            <p className="text-sm font-medium text-muted-foreground mb-4 text-center">Select your messaging platform</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => {
                    if (platform.comingSoon) return
                    setSelectedPlatform(platform.id)
                    setError(null)
                    setUploadedFiles([])
                  }}
                  disabled={platform.comingSoon}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                    platform.comingSoon
                      ? "border-border bg-muted/50 cursor-not-allowed opacity-60"
                      : selectedPlatform === platform.id
                        ? platform.color
                        : "border-border bg-card hover:border-primary/30 hover:bg-primary/5",
                  )}
                >
                  {platform.comingSoon && (
                    <span className="absolute -top-2 -right-2 text-[10px] font-medium bg-muted-foreground/20 text-muted-foreground px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                  {platform.icon}
                  <span className="text-sm font-medium">{platform.name}</span>
                </button>
              ))}
            </div>
            {selectedPlatformData && !selectedPlatformData.comingSoon && (
              <p className="text-xs text-muted-foreground text-center mt-3">Tip: {selectedPlatformData.hint}</p>
            )}
          </div>

          {/* Upload Area */}
          <Card className="border-2 border-dashed border-primary/20 bg-card shadow-sm">
            <CardContent className="p-0">
              <label
                htmlFor="file-upload"
                className={cn(
                  "flex flex-col items-center justify-center p-12 cursor-pointer transition-all duration-200 rounded-xl",
                  isDragging && "bg-primary/5 border-primary",
                  isProcessing && "pointer-events-none opacity-50",
                  !selectedPlatform && "opacity-50 cursor-not-allowed",
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div
                  className={cn(
                    "h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-colors",
                    isDragging ? "bg-primary/20" : "bg-primary/10",
                  )}
                >
                  {isProcessing ? (
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload
                      className={cn("h-8 w-8 transition-colors", isDragging ? "text-primary" : "text-primary/70")}
                    />
                  )}
                </div>
                <p className="text-lg font-medium mb-2">
                  {isProcessing ? processingProgress || "Analyzing your chats..." : "Drop your chat export here"}
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  {!selectedPlatform
                    ? "Select a platform above to get started"
                    : selectedPlatformData?.multiFile
                      ? "You can select multiple files at once"
                      : "Click or drag to upload your file"}
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept={selectedPlatformData?.acceptTypes || ".json,.txt"}
                  multiple={selectedPlatformData?.multiFile}
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isProcessing || !selectedPlatform}
                />
              </label>
            </CardContent>
          </Card>

          {uploadedFiles.length > 0 && (
            <Card className="mt-4 bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">
                    {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} selected
                  </p>
                  {selectedPlatformData?.multiFile && (
                    <label htmlFor="add-more-files" className="cursor-pointer">
                      <span className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Add more
                      </span>
                      <input
                        id="add-more-files"
                        type="file"
                        accept={selectedPlatformData.acceptTypes}
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm bg-secondary/50 rounded-lg px-3 py-2"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-muted-foreground hover:text-destructive ml-2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" onClick={processFiles} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Analyze Chats"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Unable to process file</p>
                  <p className="text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Your data stays private - all processing happens in your browser
            </p>
            <p className="text-xs text-muted-foreground/70">
              Supported: WhatsApp TXT/JSON, Instagram JSON, Messenger JSON
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 bg-card">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          Built with care for curious conversationalists
        </div>
      </footer>
    </div>
  )
}
