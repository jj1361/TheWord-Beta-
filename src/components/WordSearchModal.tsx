import React, { useEffect, useState } from 'react';
import { LexiconData } from '../types/lexicon';
import { lexiconService } from '../services/lexiconService';
import { strongsSearchService } from '../services/strongsSearchService';
import { getPartOfSpeechName } from '../utils/partsOfSpeech';
import './WordSearchModal.css';

interface VerseReference {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  osisRef: string;
}

interface WordSearchModalProps {
  strongsId: string;
  onClose: () => void;
  onVerseClick: (bookId: number, chapter: number, verse: number) => void;
}

const WordSearchModal: React.FC<WordSearchModalProps> = ({
  strongsId,
  onClose,
  onVerseClick,
}) => {
  const [lexiconData, setLexiconData] = useState<LexiconData | null>(null);
  const [verses, setVerses] = useState<VerseReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load lexicon data
        const lexData = await lexiconService.getLexiconData(strongsId);
        setLexiconData(lexData);

        // Search for verses containing this Strong's ID
        const verseResults = await searchVersesByStrongs(strongsId);
        setVerses(verseResults);
      } catch (err) {
        console.error('Error loading word search data:', err);
        setError('Failed to load word data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [strongsId]);

  const searchVersesByStrongs = async (strongs: string): Promise<VerseReference[]> => {
    try {
      // Use the strongsSearchService to find all verses with this Strong's ID
      const results = await strongsSearchService.searchByStrongsId(strongs);
      return results;
    } catch (err) {
      console.error('Error searching verses:', err);
      return [];
    }
  };

  const handleVerseClick = (verse: VerseReference) => {
    onVerseClick(verse.bookId, verse.chapter, verse.verse);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="word-search-overlay" onClick={handleOverlayClick}>
      <div className="word-search-modal">
        <div className="word-search-header">
          <h2 className="word-search-title">
            Word Search: Strong's {strongsId}
          </h2>
          <button
            className="word-search-close"
            onClick={onClose}
            aria-label="Close word search"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="word-search-loading">
            <div className="loading-spinner"></div>
            <p>Loading word data...</p>
          </div>
        )}

        {error && (
          <div className="word-search-error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="word-search-content">
            <div className="word-search-lexicon">
              <h3 className="word-search-section-title">Lexicon Data</h3>
              <div className="word-search-lexicon-content">
                {lexiconData && (lexiconData.strongs || lexiconData.bdb) ? (
                  <>
                    {lexiconData.strongs && (
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

                    {lexiconData.bdb && (
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
                  </>
                ) : (
                  <div className="word-search-no-data">
                    <p>No lexicon data available for Strong's {strongsId}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="word-search-verses">
              <h3 className="word-search-section-title">
                Verse References ({verses.length})
              </h3>
              <div className="word-search-verse-list">
                {verses.length > 0 ? (
                  verses.map((verse, idx) => (
                    <div
                      key={`${verse.osisRef}-${idx}`}
                      className="word-search-verse-item"
                      onClick={() => handleVerseClick(verse)}
                    >
                      <div className="word-search-verse-ref">
                        {verse.bookName} {verse.chapter}:{verse.verse}
                      </div>
                      <div className="word-search-verse-text">
                        {verse.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="word-search-no-verses">
                    <p>Finding verses containing Strong's {strongsId}...</p>
                    <p className="word-search-hint">
                      This feature will show all verses containing this word.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordSearchModal;
