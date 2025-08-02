declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react'
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string
    absoluteStrokeWidth?: boolean
  }
  
  export const Mic: ComponentType<IconProps>
  export const Camera: ComponentType<IconProps>
  export const Activity: ComponentType<IconProps>
  export const Brain: ComponentType<IconProps>
  export const History: ComponentType<IconProps>
  export const Shield: ComponentType<IconProps>
  export const Stethoscope: ComponentType<IconProps>
  export const Loader2: ComponentType<IconProps>
  export const Database: ComponentType<IconProps>
  export const MicOff: ComponentType<IconProps>
  export const Play: ComponentType<IconProps>
  export const Download: ComponentType<IconProps>
  export const AudioWaveformIcon: ComponentType<IconProps>
  export const CameraOff: ComponentType<IconProps>
  export const Eye: ComponentType<IconProps>
  export const Badge: ComponentType<IconProps>
  export const Progress: ComponentType<IconProps>
  export const AlertTriangle: ComponentType<IconProps>
  export const CheckCircle: ComponentType<IconProps>
  export const RefreshCw: ComponentType<IconProps>
  export const Share2: ComponentType<IconProps>
  export const Wind: ComponentType<IconProps>
} 