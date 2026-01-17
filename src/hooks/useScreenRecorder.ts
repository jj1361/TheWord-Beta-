/**
 * useScreenRecorder Hook
 *
 * A custom React hook for recording screen and audio.
 * Supports screen capture, system audio, and microphone recording.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export interface RecordingOptions {
  captureScreen: boolean;
  captureSystemAudio: boolean;
  captureMicrophone: boolean;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
  isSupported: boolean;
}

const DEFAULT_OPTIONS: RecordingOptions = {
  captureScreen: true,
  captureSystemAudio: true,
  captureMicrophone: false,
  videoBitsPerSecond: 8000000,  // 8 Mbps for smooth video
  audioBitsPerSecond: 320000,   // 320 kbps for high quality audio
};

export function useScreenRecorder() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
    isSupported: typeof navigator !== 'undefined' &&
                 !!navigator.mediaDevices?.getDisplayMedia &&
                 typeof MediaRecorder !== 'undefined',
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Start duration timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedDurationRef.current;
    timerRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    }, 1000);
  }, []);

  // Stop duration timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Mix multiple audio streams with high quality settings
  const mixAudioStreams = useCallback((streams: MediaStream[]): MediaStreamTrack | null => {
    const audioTracks = streams.flatMap(stream => stream.getAudioTracks());
    if (audioTracks.length === 0) return null;
    if (audioTracks.length === 1) return audioTracks[0];

    try {
      // Use high sample rate for better audio quality
      const audioContext = new AudioContext({ sampleRate: 48000 });
      const destination = audioContext.createMediaStreamDestination();

      streams.forEach(stream => {
        if (stream.getAudioTracks().length > 0) {
          const source = audioContext.createMediaStreamSource(stream);
          // Add a gain node to prevent clipping when mixing
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 0.8; // Slightly reduce to prevent clipping
          source.connect(gainNode);
          gainNode.connect(destination);
        }
      });

      return destination.stream.getAudioTracks()[0];
    } catch (err) {
      console.error('Failed to mix audio streams:', err);
      return audioTracks[0];
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async (options: Partial<RecordingOptions> = {}) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    setState(prev => ({ ...prev, error: null }));

    try {
      // Get screen stream with optional system audio (high quality settings)
      const displayMediaOptions: DisplayMediaStreamOptions = {
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 30, max: 60 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        } as MediaTrackConstraints,
        audio: opts.captureSystemAudio ? {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          sampleSize: 16,
          channelCount: 2,
        } : false,
      };

      const screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      streamRef.current = screenStream;

      // Handle stream ending (user stops sharing)
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording();
      });

      // Prepare tracks for recording
      const tracks: MediaStreamTrack[] = [...screenStream.getVideoTracks()];
      const audioStreams: MediaStream[] = [];

      // Add system audio if available
      if (screenStream.getAudioTracks().length > 0) {
        audioStreams.push(new MediaStream(screenStream.getAudioTracks()));
      }

      // Get microphone stream if requested (high quality settings)
      if (opts.captureMicrophone) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000,
              sampleSize: 16,
              channelCount: 1, // Mono for voice
            }
          });
          micStreamRef.current = micStream;
          audioStreams.push(micStream);
        } catch (err) {
          console.warn('Microphone access denied:', err);
        }
      }

      // Mix audio streams if we have any
      if (audioStreams.length > 0) {
        const mixedAudio = mixAudioStreams(audioStreams);
        if (mixedAudio) {
          tracks.push(mixedAudio);
        }
      }

      // Create combined stream
      const combinedStream = new MediaStream(tracks);

      // Determine best mime type - prefer VP8 for faster encoding (smoother recording)
      // VP9 has better compression but requires more CPU which can cause frame drops
      const mimeTypes = [
        'video/webm;codecs=vp8,opus',  // VP8 is faster to encode
        'video/webm;codecs=vp9,opus',  // VP9 for better quality if VP8 unavailable
        'video/webm',
        'video/mp4',
      ];
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';

      // Create MediaRecorder with optimized settings
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: opts.videoBitsPerSecond,
        audioBitsPerSecond: opts.audioBitsPerSecond,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setState(prev => ({ ...prev, error: 'Recording error occurred' }));
        cleanup();
      };

      mediaRecorder.onstop = () => {
        // Recording stopped - blob is ready to be saved
      };

      // Start recording with timeslice for chunked data
      // Add a small delay before starting to let the system stabilize
      await new Promise(resolve => setTimeout(resolve, 100));
      mediaRecorder.start(500); // Collect data every 500ms for smoother recording
      pausedDurationRef.current = 0;
      startTimer();

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        error: null,
      }));
    } catch (err) {
      console.error('Failed to start recording:', err);
      cleanup();

      let errorMessage = 'Failed to start recording';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Screen sharing permission denied';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No screen available for capture';
        } else {
          errorMessage = err.message;
        }
      }

      setState(prev => ({ ...prev, error: errorMessage }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanup, mixAudioStreams, startTimer]);

  // Stop recording and return the blob
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        cleanup();
        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          duration: 0,
        }));
        resolve(null);
        return;
      }

      stopTimer();

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanup();
        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
        }));
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, [cleanup, stopTimer]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      stopTimer();
      pausedDurationRef.current = Date.now() - startTimeRef.current;
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [stopTimer]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      startTimer();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [startTimer]);

  // Save blob to file
  const saveRecording = useCallback((blob: Blob, filename?: string) => {
    const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const defaultFilename = `recording-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.${extension}`;
    const finalFilename = filename || defaultFilename;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Format duration as MM:SS or HH:MM:SS
  const formatDuration = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    saveRecording,
    formatDuration,
  };
}

export default useScreenRecorder;
