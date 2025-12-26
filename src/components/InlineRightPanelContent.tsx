import React, { useState, useEffect, useCallback } from 'react';
import { LexiconData } from '../types/lexicon';
import { HebrewLetterInfo } from '../config/hebrewLetters';
import { CrossReference, crossRefService } from '../services/crossRefService';
import './InlineRightPanelContent.css';

interface CrossRefContext {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
}

type TabType = 'strongs' | 'stepbible' | 'bdb' | 'ahlb' | 'hebrew' | 'crossref';

interface InlineRightPanelContentProps {
  lexiconContent: LexiconData | null;
  hebrewLetterContent: HebrewLetterInfo | null;
  crossRefContext?: CrossRefContext | null;
  crossRefVerses?: Array<CrossReference & { text?: string }>;
  onClose: () => void;
  onVerseClick?: (bookId: number, chapter: number, verse: number) => void;
  onStrongsClick?: (strongsNumber: string) => void;
}

/**
 * Inline version of the right panel content for display within the verse area
 * when webcam mode is enabled. Shows all lexicons (Strong's, BDB, STEP Bible, AHLB),
 * Hebrew letter info, and cross references with tabs.
 */
const InlineRightPanelContent: React.FC<InlineRightPanelContentProps> = ({
  lexiconContent,
  hebrewLetterContent,
  crossRefContext,
  crossRefVerses = [],
  onClose,
  onVerseClick,
  onStrongsClick,
}) => {
  // Determine initial tab based on available content
  const getInitialTab = useCallback((): TabType => {
    if (crossRefContext) return 'crossref';
    if (lexiconContent) {
      if (lexiconContent.strongs) return 'strongs';
      if (lexiconContent.stepBible) return 'stepbible';
      if (lexiconContent.bdb) return 'bdb';
      if (lexiconContent.ahlb) return 'ahlb';
    }
    if (hebrewLetterContent) return 'hebrew';
    return 'strongs';
  }, [crossRefContext, lexiconContent, hebrewLetterContent]);

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [prevLexiconId, setPrevLexiconId] = useState<string | null>(null);

  // Update tab when content changes
  useEffect(() => {
    const currentLexiconId = lexiconContent?.strongs?.id || lexiconContent?.stepBible?.eStrong || null;

    if (currentLexiconId && currentLexiconId !== prevLexiconId) {
      setActiveTab(getInitialTab());
      setPrevLexiconId(currentLexiconId);
    } else if (crossRefContext && activeTab !== 'crossref') {
      setActiveTab('crossref');
    } else if (hebrewLetterContent && !lexiconContent && !crossRefContext) {
      setActiveTab('hebrew');
    }
  }, [lexiconContent, hebrewLetterContent, crossRefContext, prevLexiconId, activeTab, getInitialTab]);

  // Don't render if no content
  if (!lexiconContent && !hebrewLetterContent && !crossRefContext) {
    return null;
  }

  const handleStrongsLinkClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('strongs-link') && onStrongsClick) {
      const strongsNum = target.getAttribute('data-strongs');
      if (strongsNum) {
        onStrongsClick(strongsNum);
      }
    }
  };

  const parseStrongsReferences = (text: string): string => {
    if (!text || !onStrongsClick) return text;
    const strongsPattern = /\b([HG]\d{1,5}[A-Z]?)\b/g;
    return text.replace(strongsPattern, (match, strongsNum) => {
      const baseNum = strongsNum.replace(/[A-Z]$/, '');
      return `<span class="strongs-link" data-strongs="${baseNum}" title="Click to view ${baseNum}">${match}</span>`;
    });
  };

  // Count available tabs
  const availableTabs: { type: TabType; label: string; icon: string }[] = [];
  if (lexiconContent?.strongs) availableTabs.push({ type: 'strongs', label: "Strong's", icon: '📖' });
  if (lexiconContent?.stepBible) availableTabs.push({ type: 'stepbible', label: 'STEP', icon: '📚' });
  if (lexiconContent?.bdb) availableTabs.push({ type: 'bdb', label: 'BDB', icon: '📕' });
  if (lexiconContent?.ahlb) availableTabs.push({ type: 'ahlb', label: 'AHLB', icon: '📜' });
  if (hebrewLetterContent) availableTabs.push({ type: 'hebrew', label: 'Letter', icon: '🔤' });
  if (crossRefContext) availableTabs.push({ type: 'crossref', label: 'Cross Refs', icon: '🔗' });

  return (
    <div className="inline-right-panel-content">
      <div className="inline-panel-header">
        {/* Tabs */}
        <div className="inline-panel-tabs">
          {availableTabs.map(tab => (
            <button
              key={tab.type}
              className={`inline-panel-tab ${activeTab === tab.type ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.type)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
        <button className="inline-panel-close" onClick={onClose} title="Close">
          ×
        </button>
      </div>

      <div className="inline-panel-body">
        {/* Strong's Lexicon Tab */}
        {activeTab === 'strongs' && lexiconContent?.strongs && (
          <div className="inline-lexicon-content">
            <div className="inline-lexicon-word-row">
              <span className="inline-lexicon-word">{lexiconContent.strongs.lemma || lexiconContent.strongs.word}</span>
              <span className="inline-lexicon-strongs">#{lexiconContent.strongs.id}</span>
            </div>

            {(lexiconContent.strongs.pron || lexiconContent.strongs.pronunciation) && (
              <div className="inline-lexicon-pron">
                {lexiconContent.strongs.pron || lexiconContent.strongs.pronunciation}
              </div>
            )}

            {(lexiconContent.strongs.xlit || lexiconContent.strongs.translit || lexiconContent.strongs.transliteration) && (
              <div className="inline-lexicon-translit">
                {lexiconContent.strongs.xlit || lexiconContent.strongs.translit || lexiconContent.strongs.transliteration}
              </div>
            )}

            {(lexiconContent.strongs.strongs_def || lexiconContent.strongs.meaning) && (
              <div className="inline-lexicon-section">
                <div className="inline-section-title">Definition</div>
                <div
                  className="inline-lexicon-def"
                  onClick={handleStrongsLinkClick}
                  dangerouslySetInnerHTML={{
                    __html: parseStrongsReferences(lexiconContent.strongs.strongs_def || lexiconContent.strongs.meaning || '')
                  }}
                />
              </div>
            )}

            {(lexiconContent.strongs.kjv_def || lexiconContent.strongs.usage) && (
              <div className="inline-lexicon-section">
                <div className="inline-section-title">KJV Usage</div>
                <div className="inline-lexicon-usage">
                  {lexiconContent.strongs.kjv_def || lexiconContent.strongs.usage}
                </div>
              </div>
            )}

            {(lexiconContent.strongs.derivation || lexiconContent.strongs.source) && (
              <div className="inline-lexicon-section">
                <div className="inline-section-title">Derivation</div>
                <div
                  className="inline-lexicon-derivation"
                  onClick={handleStrongsLinkClick}
                  dangerouslySetInnerHTML={{
                    __html: parseStrongsReferences(lexiconContent.strongs.derivation || lexiconContent.strongs.source || '')
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP Bible Tab */}
        {activeTab === 'stepbible' && lexiconContent?.stepBible && (
          <div className="inline-lexicon-content">
            <div className="inline-lexicon-word-row">
              <span className="inline-lexicon-word">{lexiconContent.stepBible.word}</span>
              <span className="inline-lexicon-strongs">{lexiconContent.stepBible.eStrong}</span>
            </div>

            {lexiconContent.stepBible.transliteration && (
              <div className="inline-lexicon-translit">
                {lexiconContent.stepBible.transliteration}
              </div>
            )}

            {lexiconContent.stepBible.gloss && (
              <div className="inline-lexicon-section">
                <div className="inline-section-title">Gloss</div>
                <div className="inline-lexicon-gloss">"{lexiconContent.stepBible.gloss}"</div>
              </div>
            )}

            {lexiconContent.stepBible.morph && (
              <div className="inline-lexicon-section">
                <div className="inline-section-title">Grammar</div>
                <div className="inline-lexicon-pron">{lexiconContent.stepBible.morph}</div>
              </div>
            )}

            {lexiconContent.stepBible.meaning && (
              <div className="inline-lexicon-section">
                <div className="inline-section-title">Definition</div>
                <div
                  className="inline-lexicon-def stepbible-def"
                  onClick={handleStrongsLinkClick}
                  dangerouslySetInnerHTML={{
                    __html: parseStrongsReferences(lexiconContent.stepBible.meaning)
                  }}
                />
              </div>
            )}

            <div className="inline-attribution">
              Data from <a href="https://www.STEPBible.org" target="_blank" rel="noopener noreferrer">STEP Bible</a> (CC BY 4.0)
            </div>
          </div>
        )}

        {/* BDB Tab */}
        {activeTab === 'bdb' && lexiconContent?.bdb && (
          <div className="inline-lexicon-content">
            <div className="inline-lexicon-word-row">
              <span className="inline-lexicon-word">{lexiconContent.bdb.word}</span>
              <span className="inline-lexicon-strongs">BDB #{lexiconContent.bdb.id}</span>
            </div>

            <div className="inline-lexicon-section">
              <div className="inline-section-title">Part of Speech</div>
              <div className="inline-lexicon-pron">{lexiconContent.bdb.partOfSpeech}</div>
            </div>

            <div className="inline-lexicon-section">
              <div className="inline-section-title">Definition</div>
              <div
                className="inline-lexicon-def"
                onClick={handleStrongsLinkClick}
                dangerouslySetInnerHTML={{
                  __html: parseStrongsReferences(lexiconContent.bdb.definition)
                }}
              />
            </div>
          </div>
        )}

        {/* AHLB Tab */}
        {activeTab === 'ahlb' && lexiconContent?.ahlb && (
          <div className="inline-lexicon-content">
            <div className="inline-lexicon-section">
              <div className="inline-section-title">Pictographic Meaning</div>
              <div className="inline-ahlb-translation">{lexiconContent.ahlb.translation}</div>
            </div>

            {lexiconContent.ahlb.transliteration && (
              <div className="inline-lexicon-section">
                <div className="inline-section-title">Transliteration</div>
                <div className="inline-lexicon-translit">{lexiconContent.ahlb.transliteration}</div>
              </div>
            )}

            {lexiconContent.ahlb.wordType && (
              <div className="inline-lexicon-section">
                <div className="inline-section-title">Word Type</div>
                <div className="inline-lexicon-pron">{lexiconContent.ahlb.wordType}</div>
              </div>
            )}

            {lexiconContent.ahlb.definition && (
              <div className="inline-lexicon-section">
                <div className="inline-section-title">Definition</div>
                <div className="inline-lexicon-def">{lexiconContent.ahlb.definition}</div>
              </div>
            )}

            {lexiconContent.ahlb.relationship && (
              <div className="inline-lexicon-section">
                <div className="inline-section-title">Relationship to Root</div>
                <div className="inline-lexicon-def">{lexiconContent.ahlb.relationship}</div>
              </div>
            )}

            {lexiconContent.ahlb.kjvTranslations && (
              <div className="inline-lexicon-section">
                <div className="inline-section-title">KJV Translations</div>
                <div className="inline-lexicon-usage">{lexiconContent.ahlb.kjvTranslations}</div>
              </div>
            )}

            <div className="inline-attribution">
              Data from <a href="https://www.ancient-hebrew.org" target="_blank" rel="noopener noreferrer">Ancient Hebrew Research Center</a>
            </div>
          </div>
        )}

        {/* Hebrew Letter Tab */}
        {activeTab === 'hebrew' && hebrewLetterContent && (
          <div className="inline-hebrew-content">
            <div className="inline-hebrew-letters">
              <span className="inline-hebrew-modern">{hebrewLetterContent.letter}</span>
              <span className="inline-hebrew-ancient">{hebrewLetterContent.ancientScript}</span>
            </div>
            <div className="inline-hebrew-info">
              <span className="inline-hebrew-name">{hebrewLetterContent.name}</span>
              <span className="inline-hebrew-translit">({hebrewLetterContent.transliteration})</span>
            </div>

            <div className="inline-lexicon-section">
              <div className="inline-section-title">Meaning</div>
              <div className="inline-hebrew-meaning">{hebrewLetterContent.meaning}</div>
            </div>

            <div className="inline-lexicon-section">
              <div className="inline-section-title">Definition</div>
              <div className="inline-hebrew-def">{hebrewLetterContent.definition}</div>
            </div>

            <div className="inline-lexicon-section">
              <div className="inline-section-title">Numerical Value</div>
              <div className="inline-hebrew-number">{hebrewLetterContent.number}</div>
            </div>

            <div className="inline-hebrew-scripts">
              <div className="script-comparison">
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

        {/* Cross References Tab */}
        {activeTab === 'crossref' && crossRefContext && (
          <div className="inline-crossref-content">
            <div className="inline-crossref-source">
              {crossRefContext.bookName} {crossRefContext.chapter}:{crossRefContext.verse}
            </div>
            {crossRefVerses.length > 0 ? (
              <div className="inline-crossref-list">
                {crossRefVerses.slice(0, 8).map((ref, idx) => (
                  <div
                    key={idx}
                    className="inline-crossref-item"
                    onClick={() => onVerseClick?.(ref.bookId, ref.chapter, ref.verse)}
                  >
                    <span className="inline-crossref-ref">
                      {crossRefService.formatReference(ref)}
                    </span>
                    {ref.text && (
                      <span className="inline-crossref-text">
                        {ref.text.length > 100 ? ref.text.substring(0, 100) + '...' : ref.text}
                      </span>
                    )}
                  </div>
                ))}
                {crossRefVerses.length > 8 && (
                  <div className="inline-crossref-more">
                    +{crossRefVerses.length - 8} more references
                  </div>
                )}
              </div>
            ) : (
              <div className="inline-crossref-empty">No cross references found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineRightPanelContent;
