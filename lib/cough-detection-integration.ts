// Integration with the cough-detection project
// This adapts the feature extraction and classification methods for use in EarCheck

export interface CoughDetectionResult {
  isCough: boolean
  confidence: number
  features: number[]
  classification: 'cough' | 'non-cough'
}

export class CoughDetectionIntegration {
  private featureExtractor: FeatureExtractor
  private classifier: CoughClassifier

  constructor() {
    this.featureExtractor = new FeatureExtractor()
    this.classifier = new CoughClassifier()
  }

  async analyzeAudio(audioBuffer: AudioBuffer): Promise<CoughDetectionResult> {
    try {
      // Extract features using the same method as the cough-detection project
      const features = await this.featureExtractor.extractFeatures(audioBuffer)
      
      // Classify using the trained model
      const result = await this.classifier.classify(features)
      
      return result
    } catch (error) {
      console.error('Error in cough detection analysis:', error)
      throw error
    }
  }
}

class FeatureExtractor {
  async extractFeatures(audioBuffer: AudioBuffer): Promise<number[]> {
    // Convert AudioBuffer to the format expected by the cough detection project
    const audioData = this.audioBufferToFloat32Array(audioBuffer)
    
    // Resample to 44.1 kHz if necessary (same as cough-detection project)
    const targetSampleRate = 44100
    let resampledData = audioData
    
    if (audioBuffer.sampleRate !== targetSampleRate) {
      resampledData = this.resampleAudio(audioData, audioBuffer.sampleRate, targetSampleRate)
    }
    
    // Convert to mono if necessary
    if (audioBuffer.numberOfChannels > 1) {
      resampledData = this.convertToMono(resampledData, audioBuffer.numberOfChannels)
    }
    
    // Compute Mel-scale spectrogram (same parameters as cough-detection project)
    const melSpectrogram = this.computeMelSpectrogram(resampledData, targetSampleRate)
    
    // Apply log transformation
    const logMelSpectrogram = this.applyLogTransformation(melSpectrogram)
    
    // Pad to minimum size (128x128) as required by the network
    const paddedSpectrogram = this.padSpectrogram(logMelSpectrogram)
    
    // Extract 1024-dimensional feature vector using the pre-trained network
    const features = await this.extractFeatureVector(paddedSpectrogram)
    
    return features
  }

  private audioBufferToFloat32Array(audioBuffer: AudioBuffer): Float32Array {
    const channelData = audioBuffer.getChannelData(0)
    return new Float32Array(channelData)
  }

  private resampleAudio(audioData: Float32Array, originalSampleRate: number, targetSampleRate: number): Float32Array {
    // Simple linear interpolation resampling
    // In production, use a proper resampling library
    const ratio = targetSampleRate / originalSampleRate
    const newLength = Math.round(audioData.length * ratio)
    const resampled = new Float32Array(newLength)
    
    for (let i = 0; i < newLength; i++) {
      const originalIndex = i / ratio
      const index1 = Math.floor(originalIndex)
      const index2 = Math.min(index1 + 1, audioData.length - 1)
      const fraction = originalIndex - index1
      
      resampled[i] = audioData[index1] * (1 - fraction) + audioData[index2] * fraction
    }
    
    return resampled
  }

  private convertToMono(audioData: Float32Array, numChannels: number): Float32Array {
    // Simple averaging of channels
    const monoLength = audioData.length / numChannels
    const monoData = new Float32Array(monoLength)
    
    for (let i = 0; i < monoLength; i++) {
      let sum = 0
      for (let ch = 0; ch < numChannels; ch++) {
        sum += audioData[i * numChannels + ch]
      }
      monoData[i] = sum / numChannels
    }
    
    return monoData
  }

  private computeMelSpectrogram(audioData: Float32Array, sampleRate: number): Float32Array {
    // Simplified Mel spectrogram computation
    // In production, use librosa or a similar library
    const nFft = 1024
    const hopLength = 512
    const nMels = 128
    
    // Compute STFT
    const stft = this.computeSTFT(audioData, nFft, hopLength)
    
    // Apply Mel filterbank
    const melFilterbank = this.createMelFilterbank(sampleRate, nFft, nMels)
    const melSpectrogram = this.applyMelFilterbank(stft, melFilterbank)
    
    return melSpectrogram
  }

