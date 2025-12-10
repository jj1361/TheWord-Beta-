import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BIBLE_BOOKS, Book } from '../types/bible';
import './ScripturePresentationView.css';

interface Verse {
  num: number;
  text: string;
}

interface ScripturePresentationViewProps {
  bookName: string;
  bookId: number;
  chapterNum: number;
  verses: Verse[];
  onClose: () => void;
  onNavigate: (bookId: number, chapter: number) => void;
  initialVerse?: number;
}

const ScripturePresentationView: React.FC<ScripturePresentationViewProps> = ({
  bookName,
  bookId,
  chapterNum,
  verses,
  onClose,
  onNavigate,
  initialVerse = 1,
}) => {
  const [currentVerseIndex, setCurrentVerseIndex] = useState(
    Math.max(0, verses.findIndex(v => v.num === initialVerse))
  );
  const [inputBuffer, setInputBuffer] = useState('');
  const [showInputHint, setShowInputHint] = useState(false);
  const [showNavModal, setShowNavModal] = useState(false);
  const [navView, setNavView] = useState<'books' | 'chapters'>('books');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVerse = verses[currentVerseIndex];

  // Bible book categories
  const oldTestamentBooks = BIBLE_BOOKS.filter(book => book.id >= 1 && book.id <= 39);
  const newTestamentBooks = BIBLE_BOOKS.filter(book => book.id >= 40 && book.id <= 66);
  const apocryphaBooks = BIBLE_BOOKS.filter(book => book.isApocrypha);

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setNavView('chapters');
  };

  const handleChapterClick = (chapter: number) => {
    if (selectedBook) {
      onNavigate(selectedBook.id, chapter);
      closeNavModal();
    }
  };

  const handleBackToBooks = () => {
    setNavView('books');
    setSelectedBook(null);
  };

  const openNavModal = () => {
    setShowNavModal(true);
    setNavView('books');
    setSelectedBook(null);
  };

  const closeNavModal = () => {
    setShowNavModal(false);
    setNavView('books');
    setSelectedBook(null);
  };

  // Calculate dynamic font size based on text length
  const calculateFontSize = (text: string): string => {
    const length = text.length;
    if (length < 100) return 'clamp(28px, 5vw, 48px)';
    if (length < 200) return 'clamp(24px, 4vw, 40px)';
    if (length < 300) return 'clamp(20px, 3.5vw, 34px)';
    if (length < 400) return 'clamp(18px, 3vw, 28px)';
    if (length < 500) return 'clamp(16px, 2.5vw, 24px)';
    return 'clamp(14px, 2vw, 20px)';
  };

  const goToNextVerse = useCallback(() => {
    if (currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex(prev => prev + 1);
    }
  }, [currentVerseIndex, verses.length]);

  const goToPrevVerse = useCallback(() => {
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(prev => prev - 1);
    }
  }, [currentVerseIndex]);

  const goToVerse = useCallback((verseNum: number) => {
    const index = verses.findIndex(v => v.num === verseNum);
    if (index !== -1) {
      setCurrentVerseIndex(index);
    }
  }, [verses]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToNextVerse();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevVerse();
        return;
      }

      // Home/End keys
      if (e.key === 'Home') {
        e.preventDefault();
        setCurrentVerseIndex(0);
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        setCurrentVerseIndex(verses.length - 1);
        return;
      }

      // Number input for direct verse navigation
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        const newBuffer = inputBuffer + e.key;
        setInputBuffer(newBuffer);
        setShowInputHint(true);

        // Clear previous timeout
        if (inputTimeoutRef.current) {
          clearTimeout(inputTimeoutRef.current);
        }

        // Set timeout to process the number
        inputTimeoutRef.current = setTimeout(() => {
          const verseNum = parseInt(newBuffer, 10);
          if (verseNum > 0 && verseNum <= verses.length) {
            goToVerse(verseNum);
          }
          setInputBuffer('');
          setShowInputHint(false);
        }, 1500);
      }

      // Backspace to delete last character
      if (e.key === 'Backspace' && showInputHint) {
        e.preventDefault();
        if (inputTimeoutRef.current) {
          clearTimeout(inputTimeoutRef.current);
        }
        const newBuffer = inputBuffer.slice(0, -1);
        setInputBuffer(newBuffer);
        if (newBuffer === '') {
          setShowInputHint(false);
        } else {
          // Reset timeout
          inputTimeoutRef.current = setTimeout(() => {
            const verseNum = parseInt(newBuffer, 10);
            if (verseNum > 0 && verseNum <= verses.length) {
              goToVerse(verseNum);
            }
            setInputBuffer('');
            setShowInputHint(false);
          }, 1500);
        }
      }

      // Enter to confirm number immediately
      if (e.key === 'Enter' && inputBuffer) {
        e.preventDefault();
        if (inputTimeoutRef.current) {
          clearTimeout(inputTimeoutRef.current);
        }
        const verseNum = parseInt(inputBuffer, 10);
        if (verseNum > 0 && verseNum <= verses.length) {
          goToVerse(verseNum);
        }
        setInputBuffer('');
        setShowInputHint(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
    };
  }, [inputBuffer, showInputHint, goToNextVerse, goToPrevVerse, goToVerse, onClose, verses.length]);

  // Focus container on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  if (!currentVerse) {
    return null;
  }

  return (
    <div
      className="scripture-presentation-overlay"
      ref={containerRef}
      tabIndex={-1}
    >
      <div
        className="scripture-presentation-background"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/backgrounds/ScriptureBackground.png)` }}
      />

      {/* Close button */}
      <button className="presentation-close-btn" onClick={onClose}>
        ×
      </button>

      {/* Navigation hint */}
      <div className="presentation-nav-hint">
        <span>← → Navigate</span>
        <span>|</span>
        <span>Type verse #</span>
        <span>|</span>
        <span>ESC Close</span>
      </div>

      {/* Verse input indicator */}
      {showInputHint && (
        <div className="verse-input-indicator">
          <span className="input-label">Go to verse:</span>
          <span className="input-value">{inputBuffer}<span className="input-cursor">|</span></span>
          <span className="input-hint">Backspace to delete • Enter to go</span>
        </div>
      )}

      {/* Main content with glass effect */}
      <div className="scripture-glass-container">
        {/* Book, Chapter, Verse reference - clickable to open navigation */}
        <button className="scripture-reference scripture-reference-btn" onClick={openNavModal}>
          <span className="reference-book">{bookName}</span>
          <span className="reference-chapter">{chapterNum}</span>
          <span className="reference-separator">:</span>
          <span className="reference-verse">{currentVerse.num}</span>
          <span className="reference-dropdown-icon">▼</span>
        </button>

        {/* Verse text */}
        <div
          className="scripture-text"
          style={{ fontSize: calculateFontSize(currentVerse.text) }}
        >
          {currentVerse.text}
        </div>

        {/* Verse progress indicator */}
        <div className="verse-progress">
          <span className="progress-current">{currentVerse.num}</span>
          <span className="progress-separator">/</span>
          <span className="progress-total">{verses.length}</span>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        className={`scripture-nav-arrow scripture-nav-arrow-left ${currentVerseIndex === 0 ? 'disabled' : ''}`}
        onClick={goToPrevVerse}
        disabled={currentVerseIndex === 0}
      >
        ‹
      </button>
      <button
        className={`scripture-nav-arrow scripture-nav-arrow-right ${currentVerseIndex === verses.length - 1 ? 'disabled' : ''}`}
        onClick={goToNextVerse}
        disabled={currentVerseIndex === verses.length - 1}
      >
        ›
      </button>

      {/* Verse dots indicator (for chapters with <= 30 verses) */}
      {verses.length <= 30 && (
        <div className="verse-dots">
          {verses.map((v, index) => (
            <button
              key={v.num}
              className={`verse-dot ${index === currentVerseIndex ? 'active' : ''}`}
              onClick={() => setCurrentVerseIndex(index)}
              title={`Verse ${v.num}`}
            />
          ))}
        </div>
      )}

      {/* Navigation Modal */}
      {showNavModal && (
        <div className="scripture-nav-modal-overlay" onClick={closeNavModal}>
          <div className="scripture-nav-modal" onClick={(e) => e.stopPropagation()}>
            <div className="scripture-nav-modal-header">
              <h2>{navView === 'books' ? 'Select Book' : selectedBook?.name}</h2>
              <button className="scripture-nav-close-btn" onClick={closeNavModal}>×</button>
            </div>

            {navView === 'books' ? (
              <div className="scripture-nav-books-view">
                <div className="scripture-nav-testament">
                  <h3>Old Testament</h3>
                  <div className="scripture-nav-books-grid">
                    {oldTestamentBooks.map(book => (
                      <button
                        key={book.id}
                        className={`scripture-nav-book-btn ${book.id === bookId ? 'active' : ''}`}
                        onClick={() => handleBookClick(book)}
                      >
                        {book.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="scripture-nav-testament">
                  <h3>New Testament</h3>
                  <div className="scripture-nav-books-grid">
                    {newTestamentBooks.map(book => (
                      <button
                        key={book.id}
                        className={`scripture-nav-book-btn ${book.id === bookId ? 'active' : ''}`}
                        onClick={() => handleBookClick(book)}
                      >
                        {book.name}
                      </button>
                    ))}
                  </div>
                </div>

                {apocryphaBooks.length > 0 && (
                  <div className="scripture-nav-testament">
                    <h3>Apocrypha</h3>
                    <div className="scripture-nav-books-grid">
                      {apocryphaBooks.map(book => (
                        <button
                          key={book.id}
                          className={`scripture-nav-book-btn ${book.id === bookId ? 'active' : ''}`}
                          onClick={() => handleBookClick(book)}
                        >
                          {book.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="scripture-nav-chapters-view">
                <button className="scripture-nav-back-btn" onClick={handleBackToBooks}>
                  ← Back to Books
                </button>
                <div className="scripture-nav-chapters-grid">
                  {selectedBook && Array.from(
                    { length: selectedBook.chapters },
                    (_, i) => i + (selectedBook.startChapter || 1)
                  ).map(chapter => (
                    <button
                      key={chapter}
                      className={`scripture-nav-chapter-btn ${
                        selectedBook.id === bookId && chapter === chapterNum ? 'active' : ''
                      }`}
                      onClick={() => handleChapterClick(chapter)}
                    >
                      {chapter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScripturePresentationView;
