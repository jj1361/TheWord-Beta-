# Person Images Configuration Guide

This guide explains how to add custom profile pictures and cover photos to person profiles in the Bible app.

## Overview

The person profile displays support custom images for:
- **Avatar Image**: Circular profile picture displayed in the profile header
- **Cover Photo**: Banner image displayed at the top of the profile

When no custom images are configured:
- Avatar defaults to colored circle with person's initials
- Cover photo defaults to gradient background

## Configuration File

Person images are configured in: `src/config/personImages.ts`

## Adding Images

### 1. Prepare Your Images

**Avatar Images:**
- Recommended size: 160x160 pixels (or larger square)
- Format: JPG, PNG, or WebP
- Will be displayed as a circle (cropped to center)

**Cover Photos:**
- Recommended size: 940x300 pixels (or similar aspect ratio ~3:1)
- Format: JPG, PNG, or WebP
- Will be displayed as background image (centered and cover)

### 2. Store Images

You have two options for storing images:

#### Option A: Local Images (in public folder)
```
bible-app/
├── public/
│   └── images/
│       └── people/
│           ├── moses-avatar.jpg
│           ├── moses-cover.jpg
│           ├── david-avatar.jpg
│           └── david-cover.jpg
```

#### Option B: External URLs
Use any publicly accessible URL (CDN, cloud storage, etc.)

### 3. Configure Person Images

Edit `src/config/personImages.ts`:

```typescript
export const personImages: { [personID: string]: PersonImageConfig } = {
  'Moses': {
    avatarUrl: '/images/people/moses-avatar.jpg',
    coverUrl: '/images/people/moses-cover.jpg'
  },

  'David': {
    avatarUrl: '/images/people/david-avatar.jpg',
    coverUrl: '/images/people/david-cover.jpg'
  },

  'Jesus': {
    avatarUrl: 'https://example.com/images/jesus-avatar.jpg',
    coverUrl: 'https://example.com/images/jesus-cover.jpg'
  },

  // You can configure just avatar or just cover:
  'Paul': {
    avatarUrl: '/images/people/paul-avatar.jpg',
    // No cover photo - will use gradient default
  },

  'Mary': {
    // No avatar - will use initials default
    coverUrl: '/images/people/mary-cover.jpg'
  }
};
```

## Finding Person IDs

Person IDs are the identifiers used in the person data CSV file. To find the correct ID:

1. Click on a person link in a verse
2. Look at the browser console log: `Loading person profile for ID: [personID]`
3. Use that exact string as the key in `personImages`

## Examples

### Example 1: Using Local Images
```typescript
'Abraham': {
  avatarUrl: '/images/people/abraham-avatar.jpg',
  coverUrl: '/images/people/abraham-cover.jpg'
}
```

### Example 2: Using External URLs
```typescript
'Peter': {
  avatarUrl: 'https://cdn.example.com/biblical-people/peter-profile.jpg',
  coverUrl: 'https://cdn.example.com/biblical-people/peter-banner.jpg'
}
```

### Example 3: Avatar Only
```typescript
'John': {
  avatarUrl: '/images/people/john-avatar.jpg'
  // Cover will use default gradient
}
```

### Example 4: Cover Only
```typescript
'Sarah': {
  coverUrl: '/images/people/sarah-cover.jpg'
  // Avatar will show initials "SA"
}
```

## Helper Functions

The configuration file exports several helper functions:

```typescript
// Get all image config for a person
const images = getPersonImages('Moses');
// Returns: { avatarUrl: '...', coverUrl: '...' } or undefined

// Check if person has custom avatar
if (hasCustomAvatar('Moses')) {
  // ...
}

// Check if person has custom cover
if (hasCustomCover('Moses')) {
  // ...
}

// Get specific URLs
const avatarUrl = getAvatarUrl('Moses');
const coverUrl = getCoverUrl('Moses');
```

## Image Best Practices

1. **Optimize images** for web:
   - Compress to reduce file size
   - Use WebP format for better compression
   - Don't exceed 1MB per image

2. **Aspect ratios**:
   - Avatars: Use square images (1:1)
   - Covers: Use ~3:1 ratio (e.g., 900x300, 1200x400)

3. **Content**:
   - Ensure images are appropriate and relevant
   - Consider historical/artistic representations
   - Respect copyright and attribution

4. **Accessibility**:
   - Images are decorative; alt text is automatically set to person's name
   - Initials fallback ensures usability without images

## Troubleshooting

### Image Not Showing
- Check the person ID matches exactly (case-sensitive)
- Verify image path/URL is correct
- Check browser console for 404 errors
- Ensure image files are in the `public` folder for local images

### Image Appears Distorted
- Check image aspect ratio
- For avatars: Use square images
- For covers: Use wide images (3:1 ratio recommended)

### Changes Not Appearing
- Clear browser cache
- Restart development server
- Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+F5)

## Advanced Configuration

### Using Environment Variables for CDN
```typescript
const CDN_BASE = process.env.REACT_APP_CDN_URL || '';

export const personImages = {
  'Moses': {
    avatarUrl: `${CDN_BASE}/people/moses-avatar.jpg`,
    coverUrl: `${CDN_BASE}/people/moses-cover.jpg`
  }
};
```

### Programmatic Configuration
You can also add images programmatically:

```typescript
import { personImages } from './config/personImages';

// Add more images at runtime
personImages['Elijah'] = {
  avatarUrl: '/images/people/elijah-avatar.jpg',
  coverUrl: '/images/people/elijah-cover.jpg'
};
```

## Future Enhancements

Potential improvements to consider:
- Lazy loading for images
- Multiple image sizes (responsive)
- Image caching strategy
- Fallback images
- Image upload interface
- AI-generated historical artwork
