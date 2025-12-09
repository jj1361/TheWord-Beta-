import React, { useEffect, useRef } from 'react';
import { SearchResult } from '../services/searchService';
import './SearchResultsModal.css';

interface SearchResultsModalProps {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  totalCount: number;
  isLoading: boolean;
  onClose: () => void;
  onResultClick: (bookId: number, chapter: number, verse: number) => void;
}

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({
  isOpen,
  query,
  results,
  totalCount,
  isLoading,
  onClose,
  onResultClick,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Highlight search terms in red
  const highlightSearchTerms = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    // Split query into words for highlighting each term
    const queryWords = searchQuery.trim().split(/\s+/).filter(w => w.length > 0);

    // Create a regex pattern that matches any of the query words
    const pattern = queryWords.map(word =>
      word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('|');

    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = queryWords.some(
        word => part.toLowerCase() === word.toLowerCase()
      );
      return isMatch ? (
        <span key={i} className="search-highlight-red">
          {part}
        </span>
      ) : (
        part
      );
    });
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result.bookId, result.chapterNum, result.verseNum);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-backdrop" onClick={handleBackdropClick}>
      <div className="search-modal" ref={modalRef}>
        <div className="search-modal-header">
          <div className="search-modal-title">
            <h2>Search Results</h2>
            <span className="search-modal-query">
              for "<span className="query-text">{query}</span>"
            </span>
          </div>
          <div className="search-modal-stats">
            {isLoading ? (
              <span className="loading-text">Loading all results...</span>
            ) : (
              <span className="results-total">{totalCount} verses found</span>
            )}
          </div>
          <button className="search-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="search-modal-content">
          {isLoading ? (
            <div className="search-modal-loading">
              <div className="loading-spinner"></div>
              <p>Loading all {totalCount} results...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="search-modal-results">
              {results.map((result, idx) => (
                <div
                  key={`${result.bookId}-${result.chapterNum}-${result.verseNum}-${idx}`}
                  className="search-modal-result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="result-item-reference">
                    {result.bookName} {result.chapterNum}:{result.verseNum}
                  </div>
                  <div className="result-item-text">
                    {highlightSearchTerms(result.text, query)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="search-modal-empty">
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsModal;
