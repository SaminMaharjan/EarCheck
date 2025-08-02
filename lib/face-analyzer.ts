export interface FacialLandmarks {
  x: number
  y: number
  z: number
}

export interface FatigueMetrics {
  blinkRate: number
  yawnCount: number
  headTilt: number
  eyeAspectRatio: number
  mouthAspectRatio: number
  fatigueScore: number
  fatigueLevel: "low" | "moderate" | "high"
}

export class FaceAnalyzer {
  private blinkCount = 0
  private yawnCount = 0
  private lastBlinkTime = 0
  private analysisStartTime = Date.now()
  private isEyeClosed = false
  private isMouthOpen = false
  private animationFrameId: number | null = null

  // Eye landmarks for blink detection (simplified approach)
  private readonly EYE_LANDMARKS = {
    LEFT_EYE_TOP: 159,
    LEFT_EYE_BOTTOM: 145,
    RIGHT_EYE_TOP: 386,
    RIGHT_EYE_BOTTOM: 374,
    LEFT_EYE_LEFT: 33,
    LEFT_EYE_RIGHT: 133,
    RIGHT_EYE_LEFT: 362,
    RIGHT_EYE_RIGHT: 263,
  }

  // Mouth landmarks for yawn detection
  private readonly MOUTH_LANDMARKS = {
    UPPER_LIP: 13,
    LOWER_LIP: 14,
    MOUTH_LEFT: 61,
    MOUTH_RIGHT: 291,
  }

  constructor() {
    // Initialize without MediaPipe for now - we'll simulate the analysis
  }

  public async initialize(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): Promise<void> {
    // Start the analysis loop
    this.startAnalysisLoop(videoElement, canvasElement)
  }

  private startAnalysisLoop(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): void {
    const analyze = () => {
      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        this.processFrame(videoElement, canvasElement)
      }
      this.animationFrameId = requestAnimationFrame(analyze)
    }
    analyze()
  }

  private processFrame(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): void {
    const canvasCtx = canvasElement.getContext("2d")
    if (!canvasCtx) return

    // Set canvas dimensions to match video
    canvasElement.width = videoElement.videoWidth
    canvasElement.height = videoElement.videoHeight

    // Clear canvas and draw video frame
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)

    // Simulate face detection and analysis
    this.simulateFaceAnalysis(canvasCtx, canvasElement.width, canvasElement.height)
  }

  private simulateFaceAnalysis(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Simulate facial landmarks detection
    const centerX = width * 0.5
    const centerY = height * 0.5

    // Simulate eye positions
    const leftEyeX = centerX - width * 0.15
    const rightEyeX = centerX + width * 0.15
    const eyeY = centerY - height * 0.1

    // Simulate mouth position
    const mouthX = centerX
    const mouthY = centerY + height * 0.15

    // Draw simulated landmarks
    ctx.fillStyle = "#00FF00"
    ctx.strokeStyle = "#00FF00"
    ctx.lineWidth = 2

    // Draw eye landmarks
    this.drawEyeLandmark(ctx, leftEyeX, eyeY, width * 0.05, height * 0.02)
    this.drawEyeLandmark(ctx, rightEyeX, eyeY, width * 0.05, height * 0.02)

    // Draw mouth landmark
    this.drawMouthLandmark(ctx, mouthX, mouthY, width * 0.08, height * 0.03)

    // Simulate blink and yawn detection
    this.simulateBlinkYawnDetection()
  }

  private drawEyeLandmark(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.beginPath()
    ctx.ellipse(x, y, w, h, 0, 0, 2 * Math.PI)
    ctx.stroke()

    // Draw corner points
    ctx.fillRect(x - w, y - 2, 4, 4)
    ctx.fillRect(x + w, y - 2, 4, 4)
    ctx.fillRect(x, y - h - 2, 4, 4)
    ctx.fillRect(x, y + h - 2, 4, 4)
  }

  private drawMouthLandmark(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.beginPath()
    ctx.ellipse(x, y, w, h, 0, 0, 2 * Math.PI)
    ctx.stroke()

    // Draw corner points
    ctx.fillRect(x - w, y - 2, 4, 4)
    ctx.fillRect(x + w, y - 2, 4, 4)
    ctx.fillRect(x, y - h - 2, 4, 4)
    ctx.fillRect(x, y + h - 2, 4, 4)
  }

  private simulateBlinkYawnDetection(): void {
    const currentTime = Date.now()

    // Simulate random blinks (normal rate: 15-20 per minute)
    const timeSinceLastBlink = currentTime - this.lastBlinkTime
    const shouldBlink = Math.random() < 0.02 && timeSinceLastBlink > 2000 // 2% chance per frame, min 2s apart

    if (shouldBlink) {
      this.blinkCount++
      this.lastBlinkTime = currentTime
    }

    // Simulate occasional yawns (fatigue indicator)
    const shouldYawn = Math.random() < 0.001 // 0.1% chance per frame

    if (shouldYawn) {
      this.yawnCount++
    }
  }

  public getFatigueMetrics(): FatigueMetrics {
    const currentTime = Date.now()
    const elapsedMinutes = (currentTime - this.analysisStartTime) / (1000 * 60)
    const blinkRate = elapsedMinutes > 0 ? this.blinkCount / elapsedMinutes : 0

    // Calculate fatigue score (0-100)
    let fatigueScore = 0

    // Normal blink rate is 15-20 per minute
    if (blinkRate > 30) fatigueScore += 40
    else if (blinkRate > 25) fatigueScore += 25
    else if (blinkRate < 10) fatigueScore += 20

    // Each yawn adds significant fatigue points
    fatigueScore += this.yawnCount * 25

    // Add some randomness for demo purposes
    fatigueScore += Math.random() * 10

    // Cap at 100
    fatigueScore = Math.min(fatigueScore, 100)

    let fatigueLevel: "low" | "moderate" | "high" = "low"
    if (fatigueScore > 70) fatigueLevel = "high"
    else if (fatigueScore > 40) fatigueLevel = "moderate"

    // Simulate realistic EAR and MAR values
    const baseEAR = 0.3
    const baseMar = 0.4
    const earVariation = (Math.random() - 0.5) * 0.1
    const marVariation = (Math.random() - 0.5) * 0.2

    return {
      blinkRate: Math.round(blinkRate * 10) / 10,
      yawnCount: this.yawnCount,
      headTilt: Math.random() * 15, // Simulate head tilt
      eyeAspectRatio: Math.max(0.1, baseEAR + earVariation),
      mouthAspectRatio: Math.max(0.2, baseMar + marVariation),
      fatigueScore: Math.round(fatigueScore),
      fatigueLevel,
    }
  }

  public resetMetrics(): void {
    this.blinkCount = 0
    this.yawnCount = 0
    this.analysisStartTime = Date.now()
    this.isEyeClosed = false
    this.isMouthOpen = false
    this.lastBlinkTime = 0
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
}
