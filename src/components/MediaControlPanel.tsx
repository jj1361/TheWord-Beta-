import React, { useState, useEffect, useRef } from 'react';
import { MediaState, MediaTab, AudioTrack, BackgroundConfig } from '../types/media';
import { mediaService } from '../services/mediaService';
import './MediaControlPanel.css';

interface MediaControlPanelProps {
  onClose: () => void;
  onOpenDisplay: () => void;
}

const MediaControlPanel: React.FC<MediaControlPanelProps> = ({ onClose, onOpenDisplay }) => {
  const [state, setState] = useState<MediaState>(mediaService.getState());
  const [activeTab, setActiveTab] = useState<MediaTab>('video');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [youtubeUrlInput, setYoutubeUrlInput] = useState(state.youtubePlaylistUrl);
  const [slidesUrlInput, setSlidesUrlInput] = useState('');
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [editingAnnouncementText, setEditingAnnouncementText] = useState('');

  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const presentationInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const currentTrackIdRef = useRef<string | null>(null);
  const pendingPlayRef = useRef<boolean>(false);

  // Subscribe to media state changes
  useEffect(() => {
    const unsubscribe = mediaService.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  // Handle audio source changes - track by ID instead of comparing src URLs
  useEffect(() => {
    const currentTrack = state.audioPlaylist[state.currentTrackIndex];

    if (audioPlayerRef.current && currentTrack && currentTrack.src) {
      // Only load if track changed (by ID)
      if (currentTrackIdRef.current !== currentTrack.id) {
        currentTrackIdRef.current = currentTrack.id;
        pendingPlayRef.current = state.audioPlaying;
        audioPlayerRef.current.src = currentTrack.src;
        audioPlayerRef.current.load();
      }
    } else if (!currentTrack || !currentTrack.src) {
      // No track available - reset without setting empty src (which causes error)
      currentTrackIdRef.current = null;
      pendingPlayRef.current = false;
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        // Don't set src to empty string - it causes "no supported source" error
        audioPlayerRef.current.removeAttribute('src');
      }
    }
  }, [state.currentTrackIndex, state.audioPlaylist, state.audioPlaying]);

  // Handle play/pause state changes (only when source is already loaded)
  useEffect(() => {
    const currentTrack = state.audioPlaylist[state.currentTrackIndex];
    const audio = audioPlayerRef.current;

    // Guard: Must have audio element, valid track with src, and matching track ID
    if (!audio || !currentTrack || !currentTrack.src || currentTrackIdRef.current !== currentTrack.id) {
      return;
    }

    // Additional guard: Don't try to play if src attribute is missing
    if (!audio.hasAttribute('src') || !audio.src) {
      return;
    }

    if (state.audioPlaying) {
      // Check if ready to play (readyState 2 = HAVE_CURRENT_DATA)
      if (audio.readyState >= 2) {
        audio.play().catch((err) => {
          console.error('Audio play error:', err);
        });
      } else {
        // Not ready yet - set pending flag, will play on canplay event
        pendingPlayRef.current = true;
      }
    } else {
      audio.pause();
    }
  }, [state.audioPlaying, state.currentTrackIndex, state.audioPlaylist]);

  // Handle audio can play event
  const handleAudioCanPlay = () => {
    if (audioPlayerRef.current && (pendingPlayRef.current || state.audioPlaying)) {
      pendingPlayRef.current = false;
      audioPlayerRef.current.play().catch((err) => {
        console.error('Audio play error on canplay:', err);
      });
    }
  };

  // Handle audio error
  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget;
    console.error('Audio error:', audio.error?.message || 'Unknown error');
  };

  // Handle audio volume
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.volume = state.audioVolume;
      audioPlayerRef.current.muted = state.audioMuted;
    }
  }, [state.audioVolume, state.audioMuted]);

  // Handle audio track end
  const handleAudioEnded = () => {
    if (state.audioRepeat === 'one') {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.currentTime = 0;
        audioPlayerRef.current.play().catch(console.error);
      }
    } else {
      mediaService.nextTrack();
    }
  };

  // Handle video file upload
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await mediaService.fileToDataUrl(file);
      mediaService.setVideoSource({
        type: 'file',
        src: dataUrl,
        name: file.name,
      });
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  };

  // Handle video URL
  const handleVideoUrlSubmit = () => {
    if (!videoUrlInput.trim()) return;
    mediaService.setVideoSource({
      type: 'url',
      src: videoUrlInput.trim(),
      name: 'Video URL',
    });
    setVideoUrlInput('');
  };

  // Handle audio file upload
  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const dataUrl = await mediaService.fileToDataUrl(file);
        const track: AudioTrack = {
          id: mediaService.generateId(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          src: dataUrl,
          type: 'file',
        };
        mediaService.addAudioTrack(track);
      } catch (error) {
        console.error('Error uploading audio:', error);
      }
    }

    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  // Handle background image upload
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await mediaService.fileToDataUrl(file);
      const background: BackgroundConfig = {
        type: 'image',
        value: dataUrl,
        name: file.name,
      };
      mediaService.addBackground(background);
    } catch (error) {
      console.error('Error uploading background:', error);
    }

    if (backgroundInputRef.current) {
      backgroundInputRef.current.value = '';
    }
  };

  // Handle background color
  const handleBackgroundColor = (color: string) => {
    const background: BackgroundConfig = {
      type: 'color',
      value: color,
      name: color,
    };
    mediaService.addBackground(background);
  };

  // Handle presentation file upload
  const handlePresentationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await mediaService.fileToDataUrl(file);
      const ext = file.name.split('.').pop()?.toLowerCase();
      const type = ext === 'pdf' ? 'pdf' : 'pptx';
      mediaService.setPresentation({
        type: type as 'pdf' | 'pptx',
        src: dataUrl,
        name: file.name,
      });
    } catch (error) {
      console.error('Error uploading presentation:', error);
    }
  };

  // Handle Google Slides URL
  const handleSlidesUrlSubmit = () => {
    if (!slidesUrlInput.trim()) return;
    mediaService.setPresentation({
      type: 'gslides',
      src: slidesUrlInput.trim(),
      name: 'Google Slides',
    });
    setSlidesUrlInput('');
  };

  // Parse YouTube video ID from various URL formats
  const parseYoutubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Handle YouTube URL submit - supports single videos
  const handleYoutubeUrlSubmit = () => {
    if (!youtubeUrlInput.trim()) return;

    const url = youtubeUrlInput.trim();
    const videoId = parseYoutubeVideoId(url);

    if (videoId) {
      // Add as a single video track
      const newTrack = {
        id: mediaService.generateId(),
        videoId,
        title: `YouTube Video (${videoId})`,
      };
      mediaService.setYoutubeTracks([...state.youtubeTracks, newTrack]);
      setYoutubeUrlInput('');
    } else {
      // Check if it's a playlist URL
      const playlistMatch = url.match(/[?&]list=([^&]+)/);
      if (playlistMatch) {
        mediaService.setYoutubePlaylistUrl(url);
        alert('Playlist URL saved. Note: Due to YouTube API limitations, please add individual video URLs from the playlist.');
      } else {
        alert('Could not parse YouTube URL. Please enter a valid YouTube video URL.');
      }
    }
  };

  // Handle announcement add
  const handleAddAnnouncement = () => {
    if (!newAnnouncementText.trim()) return;
    mediaService.addAnnouncement(newAnnouncementText.trim());
    setNewAnnouncementText('');
  };

  // Handle announcement edit
  const handleSaveAnnouncementEdit = () => {
    if (!editingAnnouncementId || !editingAnnouncementText.trim()) return;
    mediaService.updateAnnouncement(editingAnnouncementId, editingAnnouncementText.trim());
    setEditingAnnouncementId(null);
    setEditingAnnouncementText('');
  };

  const currentTrack = state.audioPlaylist[state.currentTrackIndex];

  return (
    <div className="media-control-panel">
      {/* Hidden audio element for playback */}
      <audio
        ref={audioPlayerRef}
        onEnded={handleAudioEnded}
        onCanPlay={handleAudioCanPlay}
        onError={handleAudioError}
        preload="auto"
        style={{ display: 'none' }}
      />

      <div className="media-control-header">
        <h2>Media Control</h2>
        <div className="media-control-header-actions">
          <button
            className="media-control-launch-btn"
            onClick={onOpenDisplay}
            title="Open Display Screen"
          >
            🖥 Launch Display
          </button>
          <button className="media-control-close" onClick={onClose}>×</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="media-control-tabs">
        {(['video', 'audio', 'youtube', 'presentations', 'background', 'announcements'] as MediaTab[]).map((tab) => (
          <button
            key={tab}
            className={`media-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'video' && '🎬'}
            {tab === 'audio' && '🎵'}
            {tab === 'youtube' && '▶️'}
            {tab === 'presentations' && '📊'}
            {tab === 'background' && '🖼'}
            {tab === 'announcements' && '📢'}
            <span className="tab-label">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          </button>
        ))}
      </div>

      <div className="media-control-content">
        {/* Video Tab */}
        {activeTab === 'video' && (
          <div className="media-tab-content">
            <h3>Video</h3>

            <div className="media-section">
              <label>Upload Video File</label>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoFileUpload}
                className="media-file-input"
              />
            </div>

            <div className="media-section">
              <label>Or Enter Video URL</label>
              <div className="media-url-input-group">
                <input
                  type="text"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="media-url-input"
                />
                <button onClick={handleVideoUrlSubmit} className="media-url-btn">Load</button>
              </div>
            </div>

            {state.videoSource && (
              <div className="media-section">
                <label>Current Video</label>
                <div className="media-current-item">
                  <span>{state.videoSource.name || 'Video'}</span>
                  <button onClick={() => mediaService.setVideoSource(null)} className="media-remove-btn">×</button>
                </div>
                <div className="media-controls">
                  <button
                    onClick={() => {
                      mediaService.setActiveMode('video');
                      mediaService.setVideoPlaying(!state.videoPlaying);
                      // Auto-open display screen when playing video
                      if (!state.videoPlaying) {
                        onOpenDisplay();
                      }
                    }}
                    className="media-play-btn"
                  >
                    {state.videoPlaying ? '⏸ Pause' : '▶ Play'}
                  </button>
                  <div className="media-volume-control">
                    <span>🔊</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={state.videoVolume}
                      onChange={(e) => mediaService.setVideoVolume(parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <div className="media-tab-content">
            <h3>Audio Playlist</h3>

            <div className="media-section">
              <label>Add Audio Files</label>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleAudioFileUpload}
                className="media-file-input"
              />
            </div>

            {state.audioPlaylist.length > 0 && (
              <>
                <div className="media-section">
                  <label>Playlist ({state.audioPlaylist.length} tracks)</label>
                  <div className="media-playlist">
                    {state.audioPlaylist.map((track, index) => (
                      <div
                        key={track.id}
                        className={`media-playlist-item ${index === state.currentTrackIndex ? 'active' : ''}`}
                        onClick={() => mediaService.setCurrentTrack(index)}
                      >
                        <span className="track-number">{index + 1}</span>
                        <span className="track-name">{track.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            mediaService.removeAudioTrack(track.id);
                          }}
                          className="track-remove-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="media-section">
                  <div className="media-audio-controls">
                    <button onClick={() => mediaService.previousTrack()} title="Previous">⏮</button>
                    <button
                      onClick={() => mediaService.setAudioPlaying(!state.audioPlaying)}
                      className="media-play-btn"
                    >
                      {state.audioPlaying ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => mediaService.nextTrack()} title="Next">⏭</button>
                    <button
                      onClick={() => {
                        const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
                        const currentIndex = modes.indexOf(state.audioRepeat);
                        mediaService.setAudioRepeat(modes[(currentIndex + 1) % 3]);
                      }}
                      className={state.audioRepeat !== 'none' ? 'active' : ''}
                      title={`Repeat: ${state.audioRepeat}`}
                    >
                      🔁{state.audioRepeat === 'one' && '1'}
                    </button>
                    <button
                      onClick={() => mediaService.setAudioShuffle(!state.audioShuffle)}
                      className={state.audioShuffle ? 'active' : ''}
                      title="Shuffle"
                    >
                      🔀
                    </button>
                  </div>
                  <div className="media-volume-control">
                    <span>🔊</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={state.audioVolume}
                      onChange={(e) => mediaService.setAudioVolume(parseFloat(e.target.value))}
                    />
                  </div>
                  {currentTrack && (
                    <div className="media-now-playing-info">
                      Now Playing: {currentTrack.name}
                    </div>
                  )}
                </div>

                <button onClick={() => mediaService.clearAudioPlaylist()} className="media-clear-btn">
                  Clear Playlist
                </button>
              </>
            )}
          </div>
        )}

        {/* YouTube Tab */}
        {activeTab === 'youtube' && (
          <div className="media-tab-content">
            <h3>YouTube</h3>

            <div className="media-section">
              <label>Add YouTube Video</label>
              <div className="media-url-input-group">
                <input
                  type="text"
                  value={youtubeUrlInput}
                  onChange={(e) => setYoutubeUrlInput(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or video ID"
                  className="media-url-input"
                />
                <button onClick={handleYoutubeUrlSubmit} className="media-url-btn">Add</button>
              </div>
            </div>

            <div className="media-section">
              <label className="media-checkbox-label">
                <input
                  type="checkbox"
                  checked={state.youtubeAudioOnly}
                  onChange={(e) => mediaService.setYoutubeAudioOnly(e.target.checked)}
                />
                Audio Only (hide video)
              </label>
            </div>

            {state.youtubeTracks.length > 0 && (
              <>
                <div className="media-section">
                  <label>Videos ({state.youtubeTracks.length})</label>
                  <div className="media-playlist">
                    {state.youtubeTracks.map((track, index) => (
                      <div
                        key={track.id}
                        className={`media-playlist-item ${index === state.youtubeCurrentIndex ? 'active' : ''}`}
                        onClick={() => mediaService.setYoutubeCurrentIndex(index)}
                      >
                        <span className="track-number">{index + 1}</span>
                        <span className="track-name">{track.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newTracks = state.youtubeTracks.filter((_, i) => i !== index);
                            mediaService.setYoutubeTracks(newTracks);
                          }}
                          className="track-remove-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="media-section">
                  <div className="media-audio-controls">
                    <button onClick={() => mediaService.previousYoutubeTrack()} title="Previous">⏮</button>
                    <button
                      onClick={() => {
                        mediaService.setActiveMode('youtube');
                        mediaService.setYoutubePlaying(!state.youtubePlaying);
                        if (!state.youtubePlaying) {
                          onOpenDisplay();
                        }
                      }}
                      className="media-play-btn"
                    >
                      {state.youtubePlaying ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => mediaService.nextYoutubeTrack()} title="Next">⏭</button>
                  </div>
                </div>

                <button
                  onClick={() => mediaService.setYoutubeTracks([])}
                  className="media-clear-btn"
                >
                  Clear All Videos
                </button>
              </>
            )}

            <div className="media-note">
              Tip: Paste a YouTube video URL or video ID to add it to your playlist. Click play to open in display screen.
            </div>
          </div>
        )}

        {/* Presentations Tab */}
        {activeTab === 'presentations' && (
          <div className="media-tab-content">
            <h3>Presentations</h3>

            <div className="media-section">
              <label>Upload PowerPoint or PDF</label>
              <input
                ref={presentationInputRef}
                type="file"
                accept=".pdf,.pptx,.ppt"
                onChange={handlePresentationUpload}
                className="media-file-input"
              />
            </div>

            <div className="media-section">
              <label>Or Enter Google Slides URL</label>
              <div className="media-url-input-group">
                <input
                  type="text"
                  value={slidesUrlInput}
                  onChange={(e) => setSlidesUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/presentation/d/..."
                  className="media-url-input"
                />
                <button onClick={handleSlidesUrlSubmit} className="media-url-btn">Load</button>
              </div>
            </div>

            {state.presentation && (
              <div className="media-section">
                <label>Current Presentation</label>
                <div className="media-current-item">
                  <span>{state.presentation.name || 'Presentation'}</span>
                  <button onClick={() => mediaService.setPresentation(null)} className="media-remove-btn">×</button>
                </div>
                <div className="media-slide-controls">
                  <button onClick={() => mediaService.previousSlide()}>◀ Prev</button>
                  <span>Slide {state.currentSlide}</span>
                  <button onClick={() => mediaService.nextSlide()}>Next ▶</button>
                </div>
                <button
                  onClick={() => mediaService.setActiveMode('presentation')}
                  className="media-set-active-btn"
                >
                  Show on Display
                </button>
              </div>
            )}

            <div className="media-note">
              Tip: Google Slides works best for live presentations. PowerPoint files may have limited support.
            </div>
          </div>
        )}

        {/* Background Tab */}
        {activeTab === 'background' && (
          <div className="media-tab-content">
            <h3>Backgrounds</h3>

            <div className="media-section">
              <label>Upload Background Image</label>
              <input
                ref={backgroundInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="media-file-input"
              />
            </div>

            <div className="media-section">
              <label>Or Choose a Color</label>
              <div className="media-color-picker">
                {['#000000', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#1b1b2f'].map((color) => (
                  <button
                    key={color}
                    className="media-color-btn"
                    style={{ backgroundColor: color }}
                    onClick={() => handleBackgroundColor(color)}
                    title={color}
                  />
                ))}
                <input
                  type="color"
                  onChange={(e) => handleBackgroundColor(e.target.value)}
                  className="media-color-input"
                  title="Custom color"
                />
              </div>
            </div>

            {state.backgrounds.length > 0 && (
              <div className="media-section">
                <label>Saved Backgrounds</label>
                <div className="media-backgrounds-grid">
                  {state.backgrounds.map((bg, index) => (
                    <div
                      key={index}
                      className={`media-background-item ${index === state.activeBackgroundIndex ? 'active' : ''}`}
                      onClick={() => mediaService.setActiveBackground(index)}
                    >
                      {bg.type === 'image' ? (
                        <img src={bg.value} alt={bg.name} />
                      ) : (
                        <div className="media-bg-color" style={{ backgroundColor: bg.value }} />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          mediaService.removeBackground(index);
                        }}
                        className="media-bg-remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="media-tab-content">
            <h3>Announcements</h3>

            <div className="media-section">
              <label className="media-checkbox-label">
                <input
                  type="checkbox"
                  checked={state.announcementsEnabled}
                  onChange={(e) => mediaService.setAnnouncementsEnabled(e.target.checked)}
                />
                Enable Announcements Banner
              </label>
            </div>

            <div className="media-section">
              <label>Rotation Interval (seconds)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={state.rotationInterval}
                onChange={(e) => mediaService.setRotationInterval(parseInt(e.target.value) || 5)}
                className="media-number-input"
              />
            </div>

            <div className="media-section">
              <label>Add New Announcement</label>
              <div className="media-announcement-input">
                <textarea
                  value={newAnnouncementText}
                  onChange={(e) => setNewAnnouncementText(e.target.value)}
                  placeholder="Enter announcement text..."
                  rows={2}
                />
                <button onClick={handleAddAnnouncement} className="media-add-btn">Add</button>
              </div>
            </div>

            {state.announcements.length > 0 && (
              <div className="media-section">
                <label>Announcements ({state.announcements.filter(a => a.enabled).length} active)</label>
                <div className="media-announcements-list">
                  {state.announcements.map((announcement) => (
                    <div key={announcement.id} className={`media-announcement-item ${announcement.enabled ? '' : 'disabled'}`}>
                      {editingAnnouncementId === announcement.id ? (
                        <div className="media-announcement-edit">
                          <textarea
                            value={editingAnnouncementText}
                            onChange={(e) => setEditingAnnouncementText(e.target.value)}
                            rows={2}
                          />
                          <div className="media-announcement-edit-actions">
                            <button onClick={handleSaveAnnouncementEdit}>Save</button>
                            <button onClick={() => setEditingAnnouncementId(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <label className="media-checkbox-label">
                            <input
                              type="checkbox"
                              checked={announcement.enabled}
                              onChange={() => mediaService.toggleAnnouncement(announcement.id)}
                            />
                          </label>
                          <span className="media-announcement-text">{announcement.text}</span>
                          <div className="media-announcement-actions">
                            <button
                              onClick={() => {
                                setEditingAnnouncementId(announcement.id);
                                setEditingAnnouncementText(announcement.text);
                              }}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => mediaService.removeAnnouncement(announcement.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaControlPanel;
