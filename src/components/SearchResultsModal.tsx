import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Reset selection when results change
  useEffect(() => {
    setSelectedVerses(new Set());
  }, [results]);

  // Toggle single verse selection
  const toggleVerseSelection = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVerses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Select/deselect all verses
  const toggleSelectAll = useCallback(() => {
    if (selectedVerses.size === results.length) {
      setSelectedVerses(new Set());
    } else {
      setSelectedVerses(new Set(results.map((_, idx) => idx)));
    }
  }, [results, selectedVerses.size]);

  // Format verse for copying
  const formatVerseForCopy = useCallback((result: SearchResult): string => {
    return `${result.bookName} ${result.chapterNum}:${result.verseNum} - ${result.text}`;
  }, []);

  // Copy verses to clipboard
  const copyVerses = useCallback(async (indices: number[]) => {
    if (indices.length === 0) return;

    const versesToCopy = indices
      .sort((a, b) => a - b)
      .map(idx => formatVerseForCopy(results[idx]))
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(versesToCopy);
      setCopyToast(`${indices.length} verse${indices.length > 1 ? 's' : ''} copied!`);
      setTimeout(() => setCopyToast(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyToast('Failed to copy');
      setTimeout(() => setCopyToast(null), 2000);
    }
  }, [results, formatVerseForCopy]);

  // Copy all verses
  const copyAllVerses = useCallback(() => {
    copyVerses(results.map((_, idx) => idx));
  }, [results, copyVerses]);

  // Copy selected verses
  const copySelectedVerses = useCallback(() => {
    copyVerses(Array.from(selectedVerses));
  }, [selectedVerses, copyVerses]);

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

        {/* Copy actions toolbar */}
        {!isLoading && results.length > 0 && (
          <div className="search-modal-toolbar">
            <div className="toolbar-left">
              <label className="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={selectedVerses.size === results.length && results.length > 0}
                  onChange={toggleSelectAll}
                />
                <span>Select All</span>
              </label>
              {selectedVerses.size > 0 && (
                <span className="selected-count">{selectedVerses.size} selected</span>
              )}
            </div>
            <div className="toolbar-right">
              {selectedVerses.size > 0 && (
                <button className="copy-btn copy-selected-btn" onClick={copySelectedVerses}>
                  Copy Selected ({selectedVerses.size})
                </button>
              )}
              <button className="copy-btn copy-all-btn" onClick={copyAllVerses}>
                Copy All
              </button>
            </div>
          </div>
        )}

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
                  className={`search-modal-result-item ${selectedVerses.has(idx) ? 'selected' : ''}`}
                  onClick={() => handleResultClick(result)}
                >
                  <div
                    className="result-item-checkbox"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVerseSelection(idx, e);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVerses.has(idx)}
                      readOnly
                    />
                  </div>
                  <div className="result-item-content">
                    <div className="result-item-reference">
                      {result.bookName} {result.chapterNum}:{result.verseNum}
                    </div>
                    <div className="result-item-text">
                      {highlightSearchTerms(result.text, query)}
                    </div>
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

        {/* Copy toast notification */}
        {copyToast && (
          <div className="copy-toast">
            {copyToast}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsModal;
