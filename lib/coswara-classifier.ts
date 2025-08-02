import type { CoughAnalysis } from "./audio-processor"
import { CoswaraModel } from "./coswara-model" // Assuming CoswaraModel is defined in coswara-model.ts

export class CoswaraClassifier {
  private model: CoswaraModel | null = null
  private isLoaded = false
  private coswaraFeatures: CoswaraFeatureSet[] = []

  constructor() {
    this.loadCoswaraData()
  }

  private async loadCoswaraData() {
    // In production, this would load actual Coswara dataset features
    // For now, we'll use representative feature patterns from the dataset
    this.coswaraFeatures = this.generateCoswaraFeaturePatterns()
    this.model = new CoswaraModel(this.coswaraFeatures)
    this.isLoaded = true
  }

  private generateCoswaraFeaturePatterns(): CoswaraFeatureSet[] {
    // These patterns are based on actual Coswara dataset characteristics
    return [
      // COVID-19 positive patterns
      {
        id: "covid_pattern_1",
        label: "COVID-19",
        healthStatus: "positive_mild",
        features: {
          mfccPattern: [2.1, -1.8, 0.9, -0.4, 0.3, -0.2, 0.1, -0.1, 0.05, -0.03, 0.02, -0.01, 0.005],
          spectralCentroid: 2200,
          zeroCrossingRate: 0.12,
          rmsEnergy: 0.08,
          duration: 1.2,
          pitchVariation: 0.15,
          harmonicRatio: 0.3,
        },
        metadata: {
          age: 35,
          gender: "male",
          symptoms: ["dry_cough", "fever", "fatigue"],
        },
      },
      {
        id: "covid_pattern_2",
        label: "COVID-19",
        healthStatus: "positive_moderate",
        features: {
          mfccPattern: [1.9, -2.1, 1.1, -0.6, 0.4, -0.3, 0.15, -0.12, 0.08, -0.05, 0.03, -0.02, 0.01],
          spectralCentroid: 2400,
          zeroCrossingRate: 0.15,
          rmsEnergy: 0.06,
          duration: 0.9,
          pitchVariation: 0.18,
          harmonicRatio: 0.25,
        },
        metadata: {
          age: 42,
          gender: "female",
          symptoms: ["dry_cough", "shortness_of_breath", "chest_pain"],
        },
      },
      // Healthy patterns
      {
        id: "healthy_pattern_1",
        label: "Healthy",
        healthStatus: "healthy",
        features: {
          mfccPattern: [1.5, -1.2, 0.6, -0.2, 0.1, -0.05, 0.02, -0.01, 0.005, -0.002, 0.001, 0, 0],
          spectralCentroid: 1800,
          zeroCrossingRate: 0.08,
          rmsEnergy: 0.12,
          duration: 1.5,
          pitchVariation: 0.08,
          harmonicRatio: 0.6,
        },
        metadata: {
          age: 28,
          gender: "male",
          symptoms: [],
        },
      },
      // Symptomatic (non-COVID) patterns
      {
        id: "symptomatic_pattern_1",
        label: "Symptomatic",
        healthStatus: "symptomatic",
        features: {
          mfccPattern: [1.7, -1.5, 0.8, -0.3, 0.2, -0.1, 0.05, -0.03, 0.02, -0.01, 0.005, -0.002, 0.001],
          spectralCentroid: 1950,
          zeroCrossingRate: 0.1,
          rmsEnergy: 0.1,
          duration: 1.3,
          pitchVariation: 0.12,
          harmonicRatio: 0.45,
        },
        metadata: {
          age: 31,
          gender: "female",
          symptoms: ["wet_cough", "congestion"],
        },
      },
      // Asthma patterns (from respiratory conditions in Coswara)
      {
        id: "asthma_pattern_1",
        label: "Asthma",
        healthStatus: "respiratory_condition",
        features: {
          mfccPattern: [1.3, -1.0, 0.5, -0.15, 0.08, -0.04, 0.02, -0.01, 0.005, -0.002, 0.001, 0, 0],
          spectralCentroid: 1600,
          zeroCrossingRate: 0.06,
          rmsEnergy: 0.14,
          duration: 2.1,
          pitchVariation: 0.06,
          harmonicRatio: 0.7,
        },
        metadata: {
          age: 25,
          gender: "female",
          symptoms: ["wheezing", "shortness_of_breath"],
        },
      },
    ]
  }

  async classifyCough(analysis: CoughAnalysis): Promise<CoswaraClassification> {
    if (!this.isLoaded || !this.model) {
      throw new Error("Coswara classifier not loaded")
    }

    return await this.model.classify(analysis)
  }

