import React from 'react';
import { LexiconData } from '../types/lexicon';
import { getPartOfSpeechName } from '../utils/partsOfSpeech';
import './LexiconPanel.css';

interface LexiconPanelProps {
  lexiconData: LexiconData | null;
  strongsNumber: string | null;
  loading: boolean;
  onClose: () => void;
}

const LexiconPanel: React.FC<LexiconPanelProps> = ({ lexiconData, strongsNumber, loading, onClose }) => {
  console.log('[LexiconPanel] Render:', {
    strongsNumber,
    loading,
    hasLexiconData: !!lexiconData,
    hasStepBible: !!lexiconData?.stepBible,
    hasStrongs: !!lexiconData?.strongs,
    hasBdb: !!lexiconData?.bdb,
    stepBibleWord: lexiconData?.stepBible?.word
  });

  if (!strongsNumber && !loading) return null;

  return (
    <div className="lexicon-panel">
      <div className="lexicon-header">
        <h2>Strong's {strongsNumber}</h2>
        <button className="close-lexicon" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="lexicon-content">
        {loading && (
          <div className="lexicon-loading">
            <div className="loading-spinner-small"></div>
            <p>Loading lexicon data...</p>
          </div>
        )}

        {!loading && lexiconData?.stepBible && (
          <>
            <div className="lexicon-word-display">
              <div className="lexicon-hebrew">{lexiconData.stepBible.word}</div>
              <div className="lexicon-transliteration">{lexiconData.stepBible.transliteration}</div>
              <div className="lexicon-gloss">"{lexiconData.stepBible.gloss}"</div>
            </div>

            <div className="lexicon-info-section">
              {lexiconData.stepBible.morph && (
                <div className="lexicon-info-row">
                  <span className="lexicon-label">Grammar:</span>
                  <span className="lexicon-value">{lexiconData.stepBible.morph}</span>
                </div>
              )}

              {lexiconData.stepBible.dStrong && (
                <div className="lexicon-info-row">
                  <span className="lexicon-label">Strong's:</span>
                  <span className="lexicon-value">{lexiconData.stepBible.eStrong}</span>
                </div>
              )}
            </div>

            {lexiconData.stepBible.meaning && (
              <div className="lexicon-section lexicon-meaning">
                <h3>Definition</h3>
                <div
                  className="stepbible-definition-content"
                  dangerouslySetInnerHTML={{ __html: lexiconData.stepBible.meaning }}
                />
              </div>
            )}

            <div className="lexicon-attribution">
              <small>
                Data from <a href="https://www.STEPBible.org" target="_blank" rel="noopener noreferrer">STEP Bible</a> (CC BY 4.0)
              </small>
            </div>
          </>
        )}

        {!loading && !lexiconData?.stepBible && lexiconData?.strongs && (
          <>
            <div className="lexicon-word-display">
              <div className="lexicon-hebrew">{lexiconData.strongs.word}</div>
              <div className="lexicon-transliteration">{lexiconData.strongs.transliteration}</div>
              <div className="lexicon-pronunciation">[{lexiconData.strongs.pronunciation}]</div>
            </div>

            <div className="lexicon-info-section">
              <div className="lexicon-info-row">
                <span className="lexicon-label">Part of Speech:</span>
                <span className="lexicon-value">
                  {getPartOfSpeechName(lexiconData.strongs.partOfSpeech)}
                </span>
              </div>

              <div className="lexicon-info-row">
                <span className="lexicon-label">Language:</span>
                <span className="lexicon-value">
                  {lexiconData.strongs.language === 'heb' ? 'Hebrew' :
                   lexiconData.strongs.language === 'arc' ? 'Aramaic' :
                   lexiconData.strongs.language}
                </span>
              </div>
            </div>

            {lexiconData.strongs.source && (
              <div className="lexicon-section">
                <h3>Etymology</h3>
                <p>{lexiconData.strongs.source}</p>
              </div>
            )}

            {lexiconData.strongs.meaning && (
              <div className="lexicon-section lexicon-meaning">
                <h3>Strongs Meaning</h3>
                <p>{lexiconData.strongs.meaning}</p>
              </div>
            )}

            {lexiconData.strongs.usage && (
              <div className="lexicon-section lexicon-usage">
                <h3>Usage in KJV</h3>
                <p>{lexiconData.strongs.usage}</p>
              </div>
            )}
          </>
        )}

        {!loading && lexiconData?.bdb && (
          <>
            <div className="lexicon-divider">
              <h3>Brown-Driver-Briggs</h3>
            </div>

            <div className="lexicon-info-section">
              <div className="lexicon-info-row">
                <span className="lexicon-label">BDB ID:</span>
                <span className="lexicon-value">{lexiconData.bdb.id}</span>
              </div>

              {lexiconData.bdb.partOfSpeech && (
                <div className="lexicon-info-row">
                  <span className="lexicon-label">Part of Speech:</span>
                  <span className="lexicon-value">
                    {getPartOfSpeechName(lexiconData.bdb.partOfSpeech)}
                  </span>
                </div>
              )}
            </div>

            {lexiconData.bdb.definition && (
              <div className="lexicon-section lexicon-bdb-def">
                <h3>BDB Entry</h3>
                <div className="bdb-definition-content">
                  {lexiconData.bdb.definition.split('\n').map((line, idx) => (
                    <p key={idx}>{line.trim()}</p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!loading && !lexiconData?.stepBible && !lexiconData?.strongs && !lexiconData?.bdb && (
          <div className="lexicon-not-found">
            <p>Lexicon data not found for Strong's {strongsNumber}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LexiconPanel;
