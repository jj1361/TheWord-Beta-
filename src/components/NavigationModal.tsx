import React, { useState } from 'react';
import { BIBLE_BOOKS, Book } from '../types/bible';
import './NavigationModal.css';

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (bookId: number, chapter: number) => void;
  currentBookId: number;
  currentChapter: number;
}

const NavigationModal: React.FC<NavigationModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentBookId,
  currentChapter
}) => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [view, setView] = useState<'books' | 'chapters'>('books');

  // Old Testament: Genesis (1) to Malachi (39)
  const oldTestamentBooks = BIBLE_BOOKS.filter(book => book.id >= 1 && book.id <= 39);

  // New Testament: Matthew (40) to Revelation (66)
  const newTestamentBooks = BIBLE_BOOKS.filter(book => book.id >= 40 && book.id <= 66);

  // Apocrypha: Books 67+
  const apocryphaBooks = BIBLE_BOOKS.filter(book => book.isApocrypha);

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setView('chapters');
  };

  const handleChapterClick = (chapter: number) => {
    if (selectedBook) {
      onNavigate(selectedBook.id, chapter);
      handleClose();
    }
  };

  const handleBackToBooks = () => {
    setView('books');
    setSelectedBook(null);
  };

  const handleClose = () => {
    setView('books');
    setSelectedBook(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="navigation-modal-overlay" onClick={handleClose}>
      <div className="navigation-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="navigation-modal-header">
          <h2>
            {view === 'books' ? 'Select Book' : selectedBook?.name}
          </h2>
          <button className="close-modal-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        {view === 'books' ? (
          <div className="books-view">
            <div className="testament-section">
              <h3 className="testament-title">Old Testament</h3>
              <div className="books-grid">
                {oldTestamentBooks.map(book => (
                  <button
                    key={book.id}
                    className={`book-btn ${book.id === currentBookId ? 'active' : ''}`}
                    onClick={() => handleBookClick(book)}
                  >
                    {book.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="testament-section">
              <h3 className="testament-title">New Testament</h3>
              <div className="books-grid">
                {newTestamentBooks.map(book => (
                  <button
                    key={book.id}
                    className={`book-btn ${book.id === currentBookId ? 'active' : ''}`}
                    onClick={() => handleBookClick(book)}
                  >
                    {book.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="testament-section">
              <h3 className="testament-title">Apocrypha</h3>
              <div className="books-grid">
                {apocryphaBooks.map(book => (
                  <button
                    key={book.id}
                    className={`book-btn ${book.id === currentBookId ? 'active' : ''}`}
                    onClick={() => handleBookClick(book)}
                  >
                    {book.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="chapters-view">
            <button className="back-to-books-btn" onClick={handleBackToBooks}>
              ← Back to Books
            </button>
            <div className="chapters-grid">
              {selectedBook && Array.from({ length: selectedBook.chapters }, (_, i) => i + (selectedBook.startChapter || 1)).map(chapter => (
                <button
                  key={chapter}
                  className={`chapter-btn ${
                    selectedBook.id === currentBookId && chapter === currentChapter ? 'active' : ''
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
  );
};

export default NavigationModal;
