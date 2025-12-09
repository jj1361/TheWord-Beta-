import React, { useState, useEffect } from 'react';
import './PresentationViewer.css';

interface PresentationViewerProps {
  isOpen: boolean;
  onClose: () => void;
  presentationUrl: string;
  onUpdateUrl: (url: string) => void;
}

const PresentationViewer: React.FC<PresentationViewerProps> = ({
  isOpen,
  onClose,
  presentationUrl,
  onUpdateUrl,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(presentationUrl);
  const [embedUrl, setEmbedUrl] = useState('');
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [isOneNote, setIsOneNote] = useState(false);

  // Check if URL is a OneNote link
  const checkIsOneNote = (url: string): boolean => {
    return url.includes('1drv.ms/o/') || url.includes('onenote');
  };

  // Convert OneDrive share link to embed URL
  useEffect(() => {
    if (presentationUrl) {
      const isOneNoteLink = checkIsOneNote(presentationUrl);
      setIsOneNote(isOneNoteLink);

      if (isOneNoteLink) {
        setEmbedUrl('');
        setEmbedError(null);
      } else {
        const converted = convertToEmbedUrl(presentationUrl);
        setEmbedUrl(converted);
        setEmbedError(null);
      }
    }
  }, [presentationUrl]);

  // Convert various URL formats to embeddable format
  const convertToEmbedUrl = (url: string): string => {
    try {
      // Already an embed URL
      if (url.includes('/embed?') || url.includes('action=embedview') || url.includes('action=embed')) {
        return url;
      }

      // OneDrive live.com URLs
      if (url.includes('onedrive.live.com')) {
        // Check for resid parameter
        const residMatch = url.match(/resid=([^&]+)/i);
        if (residMatch) {
          const resid = decodeURIComponent(residMatch[1]);
          // Extract authkey if present
          const authkeyMatch = url.match(/authkey=([^&]+)/i);
          const authkey = authkeyMatch ? decodeURIComponent(authkeyMatch[1]) : '';
          return `https://onedrive.live.com/embed?resid=${resid}&authkey=${authkey}&em=2`;
        }

        // Check for resid in path format
        const pathResidMatch = url.match(/([A-F0-9]{16})!(\d+)/i);
        if (pathResidMatch) {
          const resid = `${pathResidMatch[1]}!${pathResidMatch[2]}`;
          const authkeyMatch = url.match(/authkey=([^&]+)/i);
          const authkey = authkeyMatch ? decodeURIComponent(authkeyMatch[1]) : '';
          return `https://onedrive.live.com/embed?resid=${resid}&authkey=${authkey}&em=2`;
        }
      }

      // Short OneDrive share links (1drv.ms)
      if (url.includes('1drv.ms')) {
        // Already has embed parameter
        if (url.includes('em=2') || url.includes('embed')) {
          return url;
        }
        // OneNote links - handled elsewhere
        if (url.includes('/o/')) {
          return url;
        }
        // PowerPoint links (/p/)
        if (url.includes('/p/')) {
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}em=2`;
        }
        // Excel links (/x/)
        if (url.includes('/x/')) {
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}em=2`;
        }
        // Word links (/w/)
        if (url.includes('/w/')) {
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}em=2`;
        }
        // Generic - try adding em=2
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}em=2`;
      }

      // SharePoint URLs
      if (url.includes('sharepoint.com')) {
        // PowerPoint web URLs
        if (url.includes('/_layouts/') && url.includes('sourcedoc=')) {
          if (!url.includes('action=')) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}action=embedview`;
          }
        }
        // Direct file URLs
        if (!url.includes('action=')) {
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}action=embedview`;
        }
        return url;
      }

      // Office.com and Office Online URLs
      if (url.includes('office.com') || url.includes('officeapps.live.com')) {
        // PowerPoint Online viewer
        if (url.includes('view.officeapps.live.com') || url.includes('powerpoint')) {
          if (!url.includes('action=')) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}action=embedview`;
          }
        }
        if (!url.includes('action=')) {
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}action=embedview`;
        }
        return url;
      }

      // Google Slides
      if (url.includes('docs.google.com/presentation')) {
        if (url.includes('/edit')) {
          return url.replace('/edit', '/embed').split('?')[0] + '?start=false&loop=false&delayms=3000';
        }
        if (url.includes('/view')) {
          return url.replace('/view', '/embed').split('?')[0] + '?start=false&loop=false&delayms=3000';
        }
        if (!url.includes('/embed')) {
          const baseUrl = url.split('?')[0];
          return baseUrl + (baseUrl.endsWith('/') ? 'embed' : '/embed') + '?start=false&loop=false&delayms=3000';
        }
        return url;
      }

      // Canva presentations
      if (url.includes('canva.com')) {
        if (url.includes('/view')) {
          return url.replace('/view', '/embed');
        }
        if (!url.includes('/embed')) {
          return url + '/embed';
        }
        return url;
      }

      // Prezi presentations
      if (url.includes('prezi.com')) {
        if (!url.includes('/embed')) {
          return url.replace('/view/', '/embed/').replace('/present/', '/embed/');
        }
        return url;
      }

      return url;
    } catch (e) {
      console.error('Error converting URL:', e);
      setEmbedError('Error processing URL. Please check the format.');
      return url;
    }
  };

  const handleSaveUrl = () => {
    onUpdateUrl(tempUrl);
    setShowSettings(false);
  };

  const handleCancelSettings = () => {
    setTempUrl(presentationUrl);
    setShowSettings(false);
  };

  const handleOpenInNewTab = () => {
    window.open(presentationUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="presentation-viewer-overlay">
      <div className="presentation-viewer-modal">
        <div className="presentation-viewer-header">
          <h2>
            {isOneNote ? '📓 OneNote Document' : '📊 Presentation Viewer'}
          </h2>
          <div className="presentation-viewer-actions">
            <button
              className="presentation-action-btn"
              onClick={handleOpenInNewTab}
              title="Open in New Tab"
            >
              🔗
            </button>
            <button
              className="presentation-action-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              ⚙️
            </button>
            {!isOneNote && (
              <button
                className="presentation-action-btn"
                onClick={() => {
                  const iframe = document.querySelector('.presentation-iframe') as HTMLIFrameElement;
                  if (iframe) {
                    iframe.requestFullscreen?.();
                  }
                }}
                title="Fullscreen"
              >
                ⛶
              </button>
            )}
            <button
              className="presentation-close-btn"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="presentation-settings-panel">
            <label>Presentation URL:</label>
            <input
              type="text"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="Paste your presentation link..."
              className="presentation-url-input"
            />
            <div className="presentation-settings-buttons">
              <button className="settings-save-btn" onClick={handleSaveUrl}>
                Save
              </button>
              <button className="settings-cancel-btn" onClick={handleCancelSettings}>
                Cancel
              </button>
            </div>
            <div className="presentation-url-hints">
              <p><strong>Supported formats:</strong></p>
              <ul>
                <li>OneDrive embed links (use "Embed" option when sharing)</li>
                <li>SharePoint presentation links</li>
                <li>Google Slides (public presentations)</li>
              </ul>
              <p className="hint-note">
                <strong>Tip:</strong> For OneDrive, click Share → Embed → Generate to get an embeddable link.
              </p>
            </div>
          </div>
        )}

        <div className="presentation-viewer-content">
          {embedError ? (
            <div className="presentation-error">
              <p>{embedError}</p>
              <button className="open-external-btn" onClick={handleOpenInNewTab}>
                Open in New Tab
              </button>
              <button
                className="configure-url-btn"
                onClick={() => setShowSettings(true)}
              >
                Configure URL
              </button>
            </div>
          ) : isOneNote ? (
            <div className="presentation-onenote">
              <div className="onenote-icon">📓</div>
              <h3>OneNote Document</h3>
              <p>OneNote documents cannot be embedded due to security restrictions.</p>
              <p>Please open in a new tab to view:</p>
              <button className="open-external-btn" onClick={handleOpenInNewTab}>
                Open OneNote in New Tab
              </button>
              <button
                className="configure-url-btn"
                onClick={() => setShowSettings(true)}
              >
                Configure Different URL
              </button>
            </div>
          ) : embedUrl ? (
            <iframe
              className="presentation-iframe"
              src={embedUrl}
              frameBorder="0"
              allowFullScreen
              title="PowerPoint Presentation"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            />
          ) : (
            <div className="presentation-no-url">
              <p>No presentation URL configured.</p>
              <button
                className="configure-url-btn"
                onClick={() => setShowSettings(true)}
              >
                Configure Presentation URL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresentationViewer;
