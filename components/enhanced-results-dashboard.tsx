"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Download,
  Share2,
  AlertTriangle,
  CheckCircle,
  Activity,
  Mic,
  Eye,
  Brain,
  FileText,
  BarChart3,
} from "lucide-react"
import type { FatigueMetrics } from "@/lib/face-analyzer"
import type { CoswaraAnalysis } from "@/lib/coswara-model"

interface EnhancedResultsDashboardProps {
  audioAnalysis?: CoswaraAnalysis
  fatigueMetrics?: FatigueMetrics
  onExport?: () => void
  onShare?: () => void
}

export function EnhancedResultsDashboard({
  audioAnalysis,
  fatigueMetrics,
  onExport,
  onShare,
}: EnhancedResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const getOverallRiskLevel = () => {
    if (!audioAnalysis && !fatigueMetrics) return "unknown"

    let riskScore = 0

    if (audioAnalysis) {
      if (audioAnalysis.classification.covidLikelihood > 70) riskScore += 3
      else if (audioAnalysis.classification.covidLikelihood > 40) riskScore += 2
      else riskScore += 1
    }

    if (fatigueMetrics) {
      if (fatigueMetrics.fatigueLevel === "high") riskScore += 3
      else if (fatigueMetrics.fatigueLevel === "moderate") riskScore += 2
      else riskScore += 1
    }

    if (riskScore >= 5) return "high"
    if (riskScore >= 3) return "moderate"
    return "low"
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-red-600"
      case "moderate":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "high":
        return "destructive"
      case "moderate":
        return "secondary"
      case "low":
        return "default"
      default:
        return "outline"
    }
  }

  const overallRisk = getOverallRiskLevel()

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6" />
                EarCheck AI Analysis Results
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive health screening using AI-powered audio and facial analysis
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={onExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={onShare} variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Risk Assessment */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Overall Health Assessment</h3>
            <Badge variant={getRiskBadgeVariant(overallRisk)} className="text-sm">
              {overallRisk.toUpperCase()} RISK
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {audioAnalysis && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Mic className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{audioAnalysis.classification.covidLikelihood}%</div>
                <div className="text-sm text-gray-600">COVID-19 Likelihood</div>
              </div>
            )}

            {fatigueMetrics && (
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Eye className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">{fatigueMetrics.fatigueScore}%</div>
                <div className="text-sm text-gray-600">Fatigue Level</div>
              </div>
            )}

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <div className="text-2xl font-bold text-gray-600">{audioAnalysis?.confidence.toUpperCase() || "N/A"}</div>
              <div className="text-sm text-gray-600">Analysis Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audio">Audio Analysis</TabsTrigger>
          <TabsTrigger value="facial">Facial Analysis</TabsTrigger>
          <TabsTrigger value="technical">Technical Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Findings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Key Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {audioAnalysis && (
                  <div className="flex items-start gap-3">
                    <Mic className="h-4 w-4 mt-1 text-blue-600" />
                    <div>
                      <div className="font-medium">Respiratory Analysis</div>
                      <div className="text-sm text-gray-600">
                        {audioAnalysis.similarity.toFixed(1)}% similarity to {audioAnalysis.matchedSample.healthStatus}{" "}
                        samples
                      </div>
                    </div>
                  </div>
                )}

                {fatigueMetrics && (
                  <div className="flex items-start gap-3">
                    <Eye className="h-4 w-4 mt-1 text-purple-600" />
                    <div>
                      <div className="font-medium">Fatigue Assessment</div>
                      <div className="text-sm text-gray-600">
                        {fatigueMetrics.blinkRate} blinks/min, {fatigueMetrics.yawnCount} yawns detected
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {audioAnalysis?.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-2" />
                    <span>{rec}</span>
                  </div>
                ))}

                {fatigueMetrics && fatigueMetrics.fatigueLevel !== "low" && (
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-1 h-1 bg-purple-500 rounded-full mt-2" />
                    <span>Consider taking breaks and ensuring adequate rest</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          {audioAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Coswara Dataset Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Similarity Score</span>
                      <span className="font-medium">{audioAnalysis.similarity.toFixed(1)}%</span>
                    </div>
                    <Progress value={audioAnalysis.similarity} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Matched Sample</h4>
                    <div className="text-sm space-y-1">
                      <div>ID: {audioAnalysis.matchedSample.id}</div>
                      <div>
                        Age: {audioAnalysis.matchedSample.age}, Gender: {audioAnalysis.matchedSample.gender}
                      </div>
                      <div>
                        Location: {audioAnalysis.matchedSample.location.state},{" "}
                        {audioAnalysis.matchedSample.location.country}
                      </div>
                      <div>
                        Status: <Badge variant="outline">{audioAnalysis.matchedSample.healthStatus}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Classification Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Cough Type</div>
                      <div className="font-medium">{audioAnalysis.classification.coughType}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Breathing Pattern</div>
                      <div className="font-medium">{audioAnalysis.classification.respiratoryPattern}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>COVID-19 Likelihood</span>
                      <span className="font-medium">{audioAnalysis.classification.covidLikelihood}%</span>
                    </div>
                    <Progress value={audioAnalysis.classification.covidLikelihood} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Mic className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No audio analysis data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="facial" className="space-y-4">
          {fatigueMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fatigue Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-xl font-bold text-blue-600">{fatigueMetrics.blinkRate}</div>
                      <div className="text-xs text-gray-600">Blinks/min</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <div className="text-xl font-bold text-purple-600">{fatigueMetrics.yawnCount}</div>
                      <div className="text-xs text-gray-600">Yawns</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Fatigue</span>
                      <span className="font-medium">{fatigueMetrics.fatigueScore}%</span>
                    </div>
                    <Progress value={fatigueMetrics.fatigueScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Facial Measurements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Eye Aspect Ratio (EAR)</span>
                    <span className="font-mono">{fatigueMetrics.eyeAspectRatio.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Mouth Aspect Ratio (MAR)</span>
                    <span className="font-mono">{fatigueMetrics.mouthAspectRatio.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Head Tilt</span>
                    <span className="font-mono">{fatigueMetrics.headTilt.toFixed(1)}°</span>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                    <div className="font-medium mb-1">Reference Values:</div>
                    <div>Normal EAR: 0.25-0.35</div>
                    <div>Blink threshold: &lt;0.2</div>
                    <div>Yawn threshold: MAR &gt;0.6</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No facial analysis data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {audioAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Audio Features (MFCC)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs font-mono">
                    {audioAnalysis.features.mfcc.map((coeff, index) => (
                      <div key={index} className="flex justify-between">
                        <span>MFCC[{index}]:</span>
                        <span>{coeff.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Spectral Centroid:</span>
                      <span>{audioAnalysis.features.spectralCentroid.toFixed(1)} Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RMS Energy:</span>
                      <span>{audioAnalysis.features.rmsEnergy.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{audioAnalysis.features.duration.toFixed(2)}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Analysis Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">Analysis Timestamp</div>
                  <div className="text-gray-600">{new Date().toLocaleString()}</div>
                </div>

                {audioAnalysis && (
                  <div>
                    <div className="font-medium">Dataset Reference</div>
                    <div className="text-gray-600">Coswara - IISc Bangalore</div>
                  </div>
                )}

                {fatigueMetrics && (
                  <div>
                    <div className="font-medium">Facial Analysis Method</div>
                    <div className="text-gray-600">Simulated MediaPipe Face Mesh</div>
                  </div>
                )}

                <div>
                  <div className="font-medium">Processing Location</div>
                  <div className="text-gray-600">Client-side (Privacy Protected)</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
