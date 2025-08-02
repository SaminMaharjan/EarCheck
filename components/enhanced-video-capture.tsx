"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Camera, CameraOff, Eye, AlertTriangle } from "lucide-react"
import { FaceAnalyzer, type FatigueAnalysis } from "@/lib/face-analyzer"

interface EnhancedVideoCaptureProps {
  isRecording: boolean
  onFatigueAnalysis?: (analysis: FatigueAnalysis) => void
}

export default function EnhancedVideoCapture({ isRecording, onFatigueAnalysis }: EnhancedVideoCaptureProps) {
  const [hasPermission, setHasPermission] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<FatigueAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>()
  const faceAnalyzerRef = useRef<FaceAnalyzer>(new FaceAnalyzer())

  useEffect(() => {
    if (isRecording) {
      startVideoCapture()
    } else {
      stopVideoCapture()
    }

    return () => {
      stopVideoCapture()
    }
  }, [isRecording])

  const startVideoCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
      })

      streamRef.current = stream
      setHasPermission(true)
      setError(null)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Start face analysis
      setIsAnalyzing(true)
      startFaceAnalysis()
    } catch (error) {
      console.error("Error accessing camera:", error)
      setHasPermission(false)
      setError("Camera access denied. Please allow camera permissions.")
    }
  }

  const stopVideoCapture = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    setIsAnalyzing(false)
    setCurrentAnalysis(null)
  }

  const startFaceAnalysis = useCallback(async () => {
    if (!videoRef.current || !isRecording) return

    try {
      const analysis = await faceAnalyzerRef.current.analyzeFace(videoRef.current)
      setCurrentAnalysis(analysis)
      onFatigueAnalysis?.(analysis)

      // Draw landmarks on canvas
      drawFaceLandmarks(analysis)

      // Continue analysis
      animationRef.current = requestAnimationFrame(startFaceAnalysis)
    } catch (error) {
      console.error("Face analysis error:", error)
      setError("Face analysis failed. Please ensure good lighting.")
    }
  }, [isRecording, onFatigueAnalysis])

  const drawFaceLandmarks = (analysis: FatigueAnalysis) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw face landmarks
    ctx.strokeStyle = "#00ff00"
    ctx.lineWidth = 2
    ctx.fillStyle = "#00ff00"

    const landmarks = analysis.landmarks
    const w = canvas.width
    const h = canvas.height

    // Draw eye landmarks
    const drawEye = (eye: any) => {
      ctx.beginPath()
      ctx.ellipse(
        eye.left.x * w,
        eye.left.y * h,
        (Math.abs(eye.right.x - eye.left.x) * w) / 2,
        (Math.abs(eye.bottom.y - eye.top.y) * h) / 2,
        0,
        0,
        2 * Math.PI,
      )
      ctx.stroke()
    }

    drawEye(landmarks.leftEye)
    drawEye(landmarks.rightEye)

    // Draw mouth landmarks
    ctx.beginPath()
    ctx.ellipse(
      landmarks.mouth.left.x * w,
      landmarks.mouth.top.y * h,
      (Math.abs(landmarks.mouth.right.x - landmarks.mouth.left.x) * w) / 2,
      (Math.abs(landmarks.mouth.bottom.y - landmarks.mouth.top.y) * h) / 2,
      0,
      0,
      2 * Math.PI,
    )
    ctx.stroke()

    // Draw face outline points
    ctx.fillRect(landmarks.face.nose.x * w - 2, landmarks.face.nose.y * h - 2, 4, 4)
    ctx.fillRect(landmarks.face.chin.x * w - 2, landmarks.face.chin.y * h - 2, 4, 4)
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

  const getFatigueBadgeVariant = (level: string) => {
    switch (level) {
      case "Low":
        return "default" as const
      case "Moderate":
        return "secondary" as const
      case "High":
        return "destructive" as const
      default:
        return "outline" as const
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {hasPermission && isRecording ? (
            <Camera className="h-5 w-5 text-green-600" />
          ) : (
            <CameraOff className="h-5 w-5 text-gray-400" />
          )}
          MediaPipe Face Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Display */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: "4/3" }}>
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }} />

          {!hasPermission && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="text-center">
                <CameraOff className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Camera access required</p>
              </div>
            </div>
          )}

          {/* Real-time Analysis Overlay */}
          {currentAnalysis && isRecording && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white p-2 rounded text-xs">
              <div>Blinks: {currentAnalysis.blinkRate}/min</div>
              <div>Yawns: {currentAnalysis.yawnRate}/min</div>
              <div>Head Tilt: {currentAnalysis.headTilt.toFixed(1)}°</div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Real-time Fatigue Analysis */}
        {currentAnalysis && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Live Fatigue Analysis</span>
              <Badge variant={getFatigueBadgeVariant(currentAnalysis.fatigueLevel)}>
                {currentAnalysis.fatigueLevel} ({Math.round(currentAnalysis.fatigueScore)}%)
              </Badge>
            </div>

            <Progress value={currentAnalysis.fatigueScore} className="h-2" />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Blink Rate:</span>
                  <span>{currentAnalysis.blinkRate}/min</span>
                </div>
                <div className="flex justify-between">
                  <span>Yawn Rate:</span>
                  <span>{currentAnalysis.yawnRate}/min</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Head Tilt:</span>
                  <span>{currentAnalysis.headTilt.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between">
                  <span>Eye Ratio:</span>
                  <span>{currentAnalysis.eyeAspectRatio.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Fatigue Indicators */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium">Current Indicators:</h4>
              <div className="space-y-1">
                {currentAnalysis.indicators.map((indicator, index) => (
                  <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full" />
                    {indicator}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        <p className="text-xs text-center text-muted-foreground">
          {isRecording && isAnalyzing
            ? "Analyzing facial landmarks with MediaPipe (468 points)..."
            : isRecording
              ? "Starting facial analysis..."
              : "Click 'Start ML Analysis' to begin facial fatigue detection"}
        </p>

        {/* Technical Info */}
        {currentAnalysis && (
          <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Eye className="h-3 w-3" />
              <span className="font-medium">MediaPipe Face Mesh Active</span>
            </div>
            <div>468 facial landmarks • Real-time EAR/MAR calculation</div>
            <div>Blink threshold: 0.25 • Yawn threshold: 0.6</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
