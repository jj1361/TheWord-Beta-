import React from 'react';
import './HistoryControls.css';

interface HistoryControlsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
}

const HistoryControls: React.FC<HistoryControlsProps> = ({
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward
}) => {
  return (
    <div className="history-controls">
      <button
        className="history-button"
        onClick={onGoBack}
        disabled={!canGoBack}
        title="Go back"
        aria-label="Go back in history"
      >
        ←
      </button>
      <button
        className="history-button"
        onClick={onGoForward}
        disabled={!canGoForward}
        title="Go forward"
        aria-label="Go forward in history"
      >
        →
      </button>
    </div>
  );
};

export default HistoryControls;
