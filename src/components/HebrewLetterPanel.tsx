import React from 'react';
import { HebrewLetterInfo } from '../config/hebrewLetters';
import './HebrewLetterPanel.css';

interface HebrewLetterPanelProps {
  letterInfo: HebrewLetterInfo | null;
  onClose: () => void;
}

const HebrewLetterPanel: React.FC<HebrewLetterPanelProps> = ({ letterInfo, onClose }) => {
  if (!letterInfo) return null;

  return (
    <div className="hebrew-letter-panel">
      <div className="panel-header">
        <h2>Hebrew Letter</h2>
        <button className="close-panel" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-content">
        <div className="letter-display">
          <div className="letter-main">{letterInfo.letter}</div>
          <div className="letter-emoticon">{letterInfo.emoticon}</div>
        </div>

        <div className="ancient-script-display">
          <div className="ancient-script-label">Ancient Proto-Sinaitic</div>
          <div className="ancient-script-letter">{letterInfo.ancientScript}</div>
        </div>

        <div className="letter-info">
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span className="info-value">{letterInfo.name}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Transliteration:</span>
            <span className="info-value">{letterInfo.transliteration}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Numerical Value:</span>
            <span className="info-value">{letterInfo.number}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Meaning:</span>
            <span className="info-value meaning">{letterInfo.meaning}</span>
          </div>
        </div>

        <div className="letter-definition">
          <h3>Definition</h3>
          <p>{letterInfo.definition}</p>
        </div>

        <div className="letter-image">
          <img
            src={letterInfo.imageUrl}
            alt={`Hebrew letter ${letterInfo.name}`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HebrewLetterPanel;
