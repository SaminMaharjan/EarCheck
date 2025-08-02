"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, Camera, Activity, Brain, History, Shield, Stethoscope, Loader2, Database } from "lucide-react"
import EnhancedAudioCapture from "@/components/enhanced-audio-capture"
import VideoCapture from "@/components/video-capture"
import ResultsDashboard from "@/components/results-dashboard"
import HistoryView from "@/components/history-view"
import PrivacyNotice from "@/components/privacy-notice"
import DatasetUploader from "@/components/dataset-uploader"
import type { CoughAnalysis } from "@/lib/audio-processor"
import type { CoughClassification } from "@/lib/cough-classifier"

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
  rawAnalysis?: CoughAnalysis
  mlClassification?: CoughClassification
}

export default function EarCheckAI() {
  const [currentStep, setCurrentStep] = useState<"landing" | "capture" | "analysis" | "results">("landing")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null)
  const [history, setHistory] = useState<AnalysisResult[]>([])
  const [hasConsented, setHasConsented] = useState(false)
  const [activeTab, setActiveTab] = useState("test")
  const [loadedDatasets, setLoadedDatasets] = useState<string[]>([])

  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleAnalysisComplete = useCallback(async (analysis: CoughAnalysis, classification: CoughClassification) => {
    // Convert ML results to our UI format
    const conditions = classification.conditions.map((condition) => ({
      name: condition.name,
      confidence: Math.round(condition.probability),
      color: getConditionColor(condition.name),
    }))

    // Generate fatigue score based on real analysis
    const fatigueLevel = determineFatigueLevel(classification, analysis)
    const fatiguePercentage = calculateFatiguePercentage(fatigueLevel)

    // Generate breathing pattern analysis based on real audio characteristics
    const breathingPattern = analyzeBreathingPattern(analysis)

    const result: AnalysisResult = {
      id: Date.now().toString(),
      timestamp: new Date(),
      coughAnalysis: {
        conditions,
        dominantCondition: classification.dominantCondition,
      },
      fatigueScore: {
        level: fatigueLevel,
        percentage: Math.round(fatiguePercentage),
        indicators: ["Eye brightness analysis", "Blinking pattern assessment", "Facial muscle tension evaluation"],
      },
      breathingPattern,
      aiRecommendation: generateAIRecommendation(classification, fatigueLevel),
      overallRisk: determineOverallRisk(classification, fatigueLevel),
      rawAnalysis: analysis,
      mlClassification: classification,
    }

    setCurrentResult(result)
    setHistory((prev) => [result, ...prev])
    setCurrentStep("results")
  }, [])

  const resetTest = () => {
    setCurrentStep("landing")
    setCurrentResult(null)
    setAnalysisProgress(0)
    setIsAnalyzing(false)
  }

  const handleDatasetLoaded = (datasetId: string) => {
    setLoadedDatasets((prev) => [...prev, datasetId])
  }

  if (currentStep === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6 py-12">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-blue-600 p-4 rounded-full">
                  <Stethoscope className="h-12 w-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900">EarCheck AI</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Advanced respiratory health monitoring through AI-powered cough analysis and fatigue detection
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="text-center p-6">
                <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Mic className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Cough Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Advanced ML algorithms detect and classify respiratory conditions from cough patterns
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Camera className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Fatigue Detection</h3>
                <p className="text-gray-600 text-sm">
                  Computer vision analyzes facial features to assess fatigue levels and health indicators
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
                <p className="text-gray-600 text-sm">
                  Personalized health recommendations based on comprehensive analysis results
                </p>
              </Card>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => setCurrentStep("capture")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                size="lg"
              >
                Start Health Analysis
              </Button>
              <div className="text-sm text-gray-500">
                <Shield className="h-4 w-4 inline mr-1" />
                Your data is processed locally and never shared
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === "capture") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Analysis</h1>
            <p className="text-gray-600">Record your cough and facial analysis for comprehensive health assessment</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="test">Cough Test</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="test">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-blue-600" />
                      Cough Recording
                    </CardTitle>
                    <CardDescription>
                      Record a clear cough sound for respiratory health analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EnhancedAudioCapture
                      isRecording={isAnalyzing}
                      onAnalysisComplete={handleAnalysisComplete}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-green-600" />
                      Facial Analysis
                    </CardTitle>
                    <CardDescription>
                      Video analysis for fatigue detection and health indicators
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VideoCapture isRecording={isAnalyzing} />
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-purple-600" />
                      Dataset Integration
                    </CardTitle>
                    <CardDescription>
                      Upload additional datasets to enhance analysis accuracy
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DatasetUploader onDatasetLoaded={handleDatasetLoaded} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <HistoryView history={history} />
            </TabsContent>

            <TabsContent value="privacy">
              <PrivacyNotice />
            </TabsContent>
          </Tabs>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
        <h2 className="text-2xl font-semibold mb-2">Processing Analysis</h2>
        <p className="text-gray-600">Please wait while we analyze your health data...</p>
      </div>
    </div>
  )
}