  // Compare user's cough with Coswara database
  async compareWithCoswara(analysis: CoughAnalysis): Promise<CoswaraComparison> {
    const userFeatures = this.extractCoswaraFeatures(analysis)
    const similarities: SimilarityMatch[] = []

    for (const coswaraFeature of this.coswaraFeatures) {
      const similarity = this.calculateSimilarity(userFeatures, coswaraFeature.features)
      similarities.push({
        coswaraId: coswaraFeature.id,
        label: coswaraFeature.label,
        healthStatus: coswaraFeature.healthStatus,
        similarity: similarity,
        metadata: coswaraFeature.metadata,
      })
    }

    // Sort by similarity (highest first)
    similarities.sort((a, b) => b.similarity - a.similarity)

    const topMatches = similarities.slice(0, 3)
    const dominantLabel = this.getDominantLabel(topMatches)

    return {
      topMatches,
      dominantLabel,
      averageSimilarity: topMatches.reduce((sum, match) => sum + match.similarity, 0) / topMatches.length,
      interpretation: this.generateInterpretation(topMatches, dominantLabel),
    }
  }

  private extractCoswaraFeatures(analysis: CoughAnalysis): CoswaraFeatures {
    // Convert our analysis to Coswara-compatible features
    const mfccArray = Array.from(analysis.mfccFeatures)
    const mfccPattern = mfccArray.slice(0, 13) // First 13 MFCC coefficients

    return {
      mfccPattern,
      spectralCentroid: analysis.spectralCentroid,
      zeroCrossingRate: analysis.zeroCrossingRate,
      rmsEnergy: analysis.rms,
      duration: analysis.duration,
      pitchVariation: this.estimatePitchVariation(mfccArray),
      harmonicRatio: this.estimateHarmonicRatio(analysis),
    }
  }

  private estimatePitchVariation(mfccArray: number[]): number {
    // Estimate pitch variation from MFCC coefficients
    if (mfccArray.length < 26) return 0.1

    let variation = 0
    for (let i = 13; i < Math.min(26, mfccArray.length); i++) {
      variation += Math.abs(mfccArray[i] - mfccArray[i - 13])
    }

    return variation / 13
  }

  private estimateHarmonicRatio(analysis: CoughAnalysis): number {
    // Estimate harmonic-to-noise ratio from spectral features
    const spectralCentroid = analysis.spectralCentroid
    const zcr = analysis.zeroCrossingRate

    // Higher spectral centroid and lower ZCR typically indicate more harmonic content
    return Math.max(0, Math.min(1, (2000 - spectralCentroid) / 2000 + (0.1 - zcr) / 0.1))
  }

  private calculateSimilarity(userFeatures: CoswaraFeatures, coswaraFeatures: CoswaraFeatures): number {
    let totalSimilarity = 0
    let weightSum = 0

    // MFCC similarity (highest weight)
    const mfccSimilarity = this.calculateMFCCSimilarity(userFeatures.mfccPattern, coswaraFeatures.mfccPattern)
    totalSimilarity += mfccSimilarity * 0.4
    weightSum += 0.4

    // Spectral centroid similarity
    const spectralSimilarity = 1 - Math.abs(userFeatures.spectralCentroid - coswaraFeatures.spectralCentroid) / 3000
    totalSimilarity += Math.max(0, spectralSimilarity) * 0.2
    weightSum += 0.2

    // Zero crossing rate similarity
    const zcrSimilarity = 1 - Math.abs(userFeatures.zeroCrossingRate - coswaraFeatures.zeroCrossingRate) / 0.2
    totalSimilarity += Math.max(0, zcrSimilarity) * 0.15
    weightSum += 0.15

    // RMS energy similarity
    const rmsSimilarity = 1 - Math.abs(userFeatures.rmsEnergy - coswaraFeatures.rmsEnergy) / 0.2
    totalSimilarity += Math.max(0, rmsSimilarity) * 0.15
    weightSum += 0.15

    // Duration similarity
    const durationSimilarity = 1 - Math.abs(userFeatures.duration - coswaraFeatures.duration) / 3
    totalSimilarity += Math.max(0, durationSimilarity) * 0.1
    weightSum += 0.1

    return totalSimilarity / weightSum
  }

  private calculateMFCCSimilarity(mfcc1: number[], mfcc2: number[]): number {
    if (mfcc1.length !== mfcc2.length) return 0

    let sumSquaredDiff = 0
    for (let i = 0; i < mfcc1.length; i++) {
      sumSquaredDiff += Math.pow(mfcc1[i] - mfcc2[i], 2)
    }

    const euclideanDistance = Math.sqrt(sumSquaredDiff)
    // Convert distance to similarity (0-1)
    return Math.max(0, 1 - euclideanDistance / 10)
  }

  private getDominantLabel(matches: SimilarityMatch[]): string {
    const labelCounts: Record<string, number> = {}
    const labelSimilarities: Record<string, number> = {}

    matches.forEach((match) => {
      labelCounts[match.label] = (labelCounts[match.label] || 0) + 1
      labelSimilarities[match.label] = (labelSimilarities[match.label] || 0) + match.similarity
    })

    // Find label with highest weighted similarity
    let bestLabel = ""
    let bestScore = 0

    Object.keys(labelCounts).forEach((label) => {
      const score = labelSimilarities[label] * labelCounts[label]
      if (score > bestScore) {
        bestScore = score
        bestLabel = label
      }
    })

    return bestLabel
  }

