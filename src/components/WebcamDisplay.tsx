import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WEBCAM_BACKGROUNDS, SEGMENTATION_CONFIG, BackgroundConfig } from '../config/webcamBackgrounds';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import './WebcamDisplay.css';

interface WebcamDisplayProps {
  isVisible: boolean;
  showSettings: boolean;
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
}

const WebcamDisplay: React.FC<WebcamDisplayProps> = ({ isVisible, showSettings: externalShowSettings, isFullscreen = false, onExitFullscreen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const selfieSegmentationRef = useRef<SelfieSegmentation | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundConfig>(WEBCAM_BACKGROUNDS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [segmentationReady, setSegmentationReady] = useState(false);

  // Handle Escape key to exit CSS fullscreen mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen && onExitFullscreen) {
        onExitFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, onExitFullscreen]);

  // Apply green screen optimizations to segmentation mask
  const optimizeMaskForGreenScreen = (mask: HTMLCanvasElement | HTMLImageElement, width: number, height: number): HTMLCanvasElement => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) return tempCanvas;

    // Draw the original mask
    tempCtx.drawImage(mask, 0, 0, width, height);

    // Get image data for processing
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const threshold = SEGMENTATION_CONFIG.greenScreen.confidenceThreshold * 255;
    const smoothing = SEGMENTATION_CONFIG.greenScreen.edgeSmoothing;

    // Apply threshold and edge smoothing
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i]; // Mask is grayscale, use R channel

      // Apply confidence threshold
      if (alpha < threshold) {
        data[i] = data[i + 1] = data[i + 2] = 0;
      } else {
        // Apply smoothing to edges
        const smoothedAlpha = Math.min(255, alpha * (1 + smoothing));
        data[i] = data[i + 1] = data[i + 2] = smoothedAlpha;
      }
    }

    tempCtx.putImageData(imageData, 0, 0);

    // Apply slight blur for smoother edges if edge refinement is enabled
    if (SEGMENTATION_CONFIG.greenScreen.useEdgeRefinement) {
      const blurredCanvas = document.createElement('canvas');
      blurredCanvas.width = width;
      blurredCanvas.height = height;
      const blurCtx = blurredCanvas.getContext('2d');

      if (blurCtx) {
        blurCtx.filter = 'blur(1px)';
        blurCtx.drawImage(tempCanvas, 0, 0);
        return blurredCanvas;
      }
    }

    return tempCanvas;
  };

  // Process frame with MediaPipe segmentation
  const onResults = useCallback((results: any) => {
    if (!canvasRef.current || !videoRef.current || !hiddenCanvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const hiddenCanvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const hiddenCtx = hiddenCanvas.getContext('2d');

    if (!ctx || !hiddenCtx) return;

    // Set canvas dimensions to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      hiddenCanvas.width = video.videoWidth;
      hiddenCanvas.height = video.videoHeight;
    }

    // Clear the canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);

    // Determine if we should use green screen optimization
    const useGreenScreen = selectedBackground.useGreenScreen || false;

    // Get the appropriate mask (optimized or original)
    const maskToUse = useGreenScreen
      ? optimizeMaskForGreenScreen(results.segmentationMask, canvas.width, canvas.height)
      : results.segmentationMask;

    if (selectedBackground.id === 'none') {
      // No background replacement, just draw the video
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    } else if (selectedBackground.id === 'blur') {
      // Create blurred version of entire image
      hiddenCtx.filter = `blur(${SEGMENTATION_CONFIG.blur.blurAmount}px)`;
      hiddenCtx.drawImage(results.image, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
      hiddenCtx.filter = 'none';

      // Draw the blurred background
      ctx.drawImage(hiddenCanvas, 0, 0, canvas.width, canvas.height);

      // Draw sharp person on top using the mask
      ctx.save();
      // Use the mask to cut out where the person is from the blurred background
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(maskToUse, 0, 0, canvas.width, canvas.height);

      // Draw the original sharp person
      ctx.globalCompositeOperation = 'destination-over';
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else if (selectedBackground.imagePath && backgroundImageRef.current) {
      if (useGreenScreen) {
        // Green Screen Mode: Optimized for clean cutout
        // Draw the person first
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        // Use optimized mask to keep only the person
        ctx.save();
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(maskToUse, 0, 0, canvas.width, canvas.height);

        // Draw background image behind the person
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        // Standard Mode: Basic segmentation
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        // Use mask to keep only the person
        ctx.save();
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(maskToUse, 0, 0, canvas.width, canvas.height);

        // Draw background image behind the person
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    } else {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }
  }, [selectedBackground]);

  // Initialize MediaPipe Selfie Segmentation
  useEffect(() => {
    const selfieSegmentation = new SelfieSegmentation({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      }
    });

    selfieSegmentation.setOptions({
      modelSelection: SEGMENTATION_CONFIG.modelSelection,
      selfieMode: SEGMENTATION_CONFIG.selfieMode,
    });

    selfieSegmentation.onResults(onResults);
    selfieSegmentationRef.current = selfieSegmentation;
    setSegmentationReady(true);

    return () => {
      selfieSegmentation.close();
    };
  }, [onResults]);

  useEffect(() => {
    if (isVisible) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  useEffect(() => {
    if (selectedBackground.imagePath && selectedBackground.id !== 'none' && selectedBackground.id !== 'blur') {
      const img = new Image();
      img.src = selectedBackground.imagePath;
      img.onload = () => {
        backgroundImageRef.current = img;
      };
      img.onerror = () => {
        console.error('Failed to load background image:', selectedBackground.imagePath);
        // Fallback to no background if image fails to load
        setSelectedBackground(WEBCAM_BACKGROUNDS[0]);
      };
    } else {
      backgroundImageRef.current = null;
    }
  }, [selectedBackground]);

  // Send video frames to MediaPipe for processing
  useEffect(() => {
    if (!videoReady || !isProcessing || !segmentationReady || !selfieSegmentationRef.current || !videoRef.current) {
      return;
    }

    const sendFrame = async () => {
      if (videoRef.current && selfieSegmentationRef.current && isProcessing) {
        await selfieSegmentationRef.current.send({ image: videoRef.current });
        animationFrameRef.current = requestAnimationFrame(sendFrame);
      }
    };

    sendFrame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoReady, isProcessing, segmentationReady]);

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          videoRef.current?.play().then(() => {
            console.log('Video playing');
            setVideoReady(true);
            setIsProcessing(true);
          }).catch(err => {
            console.error('Error playing video:', err);
          });
        };
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Unable to access webcam. Please ensure you have granted camera permissions.');
    }
  };

  const stopWebcam = () => {
    setIsProcessing(false);
    setVideoReady(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
    }
  };

  const handleBackgroundChange = (background: BackgroundConfig) => {
    setSelectedBackground(background);
  };

  if (!isVisible) {
    return null;
  }

  const enabledBackgrounds = WEBCAM_BACKGROUNDS.filter(bg => bg.enabled);

  return (
    <div ref={containerRef} className={`webcam-display ${isFullscreen ? 'css-fullscreen' : ''}`}>
      {externalShowSettings && (
        <div className="webcam-background-selector">
          <label className="background-label">Background:</label>
          <div className="background-options">
            {enabledBackgrounds.map((bg) => (
              <button
                key={bg.id}
                className={`background-option ${selectedBackground.id === bg.id ? 'active' : ''}`}
                onClick={() => handleBackgroundChange(bg)}
                title={bg.name}
              >
                {bg.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="webcam-video-container">
        {error ? (
          <div className="webcam-error">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="webcam-video"
              style={{ display: 'none' }}
            />
            <canvas
              ref={hiddenCanvasRef}
              style={{ display: 'none' }}
            />
            <canvas
              ref={canvasRef}
              className="webcam-canvas"
            />
            {isFullscreen && (
              <div className="webcam-logo-overlay">
                <img src="/Logo.png" alt="Logo" className="webcam-logo" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Exit fullscreen button when in CSS fullscreen mode */}
      {isFullscreen && (
        <button
          className="webcam-exit-fullscreen-btn"
          onClick={() => onExitFullscreen?.()}
          title="Exit Fullscreen (Esc)"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default WebcamDisplay;
