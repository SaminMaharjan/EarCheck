"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mic, Camera, Brain, Shield, Activity, Play, Square, RotateCcw, Download } from "lucide-react"
import { EnhancedVideoCapture } from "@/components/enhanced-video-capture"
import { EnhancedResultsDashboard } from "@/components/enhanced-results-dashboard"
import { CoswaraClassifier, type CoswaraAnalysis } from "@/lib/coswara-model"
import type { FatigueMetrics } from "@/lib/face-analyzer"

export default function EarCheckAI() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioAnalysis, setAudioAnalysis] = useState<CoswaraAnalysis | null>(null)
  const [fatigueMetrics, setFatigueMetrics] = useState<FatigueMetrics | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState("capture")

  const mediaRecorderRef = useState<MediaRecorder | null>(null)[0]
  const coswaraClassifier = useState(() => new CoswaraClassifier())[0]

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setAudioBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop()
          setIsRecording(false)
        }
      }, 10000)
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef && mediaRecorderRef.state === "recording") {
      mediaRecorderRef.stop()
      setIsRecording(false)
    }
  }

  const analyzeAudio = async () => {
    if (!audioBlob) return

    setIsAnalyzing(true)
    try {
      const analysis = await coswaraClassifier.analyzeAudio(audioBlob)
      setAudioAnalysis(analysis)
      setActiveTab("results")
    } catch (error) {
      console.error("Audio analysis error:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFatigueAnalysis = (metrics: FatigueMetrics) => {
    setFatigueMetrics(metrics)
    if (audioAnalysis) {
      setActiveTab("results")
    }
  }

  const resetAnalysis = () => {
    setAudioBlob(null)
    setAudioAnalysis(null)
    setFatigueMetrics(null)
    setActiveTab("capture")
  }

  const exportResults = () => {
    const results = {
      timestamp: new Date().toISOString(),
      audioAnalysis,
      fatigueMetrics,
    }

    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `earcheck-analysis-${Date.now()}.json`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">EarCheck AI</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced health screening using AI-powered audio and facial analysis
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Privacy-First
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Real-time Analysis
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              AI-Powered
            </Badge>
          </div>
        </div>

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="capture">Capture</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="capture" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Audio Capture */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Audio Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <Mic
                      className={`h-16 w-16 mx-auto mb-4 ${isRecording ? "text-red-500 animate-pulse" : "text-gray-400"}`}
                    />
                    <p className="text-sm text-gray-600 mb-4">
                      {isRecording ? "Recording your cough sample..." : "Click to record a 10-second cough sample"}
                    </p>
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      variant={isRecording ? "destructive" : "default"}
                      size="lg"
                    >
                      {isRecording ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                  </div>

                  {audioBlob && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-green-700">Audio recorded successfully</span>
                        <Button onClick={analyzeAudio} disabled={isAnalyzing} size="sm">
                          {isAnalyzing ? "Analyzing..." : "Analyze Audio"}
                        </Button>
                      </div>
                      <audio controls className="w-full">
                        <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                      </audio>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Video Capture */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Facial Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedVideoCapture onAnalysisComplete={handleFatigueAnalysis} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Audio Analysis</span>
                    <Badge variant={audioAnalysis ? "default" : "secondary"}>
                      {audioAnalysis ? "Complete" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Facial Analysis</span>
                    <Badge variant={fatigueMetrics ? "default" : "secondary"}>
                      {fatigueMetrics ? "Complete" : "Pending"}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="text-center">
                    <Button onClick={() => setActiveTab("results")} disabled={!audioAnalysis && !fatigueMetrics}>
                      View Results
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={resetAnalysis} variant="outline" className="w-full bg-transparent">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Analysis
                  </Button>
                  <Button
                    onClick={exportResults}
                    variant="outline"
                    className="w-full bg-transparent"
                    disabled={!audioAnalysis && !fatigueMetrics}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {audioAnalysis || fatigueMetrics ? (
              <EnhancedResultsDashboard
                audioAnalysis={audioAnalysis}
                fatigueMetrics={fatigueMetrics}
                onExport={exportResults}
                onShare={() => console.log("Share functionality")}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No Analysis Data</h3>
                  <p className="text-gray-600 mb-4">Complete audio or facial analysis to view results</p>
                  <Button onClick={() => setActiveTab("capture")}>Start Analysis</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            EarCheck AI uses advanced machine learning models for health screening. This tool is for informational
            purposes only and should not replace professional medical advice.
          </p>
        </div>
      </div>
    </div>
  )
}