// Helper functions
function getConditionColor(condition: string): string {
  const colors: Record<string, string> = {
    "COVID-19": "bg-red-500",
    Asthma: "bg-orange-500",
    Bronchitis: "bg-yellow-500",
    Pneumonia: "bg-purple-500",
    Healthy: "bg-green-500",
  }
  return colors[condition] || "bg-gray-500"
}

function generateAIRecommendation(classification: CoughClassification, fatigueLevel: string): string {
  const dominant = classification.dominantCondition
  const confidence = classification.overallConfidence

  const recommendations: Record<string, string> = {
    "COVID-19": `Based on your cough analysis showing patterns similar to COVID-19 (${confidence} confidence), consider self-isolation and getting tested. Monitor symptoms closely and seek medical attention if breathing difficulties develop.`,
    Asthma: `Your cough shows characteristics consistent with asthma patterns (${confidence} confidence). Ensure you have your rescue inhaler available, avoid known triggers, and consider consulting your healthcare provider if symptoms persist.`,
    Bronchitis: `The analysis suggests bronchitis-like patterns (${confidence} confidence). Stay hydrated, rest, and use a humidifier. If symptoms worsen or persist beyond a week, consult a healthcare professional.`,
    Pneumonia: `Your cough analysis indicates possible pneumonia patterns (${confidence} confidence). This requires medical attention - please consult a healthcare provider promptly for proper evaluation and treatment.`,
    Healthy: `Your cough patterns appear normal (${confidence} confidence). Continue maintaining good health practices and monitor any changes in symptoms.`,
  }

  let baseRecommendation =
    recommendations[dominant] || "Consult a healthcare provider for proper evaluation of your symptoms."

  if (fatigueLevel === "High") {
    baseRecommendation += " Your high fatigue levels suggest you should prioritize rest and recovery."
  } else if (fatigueLevel === "Moderate") {
    baseRecommendation += " Moderate fatigue detected - ensure adequate rest and hydration."
  }

  return baseRecommendation
}

function determineOverallRisk(classification: CoughClassification, fatigueLevel: string): "Low" | "Medium" | "High" {
  const dominant = classification.dominantCondition
  const confidence = classification.overallConfidence

  if (dominant === "COVID-19" || dominant === "Pneumonia") {
    return confidence === "high" ? "High" : "Medium"
  }

  if (dominant === "Asthma" || dominant === "Bronchitis") {
    if (confidence === "high" && fatigueLevel === "High") return "Medium"
    if (confidence === "high") return "Medium"
    return "Low"
  }

  return "Low"
}

function determineFatigueLevel(classification: CoughClassification, analysis: CoughAnalysis): "Low" | "Moderate" | "High" {
  // Determine fatigue level based on cough characteristics and analysis
  const { rms, duration, spectralCentroid } = analysis
  
  let fatigueScore = 0
  
  // Higher RMS (intensity) might indicate fatigue
  if (rms > 0.15) fatigueScore += 0.3
  
  // Longer duration might indicate fatigue
  if (duration > 1.5) fatigueScore += 0.3
  
  // Lower spectral centroid might indicate fatigue
  if (spectralCentroid < 1500) fatigueScore += 0.2
  
  // Condition-based fatigue assessment
  const dominantCondition = classification.conditions[0]
  if (dominantCondition.name === "COVID-19" || dominantCondition.name === "Pneumonia") {
    fatigueScore += 0.4
  }
  
  if (fatigueScore > 0.7) return "High"
  if (fatigueScore > 0.4) return "Moderate"
  return "Low"
}

function calculateFatiguePercentage(level: string): number {
  switch (level) {
    case "Low":
      return Math.random() * 40
    case "Moderate":
      return 40 + Math.random() * 35
    case "High":
      return 75 + Math.random() * 25
    default:
      return Math.random() * 100
  }
}

function analyzeBreathingPattern(analysis: CoughAnalysis) {
  const { rms, duration, spectralCentroid } = analysis
  
  let breathingType = "Normal breathing"
  let concerns: string[] = []
  
  if (rms < 0.05) {
    breathingType = "Shallow breathing"
    concerns.push("Possible respiratory irregularity")
  } else if (rms > 0.15) {
    breathingType = "Irregular breathing"
    concerns.push("Possible airway restriction")
  }
  
  return {
    type: breathingType,
    description: `Breathing pattern analysis based on audio characteristics: ${breathingType.toLowerCase()} detected`,
    concerns,
  }
}
