/**
 * SplitView Component
 * Container for comparing up to 3 translations side by side with a single shared scrollbar
 * and verse alignment across all panes
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TranslationId, TRANSLATIONS, getTranslationById } from '../types/translation';
import { useTranslation } from '../contexts/TranslationContext';
import { Chapter } from '../types/bible';
import { bibleService } from '../services/bibleService';
import './SplitView.css';

interface SplitViewProps {
  bookId: number;
  chapterNum: number;
  textSize?: number;
  highlightVerse?: number;
  onClose: () => void;
}

interface PaneState {
  id: string;
  translationId: TranslationId;
  chapter: Chapter | null;
  loading: boolean;
}

const SplitView: React.FC<SplitViewProps> = ({
  bookId,
  chapterNum,
  textSize = 18,
  highlightVerse,
  onClose,
}) => {
  const { currentTranslation } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Initialize with current translation and one additional translation
  const [panes, setPanes] = useState<PaneState[]>(() => {
    const defaultSecondTranslation = TRANSLATIONS.find(t => t.id !== currentTranslation)?.id || 'tagalog';
    return [
      { id: 'pane-1', translationId: currentTranslation, chapter: null, loading: true },
      { id: 'pane-2', translationId: defaultSecondTranslation as TranslationId, chapter: null, loading: true },
    ];
  });

  // Load chapters for all panes when book/chapter changes
  useEffect(() => {
    const loadAllChapters = async () => {
      setPanes(prev => prev.map(p => ({ ...p, loading: true })));

      const updatedPanes = await Promise.all(
        panes.map(async (pane) => {
          try {
            const chapterData = await bibleService.loadChapter(bookId, chapterNum, pane.translationId);
            return { ...pane, chapter: chapterData, loading: false };
          } catch (error) {
            console.error('Error loading chapter for split view:', error);
            return { ...pane, chapter: null, loading: false };
          }
        })
      );
      setPanes(updatedPanes);
    };

    loadAllChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterNum]);

  // Handle translation change for a pane
  const handleTranslationChange = useCallback(async (paneId: string, translationId: TranslationId) => {
    setDropdownOpen(null);

    setPanes(prev => prev.map(p =>
      p.id === paneId ? { ...p, loading: true, translationId } : p
    ));

    try {
      const chapterData = await bibleService.loadChapter(bookId, chapterNum, translationId);
      setPanes(prev => prev.map(p =>
        p.id === paneId ? { ...p, chapter: chapterData, loading: false } : p
      ));
    } catch (error) {
      console.error('Error loading chapter:', error);
      setPanes(prev => prev.map(p =>
        p.id === paneId ? { ...p, chapter: null, loading: false } : p
      ));
    }
  }, [bookId, chapterNum]);

  // Add a new pane (max 3)
  const handleAddPane = useCallback(async () => {
    if (panes.length >= 3) return;

    const usedTranslations = new Set(panes.map(p => p.translationId));
    const availableTranslation = TRANSLATIONS.find(t => !usedTranslations.has(t.id));
    const newTranslationId = (availableTranslation?.id || 'kjv') as TranslationId;

    const newPane: PaneState = {
      id: `pane-${Date.now()}`,
      translationId: newTranslationId,
      chapter: null,
      loading: true,
    };

    setPanes(prev => [...prev, newPane]);

    try {
      const chapterData = await bibleService.loadChapter(bookId, chapterNum, newTranslationId);
      setPanes(prev => prev.map(p =>
        p.id === newPane.id ? { ...p, chapter: chapterData, loading: false } : p
      ));
    } catch (error) {
      console.error('Error loading chapter:', error);
      setPanes(prev => prev.map(p =>
        p.id === newPane.id ? { ...p, loading: false } : p
      ));
    }
  }, [panes, bookId, chapterNum]);

  // Remove a pane (keep at least 2)
  const handleRemovePane = useCallback((paneId: string) => {
    if (panes.length <= 2) return;
    setPanes(prev => prev.filter(pane => pane.id !== paneId));
  }, [panes.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.pane-header-dropdown-container')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get the maximum number of verses across all loaded chapters
  const maxVerses = Math.max(...panes.map(p => p.chapter?.kjvVerses.length || 0), 0);

  // Scroll to highlighted verse
  useEffect(() => {
    if (highlightVerse && scrollContainerRef.current) {
      const verseRow = scrollContainerRef.current.querySelector(`[data-verse-row="${highlightVerse}"]`);
      if (verseRow) {
        verseRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightVerse, panes]);

  const isLoading = panes.some(p => p.loading);

  return (
    <div className="split-view-container">
      {/* Split View Header */}
      <div className="split-view-header">
        <div className="split-view-title">
          <span className="split-icon">⧉</span>
          <span>Compare Translations</span>
          <span className="pane-count">({panes.length} of 3)</span>
        </div>

        <div className="split-view-actions">
          {panes.length < 3 && (
            <button
              className="split-view-add-btn"
              onClick={handleAddPane}
              title="Add another translation"
            >
              <span>+</span>
              Add Translation
            </button>
          )}

          <button
            className="split-view-close-btn"
            onClick={onClose}
            title="Exit split view"
          >
            <span>×</span>
            Close
          </button>
        </div>
      </div>

      {/* Pane Headers (fixed) */}
      <div className="split-view-pane-headers">
        {panes.map((pane, index) => {
          const translationInfo = getTranslationById(pane.translationId);
          const isOpen = dropdownOpen === pane.id;

          return (
            <div key={pane.id} className={`pane-header ${index === 0 ? 'primary' : ''}`}>
              <div className="pane-header-dropdown-container">
                <button
                  className="pane-header-translation-btn"
                  onClick={() => setDropdownOpen(isOpen ? null : pane.id)}
                >
                  <span className="translation-abbrev">{translationInfo?.abbreviation || 'KJV'}</span>
                  <span className="translation-name">{translationInfo?.name || 'King James Version'}</span>
                  <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="pane-header-dropdown">
                    {TRANSLATIONS.map(translation => (
                      <button
                        key={translation.id}
                        className={`dropdown-option ${translation.id === pane.translationId ? 'active' : ''}`}
                        onClick={() => handleTranslationChange(pane.id, translation.id)}
                      >
                        <span className="option-abbrev">{translation.abbreviation}</span>
                        <span className="option-name">{translation.name}</span>
                        {translation.id === pane.translationId && <span className="check-mark">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {index > 0 && panes.length > 2 && (
                <button
                  className="pane-header-remove-btn"
                  onClick={() => handleRemovePane(pane.id)}
                  title="Remove this pane"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Single Scrollable Content Area */}
      <div className="split-view-scroll-container" ref={scrollContainerRef}>
        {isLoading ? (
          <div className="split-view-loading">
            <div className="loading-spinner" />
            <span>Loading translations...</span>
          </div>
        ) : (
          <div className="split-view-content">
            {Array.from({ length: maxVerses }, (_, i) => i + 1).map(verseNum => (
              <div
                key={verseNum}
                className={`split-view-verse-row ${highlightVerse === verseNum ? 'highlighted' : ''}`}
                data-verse-row={verseNum}
              >
                {panes.map(pane => {
                  const verse = pane.chapter?.kjvVerses.find(v => v.num === verseNum);
                  return (
                    <div
                      key={pane.id}
                      className="split-view-verse-cell"
                      style={{ fontSize: `${textSize}px` }}
                    >
                      {verse ? (
                        <>
                          <span className="verse-number">{verse.num}</span>
                          <span className="verse-text">{verse.text}</span>
                        </>
                      ) : (
                        <div className="verse-empty">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitView;