  private computeSTFT(audioData: Float32Array, nFft: number, hopLength: number): Float32Array {
    // Simplified STFT computation
    const numFrames = Math.floor((audioData.length - nFft) / hopLength) + 1
    const stft = new Float32Array(numFrames * (nFft / 2 + 1) * 2) // Complex numbers
    
    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopLength
      const frameData = audioData.slice(start, start + nFft)
      
      // Apply window and compute FFT
      const windowed = this.applyHammingWindow(frameData)
      const fft = this.computeFFT(windowed)
      
      // Store magnitude and phase
      const frameStart = frame * (nFft / 2 + 1) * 2
      for (let i = 0; i < nFft / 2 + 1; i++) {
        const real = fft[i * 2]
        const imag = fft[i * 2 + 1]
        const magnitude = Math.sqrt(real * real + imag * imag)
        const phase = Math.atan2(imag, real)
        
        stft[frameStart + i * 2] = magnitude
        stft[frameStart + i * 2 + 1] = phase
      }
    }
    
    return stft
  }

  private applyHammingWindow(frame: Float32Array): Float32Array {
    const windowed = new Float32Array(frame.length)
    const N = frame.length
    
    for (let n = 0; n < N; n++) {
      const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (N - 1))
      windowed[n] = frame[n] * window
    }
    
    return windowed
  }

  private computeFFT(signal: Float32Array): Float32Array {
    // Simplified FFT - in production use a proper FFT library
    const N = signal.length
    const result = new Float32Array(N * 2) // Real and imaginary parts
    
    for (let k = 0; k < N; k++) {
      let real = 0
      let imag = 0
      
      for (let n = 0; n < N; n++) {
        const angle = (-2 * Math.PI * k * n) / N
        real += signal[n] * Math.cos(angle)
        imag += signal[n] * Math.sin(angle)
      }
      
      result[k * 2] = real
      result[k * 2 + 1] = imag
    }
    
    return result
  }

  private createMelFilterbank(sampleRate: number, nFft: number, nMels: number): Float32Array {
    // Simplified Mel filterbank creation
    const filterbank = new Float32Array(nMels * (nFft / 2 + 1))
    
    // Create triangular filters
    for (let i = 0; i < nMels; i++) {
      const melLow = this.hzToMel(0)
      const melHigh = this.hzToMel(sampleRate / 2)
      const melStep = (melHigh - melLow) / (nMels + 1)
      
      const melCenter = melLow + (i + 1) * melStep
      const hzCenter = this.melToHz(melCenter)
      
      // Create triangular filter
      for (let j = 0; j < nFft / 2 + 1; j++) {
        const hz = (j * sampleRate) / nFft
        const mel = this.hzToMel(hz)
        
        if (mel >= melCenter - melStep && mel <= melCenter + melStep) {
          const weight = 1 - Math.abs(mel - melCenter) / melStep
          filterbank[i * (nFft / 2 + 1) + j] = Math.max(0, weight)
        }
      }
    }
    
    return filterbank
  }

  private hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700)
  }

  private melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1)
  }

  private applyMelFilterbank(stft: Float32Array, melFilterbank: Float32Array): Float32Array {
    const nMels = 128
    const nFft = 1024
    const numFrames = stft.length / ((nFft / 2 + 1) * 2)
    const melSpectrogram = new Float32Array(nMels * numFrames)
    
    for (let frame = 0; frame < numFrames; frame++) {
      const frameStart = frame * (nFft / 2 + 1) * 2
      
      for (let mel = 0; mel < nMels; mel++) {
        let sum = 0
        
        for (let freq = 0; freq < nFft / 2 + 1; freq++) {
          const magnitude = stft[frameStart + freq * 2]
          const weight = melFilterbank[mel * (nFft / 2 + 1) + freq]
          sum += magnitude * magnitude * weight
        }
        
        melSpectrogram[frame * nMels + mel] = sum
      }
    }
    
    return melSpectrogram
  }

  private applyLogTransformation(melSpectrogram: Float32Array): Float32Array {
    const logSpectrogram = new Float32Array(melSpectrogram.length)
    
    for (let i = 0; i < melSpectrogram.length; i++) {
      logSpectrogram[i] = Math.log(melSpectrogram[i] + 1e-10)
    }
    
    return logSpectrogram
  }

  private padSpectrogram(logMelSpectrogram: Float32Array): Float32Array {
    const nMels = 128
    const numFrames = logMelSpectrogram.length / nMels
    
    let paddedSpectrogram: Float32Array
    
    if (numFrames < 128) {
      // Pad with zeros to reach 128 frames
      paddedSpectrogram = new Float32Array(128 * nMels)
      paddedSpectrogram.set(logMelSpectrogram)
    } else if (numFrames > 128) {
      // Truncate to 128 frames
      paddedSpectrogram = logMelSpectrogram.slice(0, 128 * nMels)
    } else {
      paddedSpectrogram = logMelSpectrogram
    }
    
    return paddedSpectrogram
  }

  private async extractFeatureVector(paddedSpectrogram: Float32Array): Promise<number[]> {
    // In production, this would use the pre-trained network from the cough-detection project
    // For now, we'll use a simplified feature extraction
    
    const nMels = 128
    const numFrames = 128
    const features: number[] = []
    
    // Extract statistical features from the mel spectrogram
    for (let mel = 0; mel < nMels; mel++) {
      const melBand = paddedSpectrogram.slice(mel * numFrames, (mel + 1) * numFrames)
      
      // Mean
      const mean = melBand.reduce((sum, val) => sum + val, 0) / numFrames
      features.push(mean)
      
      // Standard deviation
      const variance = melBand.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numFrames
      features.push(Math.sqrt(variance))
      
      // Min and max
      features.push(Math.min(...melBand))
      features.push(Math.max(...melBand))
    }
    
    // Pad or truncate to 1024 features
    while (features.length < 1024) {
      features.push(0)
    }
    
    return features.slice(0, 1024)
  }
}

