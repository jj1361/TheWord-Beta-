import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import './TranslationSelector.css';

interface TranslationSelectorProps {
  className?: string;
}

const TranslationSelector: React.FC<TranslationSelectorProps> = ({ className = '' }) => {
  const { currentTranslation, currentTranslationInfo, availableTranslations, setTranslation } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (translationId: string) => {
    setTranslation(translationId as typeof currentTranslation);
    setIsOpen(false);
  };

  return (
    <div className={`translation-selector ${className}`} ref={dropdownRef}>
      <button
        className="translation-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Select Bible translation"
      >
        <span className="translation-abbrev">{currentTranslationInfo?.abbreviation || 'KJV'}</span>
        <span className="translation-dropdown-icon">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="translation-dropdown">
          <div className="translation-dropdown-header">
            Select Translation
          </div>
          {availableTranslations.map(translation => (
            <button
              key={translation.id}
              className={`translation-option ${translation.id === currentTranslation ? 'active' : ''}`}
              onClick={() => handleSelect(translation.id)}
            >
              <div className="translation-option-main">
                <span className="translation-option-abbrev">{translation.abbreviation}</span>
                <span className="translation-option-name">{translation.name}</span>
              </div>
              <div className="translation-option-meta">
                <span className="translation-option-language">{translation.language}</span>
                {translation.hasStrongsNumbers && (
                  <span className="translation-feature-badge" title="Has Strong's Numbers">H</span>
                )}
                {translation.hasInterlinear && (
                  <span className="translation-feature-badge" title="Has Interlinear">I</span>
                )}
              </div>
              {translation.id === currentTranslation && (
                <span className="translation-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranslationSelector;
