/**
 * Media Presentation Types
 * Types for the church worship/service media presentation system
 */

// Audio track in a playlist
export interface AudioTrack {
  id: string;
  name: string;
  src: string; // base64 data URL or file path
  duration?: number; // in seconds
  type: 'file' | 'url';
}

// YouTube track extracted from playlist
export interface YouTubeTrack {
  id: string;
  videoId: string;
  title: string;
  thumbnail?: string;
  duration?: number;
}

// Announcement for rotating banner
export interface Announcement {
  id: string;
  text: string;
  enabled: boolean;
  createdAt: number;
}

// Video source configuration
export interface VideoSource {
  type: 'file' | 'url';
  src: string;
  name?: string;
}

// Presentation configuration
export interface PresentationSource {
  type: 'pdf' | 'gslides' | 'pptx';
  src: string;
  name?: string;
  totalSlides?: number;
}

// Background configuration
export interface BackgroundConfig {
  type: 'image' | 'color';
  value: string; // image data URL or hex color
  name?: string;
}

// Complete media state
export interface MediaState {
  // Video
  videoSource: VideoSource | null;
  videoPlaying: boolean;
  videoVolume: number;
  videoMuted: boolean;

  // Audio
  audioPlaylist: AudioTrack[];
  currentTrackIndex: number;
  audioPlaying: boolean;
  audioVolume: number;
  audioMuted: boolean;
  audioRepeat: 'none' | 'one' | 'all';
  audioShuffle: boolean;

  // YouTube
  youtubePlaylistUrl: string;
  youtubeTracks: YouTubeTrack[];
  youtubeCurrentIndex: number;
  youtubeAudioOnly: boolean;
  youtubePlaying: boolean;

  // Presentations
  presentation: PresentationSource | null;
  currentSlide: number;

  // Background
  backgrounds: BackgroundConfig[];
  activeBackgroundIndex: number;

  // Announcements
  announcements: Announcement[];
  announcementsEnabled: boolean;
  rotationInterval: number; // seconds between rotations
  currentAnnouncementIndex: number;

  // Display mode
  activeMode: 'background' | 'video' | 'presentation' | 'youtube';
  displayScreenOpen: boolean;
}

// Default state
export const DEFAULT_MEDIA_STATE: MediaState = {
  videoSource: null,
  videoPlaying: false,
  videoVolume: 1,
  videoMuted: false,

  audioPlaylist: [],
  currentTrackIndex: 0,
  audioPlaying: false,
  audioVolume: 1,
  audioMuted: false,
  audioRepeat: 'none',
  audioShuffle: false,

  youtubePlaylistUrl: '',
  youtubeTracks: [],
  youtubeCurrentIndex: 0,
  youtubeAudioOnly: true,
  youtubePlaying: false,

  presentation: null,
  currentSlide: 1,

  backgrounds: [],
  activeBackgroundIndex: -1,

  announcements: [],
  announcementsEnabled: false,
  rotationInterval: 5,
  currentAnnouncementIndex: 0,

  activeMode: 'background',
  displayScreenOpen: false,
};

// Control panel tab types
export type MediaTab = 'video' | 'audio' | 'youtube' | 'presentations' | 'background' | 'announcements';
