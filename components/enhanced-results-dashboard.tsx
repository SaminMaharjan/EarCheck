"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  Brain,
  Eye,
  Wind,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Share2,
  Database,
  TrendingUp,
} from "lucide-react"
import type { AnalysisResult } from "@/app/page"
import type { CoswaraComparison } from "@/lib/coswara-classifier"

interface EnhancedResultsDashboardProps {
  result: AnalysisResult
  onNewTest: () => void
}

export default function EnhancedResultsDashboard({ result, onNewTest }: EnhancedResultsDashboardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-green-600 bg-green-50 border-green-200"
      case "Medium":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "High":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getFatigueColor = (level: string) => {
    switch (level) {
      case "Low":
        return "text-green-600"
      case "Moderate":
        return "text-orange-600"
      case "High":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Analysis Results</h1>
          <p className="text-muted-foreground">
            Completed on {result.timestamp.toLocaleDateString()} at {result.timestamp.toLocaleTimeString()}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Coswara Dataset
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              MediaPipe Face Mesh
            </Badge>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={onNewTest} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      </div>

      {/* Overall Risk Alert */}
      <Alert className={`border-2 ${getRiskColor(result.overallRisk)}`}>
        {result.overallRisk === "Low" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        <AlertDescription className="font-medium">
          <strong>Overall Risk Level: {result.overallRisk}</strong>
          {result.overallRisk === "Low" && " - Your results appear normal with no immediate concerns."}
          {result.overallRisk === "Medium" && " - Some indicators suggest monitoring your symptoms."}
          {result.overallRisk === "High" && " - Multiple indicators suggest consulting a healthcare provider."}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="coswara">Coswara Match</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          {/* Main Results Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cough Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  ML Cough Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {result.coughAnalysis.conditions.map((condition, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{condition.name}</span>
                        <span className="text-sm text-muted-foreground">{condition.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${condition.color}`}
                          style={{ width: `${condition.confidence}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t">
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Most Likely: {result.coughAnalysis.dominantCondition}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Fatigue Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  MediaPipe Fatigue Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getFatigueColor(result.fatigueScore.level)}`}>
                    {result.fatigueScore.percentage}%
                  </div>
                  <div className={`text-lg font-medium ${getFatigueColor(result.fatigueScore.level)}`}>
                    {result.fatigueScore.level} Fatigue
                  </div>
                </div>

                <Progress value={result.fatigueScore.percentage} className="h-3" />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Detected Indicators:</h4>
                  <ul className="space-y-1">
                    {result.fatigueScore.indicators.map((indicator, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                        {indicator}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Breathing Pattern */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-purple-600" />
                  Breathing Pattern
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{result.breathingPattern.type}</div>
                  <p className="text-sm text-muted-foreground mt-2">{result.breathingPattern.description}</p>
                </div>

                {result.breathingPattern.concerns.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Potential Concerns:</h4>
                    <ul className="space-y-1">
                      {result.breathingPattern.concerns.map((concern, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-600" />
                AI-Powered Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">{result.aiRecommendation}</p>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <strong>Disclaimer:</strong> This analysis is for informational purposes only and should not replace
                professional medical advice. Always consult with healthcare providers for medical concerns.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coswara" className="space-y-6">
          {result.mlClassification?.coswaraComparison && (
            <CoswaraComparisonView comparison={result.mlClassification.coswaraComparison} />
          )}
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          {result.rawAnalysis && <TechnicalAnalysisView analysis={result.rawAnalysis} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CoswaraComparisonView({ comparison }: { comparison: CoswaraComparison }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Coswara Dataset Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 leading-relaxed">{comparison.interpretation}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Top Matches from Coswara Database:</h4>
            {comparison.topMatches.map((match, index) => (
              <div key={match.coswaraId} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Badge variant={index === 0 ? "default" : "secondary"}>{match.label}</Badge>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {Math.round(match.similarity * 100)}% similarity
                    </span>
                  </div>
                  <Badge variant="outline">{match.healthStatus}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Age: {match.metadata.age}, Gender: {match.metadata.gender}
                  {match.metadata.symptoms.length > 0 && <span>, Symptoms: {match.metadata.symptoms.join(", ")}</span>}
                </div>
                <Progress value={match.similarity * 100} className="h-1 mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TechnicalAnalysisView({ analysis }: { analysis: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Technical Audio Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Audio Characteristics</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{analysis.duration?.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>RMS Energy:</span>
                  <span>{analysis.rms?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Zero Crossing Rate:</span>
                  <span>{analysis.zeroCrossingRate?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spectral Centroid:</span>
                  <span>{analysis.spectralCentroid?.toFixed(0)} Hz</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">MFCC Features</h4>
              <div className="text-xs text-muted-foreground">
                <p>First 5 MFCC coefficients:</p>
                <div className="font-mono mt-1">
                  {analysis.mfccFeatures &&
                    Array.from(analysis.mfccFeatures)
                      .slice(0, 5)
                      .map((val: number, i: number) => (
                        <div key={i}>
                          MFCC[{i}]: {val.toFixed(3)}
                        </div>
                      ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