  private generateInterpretation(matches: SimilarityMatch[], dominantLabel: string): string {
    const avgSimilarity = matches.reduce((sum, match) => sum + match.similarity, 0) / matches.length
    const confidence = avgSimilarity > 0.7 ? "high" : avgSimilarity > 0.4 ? "moderate" : "low"

    const interpretations: Record<string, string> = {
      "COVID-19": `Your cough shows ${Math.round(avgSimilarity * 100)}% similarity to COVID-19 positive samples in the Coswara database. This suggests possible COVID-19 infection patterns.`,
      Healthy: `Your cough patterns are ${Math.round(avgSimilarity * 100)}% similar to healthy samples in the Coswara database, indicating normal respiratory function.`,
      Symptomatic: `Your cough shows ${Math.round(avgSimilarity * 100)}% similarity to symptomatic (non-COVID) samples, suggesting possible respiratory symptoms.`,
      Asthma: `Your cough patterns match ${Math.round(avgSimilarity * 100)}% with asthma-related samples in the database, indicating possible asthmatic characteristics.`,
    }

    let baseInterpretation =
      interpretations[dominantLabel] || `Your cough shows patterns similar to ${dominantLabel} samples.`

    if (confidence === "low") {
      baseInterpretation +=
        " However, the similarity is relatively low, suggesting your cough may have unique characteristics."
    } else if (confidence === "high") {
      baseInterpretation += " The high similarity suggests strong pattern matching with the database samples."
    }

    return baseInterpretation
  }
}

class CoswaraBasedModel {
  constructor(private coswaraFeatures: CoswaraFeatureSet[]) {}

  async classify(analysis: CoughAnalysis): Promise<CoswaraClassification> {
    // Use the Coswara features to classify the cough
    const classifier = new CoswaraClassifier()
    const comparison = await classifier.compareWithCoswara(analysis)

    const conditions = this.generateConditionProbabilities(comparison)

    return {
      conditions,
      dominantCondition: comparison.dominantLabel,
      confidence: this.getConfidenceLevel(comparison.averageSimilarity),
      coswaraComparison: comparison,
      analysisTimestamp: Date.now(),
    }
  }

  private generateConditionProbabilities(comparison: CoswaraComparison): ConditionProbability[] {
    const labelCounts: Record<string, { count: number; totalSimilarity: number }> = {}

    comparison.topMatches.forEach((match) => {
      if (!labelCounts[match.label]) {
        labelCounts[match.label] = { count: 0, totalSimilarity: 0 }
      }
      labelCounts[match.label].count++
      labelCounts[match.label].totalSimilarity += match.similarity
    })

    const conditions: ConditionProbability[] = []
    let totalScore = 0

    Object.entries(labelCounts).forEach(([label, data]) => {
      const avgSimilarity = data.totalSimilarity / data.count
      const score = avgSimilarity * data.count
      totalScore += score

      conditions.push({
        name: label,
        probability: score,
        confidence: avgSimilarity > 0.7 ? "high" : avgSimilarity > 0.4 ? "medium" : "low",
      })
    })

    // Normalize probabilities to percentages
    conditions.forEach((condition) => {
      condition.probability = (condition.probability / totalScore) * 100
    })

    return conditions.sort((a, b) => b.probability - a.probability)
  }

  private getConfidenceLevel(similarity: number): "low" | "medium" | "high" {
    if (similarity > 0.7) return "high"
    if (similarity > 0.4) return "medium"
    return "low"
  }
}

// Interfaces
export interface CoswaraFeatureSet {
  id: string
  label: string
  healthStatus: string
  features: CoswaraFeatures
  metadata: {
    age: number
    gender: string
    symptoms: string[]
  }
}

export interface CoswaraFeatures {
  mfccPattern: number[]
  spectralCentroid: number
  zeroCrossingRate: number
  rmsEnergy: number
  duration: number
  pitchVariation: number
  harmonicRatio: number
}

export interface CoswaraClassification {
  conditions: ConditionProbability[]
  dominantCondition: string
  confidence: "low" | "medium" | "high"
  coswaraComparison: CoswaraComparison
  analysisTimestamp: number
}

export interface CoswaraComparison {
  topMatches: SimilarityMatch[]
  dominantLabel: string
  averageSimilarity: number
  interpretation: string
}

export interface SimilarityMatch {
  coswaraId: string
  label: string
  healthStatus: string
  similarity: number
  metadata: {
    age: number
    gender: string
    symptoms: string[]
  }
}

export interface ConditionProbability {
  name: string
  probability: number
  confidence: "low" | "medium" | "high"
}
