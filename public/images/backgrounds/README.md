# Webcam Background Images

Place your custom background images in this folder.

## Recommended Specifications

- **Format**: JPG or PNG
- **Resolution**: 1920x1080 (16:9 aspect ratio)
- **File Size**: < 500KB for best performance
- **Naming**: Use descriptive names (e.g., `office-background.jpg`, `nature-scene.png`)

## Currently Configured Backgrounds

The following background images are referenced in `/src/config/webcamBackgrounds.ts`:

1. `background1.jpg` - Custom Background 1
2. `background2.jpg` - Custom Background 2
3. `background3.jpg` - Custom Background 3

## Adding New Backgrounds

1. Copy your image file to this directory
2. Update the configuration in `/src/config/webcamBackgrounds.ts`
3. Add a new entry with the image path relative to the public folder

Example:
```typescript
{
  id: 'library',
  name: 'Library Background',
  imagePath: '/images/backgrounds/library-background.jpg',
  enabled: true
}
```

## Sample Background Ideas

- Office settings
- Nature scenes (mountains, beaches, forests)
- Solid colors (professional looking gradients)
- Bookshelf or library
- Biblical scenes or artwork
- Abstract patterns

You can find free background images from:
- Unsplash.com
- Pexels.com
- Pixabay.com

Make sure you have the right to use any images you add.
