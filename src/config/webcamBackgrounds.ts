export interface BackgroundConfig {
  id: string;
  name: string;
  imagePath: string;
  enabled: boolean;
  useGreenScreen?: boolean; // Optimized segmentation mode
}

export const WEBCAM_BACKGROUNDS: BackgroundConfig[] = [
  {
    id: 'none',
    name: 'No Background',
    imagePath: '',
    enabled: true,
    useGreenScreen: false
  },
  {
    id: 'blur',
    name: 'Blur Background',
    imagePath: '',
    enabled: true,
    useGreenScreen: false
  },
  {
    id: 'custom1',
    name: 'Zoom Background',
    imagePath: '/images/backgrounds/background1.jpg',
    enabled: true,
    useGreenScreen: false
  },
  {
    id: 'custom1-green',
    name: 'Zoom Background (Green Screen)',
    imagePath: '/images/backgrounds/background1.jpg',
    enabled: true,
    useGreenScreen: true
  },
  {
    id: 'custom2',
    name: 'Custom Background 2',
    imagePath: '/images/backgrounds/background2.jpg',
    enabled: true,
    useGreenScreen: false
  },
  {
    id: 'custom3',
    name: 'Custom Background 3',
    imagePath: '/images/backgrounds/background3.jpg',
    enabled: true,
    useGreenScreen: false
  }
];

export const SEGMENTATION_CONFIG = {
  modelSelection: 1, // 0: general, 1: landscape (better for webcam)
  selfieMode: true,
  blur: {
    blurAmount: 15,
    edgeBlur: 3
  },
  greenScreen: {
    // Optimized settings for clean background replacement
    edgeSmoothing: 0.5, // 0-1, higher = smoother edges
    confidenceThreshold: 0.7, // 0-1, higher = stricter segmentation
    useEdgeRefinement: true // Additional edge processing for cleaner cutout
  }
};
