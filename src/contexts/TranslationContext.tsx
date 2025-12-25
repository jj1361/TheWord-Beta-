import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { TranslationId, TranslationMetadata, TRANSLATIONS, getTranslationById } from '../types/translation';

interface TranslationContextType {
  // Current translation
  currentTranslation: TranslationId;
  currentTranslationInfo: TranslationMetadata | undefined;

  // All available translations
  availableTranslations: TranslationMetadata[];

  // Set translation
  setTranslation: (translationId: TranslationId) => void;

  // Helper to check if current translation has Strong's numbers
  hasStrongsNumbers: boolean;

  // Helper to check if current translation has interlinear data
  hasInterlinear: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
  defaultTranslation?: TranslationId;
}

export function TranslationProvider({
  children,
  defaultTranslation = 'kjv'
}: TranslationProviderProps) {
  const [currentTranslation, setCurrentTranslation] = useState<TranslationId>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('bible-translation');
    if (saved && TRANSLATIONS.some(t => t.id === saved)) {
      return saved as TranslationId;
    }
    return defaultTranslation;
  });

  const setTranslation = useCallback((translationId: TranslationId) => {
    setCurrentTranslation(translationId);
    localStorage.setItem('bible-translation', translationId);
  }, []);

  const currentTranslationInfo = getTranslationById(currentTranslation);

  const value: TranslationContextType = {
    currentTranslation,
    currentTranslationInfo,
    availableTranslations: TRANSLATIONS,
    setTranslation,
    hasStrongsNumbers: currentTranslationInfo?.hasStrongsNumbers ?? false,
    hasInterlinear: currentTranslationInfo?.hasInterlinear ?? false,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation(): TranslationContextType {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

export { TranslationContext };
