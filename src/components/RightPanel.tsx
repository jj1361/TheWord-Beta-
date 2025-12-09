import React, { useState, useEffect } from 'react';
import { LexiconData } from '../types/lexicon';
import { HebrewLetterInfo } from '../config/hebrewLetters';
import { strongsSearchService } from '../services/strongsSearchService';
import './RightPanel.css';

interface VerseReference {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  osisRef: string;
}

interface RightPanelProps {
  lexiconContent: LexiconData | null;
  hebrewLetterContent: HebrewLetterInfo | null;
  onClose: () => void;
  onVerseClick?: (bookId: number, chapter: number, verse: number) => void;
}

type TabType = 'strongs' | 'stepbible' | 'bdb' | 'ahlb' | 'hebrew';

// Interface for translation word with count
interface TranslationWord {
  word: string;
  count: number;
  verses: VerseReference[];
}

const RightPanel: React.FC<RightPanelProps> = ({
  lexiconContent,
  hebrewLetterContent,
  onClose,
  onVerseClick
}) => {
  // State for verse references (KJV usage)
  const [verseReferences, setVerseReferences] = useState<VerseReference[]>([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [showReferences, setShowReferences] = useState(false);

  // State for translation words with counts
  const [translationWords, setTranslationWords] = useState<TranslationWord[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(null);
  const [translationVerses, setTranslationVerses] = useState<VerseReference[]>([]);

  // Determine initial tab based on which content is available
  // Default to Strong's if available, otherwise first available lexicon
  const getInitialTab = (): TabType => {
    if (lexiconContent) {
      // Always default to Strong's first
      if (lexiconContent.strongs) return 'strongs';
      if (lexiconContent.stepBible) return 'stepbible';
      if (lexiconContent.bdb) return 'bdb';
      if (lexiconContent.ahlb) return 'ahlb';
    }
    if (hebrewLetterContent) return 'hebrew';
    return 'strongs';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [prevLexiconId, setPrevLexiconId] = useState<string | null>(null);
  const [prevHebrewLetter, setPrevHebrewLetter] = useState<string | null>(null);

  // Update active tab when content changes to automatically show newly clicked content
  useEffect(() => {
    const currentLexiconId = lexiconContent?.strongs?.id || lexiconContent?.stepBible?.eStrong || null;
    const currentHebrewLetter = hebrewLetterContent?.letter || null;

    // Check if lexicon content changed (new Strong's number was clicked)
    const lexiconChanged = currentLexiconId && currentLexiconId !== prevLexiconId;

    // Check if Hebrew letter content changed (new letter was clicked)
    const hebrewChanged = currentHebrewLetter && currentHebrewLetter !== prevHebrewLetter;

    // Update active tab based on what changed most recently
    if (lexiconChanged) {
      // Reset to Strong's tab when new word is clicked
      setActiveTab(getInitialTab());
      setPrevLexiconId(currentLexiconId);
    } else if (hebrewChanged) {
      setActiveTab('hebrew');
      setPrevHebrewLetter(currentHebrewLetter);
    }

    // If one type of content is removed, switch to the other if available
    if (!lexiconContent && hebrewLetterContent) {
      setActiveTab('hebrew');
    } else if (lexiconContent && !hebrewLetterContent) {
      setActiveTab(getInitialTab());
    }
  }, [lexiconContent, hebrewLetterContent, prevLexiconId, prevHebrewLetter]);

  // Load verse references when Strong's number changes
  useEffect(() => {
    const strongsId = lexiconContent?.strongs?.id || lexiconContent?.stepBible?.eStrong;

    if (strongsId) {
      // Reset state when Strong's number changes
      setVerseReferences([]);
      setShowReferences(false);
      setTranslationWords([]);
      setSelectedTranslation(null);
      setTranslationVerses([]);
    }
  }, [lexiconContent?.strongs?.id, lexiconContent?.stepBible?.eStrong]);

  // Parse kjv_def into individual translation words
  const parseKjvDef = (kjvDef: string): string[] => {
    // Split by comma and clean up each word
    return kjvDef
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0);
  };

  // Count occurrences of each translation word in the verse references
  const countTranslationOccurrences = (verses: VerseReference[], translations: string[]): TranslationWord[] => {
    const results: TranslationWord[] = [];

    for (const translation of translations) {
      // Clean up the translation for matching (remove parenthetical variations)
      const baseWord = translation.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      const matchingVerses: VerseReference[] = [];

      for (const verse of verses) {
        const verseTextLower = verse.text.toLowerCase();
        // Check if any form of the word appears in the verse
        if (verseTextLower.includes(baseWord)) {
          matchingVerses.push(verse);
        }
      }

      results.push({
        word: translation,
        count: matchingVerses.length,
        verses: matchingVerses
      });
    }

    return results;
  };

  // Function to load verse references on demand
  const loadVerseReferences = async () => {
    const strongsId = lexiconContent?.strongs?.id || lexiconContent?.stepBible?.eStrong;
    if (!strongsId || loadingReferences) return;

    setLoadingReferences(true);
    try {
      const references = await strongsSearchService.searchByStrongsId(strongsId);
      setVerseReferences(references);

      // Parse KJV translations and count occurrences
      const kjvDef = lexiconContent?.strongs?.kjv_def || lexiconContent?.strongs?.usage || '';
      if (kjvDef) {
        const translations = parseKjvDef(kjvDef);
        const translationsWithCounts = countTranslationOccurrences(references, translations);
        setTranslationWords(translationsWithCounts);
      }

      setShowReferences(true);
    } catch (error) {
      console.error('Error loading verse references:', error);
    } finally {
      setLoadingReferences(false);
    }
  };

  // Handle clicking on a translation word
  const handleTranslationClick = (translationWord: TranslationWord) => {
    if (selectedTranslation === translationWord.word) {
      // Toggle off if already selected
      setSelectedTranslation(null);
      setTranslationVerses([]);
    } else {
      setSelectedTranslation(translationWord.word);
      setTranslationVerses(translationWord.verses);
    }
  };

  // Handle clicking on a verse reference
  const handleVerseReferenceClick = (ref: VerseReference) => {
    if (onVerseClick) {
      onVerseClick(ref.bookId, ref.chapter, ref.verse);
    }
  };

  // If neither content is available, don't render
  if (!lexiconContent && !hebrewLetterContent) {
    return null;
  }

  return (
    <div className="right-panel">
      <div className="right-panel-header">
        <div className="right-panel-tabs">
          {lexiconContent?.strongs && (
            <button
              className={`right-panel-tab ${activeTab === 'strongs' ? 'active' : ''}`}
              onClick={() => setActiveTab('strongs')}
            >
              📖 Strong's
            </button>
          )}
          {lexiconContent?.stepBible && (
            <button
              className={`right-panel-tab ${activeTab === 'stepbible' ? 'active' : ''}`}
              onClick={() => setActiveTab('stepbible')}
            >
              📚 STEP Bible
            </button>
          )}
          {lexiconContent?.bdb && (
            <button
              className={`right-panel-tab ${activeTab === 'bdb' ? 'active' : ''}`}
              onClick={() => setActiveTab('bdb')}
            >
              📕 BDB
            </button>
          )}
          {lexiconContent?.ahlb && (
            <button
              className={`right-panel-tab ${activeTab === 'ahlb' ? 'active' : ''}`}
              onClick={() => setActiveTab('ahlb')}
            >
              📜 AHLB
            </button>
          )}
          {hebrewLetterContent && (
            <button
              className={`right-panel-tab ${activeTab === 'hebrew' ? 'active' : ''}`}
              onClick={() => setActiveTab('hebrew')}
            >
              🔤 Hebrew Letter
            </button>
          )}
        </div>
        <button className="right-panel-close" onClick={onClose} title="Close Panel">
          ✕
        </button>
      </div>

      <div className="right-panel-content">
        {/* Strong's Lexicon Tab */}
        {activeTab === 'strongs' && lexiconContent?.strongs && (
          <div className="lexicon-panel">
            <div className="lexicon-header">
              <h2 className="lexicon-word">{lexiconContent.strongs.lemma || lexiconContent.strongs.word}</h2>
              <div className="lexicon-strongs">Strong's #{lexiconContent.strongs.id}</div>
            </div>

            {(lexiconContent.strongs.pron || lexiconContent.strongs.pronunciation) && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Pronunciation</h3>
                <p className="lexicon-pronunciation">{lexiconContent.strongs.pron || lexiconContent.strongs.pronunciation}</p>
              </div>
            )}

            {(lexiconContent.strongs.xlit || lexiconContent.strongs.translit || lexiconContent.strongs.transliteration) && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Transliteration</h3>
                <p className="lexicon-pronunciation">{lexiconContent.strongs.xlit || lexiconContent.strongs.translit || lexiconContent.strongs.transliteration}</p>
              </div>
            )}

            {(lexiconContent.strongs.strongs_def || lexiconContent.strongs.meaning) && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Definition</h3>
                <div className="lexicon-definition">
                  {(lexiconContent.strongs.strongs_def || lexiconContent.strongs.meaning).split('\n').map((line: string, idx: number) => (
                    <p key={idx}>{line.trim()}</p>
                  ))}
                </div>
              </div>
            )}

            {(lexiconContent.strongs.kjv_def || lexiconContent.strongs.usage) && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">
                  KJV Usage
                  {verseReferences.length > 0 && (
                    <span className="usage-count">({verseReferences.length} total occurrences)</span>
                  )}
                </h3>

                {/* Translation words with counts */}
                <div className="translation-words-container">
                  {!showReferences && !loadingReferences && (
                    <>
                      <div className="lexicon-definition">
                        {(lexiconContent.strongs.kjv_def || lexiconContent.strongs.usage).split('\n').map((line: string, idx: number) => (
                          <p key={idx}>{line.trim()}</p>
                        ))}
                      </div>
                      <button
                        className="show-references-btn"
                        onClick={loadVerseReferences}
                      >
                        Load Usage Counts & References
                      </button>
                    </>
                  )}

                  {loadingReferences && (
                    <div className="references-loading">
                      Loading scripture references...
                    </div>
                  )}

                  {showReferences && translationWords.length > 0 && (
                    <div className="translation-words-list">
                      {translationWords.map((tw, idx) => (
                        <span
                          key={idx}
                          className={`translation-word-item ${selectedTranslation === tw.word ? 'selected' : ''} ${tw.count > 0 ? 'clickable' : ''}`}
                          onClick={() => tw.count > 0 && handleTranslationClick(tw)}
                          title={tw.count > 0 ? `Click to see ${tw.count} verse(s)` : 'No matches found'}
                        >
                          {tw.word}
                          <span className="translation-count">({tw.count}x)</span>
                          {idx < translationWords.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scripture References for selected translation */}
                {selectedTranslation && translationVerses.length > 0 && (
                  <div className="scripture-references-section">
                    <div className="references-container">
                      <div className="references-header">
                        <span className="references-count">
                          "{selectedTranslation}" - {translationVerses.length} verse{translationVerses.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          className="hide-references-btn"
                          onClick={() => {
                            setSelectedTranslation(null);
                            setTranslationVerses([]);
                          }}
                        >
                          Close
                        </button>
                      </div>
                      <div className="references-list">
                        {translationVerses.map((ref, idx) => (
                          <div
                            key={idx}
                            className="reference-item"
                            onClick={() => handleVerseReferenceClick(ref)}
                          >
                            <span className="reference-location">
                              {ref.bookName} {ref.chapter}:{ref.verse}
                            </span>
                            <span className="reference-text">
                              {ref.text.length > 80 ? ref.text.substring(0, 80) + '...' : ref.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Show all references button when translations are loaded */}
                {showReferences && verseReferences.length > 0 && !selectedTranslation && (
                  <div className="scripture-references-section">
                    <button
                      className="show-all-references-btn"
                      onClick={() => {
                        setSelectedTranslation('__all__');
                        setTranslationVerses(verseReferences);
                      }}
                    >
                      Show All {verseReferences.length} References
                    </button>
                  </div>
                )}
              </div>
            )}

            {(lexiconContent.strongs.derivation || lexiconContent.strongs.source) && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Derivation</h3>
                <p className="lexicon-derivation">{lexiconContent.strongs.derivation || lexiconContent.strongs.source}</p>
              </div>
            )}
          </div>
        )}

        {/* STEP Bible Tab */}
        {activeTab === 'stepbible' && lexiconContent?.stepBible && (
          <div className="lexicon-panel">
            <div className="lexicon-header">
              <h2 className="lexicon-word">{lexiconContent.stepBible.word}</h2>
              <div className="lexicon-strongs">Strong's {lexiconContent.stepBible.eStrong}</div>
            </div>

            {lexiconContent.stepBible.transliteration && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Transliteration</h3>
                <p className="lexicon-pronunciation">{lexiconContent.stepBible.transliteration}</p>
              </div>
            )}

            {lexiconContent.stepBible.gloss && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Gloss</h3>
                <p className="lexicon-gloss">"{lexiconContent.stepBible.gloss}"</p>
              </div>
            )}

            {lexiconContent.stepBible.morph && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Grammar</h3>
                <p className="lexicon-pronunciation">{lexiconContent.stepBible.morph}</p>
              </div>
            )}

            {lexiconContent.stepBible.meaning && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Definition</h3>
                <div
                  className="lexicon-definition stepbible-definition-content"
                  dangerouslySetInnerHTML={{ __html: lexiconContent.stepBible.meaning }}
                />
              </div>
            )}

            <div className="lexicon-attribution">
              <small>
                Data from <a href="https://www.STEPBible.org" target="_blank" rel="noopener noreferrer">STEP Bible</a> (CC BY 4.0)
              </small>
            </div>
          </div>
        )}

        {/* BDB Tab */}
        {activeTab === 'bdb' && lexiconContent?.bdb && (
          <div className="lexicon-panel">
            <div className="lexicon-header">
              <h2 className="lexicon-word">{lexiconContent.bdb.word}</h2>
              <div className="lexicon-strongs">BDB #{lexiconContent.bdb.id}</div>
            </div>

            <div className="lexicon-section">
              <h3 className="lexicon-section-title">Part of Speech</h3>
              <p className="lexicon-pronunciation">{lexiconContent.bdb.partOfSpeech}</p>
            </div>

            <div className="lexicon-section">
              <h3 className="lexicon-section-title">Definition</h3>
              <div className="lexicon-definition">
                <p>{lexiconContent.bdb.definition}</p>
              </div>
            </div>
          </div>
        )}

        {/* AHLB Tab */}
        {activeTab === 'ahlb' && lexiconContent?.ahlb && (
          <div className="lexicon-panel">
            <div className="lexicon-divider">
              <h3>📜 Ancient Hebrew Lexicon</h3>
            </div>

            <div className="lexicon-section ahlb-section">
              <h3 className="lexicon-section-title">Pictographic Meaning</h3>
              <p className="ahlb-translation">{lexiconContent.ahlb.translation}</p>
            </div>

            {lexiconContent.ahlb.transliteration && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Transliteration</h3>
                <p className="lexicon-pronunciation">{lexiconContent.ahlb.transliteration}</p>
              </div>
            )}

            {lexiconContent.ahlb.wordType && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Word Type</h3>
                <p className="lexicon-pronunciation">{lexiconContent.ahlb.wordType}</p>
              </div>
            )}

            {lexiconContent.ahlb.definition && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Definition</h3>
                <div className="lexicon-definition ahlb-definition">
                  <p>{lexiconContent.ahlb.definition}</p>
                </div>
              </div>
            )}

            {lexiconContent.ahlb.relationship && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Relationship to Root</h3>
                <div className="lexicon-definition ahlb-relationship">
                  <p>{lexiconContent.ahlb.relationship}</p>
                </div>
              </div>
            )}

            {lexiconContent.ahlb.kjvTranslations && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">KJV Translations</h3>
                <p className="lexicon-pronunciation">{lexiconContent.ahlb.kjvTranslations}</p>
              </div>
            )}

            <div className="lexicon-attribution">
              <small>
                Data from <a href="https://www.ancient-hebrew.org" target="_blank" rel="noopener noreferrer">Ancient Hebrew Research Center</a>
              </small>
            </div>
          </div>
        )}

        {activeTab === 'hebrew' && hebrewLetterContent && (
          <div className="hebrew-letter-panel">
            <div className="hebrew-letter-header">
              <div className="hebrew-letter-display">
                <div className="hebrew-letter-modern">{hebrewLetterContent.letter}</div>
                <div className="hebrew-letter-ancient">{hebrewLetterContent.ancientScript}</div>
              </div>
              <div className="hebrew-letter-info">
                <h2 className="hebrew-letter-name">{hebrewLetterContent.name}</h2>
                <p className="hebrew-letter-pronunciation">
                  Pronounced: <em>{hebrewLetterContent.transliteration}</em>
                </p>
              </div>
            </div>

            <div className="hebrew-letter-section">
              <h3 className="hebrew-section-title">Meaning</h3>
              <p className="hebrew-letter-meaning">{hebrewLetterContent.meaning}</p>
            </div>

            <div className="hebrew-letter-section">
              <h3 className="hebrew-section-title">Definition</h3>
              <p className="hebrew-letter-meaning">{hebrewLetterContent.definition}</p>
            </div>

            <div className="hebrew-letter-section">
              <h3 className="hebrew-section-title">Numerical Value</h3>
              <p className="hebrew-letter-value">{hebrewLetterContent.number}</p>
            </div>

            <div className="hebrew-letter-section">
              <h3 className="hebrew-section-title">Scripts</h3>
              <div className="hebrew-scripts-comparison">
                <div className="script-item">
                  <span className="script-label">Modern Hebrew:</span>
                  <span className="script-display modern">{hebrewLetterContent.letter}</span>
                </div>
                <div className="script-item">
                  <span className="script-label">Proto-Sinaitic:</span>
                  <span className="script-display ancient">{hebrewLetterContent.ancientScript}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;
