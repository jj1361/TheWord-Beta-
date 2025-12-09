# Green Screen Mode Feature

## Overview
Added optimized "Green Screen Mode" for cleaner background replacement with MediaPipe segmentation.

## What's New

### 1. Green Screen Optimization Settings
Located in `/src/config/webcamBackgrounds.ts`:

```typescript
greenScreen: {
  edgeSmoothing: 0.5,        // 0-1, higher = smoother edges
  confidenceThreshold: 0.7,   // 0-1, higher = stricter segmentation
  useEdgeRefinement: true     // Additional edge processing
}
```

### 2. Background Options
Each background can now specify `useGreenScreen: true` to enable optimized mode:

- **Zoom Background** - Standard segmentation
- **Zoom Background (Green Screen)** - Optimized segmentation with cleaner edges

### 3. How It Works

**Standard Mode:**
- Basic MediaPipe segmentation
- Good for general use
- Faster processing

**Green Screen Mode:**
- Applies confidence threshold to remove uncertain pixels
- Edge smoothing for cleaner cutout
- Optional 1px blur for refined edges
- Better for professional appearance

### 4. Optimization Features

1. **Confidence Threshold**: Removes pixels below 70% confidence (adjustable)
2. **Edge Smoothing**: Enhances edge alpha values for smoother transitions
3. **Edge Refinement**: Applies subtle blur to mask edges for natural blending

## Usage

1. Click **Show Camera** button
2. Click the **⚙️ (settings)** button in webcam panel
3. Select **"Zoom Background (Green Screen)"** for optimized mode
4. Compare with regular **"Zoom Background"** to see the difference

## Configuration

To adjust green screen settings, edit `/src/config/webcamBackgrounds.ts`:

```typescript
export const SEGMENTATION_CONFIG = {
  greenScreen: {
    edgeSmoothing: 0.5,          // Adjust 0-1
    confidenceThreshold: 0.7,     // Adjust 0-1
    useEdgeRefinement: true       // Toggle edge blur
  }
};
```

## Adding More Green Screen Backgrounds

To add a new optimized background:

```typescript
{
  id: 'custom-green',
  name: 'My Background (Green Screen)',
  imagePath: '/images/backgrounds/my-background.jpg',
  enabled: true,
  useGreenScreen: true  // Enable optimization
}
```

## Performance Notes

- Green Screen Mode has slightly higher CPU usage due to mask processing
- Edge refinement adds ~1-2ms per frame
- Overall performance impact is minimal on modern devices

## Tips for Best Results

1. **Lighting**: Ensure even lighting on your face
2. **Contrast**: Sit against a contrasting background
3. **Distance**: Maintain 2-3 feet from camera
4. **Settings**: Adjust `confidenceThreshold` if edges are too soft/harsh
5. **Compare**: Try both standard and green screen modes to see which works better
