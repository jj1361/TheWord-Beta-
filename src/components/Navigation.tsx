import React, { useState } from 'react';
import { BIBLE_BOOKS } from '../types/bible';
import NavigationModal from './NavigationModal';
import './Navigation.css';

interface NavigationProps {
  currentBookId: number;
  currentChapter: number;
  onNavigate: (bookId: number, chapter: number) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentBookId, currentChapter, onNavigate }) => {
  const [selectedBook, setSelectedBook] = useState(currentBookId);
  const [selectedChapter, setSelectedChapter] = useState(currentChapter);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentBook = BIBLE_BOOKS.find(b => b.id === selectedBook);
  const displayBook = BIBLE_BOOKS.find(b => b.id === currentBookId);

  const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bookId = parseInt(e.target.value);
    setSelectedBook(bookId);
    setSelectedChapter(1);
  };

  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChapter(parseInt(e.target.value));
  };

  const handleGo = () => {
    onNavigate(selectedBook, selectedChapter);
  };

  const handlePrevChapter = () => {
    const book = BIBLE_BOOKS.find(b => b.id === currentBookId);
    const startChapter = book?.startChapter || 1;
    if (currentChapter > startChapter) {
      onNavigate(currentBookId, currentChapter - 1);
    } else if (currentBookId > 1) {
      const prevBook = BIBLE_BOOKS.find(b => b.id === currentBookId - 1);
      if (prevBook) {
        // Navigate to last chapter of previous book
        const lastChapter = (prevBook.startChapter || 1) + prevBook.chapters - 1;
        onNavigate(currentBookId - 1, lastChapter);
      }
    }
  };

  const handleNextChapter = () => {
    const book = BIBLE_BOOKS.find(b => b.id === currentBookId);
    if (book) {
      const lastChapter = (book.startChapter || 1) + book.chapters - 1;
      if (currentChapter < lastChapter) {
        onNavigate(currentBookId, currentChapter + 1);
      } else if (currentBookId < 66) {
        const nextBook = BIBLE_BOOKS.find(b => b.id === currentBookId + 1);
        const nextStartChapter = nextBook?.startChapter || 1;
        onNavigate(currentBookId + 1, nextStartChapter);
      }
    }
  };

  return (
    <>
      <div className="navigation">
        <div className="navigation-with-arrows">
          <button
            onClick={handlePrevChapter}
            className="nav-arrow nav-arrow-left"
            disabled={currentBookId === 1 && currentChapter === 1}
          >
            ←
          </button>

          <button
            className="navigation-modal-btn"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="current-reference">
              {displayBook?.name} {currentChapter}
            </span>
            <span className="dropdown-icon">▼</span>
          </button>

          <button
            onClick={handleNextChapter}
            className="nav-arrow nav-arrow-right"
            disabled={currentBookId === 66 && currentChapter === 22}
          >
            →
          </button>
        </div>
      </div>

      <NavigationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNavigate={onNavigate}
        currentBookId={currentBookId}
        currentChapter={currentChapter}
      />
    </>
  );
};

export default Navigation;
