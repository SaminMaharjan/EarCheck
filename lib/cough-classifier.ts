import type { CoughAnalysis } from "./audio-processor"
import { CoughDetectionIntegration, type CoughDetectionResult } from "./cough-detection-integration"

export class CoughClassifier {
  private model: CoughModel | null = null
  private isLoaded = false
  private coughDetectionIntegration: CoughDetectionIntegration

  constructor() {
    this.coughDetectionIntegration = new CoughDetectionIntegration()
    this.loadModel()
  }

  private async loadModel() {
    // Use the integrated cough detection model
    this.model = new IntegratedCoughModel(this.coughDetectionIntegration)
    this.isLoaded = true
  }

  async classifyCough(analysis: CoughAnalysis): Promise<CoughClassification> {
    if (!this.isLoaded || !this.model) {
      throw new Error("Model not loaded")
    }

    return await this.model.predict(analysis)
  }

  async batchClassify(analyses: CoughAnalysis[]): Promise<CoughClassification[]> {
    const results: CoughClassification[] = []

    for (const analysis of analyses) {
      const classification = await this.classifyCough(analysis)
      results.push(classification)
    }

    return results
  }
}

interface CoughModel {
  predict(analysis: CoughAnalysis): Promise<CoughClassification>
}

class IntegratedCoughModel implements CoughModel {
  constructor(private coughDetectionIntegration: CoughDetectionIntegration) {}

  async predict(analysis: CoughAnalysis): Promise<CoughClassification> {
    // First, detect if this is actually a cough
    const coughDetection = await this.coughDetectionIntegration.analyzeAudio(
      this.createAudioBufferFromAnalysis(analysis)
    )

    if (!coughDetection.isCough) {
      // If not a cough, return low probabilities for all conditions
      return {
        conditions: [
          { name: "COVID-19", probability: 0.05, confidence: "low" },
          { name: "Asthma", probability: 0.05, confidence: "low" },
          { name: "Bronchitis", probability: 0.05, confidence: "low" },
          { name: "Pneumonia", probability: 0.05, confidence: "low" },
        ],
        dominantCondition: "No cough detected",
        overallConfidence: "low",
        analysisTimestamp: Date.now(),
      }
    }

    // If it is a cough, use the original rule-based classification
    const { duration, rms, zeroCrossingRate, spectralCentroid, mfccFeatures } = analysis

    const conditions: ConditionProbability[] = []

    // COVID-19 patterns (typically dry, persistent)
    let covidScore = 0
    if (duration > 0.5 && duration < 2.0) covidScore += 0.3
    if (rms < 0.1) covidScore += 0.2 // Dry cough
    if (zeroCrossingRate > 0.1) covidScore += 0.2
    if (spectralCentroid > 2000) covidScore += 0.3

    conditions.push({
      name: "COVID-19",
      probability: Math.min(covidScore, 0.95),
      confidence: covidScore > 0.6 ? "high" : covidScore > 0.3 ? "medium" : "low",
    })

    // Asthma patterns (wheezing, longer duration)
    let asthmaScore = 0
    if (duration > 1.0) asthmaScore += 0.3
    if (spectralCentroid < 1500) asthmaScore += 0.3 // Lower frequency content
    if (this.detectWheezing(mfccFeatures)) asthmaScore += 0.4

    conditions.push({
      name: "Asthma",
      probability: Math.min(asthmaScore, 0.95),
      confidence: asthmaScore > 0.6 ? "high" : asthmaScore > 0.3 ? "medium" : "low",
    })

    // Bronchitis patterns (wet, productive cough)
    let bronchitisScore = 0
    if (rms > 0.15) bronchitisScore += 0.3 // Wet cough
    if (duration > 0.8) bronchitisScore += 0.2
    if (spectralCentroid < 2000) bronchitisScore += 0.3

    conditions.push({
      name: "Bronchitis",
      probability: Math.min(bronchitisScore, 0.95),
      confidence: bronchitisScore > 0.6 ? "high" : bronchitisScore > 0.3 ? "medium" : "low",
    })

    // Pneumonia patterns
    let pneumoniaScore = 0
    if (rms > 0.12) pneumoniaScore += 0.2
    if (duration < 1.5) pneumoniaScore += 0.2
    if (zeroCrossingRate < 0.08) pneumoniaScore += 0.3

    conditions.push({
      name: "Pneumonia",
      probability: Math.min(pneumoniaScore, 0.95),
      confidence: pneumoniaScore > 0.6 ? "high" : pneumoniaScore > 0.3 ? "medium" : "low",
    })

    // Sort by probability
    conditions.sort((a, b) => b.probability - a.probability)

    // Normalize probabilities
    const total = conditions.reduce((sum, c) => sum + c.probability, 0)
    if (total > 0) {
      conditions.forEach((c) => {
        c.probability = (c.probability / total) * 100
      })
    }

    return {
      conditions,
      dominantCondition: conditions[0]?.name || "Unknown",
      overallConfidence: conditions[0]?.confidence || "low",
      analysisTimestamp: Date.now(),
    }
  }

  private detectWheezing(mfccFeatures: Float32Array): boolean {
    // Simple wheezing detection based on MFCC patterns
    // Look for specific patterns in the MFCC coefficients
    let wheezingIndicators = 0

    for (let i = 0; i < mfccFeatures.length; i += 13) {
      // Check for characteristic patterns in MFCC coefficients
      if (mfccFeatures[i + 2] > 0.5 && mfccFeatures[i + 3] < -0.3) {
        wheezingIndicators++
      }
    }

    return wheezingIndicators > mfccFeatures.length / 26 // More than 50% of frames
  }

  private createAudioBufferFromAnalysis(analysis: CoughAnalysis): AudioBuffer {
    // Create a mock AudioBuffer from the analysis data
    // In a real implementation, you'd want to store the original audio data
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const buffer = audioContext.createBuffer(1, analysis.mfccFeatures.length * 512, 44100)
    const channelData = buffer.getChannelData(0)
    
    // Fill with mock data based on the analysis features
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = Math.sin(i * 0.01) * analysis.rms
    }
    
    return buffer
  }
}

export interface CoughClassification {
  conditions: ConditionProbability[]
  dominantCondition: string
  overallConfidence: "low" | "medium" | "high"
  analysisTimestamp: number
}

export interface ConditionProbability {
  name: string
  probability: number
  confidence: "low" | "medium" | "high"
}
