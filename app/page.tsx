"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, Camera, Activity, Brain, History, Shield, Stethoscope, Loader2 } from "lucide-react"
import AudioCapture from "@/components/audio-capture"
import VideoCapture from "@/components/video-capture"
import ResultsDashboard from "@/components/results-dashboard"
import HistoryView from "@/components/history-view"
import PrivacyNotice from "@/components/privacy-notice"

export interface AnalysisResult {
  id: string
  timestamp: Date
  coughAnalysis: {
    conditions: Array<{ name: string; confidence: number; color: string }>
    dominantCondition: string
  }
  fatigueScore: {
    level: "Low" | "Moderate" | "High"
    percentage: number
    indicators: string[]
  }
  breathingPattern: {
    type: string
    description: string
    concerns: string[]
  }
  aiRecommendation: string
  overallRisk: "Low" | "Medium" | "High"
}

export default function EarCheckAI() {
  const [currentStep, setCurrentStep] = useState<"landing" | "capture" | "analysis" | "results">("landing")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null)
  const [history, setHistory] = useState<AnalysisResult[]>([])
  const [hasConsented, setHasConsented] = useState(false)
  const [activeTab, setActiveTab] = useState("test")

  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const startAnalysis = useCallback(async () => {
    if (!hasConsented) return

    setCurrentStep("capture")
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    // Simulate analysis progress
    const progressSteps = [
      { step: 20, message: "Capturing audio and video..." },
      { step: 40, message: "Analyzing cough patterns..." },
      { step: 60, message: "Detecting facial fatigue..." },
      { step: 80, message: "Analyzing breathing patterns..." },
      { step: 100, message: "Generating AI recommendations..." },
    ]

    for (const { step } of progressSteps) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setAnalysisProgress(step)
    }

    // Generate mock analysis result
    const mockResult: AnalysisResult = {
      id: Date.now().toString(),
      timestamp: new Date(),
      coughAnalysis: {
        conditions: [
          { name: "Asthma", confidence: 72, color: "bg-orange-500" },
          { name: "Bronchitis", confidence: 18, color: "bg-yellow-500" },
          { name: "COVID-19", confidence: 8, color: "bg-red-500" },
          { name: "Pneumonia", confidence: 2, color: "bg-purple-500" },
        ],
        dominantCondition: "Asthma",
      },
      fatigueScore: {
        level: "Moderate",
        percentage: 65,
        indicators: ["Reduced eye brightness", "Slower blinking rate", "Slight facial tension"],
      },
      breathingPattern: {
        type: "Shallow breathing",
        description: "Breathing appears more shallow than normal with slight irregularity",
        concerns: ["Possible airway restriction", "Reduced lung capacity utilization"],
      },
      aiRecommendation:
        "Based on your cough analysis showing 72% similarity to asthma patterns, combined with moderate fatigue and shallow breathing, I recommend monitoring your symptoms closely. Consider using your rescue inhaler if you have one, ensure you're in a well-ventilated area, and consult with your healthcare provider if symptoms persist or worsen. Stay hydrated and avoid known triggers.",
      overallRisk: "Medium",
    }

    setCurrentResult(mockResult)
    setHistory((prev) => [mockResult, ...prev])
    setCurrentStep("results")
    setIsAnalyzing(false)
  }, [hasConsented])

  const resetTest = () => {
    setCurrentStep("landing")
    setCurrentResult(null)
    setAnalysisProgress(0)
    setIsAnalyzing(false)
  }

  if (currentStep === "capture" || currentStep === "analysis") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Activity className="h-6 w-6 text-blue-600" />
              Analyzing Your Health Data
            </CardTitle>
            <CardDescription>Please remain still while we analyze your cough and facial patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <AudioCapture isRecording={isAnalyzing} />
              <VideoCapture isRecording={isAnalyzing} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Analysis Progress</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-3" />
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing your health data...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "results" && currentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <ResultsDashboard result={currentResult} onNewTest={resetTest} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <header className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">EarCheck AI</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real-time cough analysis powered by AI. Get instant health insights from your cough, facial patterns, and
            breathing.
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Test
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-6">
            {/* Main CTA Card */}
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Start Your Health Check</CardTitle>
                <CardDescription>Cough into your device for 3-5 seconds while looking at the camera</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto">
                      <Mic className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium">Audio Analysis</p>
                    <p className="text-xs text-muted-foreground">Cough pattern recognition</p>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-green-100 rounded-full w-fit mx-auto">
                      <Camera className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm font-medium">Facial Analysis</p>
                    <p className="text-xs text-muted-foreground">Fatigue detection</p>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto">
                      <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium">AI Insights</p>
                    <p className="text-xs text-muted-foreground">Personalized recommendations</p>
                  </div>
                </div>

                <PrivacyNotice hasConsented={hasConsented} onConsentChange={setHasConsented} />

                <Button
                  onClick={startAnalysis}
                  disabled={!hasConsented || isAnalyzing}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Cough Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Respiratory Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Advanced ML models analyze your cough patterns to identify potential respiratory conditions
                    including COVID-19, asthma, bronchitis, and pneumonia.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5 text-green-600" />
                    Fatigue Detection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Facial analysis technology detects signs of fatigue through eye patterns, blinking rates, and facial
                    expressions to assess your overall wellness.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Powered by Gemini AI, receive personalized, natural-language health recommendations based on your
                    comprehensive analysis results.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <HistoryView history={history} />
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>Your privacy and data security are our top priorities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Data Processing</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Audio and video processed in real-time</li>
                      <li>• No permanent storage of raw media files</li>
                      <li>• Analysis results stored locally in your browser</li>
                      <li>• All data transmission encrypted with HTTPS</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold">Your Rights</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Full control over your data</li>
                      <li>• Clear consent before any analysis</li>
                      <li>• Option to delete history anytime</li>
                      <li>• No sharing with third parties</li>
                    </ul>
                  </div>
                </div>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Medical Disclaimer:</strong> EarCheck AI is for informational purposes only and should not
                    replace professional medical advice. Always consult healthcare providers for medical concerns.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
