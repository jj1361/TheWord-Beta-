/**
 * Media Service
 * Manages media state for the church worship presentation system
 */

import {
  MediaState,
  DEFAULT_MEDIA_STATE,
  AudioTrack,
  YouTubeTrack,
  Announcement,
  VideoSource,
  PresentationSource,
  BackgroundConfig,
} from '../types/media';

const STORAGE_KEY = 'mediaState';

class MediaService {
  private state: MediaState;
  private listeners: Set<(state: MediaState) => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  // Load state from localStorage
  private loadState(): MediaState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_MEDIA_STATE, ...parsed };
      }
    } catch (error) {
      console.error('Error loading media state:', error);
    }
    return { ...DEFAULT_MEDIA_STATE };
  }

  // Save state to localStorage
  private saveState(): void {
    try {
      // Don't save playing states - they should reset on reload
      // Don't save large data (video files, audio files with base64 data)
      const stateToSave = {
        ...this.state,
        videoPlaying: false,
        audioPlaying: false,
        youtubePlaying: false,
        displayScreenOpen: false,
        // Don't persist video source (too large for localStorage)
        videoSource: this.state.videoSource?.type === 'url' ? this.state.videoSource : null,
        // Don't persist audio playlist with file data (too large)
        audioPlaylist: this.state.audioPlaylist.filter(track => track.type !== 'file'),
        // Don't persist background images (too large)
        backgrounds: this.state.backgrounds.filter(bg => bg.type === 'color'),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      // Handle quota exceeded - clear storage and try again with minimal data
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing media state');
        try {
          localStorage.removeItem(STORAGE_KEY);
          // Save minimal state without any media files
          const minimalState = {
            ...this.state,
            videoPlaying: false,
            audioPlaying: false,
            youtubePlaying: false,
            displayScreenOpen: false,
            videoSource: null,
            audioPlaylist: [],
            backgrounds: this.state.backgrounds.filter(bg => bg.type === 'color'),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalState));
        } catch {
          // If still failing, just clear it
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        console.error('Error saving media state:', error);
      }
    }
  }

  // Notify listeners of state changes
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  // Subscribe to state changes
  subscribe(listener: (state: MediaState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Get current state
  getState(): MediaState {
    return { ...this.state };
  }

  // Update state
  private updateState(updates: Partial<MediaState>): void {
    this.state = { ...this.state, ...updates };
    this.saveState();
    this.notifyListeners();
  }

  // ==================== VIDEO ====================

  setVideoSource(source: VideoSource | null): void {
    this.updateState({
      videoSource: source,
      videoPlaying: false,
      activeMode: source ? 'video' : this.state.activeMode,
    });
  }

  setVideoPlaying(playing: boolean): void {
    this.updateState({ videoPlaying: playing });
  }

  setVideoVolume(volume: number): void {
    this.updateState({ videoVolume: Math.max(0, Math.min(1, volume)) });
  }

  setVideoMuted(muted: boolean): void {
    this.updateState({ videoMuted: muted });
  }

  // ==================== AUDIO ====================

  addAudioTrack(track: AudioTrack): void {
    this.updateState({
      audioPlaylist: [...this.state.audioPlaylist, track],
    });
  }

  removeAudioTrack(trackId: string): void {
    const newPlaylist = this.state.audioPlaylist.filter((t) => t.id !== trackId);
    let newIndex = this.state.currentTrackIndex;

    // Adjust current index if needed
    if (newIndex >= newPlaylist.length) {
      newIndex = Math.max(0, newPlaylist.length - 1);
    }

    this.updateState({
      audioPlaylist: newPlaylist,
      currentTrackIndex: newIndex,
      audioPlaying: newPlaylist.length === 0 ? false : this.state.audioPlaying,
    });
  }

  reorderAudioPlaylist(fromIndex: number, toIndex: number): void {
    const newPlaylist = [...this.state.audioPlaylist];
    const [removed] = newPlaylist.splice(fromIndex, 1);
    newPlaylist.splice(toIndex, 0, removed);

    // Adjust current track index
    let newCurrentIndex = this.state.currentTrackIndex;
    if (fromIndex === this.state.currentTrackIndex) {
      newCurrentIndex = toIndex;
    } else if (fromIndex < this.state.currentTrackIndex && toIndex >= this.state.currentTrackIndex) {
      newCurrentIndex--;
    } else if (fromIndex > this.state.currentTrackIndex && toIndex <= this.state.currentTrackIndex) {
      newCurrentIndex++;
    }

    this.updateState({
      audioPlaylist: newPlaylist,
      currentTrackIndex: newCurrentIndex,
    });
  }

  setCurrentTrack(index: number): void {
    if (index >= 0 && index < this.state.audioPlaylist.length) {
      this.updateState({ currentTrackIndex: index });
    }
  }

  nextTrack(): void {
    const { audioPlaylist, currentTrackIndex, audioShuffle, audioRepeat } = this.state;
    if (audioPlaylist.length === 0) return;

    let nextIndex: number;
    if (audioShuffle) {
      nextIndex = Math.floor(Math.random() * audioPlaylist.length);
    } else {
      nextIndex = currentTrackIndex + 1;
      if (nextIndex >= audioPlaylist.length) {
        nextIndex = audioRepeat === 'all' ? 0 : audioPlaylist.length - 1;
        if (audioRepeat !== 'all') {
          this.updateState({ audioPlaying: false });
          return;
        }
      }
    }

    this.updateState({ currentTrackIndex: nextIndex });
  }

  previousTrack(): void {
    const { audioPlaylist, currentTrackIndex } = this.state;
    if (audioPlaylist.length === 0) return;

    const prevIndex = currentTrackIndex - 1 < 0 ? audioPlaylist.length - 1 : currentTrackIndex - 1;
    this.updateState({ currentTrackIndex: prevIndex });
  }

  setAudioPlaying(playing: boolean): void {
    this.updateState({ audioPlaying: playing });
  }

  setAudioVolume(volume: number): void {
    this.updateState({ audioVolume: Math.max(0, Math.min(1, volume)) });
  }

  setAudioMuted(muted: boolean): void {
    this.updateState({ audioMuted: muted });
  }

  setAudioRepeat(repeat: 'none' | 'one' | 'all'): void {
    this.updateState({ audioRepeat: repeat });
  }

  setAudioShuffle(shuffle: boolean): void {
    this.updateState({ audioShuffle: shuffle });
  }

  clearAudioPlaylist(): void {
    this.updateState({
      audioPlaylist: [],
      currentTrackIndex: 0,
      audioPlaying: false,
    });
  }

  // ==================== YOUTUBE ====================

  setYoutubePlaylistUrl(url: string): void {
    this.updateState({ youtubePlaylistUrl: url });
  }

  setYoutubeTracks(tracks: YouTubeTrack[]): void {
    this.updateState({
      youtubeTracks: tracks,
      youtubeCurrentIndex: 0,
    });
  }

  setYoutubeCurrentIndex(index: number): void {
    if (index >= 0 && index < this.state.youtubeTracks.length) {
      this.updateState({ youtubeCurrentIndex: index });
    }
  }

  setYoutubeAudioOnly(audioOnly: boolean): void {
    this.updateState({ youtubeAudioOnly: audioOnly });
  }

  setYoutubePlaying(playing: boolean): void {
    this.updateState({ youtubePlaying: playing });
  }

  nextYoutubeTrack(): void {
    const { youtubeTracks, youtubeCurrentIndex } = this.state;
    if (youtubeTracks.length === 0) return;

    const nextIndex = (youtubeCurrentIndex + 1) % youtubeTracks.length;
    this.updateState({ youtubeCurrentIndex: nextIndex });
  }

  previousYoutubeTrack(): void {
    const { youtubeTracks, youtubeCurrentIndex } = this.state;
    if (youtubeTracks.length === 0) return;

    const prevIndex = youtubeCurrentIndex - 1 < 0 ? youtubeTracks.length - 1 : youtubeCurrentIndex - 1;
    this.updateState({ youtubeCurrentIndex: prevIndex });
  }

  // ==================== PRESENTATIONS ====================

  setPresentation(presentation: PresentationSource | null): void {
    this.updateState({
      presentation,
      currentSlide: 1,
      activeMode: presentation ? 'presentation' : this.state.activeMode,
    });
  }

  setCurrentSlide(slide: number): void {
    const { presentation } = this.state;
    if (presentation && slide >= 1) {
      const maxSlide = presentation.totalSlides || 999;
      this.updateState({ currentSlide: Math.min(slide, maxSlide) });
    }
  }

  nextSlide(): void {
    this.setCurrentSlide(this.state.currentSlide + 1);
  }

  previousSlide(): void {
    this.setCurrentSlide(Math.max(1, this.state.currentSlide - 1));
  }

  // ==================== BACKGROUNDS ====================

  addBackground(background: BackgroundConfig): void {
    this.updateState({
      backgrounds: [...this.state.backgrounds, background],
    });
  }

  removeBackground(index: number): void {
    const newBackgrounds = this.state.backgrounds.filter((_, i) => i !== index);
    let newActiveIndex = this.state.activeBackgroundIndex;

    if (index === this.state.activeBackgroundIndex) {
      newActiveIndex = -1;
    } else if (index < this.state.activeBackgroundIndex) {
      newActiveIndex--;
    }

    this.updateState({
      backgrounds: newBackgrounds,
      activeBackgroundIndex: newActiveIndex,
    });
  }

  setActiveBackground(index: number): void {
    this.updateState({
      activeBackgroundIndex: index,
      activeMode: 'background',
    });
  }

  // ==================== ANNOUNCEMENTS ====================

  addAnnouncement(text: string): void {
    const announcement: Announcement = {
      id: Date.now().toString(),
      text,
      enabled: true,
      createdAt: Date.now(),
    };
    this.updateState({
      announcements: [...this.state.announcements, announcement],
    });
  }

  updateAnnouncement(id: string, text: string): void {
    const newAnnouncements = this.state.announcements.map((a) =>
      a.id === id ? { ...a, text } : a
    );
    this.updateState({ announcements: newAnnouncements });
  }

  toggleAnnouncement(id: string): void {
    const newAnnouncements = this.state.announcements.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    this.updateState({ announcements: newAnnouncements });
  }

  removeAnnouncement(id: string): void {
    const newAnnouncements = this.state.announcements.filter((a) => a.id !== id);
    this.updateState({ announcements: newAnnouncements });
  }

  setAnnouncementsEnabled(enabled: boolean): void {
    this.updateState({ announcementsEnabled: enabled });
  }

  setRotationInterval(seconds: number): void {
    this.updateState({ rotationInterval: Math.max(1, seconds) });
  }

  nextAnnouncement(): void {
    const enabledAnnouncements = this.state.announcements.filter((a) => a.enabled);
    if (enabledAnnouncements.length === 0) return;

    const currentIndex = this.state.currentAnnouncementIndex;
    const nextIndex = (currentIndex + 1) % enabledAnnouncements.length;
    this.updateState({ currentAnnouncementIndex: nextIndex });
  }

  // ==================== DISPLAY ====================

  setActiveMode(mode: 'background' | 'video' | 'presentation' | 'youtube'): void {
    this.updateState({ activeMode: mode });
  }

  setDisplayScreenOpen(open: boolean): void {
    this.updateState({ displayScreenOpen: open });
  }

  // ==================== UTILITIES ====================

  // Generate unique ID
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convert file to base64 data URL
  async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Parse YouTube playlist URL to extract playlist ID
  parseYoutubePlaylistUrl(url: string): string | null {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
  }

  // Convert Google Slides URL to embed URL
  convertGoogleSlidesUrl(url: string): string {
    // Handle various Google Slides URL formats
    if (url.includes('/embed')) {
      return url;
    }

    // Extract presentation ID
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`;
    }

    return url;
  }

  // Reset all state
  reset(): void {
    this.state = { ...DEFAULT_MEDIA_STATE };
    this.saveState();
    this.notifyListeners();
  }
}

export const mediaService = new MediaService();
