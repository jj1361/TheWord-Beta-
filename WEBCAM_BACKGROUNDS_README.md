# Webcam Background Configuration

This application includes a webcam feature with background replacement capabilities, similar to green screen technology.

## Features

- **No Background**: Display the webcam feed without any modifications
- **Blur Background**: Apply a blur effect to the background while keeping the person in focus
- **Custom Backgrounds**: Replace the background with custom images

## Configuration File

The background options are configured in `/src/config/webcamBackgrounds.ts`

### Configuration Structure

```typescript
export interface BackgroundConfig {
  id: string;           // Unique identifier for the background
  name: string;         // Display name shown in the UI
  imagePath: string;    // Path to the background image (relative to public folder)
  enabled: boolean;     // Whether this background is available for selection
}
```

### Adding New Backgrounds

1. **Add your background image** to `/public/images/backgrounds/`
   - Recommended format: JPG or PNG
   - Recommended size: 1920x1080 (16:9 aspect ratio)
   - Keep file sizes reasonable (< 500KB) for better performance

2. **Update the configuration file** (`/src/config/webcamBackgrounds.ts`):

```typescript
{
  id: 'custom4',  // Unique ID
  name: 'My Custom Background',
  imagePath: '/images/backgrounds/my-background.jpg',
  enabled: true
}
```

3. **Save the file** - changes will be reflected when the app reloads

### Segmentation Configuration

You can adjust the background blur and segmentation quality in the configuration file:

```typescript
export const SEGMENTATION_CONFIG = {
  modelSelection: 1, // 0: general, 1: landscape (better for webcam)
  selfieMode: true,
  blur: {
    blurAmount: 15,  // Blur intensity (1-50)
    edgeBlur: 3      // Edge softening (1-10)
  }
};
```

## Using the Webcam Background Feature

1. Click the **Show Camera** button to enable the webcam
2. Click the **⚙️ (settings)** button in the webcam panel header
3. Select your desired background from the dropdown:
   - **No Background**: Shows normal webcam feed
   - **Blur Background**: Blurs the background
   - **Custom Background 1-3**: Uses pre-configured background images

## Current Implementation

**Note**: The current implementation uses a simplified background removal algorithm based on edge detection and color thresholding. This is a basic version suitable for demonstration purposes.

### For Production Use

To achieve professional-quality background segmentation (like Zoom/Teams), consider integrating one of these ML-based solutions:

#### Option 1: MediaPipe Selfie Segmentation (Recommended)
```bash
npm install @mediapipe/selfie_segmentation
```

#### Option 2: TensorFlow BodyPix
```bash
npm install @tensorflow-models/body-pix @tensorflow/tfjs
```

#### Option 3: Background Removal API
Use a third-party API service for cloud-based segmentation

## File Structure

```
bible-app/
├── public/
│   └── images/
│       └── backgrounds/          # Place background images here
│           ├── background1.jpg
│           ├── background2.jpg
│           └── background3.jpg
├── src/
│   ├── components/
│   │   ├── WebcamDisplay.tsx     # Webcam component with background logic
│   │   └── WebcamDisplay.css     # Webcam styling
│   └── config/
│       └── webcamBackgrounds.ts  # Background configuration file
```

## Tips for Best Results

1. **Lighting**: Ensure good, even lighting on the person
2. **Contrast**: Use backgrounds that contrast with your clothing
3. **Distance**: Sit at a reasonable distance from the webcam
4. **Solid Background**: For best results with the basic algorithm, use a solid-colored wall behind you
5. **Camera Position**: Center yourself in the frame

## Troubleshooting

### Background not loading
- Check that the image path in the configuration is correct
- Ensure the image file exists in `/public/images/backgrounds/`
- Check browser console for errors

### Poor segmentation quality
- Improve lighting conditions
- Increase contrast between you and the background
- Consider upgrading to ML-based segmentation (see Production Use section)

### Performance issues
- Reduce background image file sizes
- Use fewer background options
- Close other applications using the webcam

## Future Enhancements

- Integration with MediaPipe for AI-based person segmentation
- Real-time background blur with adjustable intensity
- Virtual background library with categories
- Ability to upload custom backgrounds through the UI
- Background video support
- Chroma key (green screen) support
