/**
 * Verse Media Configuration
 *
 * This file allows users to tag verses with images and videos.
 * Media items can be ordered and will display in a carousel when the verse media toggle is enabled.
 *
 * Supported media types:
 * - Images: jpg, jpeg, png, gif, webp, svg
 * - Videos: mp4, webm, ogg, YouTube URLs, Vimeo URLs
 *
 * Usage:
 * 1. Add media files to the public/media/verses/ directory
 * 2. Configure the verse media mapping below
 * 3. Click the media toggle button on a verse to view the carousel
 */

// Media item types
export type MediaType = 'image' | 'video';
export type VideoSource = 'local' | 'youtube' | 'vimeo';

export interface MediaItem {
  id: string;
  type: MediaType;
  // For local files, use path relative to public folder (e.g., '/media/verses/genesis-1-1.jpg')
  // For YouTube, use video ID or full URL
  // For Vimeo, use video ID or full URL
  src: string;
  // Optional thumbnail for videos
  thumbnail?: string;
  // Title shown in carousel
  title?: string;
  // Description/caption
  description?: string;
  // Video source type (only for videos)
  videoSource?: VideoSource;
  // Display order (lower numbers appear first)
  order?: number;
  // Optional attribution/credit
  attribution?: string;
}

export interface VerseMediaMapping {
  // Book ID (1-66)
  bookId: number;
  // Chapter number
  chapter: number;
  // Verse number
  verse: number;
  // Array of media items for this verse
  media: MediaItem[];
}

// Helper function to create a verse key for lookup
export function getVerseKey(bookId: number, chapter: number, verse: number): string {
  return `${bookId}:${chapter}:${verse}`;
}

// Helper to extract YouTube video ID from URL
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^[a-zA-Z0-9_-]{11}$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  return null;
}

// Helper to extract Vimeo video ID from URL
export function extractVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /^\d+$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  return null;
}

// Helper to get YouTube thumbnail
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Helper to get embed URL for videos
export function getVideoEmbedUrl(item: MediaItem): string | null {
  if (item.type !== 'video') return null;

  if (item.videoSource === 'youtube') {
    const videoId = extractYouTubeId(item.src);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    }
  } else if (item.videoSource === 'vimeo') {
    const videoId = extractVimeoId(item.src);
    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
  }

  // For local videos, return the src directly
  return item.src;
}

/**
 * VERSE MEDIA CONFIGURATION
 *
 * Add your verse media mappings here.
 * Each entry maps a specific verse to an array of media items.
 *
 * Example entries are provided below - modify or remove as needed.
 */
export const VERSE_MEDIA_CONFIG: VerseMediaMapping[] = [
  // Example: Genesis 1:1 - "In the beginning..."
  {
    bookId: 1,
    chapter: 33,
    verse: 3,
    media: [
      // {
      //   id: 'gen-1-1-creation',
      //   type: 'image',
      //   src: '/media/verses/creation-light.png',
      //   title: 'Creation of Light',
      //   description: 'Artistic representation of the creation of light',
      //   order: 1,
      // },
      // Example YouTube video
       {
         id: 'gen-3-33-video',
         type: 'video',
         src: '3qlfi6doRJI', // YouTube video ID
         videoSource: 'youtube',
         title: 'Peniel',
         description: 'A video explaining Genesis 33:3',
         order: 1,
       },
    ],
  },

  // Example: John 3:16 - "For God so loved the world..."
  {
    bookId: 43, // John
    chapter: 3,
    verse: 16,
    media: [
      {
        id: 'john-3-16-cross',
        type: 'image',
        src: '/media/verses/cross-love.jpg',
        title: 'God\'s Love',
        description: 'The ultimate expression of God\'s love',
        order: 1,
      },
    ],
  },

  // Example: Psalm 23:1 - "The Lord is my shepherd..."
  {
    bookId: 19, // Psalms
    chapter: 23,
    verse: 1,
    media: [
      {
        id: 'psalm-23-1-shepherd',
        type: 'image',
        src: '/media/verses/shepherd.jpg',
        title: 'The Good Shepherd',
        description: 'The Lord as our shepherd',
        order: 1,
      },
    ],
  },
];

// Build a lookup map for quick access
const verseMediaMap = new Map<string, MediaItem[]>();

// Initialize the map
VERSE_MEDIA_CONFIG.forEach((config) => {
  const key = getVerseKey(config.bookId, config.chapter, config.verse);
  // Sort media by order
  const sortedMedia = [...config.media].sort((a, b) => (a.order || 0) - (b.order || 0));
  verseMediaMap.set(key, sortedMedia);
});

/**
 * Get media items for a specific verse
 */
export function getVerseMedia(bookId: number, chapter: number, verse: number): MediaItem[] {
  const key = getVerseKey(bookId, chapter, verse);
  return verseMediaMap.get(key) || [];
}

/**
 * Check if a verse has media
 */
export function verseHasMedia(bookId: number, chapter: number, verse: number): boolean {
  const key = getVerseKey(bookId, chapter, verse);
  const media = verseMediaMap.get(key);
  return media !== undefined && media.length > 0;
}

/**
 * Get all verses with media for a specific chapter
 */
export function getChapterVersesWithMedia(bookId: number, chapter: number): Set<number> {
  const versesWithMedia = new Set<number>();

  VERSE_MEDIA_CONFIG.forEach((config) => {
    if (config.bookId === bookId && config.chapter === chapter) {
      versesWithMedia.add(config.verse);
    }
  });

  return versesWithMedia;
}

const verseMediaConfig = {
  getVerseMedia,
  verseHasMedia,
  getChapterVersesWithMedia,
  getVerseKey,
  extractYouTubeId,
  extractVimeoId,
  getYouTubeThumbnail,
  getVideoEmbedUrl,
};

export default verseMediaConfig;