class CoughClassifier {
  private model: any = null

  constructor() {
    this.loadModel()
  }

  private async loadModel() {
    // In production, this would load the trained SVM model from the cough-detection project
    // For now, we'll use a simple rule-based classifier
    this.model = new SimpleCoughClassifier()
  }

  async classify(features: number[]): Promise<CoughDetectionResult> {
    if (!this.model) {
      throw new Error('Model not loaded')
    }

    const result = await this.model.predict(features)
    return result
  }
}

class SimpleCoughClassifier {
  async predict(features: number[]): Promise<CoughDetectionResult> {
    // Simple rule-based classification based on feature characteristics
    // In production, this would use the actual trained SVM model
    
    // Calculate some basic statistics from the features
    const mean = features.reduce((sum, val) => sum + val, 0) / features.length
    const variance = features.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / features.length
    const std = Math.sqrt(variance)
    
    // Simple heuristics for cough detection
    let coughScore = 0
    
    // Higher variance often indicates cough-like patterns
    if (variance > 0.1) coughScore += 0.3
    
    // Check for specific frequency band characteristics
    const lowFreqFeatures = features.slice(0, 256) // Lower frequency bands
    const highFreqFeatures = features.slice(256, 512) // Higher frequency bands
    
    const lowFreqMean = lowFreqFeatures.reduce((sum, val) => sum + val, 0) / lowFreqFeatures.length
    const highFreqMean = highFreqFeatures.reduce((sum, val) => sum + val, 0) / highFreqFeatures.length
    
    // Coughs often have specific frequency characteristics
    if (lowFreqMean > highFreqMean * 1.5) coughScore += 0.2
    if (highFreqMean > 0.05) coughScore += 0.2
    
    // Check for temporal patterns
    const temporalFeatures = features.slice(512, 768)
    const temporalVariance = temporalFeatures.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / temporalFeatures.length
    if (temporalVariance > 0.05) coughScore += 0.3
    
    const isCough = coughScore > 0.5
    const confidence = Math.min(coughScore, 0.95)
    
    return {
      isCough,
      confidence,
      features,
      classification: isCough ? 'cough' : 'non-cough'
    }
  }
} 