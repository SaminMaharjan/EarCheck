"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Camera, Square, RotateCcw, Eye, Zap } from "lucide-react"
import { FaceAnalyzer, type FatigueMetrics } from "@/lib/face-analyzer"

interface EnhancedVideoCaptureProps {
  onAnalysisComplete?: (metrics: FatigueMetrics) => void
}

export function EnhancedVideoCapture({ onAnalysisComplete }: EnhancedVideoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const faceAnalyzerRef = useRef<FaceAnalyzer | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [metrics, setMetrics] = useState<FatigueMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (faceAnalyzerRef.current) {
        faceAnalyzerRef.current.stop()
      }
    }
  }, [stream])

  const startCapture = async () => {
    try {
      setError(null)

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()

        // Initialize face analyzer
        if (!faceAnalyzerRef.current) {
          faceAnalyzerRef.current = new FaceAnalyzer()
        }

        if (canvasRef.current) {
          await faceAnalyzerRef.current.initialize(videoRef.current, canvasRef.current)
          setIsInitialized(true)
        }
      }

      setIsRecording(true)

      // Start metrics collection
      const metricsInterval = setInterval(() => {
        if (faceAnalyzerRef.current) {
          const currentMetrics = faceAnalyzerRef.current.getFatigueMetrics()
          setMetrics(currentMetrics)
        }
      }, 1000)

      // Auto-stop after 30 seconds
      setTimeout(() => {
        clearInterval(metricsInterval)
        stopCapture()
      }, 30000)
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Failed to access camera. Please ensure camera permissions are granted.")
    }
  }

  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    if (faceAnalyzerRef.current) {
      const finalMetrics = faceAnalyzerRef.current.getFatigueMetrics()
      setMetrics(finalMetrics)
      onAnalysisComplete?.(finalMetrics)
      faceAnalyzerRef.current.stop()
    }

    setIsRecording(false)
    setIsInitialized(false)
  }

  const resetAnalysis = () => {
    if (faceAnalyzerRef.current) {
      faceAnalyzerRef.current.resetMetrics()
      setMetrics(null)
    }
  }

  const getFatigueColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-500"
      case "moderate":
        return "bg-yellow-500"
      case "high":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getFatigueBadgeVariant = (level: string) => {
    switch (level) {
      case "low":
        return "default"
      case "moderate":
        return "secondary"
      case "high":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Facial Fatigue Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Feed */}
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                style={{ display: isRecording ? "block" : "none" }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                width={640}
                height={480}
                style={{ display: isRecording && isInitialized ? "block" : "none" }}
              />
              {!isRecording && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Camera feed will appear here</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={isRecording ? stopCapture : startCapture}
                variant={isRecording ? "destructive" : "default"}
                className="flex-1"
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop Analysis
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>

              <Button onClick={resetAnalysis} variant="outline" disabled={!metrics}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Real-time Metrics */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{metrics?.blinkRate.toFixed(1) || "0.0"}</div>
                  <div className="text-sm text-gray-600">Blinks/min</div>
                  <div className="text-xs text-gray-500 mt-1">Normal: 15-20/min</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">{metrics?.yawnCount || 0}</div>
                  <div className="text-sm text-gray-600">Yawns detected</div>
                  <div className="text-xs text-gray-500 mt-1">Fatigue indicator</div>
                </CardContent>
              </Card>
            </div>

            {metrics && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fatigue Level</span>
                    <Badge variant={getFatigueBadgeVariant(metrics.fatigueLevel)}>
                      {metrics.fatigueLevel.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fatigue Score</span>
                      <span>{metrics.fatigueScore}%</span>
                    </div>
                    <Progress value={metrics.fatigueScore} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                    <div>
                      <div className="font-medium">EAR</div>
                      <div>{metrics.eyeAspectRatio.toFixed(3)}</div>
                    </div>
                    <div>
                      <div className="font-medium">MAR</div>
                      <div>{metrics.mouthAspectRatio.toFixed(3)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isRecording && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Real-time analysis active</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">Simulated facial landmark detection running</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {metrics && !isRecording && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Blink Analysis</div>
                  <div className="text-gray-600">
                    {metrics.blinkRate} blinks/min
                    {metrics.blinkRate > 25
                      ? " (High - possible fatigue)"
                      : metrics.blinkRate < 10
                        ? " (Low - possible drowsiness)"
                        : " (Normal range)"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Yawn Detection</div>
                  <div className="text-gray-600">
                    {metrics.yawnCount} yawns detected
                    {metrics.yawnCount > 2
                      ? " (High fatigue indicator)"
                      : metrics.yawnCount > 0
                        ? " (Moderate fatigue)"
                        : " (No fatigue signs)"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Overall Assessment</div>
                  <div className="text-gray-600">
                    {metrics.fatigueLevel === "high"
                      ? "High fatigue detected - consider rest"
                      : metrics.fatigueLevel === "moderate"
                        ? "Moderate fatigue - monitor closely"
                        : "Low fatigue - normal alertness"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
