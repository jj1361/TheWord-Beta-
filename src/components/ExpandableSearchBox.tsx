import React, { useState, useEffect, useCallback, useRef } from 'react';
import { parseScriptureReference, isScriptureReference } from '../utils/scriptureParser';
import { searchService, SearchResult, SearchResponse } from '../services/searchService';
import { useTranslation } from '../contexts/TranslationContext';
import SearchResultsModal from './SearchResultsModal';
import './ExpandableSearchBox.css';

interface ExpandableSearchBoxProps {
  onSearch: (query: string) => Promise<SearchResponse>;
  onResultClick: (bookId: number, chapter: number, verse: number) => void;
  onWordSearch?: (strongsId: string) => void;
  voiceSearchQuery?: string | null;
  onVoiceSearchHandled?: () => void;
}

const ExpandableSearchBox: React.FC<ExpandableSearchBoxProps> = ({
  onSearch,
  onResultClick,
  onWordSearch,
  voiceSearchQuery,
  onVoiceSearchHandled
}) => {
  const { currentTranslation } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modal state for "View All Results"
  const [showAllResultsModal, setShowAllResultsModal] = useState(false);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [allResultsQuery, setAllResultsQuery] = useState('');
  const [isLoadingAllResults, setIsLoadingAllResults] = useState(false);

  // Handle voice search query
  useEffect(() => {
    if (voiceSearchQuery) {
      setIsExpanded(true);
      setQuery(voiceSearchQuery);
      setIsSearching(true);
      setShowResults(true);
      onSearch(voiceSearchQuery).then((searchResponse) => {
        setResults(searchResponse.results);
        setTotalCount(searchResponse.totalCount);
        setHasMore(searchResponse.hasMore);
        setIsSearching(false);
      }).catch((error) => {
        console.error('Voice search error:', error);
        setIsSearching(false);
      });
      onVoiceSearchHandled?.();
    }
  }, [voiceSearchQuery, onSearch, onVoiceSearchHandled]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!query.trim() && !showResults) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, showResults]);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotalCount(0);
      setHasMore(false);
      setShowResults(false);
      return;
    }

    if (isScriptureReference(searchQuery)) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const searchResponse = await onSearch(searchQuery);
      setResults(searchResponse.results);
      setTotalCount(searchResponse.totalCount);
      setHasMore(searchResponse.hasMore);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Search error:', error);
      }
    } finally {
      setIsSearching(false);
    }
  }, [onSearch]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 300);
  };

  // Check if query is a Strong's ID
  const isStrongsId = (q: string): string | null => {
    const trimmed = q.trim();
    const match = trimmed.match(/^([HGhg])?(\d+)$/);
    if (match) {
      const prefix = match[1] ? match[1].toUpperCase() : '';
      const number = match[2];
      if (prefix) {
        return `${prefix}${number}`;
      }
      return number;
    }
    return null;
  };

  // Handle form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const strongsId = isStrongsId(query);
    if (strongsId && onWordSearch) {
      onWordSearch(strongsId);
      setQuery('');
      setShowResults(false);
      setIsExpanded(false);
      return;
    }

    if (isScriptureReference(query)) {
      const parsed = parseScriptureReference(query);
      if (parsed) {
        onResultClick(parsed.bookId, parsed.chapter, parsed.verse || 1);
        setQuery('');
        setShowResults(false);
        setIsExpanded(false);
        return;
      }
    }

    setIsSearching(true);
    setShowResults(true);
    try {
      const searchResponse = await onSearch(query);
      setResults(searchResponse.results);
      setTotalCount(searchResponse.totalCount);
      setHasMore(searchResponse.hasMore);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle "View All Results" button click
  const handleViewAllResults = async () => {
    setAllResultsQuery(query);
    setShowAllResultsModal(true);
    setIsLoadingAllResults(true);
    setShowResults(false);

    try {
      const allSearchResponse = await searchService.searchAll(query, currentTranslation);
      setAllResults(allSearchResponse.results);
    } catch (error) {
      console.error('Error loading all results:', error);
    } finally {
      setIsLoadingAllResults(false);
    }
  };

  // Handle closing the all results modal
  const handleCloseAllResultsModal = () => {
    setShowAllResultsModal(false);
    setAllResults([]);
    setAllResultsQuery('');
  };

  // Handle result click from modal
  const handleModalResultClick = (bookId: number, chapter: number, verse: number) => {
    onResultClick(bookId, chapter, verse);
    setQuery('');
    setResults([]);
    setIsExpanded(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    const debounceTimer = debounceTimerRef.current;
    const abortController = abortControllerRef.current;
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result.bookId, result.chapterNum, result.verseNum);
    setShowResults(false);
    setQuery('');
    setResults([]);
    setIsExpanded(false);
  };

  const handleClose = () => {
    setShowResults(false);
    setQuery('');
    setResults([]);
    setIsExpanded(false);
  };

  // Highlight search terms
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const queryWords = searchQuery.trim().split(/\s+/).filter(w => w.length > 0);
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
        <mark key={i} className="highlight">
          {part}
        </mark>
      ) : (
        part
      );
    });
  };

  return (
    <div className={`expandable-search ${isExpanded ? 'expanded' : ''}`} ref={containerRef}>
      <form onSubmit={handleSearch} className="expandable-search-form">
        <button
          type="button"
          className="search-icon-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Close search" : "Open search"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search..."
          className="expandable-search-input"
        />
        {isExpanded && query && (
          <button
            type="button"
            className="clear-btn"
            onClick={handleClose}
            aria-label="Clear search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </form>

      {showResults && isExpanded && (
        <div className="expandable-search-results">
          <div className="results-header">
            <span className="results-count">
              {isSearching ? 'Searching...' : (
                hasMore
                  ? `Showing ${results.length} of ${totalCount} results`
                  : `${totalCount} result${totalCount !== 1 ? 's' : ''} found`
              )}
            </span>
            <button onClick={() => setShowResults(false)} className="close-results">
              ✕
            </button>
          </div>

          <div className="results-list">
            {results.length > 0 ? (
              results.map((result, idx) => (
                <div
                  key={idx}
                  className="result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="result-reference">
                    {result.bookName} {result.chapterNum}:{result.verseNum}
                  </div>
                  <div className="result-text">
                    {highlightText(result.text, query)}
                  </div>
                </div>
              ))
            ) : (
              !isSearching && (
                <div className="no-results">
                  No results found for "{query}"
                </div>
              )
            )}
          </div>

          {results.length > 0 && (
            <div className="results-footer">
              <button
                className="view-all-results-btn"
                onClick={handleViewAllResults}
              >
                View All {totalCount} Results
              </button>
            </div>
          )}
        </div>
      )}

      {/* All Results Modal */}
      <SearchResultsModal
        isOpen={showAllResultsModal}
        query={allResultsQuery}
        results={allResults}
        totalCount={totalCount}
        isLoading={isLoadingAllResults}
        onClose={handleCloseAllResultsModal}
        onResultClick={handleModalResultClick}
      />
    </div>
  );
};

export default ExpandableSearchBox;
