"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, Camera, Activity, Brain, History, Shield, Stethoscope, Loader2, Database, Eye } from "lucide-react"
import EnhancedAudioCapture from "@/components/enhanced-audio-capture"
import EnhancedVideoCapture from "@/components/enhanced-video-capture"
import EnhancedResultsDashboard from "@/components/enhanced-results-dashboard"
import HistoryView from "@/components/history-view"
import PrivacyNotice from "@/components/privacy-notice"
import DatasetUploader from "@/components/dataset-uploader"
import type { CoughAnalysis } from "@/lib/audio-processor"
import type { CoughClassification } from "@/lib/cough-classifier"
import type { FatigueAnalysis } from "@/lib/face-analyzer"
import { CoswaraClassifier } from "@/lib/coswara-classifier"
import { Badge } from "@/components/ui/badge"

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
  fatigueAnalysis?: FatigueAnalysis
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
  const [currentFatigueAnalysis, setCurrentFatigueAnalysis] = useState<FatigueAnalysis | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const coswaraClassifierRef = useRef<CoswaraClassifier>(new CoswaraClassifier())

  const handleAnalysisComplete = useCallback(
    async (analysis: CoughAnalysis, classification: CoughClassification) => {
      try {
        // Get Coswara-based classification
        const coswaraClassification = await coswaraClassifierRef.current.classifyCough(analysis)

        // Convert ML results to our UI format
        const conditions = coswaraClassification.conditions.map((condition) => ({
          name: condition.name,
          confidence: Math.round(condition.probability),
          color: getConditionColor(condition.name),
        }))

        // Use real fatigue analysis if available
        const fatigueData = currentFatigueAnalysis || {
          fatigueLevel: "Low" as const,
          fatigueScore: 25,
          indicators: ["No facial analysis data available"],
        }

        // Generate breathing pattern analysis based on audio features
        const breathingType = determineBreathingPattern(analysis)

        const result: AnalysisResult = {
          id: Date.now().toString(),
          timestamp: new Date(),
          coughAnalysis: {
            conditions,
            dominantCondition: coswaraClassification.dominantCondition,
          },
          fatigueScore: {
            level: fatigueData.fatigueLevel,
            percentage: Math.round(fatigueData.fatigueScore),
            indicators: fatigueData.indicators,
          },
          breathingPattern: {
            type: breathingType,
            description: `Breathing pattern analysis based on audio characteristics: ${breathingType.toLowerCase()} detected`,
            concerns: breathingType !== "Normal breathing" ? ["Audio suggests respiratory irregularity"] : [],
          },
          aiRecommendation: generateEnhancedAIRecommendation(coswaraClassification, fatigueData),
          overallRisk: determineOverallRisk(coswaraClassification, fatigueData.fatigueLevel),
          rawAnalysis: analysis,
          mlClassification: coswaraClassification,
          fatigueAnalysis: currentFatigueAnalysis,
        }

        setCurrentResult(result)
        setHistory((prev) => [result, ...prev])
        setCurrentStep("results")
        setIsAnalyzing(false)
      } catch (error) {
        console.error("Error in analysis:", error)
        setIsAnalyzing(false)
      }
    },
    [currentFatigueAnalysis],
  )

  const handleFatigueAnalysis = useCallback((analysis: FatigueAnalysis) => {
    setCurrentFatigueAnalysis(analysis)
  }, [])

  const startAnalysis = useCallback(async () => {
    if (!hasConsented) return

    setCurrentStep("capture")
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setCurrentFatigueAnalysis(null)

    // The actual analysis will be handled by the Enhanced components
  }, [hasConsented])

  const resetTest = () => {
    setCurrentStep("landing")
    setCurrentResult(null)
    setAnalysisProgress(0)
    setIsAnalyzing(false)
    setCurrentFatigueAnalysis(null)
  }

  const handleDatasetLoaded = (datasetId: string) => {
    setLoadedDatasets((prev) => [...prev, datasetId])
  }

  if (currentStep === "capture" || currentStep === "analysis") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-6xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Activity className="h-6 w-6 text-blue-600" />
              Advanced Health Analysis in Progress
            </CardTitle>
            <CardDescription>
              Cough naturally while looking at the camera. MediaPipe and Coswara ML models are analyzing your data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <EnhancedAudioCapture isRecording={isAnalyzing} onAnalysisComplete={handleAnalysisComplete} />
              <EnhancedVideoCapture isRecording={isAnalyzing} onFatigueAnalysis={handleFatigueAnalysis} />
            </div>

            {/* Real-time Fatigue Display */}
            {currentFatigueAnalysis && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Live Fatigue Analysis:</span>
                    <Badge
                      variant={
                        currentFatigueAnalysis.fatigueLevel === "High"
                          ? "destructive"
                          : currentFatigueAnalysis.fatigueLevel === "Moderate"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {currentFatigueAnalysis.fatigueLevel} ({Math.round(currentFatigueAnalysis.fatigueScore)}%)
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Blinks: {currentFatigueAnalysis.blinkRate}/min | Yawns: {currentFatigueAnalysis.yawnRate}/min
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Button onClick={resetTest} variant="outline" disabled={isAnalyzing}>
                Cancel Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "results" && currentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <EnhancedResultsDashboard result={currentResult} onNewTest={resetTest} />
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
            Advanced ML-powered cough analysis with MediaPipe facial recognition and Coswara dataset integration.
          </p>
          {loadedDatasets.length > 0 && (
            <div className="mt-4 text-sm text-green-600">
              ✓ {loadedDatasets.length} dataset(s) loaded for enhanced analysis
            </div>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto">
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Test
            </TabsTrigger>
            <TabsTrigger value="datasets" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Datasets
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
                <CardTitle className="text-2xl">Start Your Advanced Health Check</CardTitle>
                <CardDescription>
                  Cough naturally for 3-5 seconds while looking at the camera for comprehensive ML analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto">
                      <Mic className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium">Coswara ML Analysis</p>
                    <p className="text-xs text-muted-foreground">COVID dataset comparison</p>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-green-100 rounded-full w-fit mx-auto">
                      <Camera className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm font-medium">MediaPipe Face Mesh</p>
                    <p className="text-xs text-muted-foreground">468 facial landmarks</p>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto">
                      <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium">Real-time Analysis</p>
                    <p className="text-xs text-muted-foreground">Instant ML insights</p>
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
                      Analyzing with ML...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Start ML Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Enhanced Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    Coswara Dataset Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Compare your cough against thousands of COVID-19, healthy, and symptomatic samples from the Coswara
                    research dataset for accurate classification.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-600" />
                    MediaPipe Face Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Real-time facial landmark detection tracks 468 points to analyze blink rates, yawn detection, and
                    head posture for comprehensive fatigue assessment.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Advanced Audio Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    MFCC extraction, spectral analysis, and harmonic ratio calculation provide detailed acoustic
                    fingerprinting for precise respiratory condition detection.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="datasets">
            <DatasetUploader onDatasetLoaded={handleDatasetLoaded} />
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
                    <h3 className="font-semibold">Advanced Processing</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• MediaPipe facial landmark detection (468 points)</li>
                      <li>• Coswara dataset comparison for COVID detection</li>
                      <li>• MFCC and spectral feature extraction</li>
                      <li>• Real-time ML classification with confidence scores</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold">Data Protection</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• All processing happens locally in your browser</li>
                      <li>• No raw audio/video data sent to servers</li>
                      <li>• MediaPipe runs entirely client-side</li>
                      <li>• Optional recording download for personal use</li>
                    </ul>
                  </div>
                </div>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Medical Disclaimer:</strong> EarCheck AI uses research datasets and ML models for
                    informational purposes only. This tool should not replace professional medical diagnosis or
                    treatment. Always consult healthcare providers for medical concerns.
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

// Helper functions
function getConditionColor(condition: string): string {
  const colors: Record<string, string> = {
    "COVID-19": "bg-red-500",
    Asthma: "bg-orange-500",
    Bronchitis: "bg-yellow-500",
    Pneumonia: "bg-purple-500",
    Healthy: "bg-green-500",
    Symptomatic: "bg-blue-500",
  }
  return colors[condition] || "bg-gray-500"
}

function determineBreathingPattern(analysis: CoughAnalysis): string {
  // Analyze audio features to determine breathing pattern
  const { spectralCentroid, zeroCrossingRate, rms } = analysis

  if (spectralCentroid > 2200 && zeroCrossingRate > 0.12) {
    return "Shallow breathing"
  } else if (rms < 0.08 && spectralCentroid < 1800) {
    return "Deep breathing"
  } else if (zeroCrossingRate > 0.15) {
    return "Irregular breathing"
  }

  return "Normal breathing"
}

function generateEnhancedAIRecommendation(classification: any, fatigueData: any): string {
  const dominant = classification.dominantCondition
  const confidence = classification.confidence
  const similarity = Math.round(classification.coswaraComparison.averageSimilarity * 100)

  let baseRecommendation = ""

  switch (dominant) {
    case "COVID-19":
      baseRecommendation = `Your cough shows ${similarity}% similarity to COVID-19 positive samples in the Coswara database (${confidence} confidence). Consider self-isolation, get tested, and monitor symptoms closely. Seek medical attention if breathing difficulties develop.`
      break
    case "Healthy":
      baseRecommendation = `Your cough patterns match ${similarity}% with healthy samples from the Coswara dataset (${confidence} confidence). Your respiratory function appears normal.`
      break
    case "Symptomatic":
      baseRecommendation = `Your cough shows ${similarity}% similarity to symptomatic (non-COVID) samples (${confidence} confidence). Monitor symptoms and consider consulting a healthcare provider if they persist.`
      break
    case "Asthma":
      baseRecommendation = `Your cough patterns are ${similarity}% similar to asthma-related samples (${confidence} confidence). Ensure you have your rescue inhaler available and avoid known triggers.`
      break
    default:
      baseRecommendation = `Based on Coswara dataset analysis, your cough shows patterns similar to ${dominant} with ${similarity}% similarity.`
  }

  // Add fatigue analysis
  if (fatigueData.fatigueLevel === "High") {
    baseRecommendation += ` MediaPipe facial analysis detected high fatigue levels (${fatigueData.fatigueScore}%) - prioritize rest and recovery.`
  } else if (fatigueData.fatigueLevel === "Moderate") {
    baseRecommendation += ` Moderate fatigue detected through facial analysis - ensure adequate rest.`
  }

  return baseRecommendation
}

function determineOverallRisk(classification: any, fatigueLevel: string): "Low" | "Medium" | "High" {
  const dominant = classification.dominantCondition
  const confidence = classification.confidence
  const similarity = classification.coswaraComparison.averageSimilarity

  if (dominant === "COVID-19" && similarity > 0.6) {
    return confidence === "high" ? "High" : "Medium"
  }

  if (dominant === "Symptomatic" && similarity > 0.7) {
    return "Medium"
  }

  if (fatigueLevel === "High" && (dominant === "COVID-19" || dominant === "Symptomatic")) {
    return "High"
  }

  if (dominant === "Healthy" && fatigueLevel === "Low") {
    return "Low"
  }

  return "Medium"
}
