import React, { useState, useEffect, useCallback, useRef } from 'react';
import { parseScriptureReference, isScriptureReference } from '../utils/scriptureParser';
import { searchService, SearchResult, SearchResponse } from '../services/searchService';
import SearchResultsModal from './SearchResultsModal';
import './SearchBox.css';

interface SearchBoxProps {
  onSearch: (query: string) => Promise<SearchResponse>;
  onResultClick: (bookId: number, chapter: number, verse: number) => void;
  onWordSearch?: (strongsId: string) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch, onResultClick, onWordSearch }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [indexStatus, setIndexStatus] = useState<'indexing' | 'ready' | 'none'>('none');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modal state for "View All Results"
  const [showAllResultsModal, setShowAllResultsModal] = useState(false);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [allResultsQuery, setAllResultsQuery] = useState('');
  const [isLoadingAllResults, setIsLoadingAllResults] = useState(false);

  // Monitor search index status
  useEffect(() => {
    const checkIndexStatus = () => {
      if (searchService.isIndexReady()) {
        setIndexStatus('ready');
      } else if (searchService.isIndexing()) {
        setIndexStatus('indexing');
      } else {
        setIndexStatus('none');
      }
    };

    // Check immediately
    checkIndexStatus();

    // Check periodically while indexing
    const interval = setInterval(checkIndexStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotalCount(0);
      setHasMore(false);
      setShowResults(false);
      return;
    }

    // Check if the query is a scripture reference (e.g., "John 3:16", "Genesis 1")
    if (isScriptureReference(searchQuery)) {
      // Don't auto-search for scripture references, wait for user to submit
      return;
    }

    // Cancel previous search if still running
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

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer (300ms delay - responsive with optimized search)
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 300);
  };

  // Check if query is a Strong's ID (e.g., "H123", "G456", "123", "0123")
  const isStrongsId = (q: string): string | null => {
    const trimmed = q.trim();
    // Match patterns like: H123, G456, h123, g456, or just numbers like 123, 0123
    const match = trimmed.match(/^([HGhg])?(\d+)$/);
    if (match) {
      const prefix = match[1] ? match[1].toUpperCase() : '';
      const number = match[2];
      // If there's a prefix, return it with the number
      if (prefix) {
        return `${prefix}${number}`;
      }
      // If it's just a number, we'll need context to determine H or G
      // For now, return just the number and let the handler decide
      return number;
    }
    return null;
  };

  // Handle form submission (immediate search)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check if the query is a Strong's ID (e.g., "H123", "G456", "123")
    const strongsId = isStrongsId(query);
    if (strongsId && onWordSearch) {
      // Open word search modal
      onWordSearch(strongsId);
      setQuery('');
      setShowResults(false);
      return;
    }

    // Check if the query is a scripture reference (e.g., "John 3:16", "Genesis 1")
    if (isScriptureReference(query)) {
      const parsed = parseScriptureReference(query);
      if (parsed) {
        // Navigate directly to the scripture reference
        onResultClick(parsed.bookId, parsed.chapter, parsed.verse || 1);
        setQuery('');
        setShowResults(false);
        return;
      }
    }

    // Otherwise, perform immediate text search
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
      const allSearchResponse = await searchService.searchAll(query);
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
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result.bookId, result.chapterNum, result.verseNum);
    setShowResults(false);
    setQuery('');
    setResults([]);
  };

  // Highlight search terms in red
  const highlightText = (text: string, searchQuery: string) => {
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
        <mark key={i} className="highlight">
          {part}
        </mark>
      ) : (
        part
      );
    });
  };

  return (
    <div className="search-container">
      {indexStatus !== 'none' && (
        <div className={`search-status ${indexStatus === 'ready' ? 'search-status-ready' : ''}`}>
          {indexStatus === 'indexing' ? (
            <>
              <span>⚡</span>
              <span>Building search index...</span>
            </>
          ) : (
            <>
              <span>✓</span>
              <span>Fast search ready</span>
            </>
          )}
        </div>
      )}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search text, reference (John 3:16), or Strong's ID (H123, G456)..."
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={isSearching}>
            {isSearching ? '🔍 Searching...' : '🔍 Search'}
          </button>
        </div>
      </form>

      {showResults && (
        <div className="search-results">
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
              <>
                {results.map((result, idx) => (
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
                ))}
                {results.length > 0 && (
                  <button
                    className="view-all-results-btn"
                    onClick={handleViewAllResults}
                  >
                    View All {totalCount} Results
                  </button>
                )}
              </>
            ) : (
              !isSearching && (
                <div className="no-results">
                  No results found for "{query}"
                </div>
              )
            )}
          </div>
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

export default SearchBox;
