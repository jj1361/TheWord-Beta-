import React, { useState, useEffect, useCallback } from 'react';
import { LexiconData } from '../types/lexicon';
import { HebrewLetterInfo } from '../config/hebrewLetters';
import { strongsSearchService } from '../services/strongsSearchService';
import { crossRefService, CrossRefEntry, CrossReference } from '../services/crossRefService';
import { searchService } from '../services/searchService';
import { userCrossRefService } from '../services/userCrossRefService';
import { Note, Topic, VerseReference as NoteVerseReference } from '../types/notes';
import {
  CrossRefCategory,
  UserCrossReference,
  CrossRefDisplaySettings,
  CrossRefVerseReference,
  CATEGORY_COLORS,
} from '../types/crossRef';
import './RightPanel.css';

interface VerseReference {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  osisRef: string;
}

// Cross reference types
interface CrossRefVerseWithText extends CrossReference {
  text?: string;
  refKey: string;
}

interface CrossRefContext {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
}

interface RightPanelProps {
  lexiconContent: LexiconData | null;
  hebrewLetterContent: HebrewLetterInfo | null;
  onClose: () => void;
  onVerseClick?: (bookId: number, chapter: number, verse: number) => void;
  onStrongsClick?: (strongsNumber: string) => void;
  // Cross reference props
  crossRefContext?: CrossRefContext | null;
  notes?: Note[];
  topics?: Topic[];
  onEditNote?: (note: Note) => void;
  onDeleteNote?: (id: string) => void;
  onCreateNote?: (verseRef?: NoteVerseReference) => void;
  // Pre-populated cross reference target from context menu
  pendingCrossRefTarget?: string | null;
  onClearPendingCrossRefTarget?: () => void;
  // Text size prop (controlled from parent)
  textSize?: number;
}

/**
 * Parse text and convert Strong's numbers (H0001, G1234, H6872C, etc.) into clickable spans.
 * Returns HTML string that should be used with dangerouslySetInnerHTML.
 */
const parseStrongsReferences = (text: string, onStrongsClick?: (strongsNumber: string) => void): string => {
  if (!text || !onStrongsClick) return text;

  // Match Strong's numbers: H or G followed by digits, optionally followed by a letter suffix
  // Examples: H0001, G1234, H6872C, H7027G, H0001A
  const strongsPattern = /\b([HG]\d{1,5}[A-Z]?)\b/g;

  return text.replace(strongsPattern, (match, strongsNum) => {
    // Extract just the base Strong's number (remove suffix letters for lookup)
    const baseNum = strongsNum.replace(/[A-Z]$/, '');
    return `<span class="strongs-link" data-strongs="${baseNum}" title="Click to view ${baseNum}">${match}</span>`;
  });
};

type TabType = 'strongs' | 'stepbible' | 'bdb' | 'ahlb' | 'hebrew' | 'crossref';

// Interface for translation word with count
interface TranslationWord {
  word: string;
  count: number;
  verses: VerseReference[];
}

// Default text size if not provided
const DEFAULT_PANEL_TEXT_SIZE = 16;

const RightPanel: React.FC<RightPanelProps> = ({
  lexiconContent,
  hebrewLetterContent,
  onClose,
  onVerseClick,
  onStrongsClick,
  crossRefContext,
  notes = [],
  topics = [],
  onEditNote,
  onDeleteNote,
  onCreateNote,
  pendingCrossRefTarget,
  onClearPendingCrossRefTarget,
  textSize: textSizeProp,
}) => {
  // Use prop if provided, otherwise fallback to default
  const textSize = textSizeProp ?? DEFAULT_PANEL_TEXT_SIZE;
  // Handle clicks on Strong's number links
  const handleStrongsLinkClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('strongs-link') && onStrongsClick) {
      const strongsNum = target.getAttribute('data-strongs');
      if (strongsNum) {
        onStrongsClick(strongsNum);
      }
    }
  };
  // State for verse references (KJV usage)
  const [verseReferences, setVerseReferences] = useState<VerseReference[]>([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [showReferences, setShowReferences] = useState(false);

  // State for translation words with counts
  const [translationWords, setTranslationWords] = useState<TranslationWord[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(null);
  const [translationVerses, setTranslationVerses] = useState<VerseReference[]>([]);

  // Cross reference state
  const [crossRefs, setCrossRefs] = useState<CrossRefEntry[]>([]);
  const [crossRefLoading, setCrossRefLoading] = useState(false);
  const [selectedCrossRefTopic, setSelectedCrossRefTopic] = useState<number | null>(null);
  const [crossRefVerseTexts, setCrossRefVerseTexts] = useState<Map<string, string>>(new Map());
  const [displayedCrossRefs, setDisplayedCrossRefs] = useState<CrossRefVerseWithText[]>([]);
  const [selectedCrossRefVerses, setSelectedCrossRefVerses] = useState<Set<string>>(new Set());
  const [crossRefCopySuccess, setCrossRefCopySuccess] = useState(false);
  const [prevCrossRefContext, setPrevCrossRefContext] = useState<string | null>(null);

  // User cross reference state
  const [userCrossRefs, setUserCrossRefs] = useState<UserCrossReference[]>([]);
  const [crossRefCategories, setCrossRefCategories] = useState<CrossRefCategory[]>([]);
  const [displaySettings, setDisplaySettings] = useState<CrossRefDisplaySettings>(() => userCrossRefService.getDisplaySettings());
  const [selectedUserCategory, setSelectedUserCategory] = useState<string | null>(null);
  const [showAddCrossRefModal, setShowAddCrossRefModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CrossRefCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [addCrossRefTarget, setAddCrossRefTarget] = useState('');
  const [addCrossRefCategory, setAddCrossRefCategory] = useState<string>('');
  const [addCrossRefNote, setAddCrossRefNote] = useState('');
  const [addCrossRefWord, setAddCrossRefWord] = useState('');
  const [editingCrossRef, setEditingCrossRef] = useState<UserCrossReference | null>(null);
  const [userCrossRefVerseTexts, setUserCrossRefVerseTexts] = useState<Map<string, string>>(new Map());

  // Drag and drop state for user cross refs
  const [draggedCrossRefId, setDraggedCrossRefId] = useState<string | null>(null);
  const [dragOverCrossRefId, setDragOverCrossRefId] = useState<string | null>(null);

  // Selection state for user cross refs (for copy functionality)
  const [selectedUserCrossRefs, setSelectedUserCrossRefs] = useState<Set<string>>(new Set());
  const [userCrossRefCopySuccess, setUserCrossRefCopySuccess] = useState(false);

  // Determine initial tab based on which content is available
  // Default to Strong's if available, otherwise first available lexicon
  const getInitialTab = useCallback((): TabType => {
    if (crossRefContext) return 'crossref';
    if (lexiconContent) {
      // Always default to Strong's first
      if (lexiconContent.strongs) return 'strongs';
      if (lexiconContent.stepBible) return 'stepbible';
      if (lexiconContent.bdb) return 'bdb';
      if (lexiconContent.ahlb) return 'ahlb';
    }
    if (hebrewLetterContent) return 'hebrew';
    return 'strongs';
  }, [crossRefContext, lexiconContent, hebrewLetterContent]);

  const [activeTab, setActiveTab] = useState<TabType>('strongs');
  const [prevLexiconId, setPrevLexiconId] = useState<string | null>(null);
  const [prevHebrewLetter, setPrevHebrewLetter] = useState<string | null>(null);

  // Set initial tab on mount
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [getInitialTab]);

  // Separate effect to handle cross reference context changes
  // This ensures cross ref tab is shown immediately when crossRefContext is set
  useEffect(() => {
    if (crossRefContext) {
      const currentCrossRefKey = `${crossRefContext.bookId}:${crossRefContext.chapter}:${crossRefContext.verse}`;
      if (currentCrossRefKey !== prevCrossRefContext) {
        setActiveTab('crossref');
        setPrevCrossRefContext(currentCrossRefKey);
      }
    } else if (prevCrossRefContext) {
      // Cross ref was cleared, switch to available content
      setPrevCrossRefContext(null);
      if (lexiconContent) {
        setActiveTab(getInitialTab());
      } else if (hebrewLetterContent) {
        setActiveTab('hebrew');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crossRefContext]);

  // Update active tab when lexicon or hebrew content changes
  useEffect(() => {
    const currentLexiconId = lexiconContent?.strongs?.id || lexiconContent?.stepBible?.eStrong || null;
    const currentHebrewLetter = hebrewLetterContent?.letter || null;

    // Check if lexicon content changed (new Strong's number was clicked)
    const lexiconChanged = currentLexiconId && currentLexiconId !== prevLexiconId;

    // Check if Hebrew letter content changed (new letter was clicked)
    const hebrewChanged = currentHebrewLetter && currentHebrewLetter !== prevHebrewLetter;

    // Update active tab based on what changed (only if not showing cross refs)
    if (activeTab !== 'crossref') {
      if (lexiconChanged) {
        // Reset to Strong's tab when new word is clicked
        setActiveTab(getInitialTab());
        setPrevLexiconId(currentLexiconId);
      } else if (hebrewChanged) {
        setActiveTab('hebrew');
        setPrevHebrewLetter(currentHebrewLetter);
      }
    } else {
      // Still update prev values so changes are detected when switching back
      if (lexiconChanged) {
        setPrevLexiconId(currentLexiconId);
      }
      if (hebrewChanged) {
        setPrevHebrewLetter(currentHebrewLetter);
      }
    }

    // If one type of content is removed, switch to the other if available
    // But only switch if the current active tab is no longer valid
    if (!lexiconContent && !crossRefContext && hebrewLetterContent) {
      if (activeTab !== 'hebrew') {
        setActiveTab('hebrew');
      }
    } else if (!lexiconContent && !hebrewLetterContent && crossRefContext) {
      if (activeTab !== 'crossref') {
        setActiveTab('crossref');
      }
    } else if (lexiconContent && !hebrewLetterContent && !crossRefContext) {
      // Only reset if current tab is not a lexicon tab
      const lexiconTabs: TabType[] = ['strongs', 'stepbible', 'bdb', 'ahlb'];
      if (!lexiconTabs.includes(activeTab)) {
        setActiveTab(getInitialTab());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lexiconContent, hebrewLetterContent, crossRefContext, prevLexiconId, prevHebrewLetter, activeTab]);

  // Load verse references when Strong's number changes
  useEffect(() => {
    const strongsId = lexiconContent?.strongs?.id || lexiconContent?.stepBible?.eStrong;

    if (strongsId) {
      // Reset state when Strong's number changes
      setVerseReferences([]);
      setShowReferences(false);
      setTranslationWords([]);
      setSelectedTranslation(null);
      setTranslationVerses([]);
    }
  }, [lexiconContent?.strongs?.id, lexiconContent?.stepBible?.eStrong]);

  // Cross reference helper functions
  const getCrossRefsForTopic = useCallback((topicIndex: number, texts: Map<string, string>, entries: CrossRefEntry[]): CrossRefVerseWithText[] => {
    if (topicIndex < 0 || topicIndex >= entries.length) return [];

    const entry = entries[topicIndex];
    const refsWithText: CrossRefVerseWithText[] = entry.refs.map(ref => ({
      ...ref,
      refKey: `${ref.bookId}:${ref.chapter}:${ref.verse}`,
      text: texts.get(`${ref.bookId}:${ref.chapter}:${ref.verse}`)
    }));

    // Sort by book order
    refsWithText.sort((a, b) => {
      if (a.bookId !== b.bookId) return a.bookId - b.bookId;
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse - b.verse;
    });

    return refsWithText;
  }, []);

  const getAllCrossRefs = useCallback((entries: CrossRefEntry[]): CrossReference[] => {
    const seen = new Set<string>();
    const refs: CrossReference[] = [];

    for (const entry of entries) {
      for (const ref of entry.refs) {
        const key = `${ref.bookId}:${ref.chapter}:${ref.verse}`;
        if (!seen.has(key)) {
          seen.add(key);
          refs.push(ref);
        }
      }
    }

    return refs;
  }, []);

  // Load cross references when context changes
  useEffect(() => {
    const loadCrossRefs = async () => {
      if (!crossRefContext) {
        setCrossRefs([]);
        setDisplayedCrossRefs([]);
        return;
      }

      setCrossRefLoading(true);
      setSelectedCrossRefTopic(null);
      setDisplayedCrossRefs([]);
      setSelectedCrossRefVerses(new Set());

      try {
        const refs = await crossRefService.getCrossRefs(crossRefContext.bookId, crossRefContext.chapter, crossRefContext.verse);
        setCrossRefs(refs);

        // Load verse texts for all references
        const allRefs = getAllCrossRefs(refs);
        const texts = await searchService.getVerseTexts(allRefs);
        setCrossRefVerseTexts(texts);

        // Select first topic by default if available
        if (refs.length > 0) {
          setSelectedCrossRefTopic(0);
          setDisplayedCrossRefs(getCrossRefsForTopic(0, texts, refs));
        }
      } catch (error) {
        console.error('Error loading cross-references:', error);
        setCrossRefs([]);
      }
      setCrossRefLoading(false);
    };

    loadCrossRefs();
  }, [crossRefContext, getAllCrossRefs, getCrossRefsForTopic]);

  // Load user cross references and categories when context changes
  useEffect(() => {
    const loadUserCrossRefs = async () => {
      if (!crossRefContext) {
        setUserCrossRefs([]);
        return;
      }

      // Load categories
      const categories = userCrossRefService.getCategories();
      setCrossRefCategories(categories);

      // Load user cross refs for this verse
      const refs = userCrossRefService.getCrossRefsForVerse(
        crossRefContext.bookId,
        crossRefContext.chapter,
        crossRefContext.verse
      );
      setUserCrossRefs(refs);

      // Load verse texts for user cross refs (including verse ranges)
      if (refs.length > 0) {
        // Build list of all individual verses needed (expanding ranges)
        const allVerseRefs: Array<{ bookId: number; chapter: number; verse: number }> = [];
        const rangeMap = new Map<string, { start: number; end: number }>();

        for (const r of refs) {
          const refKey = `${r.targetVerse.bookId}:${r.targetVerse.chapter}:${r.targetVerse.verse}`;
          const startVerse = r.targetVerse.verse;
          const endVerse = r.targetVerse.verseEnd || r.targetVerse.verse;

          // Track the range for this reference
          if (endVerse > startVerse) {
            rangeMap.set(refKey, { start: startVerse, end: endVerse });
          }

          // Add all verses in the range
          for (let v = startVerse; v <= endVerse; v++) {
            allVerseRefs.push({
              bookId: r.targetVerse.bookId,
              chapter: r.targetVerse.chapter,
              verse: v,
            });
          }
        }

        // Fetch all verse texts
        const allTexts = await searchService.getVerseTexts(allVerseRefs);

        // Combine texts for ranges
        const combinedTexts = new Map<string, string>();
        for (const r of refs) {
          const refKey = `${r.targetVerse.bookId}:${r.targetVerse.chapter}:${r.targetVerse.verse}`;
          const range = rangeMap.get(refKey);

          if (range) {
            // Combine all verses in the range
            const rangeTexts: string[] = [];
            for (let v = range.start; v <= range.end; v++) {
              const verseKey = `${r.targetVerse.bookId}:${r.targetVerse.chapter}:${v}`;
              const text = allTexts.get(verseKey);
              if (text) {
                rangeTexts.push(`${v}. ${text}`);
              }
            }
            combinedTexts.set(refKey, rangeTexts.join(' '));
          } else {
            // Single verse
            const text = allTexts.get(refKey);
            if (text) {
              combinedTexts.set(refKey, text);
            }
          }
        }

        setUserCrossRefVerseTexts(combinedTexts);
      }
    };

    loadUserCrossRefs();
  }, [crossRefContext]);

  // Handle pending cross ref target from context menu
  useEffect(() => {
    if (pendingCrossRefTarget && crossRefContext) {
      setAddCrossRefTarget(pendingCrossRefTarget);
      setShowAddCrossRefModal(true);
      onClearPendingCrossRefTarget?.();
    }
  }, [pendingCrossRefTarget, crossRefContext, onClearPendingCrossRefTarget]);

  // Cross reference handlers
  const handleCrossRefTopicClick = (index: number) => {
    setSelectedCrossRefTopic(index);
    setDisplayedCrossRefs(getCrossRefsForTopic(index, crossRefVerseTexts, crossRefs));
    setSelectedCrossRefVerses(new Set());
  };

  const handleCrossRefNavigate = (ref: CrossReference) => {
    if (onVerseClick) {
      onVerseClick(ref.bookId, ref.chapter, ref.verse);
    }
  };

  const handleCrossRefSelectAll = () => {
    const allKeys = new Set(displayedCrossRefs.map(ref => ref.refKey));
    setSelectedCrossRefVerses(allKeys);
  };

  const handleCrossRefUnselectAll = () => {
    setSelectedCrossRefVerses(new Set());
  };

  const handleCrossRefCopy = async () => {
    const selectedRefs = displayedCrossRefs.filter(ref => selectedCrossRefVerses.has(ref.refKey));
    if (selectedRefs.length === 0) return;

    const textToCopy = selectedRefs
      .map(ref => `${crossRefService.formatReference(ref)}\n${ref.text || ''}`)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCrossRefCopySuccess(true);
      setTimeout(() => setCrossRefCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const totalCrossRefs = crossRefs.reduce((sum, entry) => sum + entry.refs.length, 0);
  const allCrossRefsSelected = displayedCrossRefs.length > 0 && selectedCrossRefVerses.size === displayedCrossRefs.length;

  // User cross reference handlers
  const handleDisplaySettingsChange = (key: keyof CrossRefDisplaySettings, value: boolean) => {
    const newSettings = { ...displaySettings, [key]: value };
    setDisplaySettings(newSettings);
    userCrossRefService.saveDisplaySettings(newSettings);
  };

  const handleOpenCategoryModal = (category?: CrossRefCategory) => {
    if (category) {
      setEditingCategory(category);
      setNewCategoryName(category.name);
      setNewCategoryColor(category.color);
      setNewCategoryDescription(category.description || '');
    } else {
      setEditingCategory(null);
      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
      setNewCategoryDescription('');
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) return;

    if (editingCategory) {
      userCrossRefService.updateCategory(editingCategory.id, {
        name: newCategoryName.trim(),
        color: newCategoryColor,
        description: newCategoryDescription.trim() || undefined,
      });
    } else {
      userCrossRefService.addCategory(
        newCategoryName.trim(),
        newCategoryColor,
        newCategoryDescription.trim() || undefined
      );
    }

    setCrossRefCategories(userCrossRefService.getCategories());
    setShowCategoryModal(false);
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor('#3b82f6');
    setNewCategoryDescription('');
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Delete this category? Cross references in this category will become uncategorized.')) {
      userCrossRefService.deleteCategory(categoryId);
      setCrossRefCategories(userCrossRefService.getCategories());
      if (selectedUserCategory === categoryId) {
        setSelectedUserCategory(null);
      }
    }
  };

  const parseVerseReference = (input: string): CrossRefVerseReference | null => {
    // Parse formats like "Genesis 1:1", "Gen 1:1", "1 John 3:16", etc.
    const pattern = /^(\d?\s*[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/;
    const match = input.trim().match(pattern);
    if (!match) return null;

    const bookNameMap: Record<string, { id: number; name: string }> = {
      'genesis': { id: 1, name: 'Genesis' }, 'gen': { id: 1, name: 'Genesis' },
      'exodus': { id: 2, name: 'Exodus' }, 'exo': { id: 2, name: 'Exodus' },
      'leviticus': { id: 3, name: 'Leviticus' }, 'lev': { id: 3, name: 'Leviticus' },
      'numbers': { id: 4, name: 'Numbers' }, 'num': { id: 4, name: 'Numbers' },
      'deuteronomy': { id: 5, name: 'Deuteronomy' }, 'deu': { id: 5, name: 'Deuteronomy' },
      'joshua': { id: 6, name: 'Joshua' }, 'jos': { id: 6, name: 'Joshua' },
      'judges': { id: 7, name: 'Judges' }, 'jdg': { id: 7, name: 'Judges' },
      'ruth': { id: 8, name: 'Ruth' }, 'rut': { id: 8, name: 'Ruth' },
      '1 samuel': { id: 9, name: '1 Samuel' }, '1sa': { id: 9, name: '1 Samuel' },
      '2 samuel': { id: 10, name: '2 Samuel' }, '2sa': { id: 10, name: '2 Samuel' },
      '1 kings': { id: 11, name: '1 Kings' }, '1ki': { id: 11, name: '1 Kings' },
      '2 kings': { id: 12, name: '2 Kings' }, '2ki': { id: 12, name: '2 Kings' },
      '1 chronicles': { id: 13, name: '1 Chronicles' }, '1ch': { id: 13, name: '1 Chronicles' },
      '2 chronicles': { id: 14, name: '2 Chronicles' }, '2ch': { id: 14, name: '2 Chronicles' },
      'ezra': { id: 15, name: 'Ezra' }, 'ezr': { id: 15, name: 'Ezra' },
      'nehemiah': { id: 16, name: 'Nehemiah' }, 'neh': { id: 16, name: 'Nehemiah' },
      'esther': { id: 17, name: 'Esther' }, 'est': { id: 17, name: 'Esther' },
      'job': { id: 18, name: 'Job' },
      'psalms': { id: 19, name: 'Psalms' }, 'psa': { id: 19, name: 'Psalms' }, 'psalm': { id: 19, name: 'Psalms' },
      'proverbs': { id: 20, name: 'Proverbs' }, 'pro': { id: 20, name: 'Proverbs' },
      'ecclesiastes': { id: 21, name: 'Ecclesiastes' }, 'ecc': { id: 21, name: 'Ecclesiastes' },
      'song of solomon': { id: 22, name: 'Song of Solomon' }, 'son': { id: 22, name: 'Song of Solomon' },
      'isaiah': { id: 23, name: 'Isaiah' }, 'isa': { id: 23, name: 'Isaiah' },
      'jeremiah': { id: 24, name: 'Jeremiah' }, 'jer': { id: 24, name: 'Jeremiah' },
      'lamentations': { id: 25, name: 'Lamentations' }, 'lam': { id: 25, name: 'Lamentations' },
      'ezekiel': { id: 26, name: 'Ezekiel' }, 'eze': { id: 26, name: 'Ezekiel' },
      'daniel': { id: 27, name: 'Daniel' }, 'dan': { id: 27, name: 'Daniel' },
      'hosea': { id: 28, name: 'Hosea' }, 'hos': { id: 28, name: 'Hosea' },
      'joel': { id: 29, name: 'Joel' }, 'joe': { id: 29, name: 'Joel' },
      'amos': { id: 30, name: 'Amos' }, 'amo': { id: 30, name: 'Amos' },
      'obadiah': { id: 31, name: 'Obadiah' }, 'oba': { id: 31, name: 'Obadiah' },
      'jonah': { id: 32, name: 'Jonah' }, 'jon': { id: 32, name: 'Jonah' },
      'micah': { id: 33, name: 'Micah' }, 'mic': { id: 33, name: 'Micah' },
      'nahum': { id: 34, name: 'Nahum' }, 'nah': { id: 34, name: 'Nahum' },
      'habakkuk': { id: 35, name: 'Habakkuk' }, 'hab': { id: 35, name: 'Habakkuk' },
      'zephaniah': { id: 36, name: 'Zephaniah' }, 'zep': { id: 36, name: 'Zephaniah' },
      'haggai': { id: 37, name: 'Haggai' }, 'hag': { id: 37, name: 'Haggai' },
      'zechariah': { id: 38, name: 'Zechariah' }, 'zec': { id: 38, name: 'Zechariah' },
      'malachi': { id: 39, name: 'Malachi' }, 'mal': { id: 39, name: 'Malachi' },
      'matthew': { id: 40, name: 'Matthew' }, 'mat': { id: 40, name: 'Matthew' },
      'mark': { id: 41, name: 'Mark' }, 'mar': { id: 41, name: 'Mark' },
      'luke': { id: 42, name: 'Luke' }, 'luk': { id: 42, name: 'Luke' },
      'john': { id: 43, name: 'John' }, 'joh': { id: 43, name: 'John' },
      'acts': { id: 44, name: 'Acts' }, 'act': { id: 44, name: 'Acts' },
      'romans': { id: 45, name: 'Romans' }, 'rom': { id: 45, name: 'Romans' },
      '1 corinthians': { id: 46, name: '1 Corinthians' }, '1co': { id: 46, name: '1 Corinthians' },
      '2 corinthians': { id: 47, name: '2 Corinthians' }, '2co': { id: 47, name: '2 Corinthians' },
      'galatians': { id: 48, name: 'Galatians' }, 'gal': { id: 48, name: 'Galatians' },
      'ephesians': { id: 49, name: 'Ephesians' }, 'eph': { id: 49, name: 'Ephesians' },
      'philippians': { id: 50, name: 'Philippians' }, 'php': { id: 50, name: 'Philippians' },
      'colossians': { id: 51, name: 'Colossians' }, 'col': { id: 51, name: 'Colossians' },
      '1 thessalonians': { id: 52, name: '1 Thessalonians' }, '1th': { id: 52, name: '1 Thessalonians' },
      '2 thessalonians': { id: 53, name: '2 Thessalonians' }, '2th': { id: 53, name: '2 Thessalonians' },
      '1 timothy': { id: 54, name: '1 Timothy' }, '1ti': { id: 54, name: '1 Timothy' },
      '2 timothy': { id: 55, name: '2 Timothy' }, '2ti': { id: 55, name: '2 Timothy' },
      'titus': { id: 56, name: 'Titus' }, 'tit': { id: 56, name: 'Titus' },
      'philemon': { id: 57, name: 'Philemon' }, 'phm': { id: 57, name: 'Philemon' },
      'hebrews': { id: 58, name: 'Hebrews' }, 'heb': { id: 58, name: 'Hebrews' },
      'james': { id: 59, name: 'James' }, 'jas': { id: 59, name: 'James' },
      '1 peter': { id: 60, name: '1 Peter' }, '1pe': { id: 60, name: '1 Peter' },
      '2 peter': { id: 61, name: '2 Peter' }, '2pe': { id: 61, name: '2 Peter' },
      '1 john': { id: 62, name: '1 John' }, '1jo': { id: 62, name: '1 John' },
      '2 john': { id: 63, name: '2 John' }, '2jo': { id: 63, name: '2 John' },
      '3 john': { id: 64, name: '3 John' }, '3jo': { id: 64, name: '3 John' },
      'jude': { id: 65, name: 'Jude' }, 'jud': { id: 65, name: 'Jude' },
      'revelation': { id: 66, name: 'Revelation' }, 'rev': { id: 66, name: 'Revelation' },
    };

    const bookInput = match[1].toLowerCase().trim();
    const book = bookNameMap[bookInput];
    if (!book) return null;

    return {
      bookId: book.id,
      bookName: book.name,
      chapter: parseInt(match[2], 10),
      verse: parseInt(match[3], 10),
      verseEnd: match[4] ? parseInt(match[4], 10) : undefined,
    };
  };

  const handleAddCrossRef = async () => {
    if (!crossRefContext || !addCrossRefTarget.trim()) return;

    const targetVerse = parseVerseReference(addCrossRefTarget);
    if (!targetVerse) {
      alert('Invalid verse reference. Use format like "Genesis 1:1" or "John 3:16"');
      return;
    }

    const sourceVerse: CrossRefVerseReference = {
      bookId: crossRefContext.bookId,
      bookName: crossRefContext.bookName,
      chapter: crossRefContext.chapter,
      verse: crossRefContext.verse,
    };

    userCrossRefService.addCrossRef(
      sourceVerse,
      targetVerse,
      addCrossRefCategory || undefined,
      addCrossRefWord.trim() || undefined,
      addCrossRefNote.trim() || undefined
    );

    // Reload user cross refs
    const refs = userCrossRefService.getCrossRefsForVerse(
      crossRefContext.bookId,
      crossRefContext.chapter,
      crossRefContext.verse
    );
    setUserCrossRefs(refs);

    // Load verse text(s) for the new cross ref (handle verse ranges)
    const startVerse = targetVerse.verse;
    const endVerse = targetVerse.verseEnd || targetVerse.verse;
    const refKey = `${targetVerse.bookId}:${targetVerse.chapter}:${targetVerse.verse}`;

    if (endVerse > startVerse) {
      // Verse range - fetch all verses and combine
      const allVerseRefs: Array<{ bookId: number; chapter: number; verse: number }> = [];
      for (let v = startVerse; v <= endVerse; v++) {
        allVerseRefs.push({
          bookId: targetVerse.bookId,
          chapter: targetVerse.chapter,
          verse: v,
        });
      }
      const allTexts = await searchService.getVerseTexts(allVerseRefs);

      // Combine verse texts with verse numbers
      const rangeTexts: string[] = [];
      for (let v = startVerse; v <= endVerse; v++) {
        const verseKey = `${targetVerse.bookId}:${targetVerse.chapter}:${v}`;
        const text = allTexts.get(verseKey);
        if (text) {
          rangeTexts.push(`${v}. ${text}`);
        }
      }

      setUserCrossRefVerseTexts(prev => {
        const merged = new Map(prev);
        merged.set(refKey, rangeTexts.join(' '));
        return merged;
      });
    } else {
      // Single verse
      const texts = await searchService.getVerseTexts([{
        bookId: targetVerse.bookId,
        chapter: targetVerse.chapter,
        verse: targetVerse.verse,
      }]);
      setUserCrossRefVerseTexts(prev => {
        const merged = new Map(prev);
        texts.forEach((value, key) => merged.set(key, value));
        return merged;
      });
    }

    // Reset form
    setShowAddCrossRefModal(false);
    setAddCrossRefTarget('');
    setAddCrossRefCategory('');
    setAddCrossRefNote('');
    setAddCrossRefWord('');
  };

  const handleDeleteUserCrossRef = (id: string) => {
    if (window.confirm('Delete this cross reference?')) {
      userCrossRefService.deleteCrossRef(id);
      if (crossRefContext) {
        const refs = userCrossRefService.getCrossRefsForVerse(
          crossRefContext.bookId,
          crossRefContext.chapter,
          crossRefContext.verse
        );
        setUserCrossRefs(refs);
      }
    }
  };

  const handleEditCrossRef = (ref: UserCrossReference) => {
    setEditingCrossRef(ref);
    setAddCrossRefTarget(userCrossRefService.formatVerseReference(ref.targetVerse));
    setAddCrossRefCategory(ref.categoryId || '');
    setAddCrossRefWord(ref.word || '');
    setAddCrossRefNote(ref.note || '');
    setShowAddCrossRefModal(true);
  };

  const handleSaveCrossRef = async () => {
    if (!crossRefContext) return;

    if (editingCrossRef) {
      // Update existing cross reference
      const targetVerse = parseVerseReference(addCrossRefTarget);
      if (!targetVerse) {
        alert('Invalid verse reference. Use format like "Genesis 1:1" or "John 3:16"');
        return;
      }

      userCrossRefService.updateCrossRef(editingCrossRef.id, {
        targetVerse,
        categoryId: addCrossRefCategory || undefined,
        word: addCrossRefWord.trim() || undefined,
        note: addCrossRefNote.trim() || undefined,
      });

      // Reload user cross refs
      const refs = userCrossRefService.getCrossRefsForVerse(
        crossRefContext.bookId,
        crossRefContext.chapter,
        crossRefContext.verse
      );
      setUserCrossRefs(refs);

      // Load verse text for the updated cross ref
      const texts = await searchService.getVerseTexts([{
        bookId: targetVerse.bookId,
        chapter: targetVerse.chapter,
        verse: targetVerse.verse,
      }]);
      setUserCrossRefVerseTexts(prev => {
        const merged = new Map(prev);
        texts.forEach((value, key) => merged.set(key, value));
        return merged;
      });

      // Reset form
      setShowAddCrossRefModal(false);
      setEditingCrossRef(null);
      setAddCrossRefTarget('');
      setAddCrossRefCategory('');
      setAddCrossRefNote('');
      setAddCrossRefWord('');
    } else {
      // Add new cross reference (use existing function)
      handleAddCrossRef();
    }
  };

  const handleCloseAddCrossRefModal = () => {
    setShowAddCrossRefModal(false);
    setEditingCrossRef(null);
    setAddCrossRefTarget('');
    setAddCrossRefCategory('');
    setAddCrossRefNote('');
    setAddCrossRefWord('');
  };

  const getCategoryById = (id: string) => crossRefCategories.find(c => c.id === id);

  // Drag and drop handlers for user cross refs
  const handleCrossRefDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedCrossRefId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Add a slight delay to allow the drag image to be captured
    setTimeout(() => {
      (e.target as HTMLElement).classList.add('dragging');
    }, 0);
  };

  const handleCrossRefDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).classList.remove('dragging');
    setDraggedCrossRefId(null);
    setDragOverCrossRefId(null);
  };

  const handleCrossRefDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedCrossRefId) {
      setDragOverCrossRefId(id);
    }
  };

  const handleCrossRefDragLeave = () => {
    setDragOverCrossRefId(null);
  };

  const handleCrossRefDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();

    if (!draggedCrossRefId || draggedCrossRefId === targetId) {
      setDraggedCrossRefId(null);
      setDragOverCrossRefId(null);
      return;
    }

    // Reorder the cross refs
    const currentRefs = [...filteredUserCrossRefs];
    const draggedIndex = currentRefs.findIndex(r => r.id === draggedCrossRefId);
    const targetIndex = currentRefs.findIndex(r => r.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedCrossRefId(null);
      setDragOverCrossRefId(null);
      return;
    }

    // Remove dragged item and insert at new position
    const [draggedItem] = currentRefs.splice(draggedIndex, 1);
    currentRefs.splice(targetIndex, 0, draggedItem);

    // Get the new order of IDs and persist
    const newOrder = currentRefs.map(r => r.id);
    const verseKey = crossRefContext
      ? `${crossRefContext.bookId}:${crossRefContext.chapter}:${crossRefContext.verse}`
      : '';
    userCrossRefService.reorderCrossRefs(verseKey, newOrder);

    // Reload cross refs to reflect new order
    if (crossRefContext) {
      const refs = userCrossRefService.getCrossRefsForVerse(
        crossRefContext.bookId,
        crossRefContext.chapter,
        crossRefContext.verse
      );
      setUserCrossRefs(refs);
    }

    setDraggedCrossRefId(null);
    setDragOverCrossRefId(null);
  };

  // Filter user cross refs by selected category
  const filteredUserCrossRefs = selectedUserCategory
    ? userCrossRefs.filter(r => r.categoryId === selectedUserCategory)
    : userCrossRefs;

  // User cross reference selection and copy handlers
  const handleUserCrossRefSelectAll = () => {
    const allIds = new Set(filteredUserCrossRefs.map(ref => ref.id));
    setSelectedUserCrossRefs(allIds);
  };

  const handleUserCrossRefUnselectAll = () => {
    setSelectedUserCrossRefs(new Set());
  };

  const handleUserCrossRefCopy = async () => {
    const selectedRefs = filteredUserCrossRefs.filter(ref => selectedUserCrossRefs.has(ref.id));
    if (selectedRefs.length === 0) return;

    const textToCopy = selectedRefs
      .map(ref => {
        const refKey = `${ref.targetVerse.bookId}:${ref.targetVerse.chapter}:${ref.targetVerse.verse}`;
        const verseText = userCrossRefVerseTexts.get(refKey) || '';
        return `${userCrossRefService.formatVerseReference(ref.targetVerse)}\n${verseText}`;
      })
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      setUserCrossRefCopySuccess(true);
      setTimeout(() => setUserCrossRefCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const allUserCrossRefsSelected = filteredUserCrossRefs.length > 0 && selectedUserCrossRefs.size === filteredUserCrossRefs.length;

  // Filter notes for current cross reference verse
  const crossRefVerseNotes = crossRefContext ? notes.filter(note =>
    note.verses?.some(v =>
      v.bookId === crossRefContext.bookId &&
      v.chapter === crossRefContext.chapter &&
      v.startVerse <= crossRefContext.verse &&
      (v.endVerse || v.startVerse) >= crossRefContext.verse
    )
  ) : [];

  const getTopicById = (id: string) => topics.find(t => t.id === id);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Parse kjv_def into individual translation words
  const parseKjvDef = (kjvDef: string): string[] => {
    // Split by comma and clean up each word
    return kjvDef
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0);
  };

  // Count occurrences of each translation word in the verse references
  const countTranslationOccurrences = (verses: VerseReference[], translations: string[]): TranslationWord[] => {
    const results: TranslationWord[] = [];

    for (const translation of translations) {
      // Clean up the translation for matching (remove parenthetical variations)
      const baseWord = translation.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      const matchingVerses: VerseReference[] = [];

      for (const verse of verses) {
        const verseTextLower = verse.text.toLowerCase();
        // Check if any form of the word appears in the verse
        if (verseTextLower.includes(baseWord)) {
          matchingVerses.push(verse);
        }
      }

      results.push({
        word: translation,
        count: matchingVerses.length,
        verses: matchingVerses
      });
    }

    return results;
  };

  // Function to load verse references on demand
  const loadVerseReferences = async () => {
    const strongsId = lexiconContent?.strongs?.id || lexiconContent?.stepBible?.eStrong;
    if (!strongsId || loadingReferences) return;

    setLoadingReferences(true);
    try {
      const references = await strongsSearchService.searchByStrongsId(strongsId);
      setVerseReferences(references);

      // Parse KJV translations and count occurrences
      const kjvDef = lexiconContent?.strongs?.kjv_def || lexiconContent?.strongs?.usage || '';
      if (kjvDef) {
        const translations = parseKjvDef(kjvDef);
        const translationsWithCounts = countTranslationOccurrences(references, translations);
        setTranslationWords(translationsWithCounts);
      }

      setShowReferences(true);
    } catch (error) {
      console.error('Error loading verse references:', error);
    } finally {
      setLoadingReferences(false);
    }
  };

  // Handle clicking on a translation word
  const handleTranslationClick = (translationWord: TranslationWord) => {
    if (selectedTranslation === translationWord.word) {
      // Toggle off if already selected
      setSelectedTranslation(null);
      setTranslationVerses([]);
    } else {
      setSelectedTranslation(translationWord.word);
      setTranslationVerses(translationWord.verses);
    }
  };

  // Handle clicking on a verse reference
  const handleVerseReferenceClick = (ref: VerseReference) => {
    if (onVerseClick) {
      onVerseClick(ref.bookId, ref.chapter, ref.verse);
    }
  };

  // If no content is available, don't render
  if (!lexiconContent && !hebrewLetterContent && !crossRefContext) {
    return null;
  }

  return (
    <div className="right-panel" style={{ '--panel-text-size': `${textSize}px` } as React.CSSProperties}>
      <div className="right-panel-header">
        {/* Back button for mobile fullscreen - calls onClose to return to verse */}
        <button className="right-panel-back-btn" onClick={onClose} title="Back to verse">
          ←
        </button>
        <div className="right-panel-tabs">
          {lexiconContent?.strongs && (
            <button
              className={`right-panel-tab ${activeTab === 'strongs' ? 'active' : ''}`}
              onClick={() => setActiveTab('strongs')}
            >
              📖 Strong's
            </button>
          )}
          {lexiconContent?.stepBible && (
            <button
              className={`right-panel-tab ${activeTab === 'stepbible' ? 'active' : ''}`}
              onClick={() => setActiveTab('stepbible')}
            >
              📚 STEP Bible
            </button>
          )}
          {lexiconContent?.bdb && (
            <button
              className={`right-panel-tab ${activeTab === 'bdb' ? 'active' : ''}`}
              onClick={() => setActiveTab('bdb')}
            >
              📕 BDB
            </button>
          )}
          {lexiconContent?.ahlb && (
            <button
              className={`right-panel-tab ${activeTab === 'ahlb' ? 'active' : ''}`}
              onClick={() => setActiveTab('ahlb')}
            >
              📜 AHLB
            </button>
          )}
          {hebrewLetterContent && (
            <button
              className={`right-panel-tab ${activeTab === 'hebrew' ? 'active' : ''}`}
              onClick={() => setActiveTab('hebrew')}
            >
              🔤 Hebrew Letter
            </button>
          )}
          {crossRefContext && (
            <button
              className={`right-panel-tab ${activeTab === 'crossref' ? 'active' : ''}`}
              onClick={() => setActiveTab('crossref')}
            >
              🔗 Cross Refs
            </button>
          )}
        </div>
        <button className="right-panel-close" onClick={onClose} title="Close Panel">
          ✕
        </button>
      </div>

      <div className="right-panel-content">
        {/* Strong's Lexicon Tab */}
        {activeTab === 'strongs' && lexiconContent?.strongs && (
          <div className="lexicon-panel">
            <div className="lexicon-header">
              <h2 className="lexicon-word">{lexiconContent.strongs.lemma || lexiconContent.strongs.word}</h2>
              <div className="lexicon-strongs">Strong's #{lexiconContent.strongs.id}</div>
            </div>

            {(lexiconContent.strongs.pron || lexiconContent.strongs.pronunciation) && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Pronunciation</h3>
                <p className="lexicon-pronunciation">{lexiconContent.strongs.pron || lexiconContent.strongs.pronunciation}</p>
              </div>
            )}

            {(lexiconContent.strongs.xlit || lexiconContent.strongs.translit || lexiconContent.strongs.transliteration) && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Transliteration</h3>
                <p className="lexicon-pronunciation">{lexiconContent.strongs.xlit || lexiconContent.strongs.translit || lexiconContent.strongs.transliteration}</p>
              </div>
            )}

            {(lexiconContent.strongs.strongs_def || lexiconContent.strongs.meaning) && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Definition</h3>
                <div className="lexicon-definition" onClick={handleStrongsLinkClick}>
                  {(lexiconContent.strongs.strongs_def || lexiconContent.strongs.meaning).split('\n').map((line: string, idx: number) => (
                    <p key={idx} dangerouslySetInnerHTML={{ __html: parseStrongsReferences(line.trim(), onStrongsClick) }} />
                  ))}
                </div>
              </div>
            )}

            {(lexiconContent.strongs.kjv_def || lexiconContent.strongs.usage) && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">
                  KJV Usage
                  {verseReferences.length > 0 && (
                    <span className="usage-count">({verseReferences.length} total occurrences)</span>
                  )}
                </h3>

                {/* Translation words with counts */}
                <div className="translation-words-container">
                  {!showReferences && !loadingReferences && (
                    <>
                      <div className="lexicon-definition">
                        {(lexiconContent.strongs.kjv_def || lexiconContent.strongs.usage).split('\n').map((line: string, idx: number) => (
                          <p key={idx}>{line.trim()}</p>
                        ))}
                      </div>
                      <button
                        className="show-references-btn"
                        onClick={loadVerseReferences}
                      >
                        Load Usage Counts & References
                      </button>
                    </>
                  )}

                  {loadingReferences && (
                    <div className="references-loading">
                      Loading scripture references...
                    </div>
                  )}

                  {showReferences && translationWords.length > 0 && (
                    <div className="translation-words-list">
                      {translationWords.map((tw, idx) => (
                        <span
                          key={idx}
                          className={`translation-word-item ${selectedTranslation === tw.word ? 'selected' : ''} ${tw.count > 0 ? 'clickable' : ''}`}
                          onClick={() => tw.count > 0 && handleTranslationClick(tw)}
                          title={tw.count > 0 ? `Click to see ${tw.count} verse(s)` : 'No matches found'}
                        >
                          {tw.word}
                          <span className="translation-count">({tw.count}x)</span>
                          {idx < translationWords.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scripture References for selected translation */}
                {selectedTranslation && translationVerses.length > 0 && (
                  <div className="scripture-references-section">
                    <div className="references-container">
                      <div className="references-header">
                        <span className="references-count">
                          "{selectedTranslation}" - {translationVerses.length} verse{translationVerses.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          className="hide-references-btn"
                          onClick={() => {
                            setSelectedTranslation(null);
                            setTranslationVerses([]);
                          }}
                        >
                          Close
                        </button>
                      </div>
                      <div className="references-list">
                        {translationVerses.map((ref, idx) => (
                          <div
                            key={idx}
                            className="reference-item"
                            onClick={() => handleVerseReferenceClick(ref)}
                          >
                            <span className="reference-location">
                              {ref.bookName} {ref.chapter}:{ref.verse}
                            </span>
                            <span className="reference-text">
                              {ref.text.length > 80 ? ref.text.substring(0, 80) + '...' : ref.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Show all references button when translations are loaded */}
                {showReferences && verseReferences.length > 0 && !selectedTranslation && (
                  <div className="scripture-references-section">
                    <button
                      className="show-all-references-btn"
                      onClick={() => {
                        setSelectedTranslation('__all__');
                        setTranslationVerses(verseReferences);
                      }}
                    >
                      Show All {verseReferences.length} References
                    </button>
                  </div>
                )}
              </div>
            )}

            {(lexiconContent.strongs.derivation || lexiconContent.strongs.source) && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Derivation</h3>
                <p
                  className="lexicon-derivation"
                  onClick={handleStrongsLinkClick}
                  dangerouslySetInnerHTML={{ __html: parseStrongsReferences(lexiconContent.strongs.derivation || lexiconContent.strongs.source || '', onStrongsClick) }}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP Bible Tab */}
        {activeTab === 'stepbible' && lexiconContent?.stepBible && (
          <div className="lexicon-panel">
            <div className="lexicon-header">
              <h2 className="lexicon-word">{lexiconContent.stepBible.word}</h2>
              <div className="lexicon-strongs">Strong's {lexiconContent.stepBible.eStrong}</div>
            </div>

            {lexiconContent.stepBible.transliteration && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Transliteration</h3>
                <p className="lexicon-pronunciation">{lexiconContent.stepBible.transliteration}</p>
              </div>
            )}

            {lexiconContent.stepBible.gloss && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Gloss</h3>
                <p className="lexicon-gloss">"{lexiconContent.stepBible.gloss}"</p>
              </div>
            )}

            {lexiconContent.stepBible.morph && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Grammar</h3>
                <p className="lexicon-pronunciation">{lexiconContent.stepBible.morph}</p>
              </div>
            )}

            {lexiconContent.stepBible.meaning && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Definition</h3>
                <div
                  className="lexicon-definition stepbible-definition-content"
                  onClick={handleStrongsLinkClick}
                  dangerouslySetInnerHTML={{ __html: parseStrongsReferences(lexiconContent.stepBible.meaning, onStrongsClick) }}
                />
              </div>
            )}

            <div className="lexicon-attribution">
              <small>
                Data from <a href="https://www.STEPBible.org" target="_blank" rel="noopener noreferrer">STEP Bible</a> (CC BY 4.0)
              </small>
            </div>
          </div>
        )}

        {/* BDB Tab */}
        {activeTab === 'bdb' && lexiconContent?.bdb && (
          <div className="lexicon-panel">
            <div className="lexicon-header">
              <h2 className="lexicon-word">{lexiconContent.bdb.word}</h2>
              <div className="lexicon-strongs">BDB #{lexiconContent.bdb.id}</div>
            </div>

            <div className="lexicon-section">
              <h3 className="lexicon-section-title">Part of Speech</h3>
              <p className="lexicon-pronunciation">{lexiconContent.bdb.partOfSpeech}</p>
            </div>

            <div className="lexicon-section">
              <h3 className="lexicon-section-title">Definition</h3>
              <div className="lexicon-definition" onClick={handleStrongsLinkClick}>
                <p dangerouslySetInnerHTML={{ __html: parseStrongsReferences(lexiconContent.bdb.definition, onStrongsClick) }} />
              </div>
            </div>
          </div>
        )}

        {/* AHLB Tab */}
        {activeTab === 'ahlb' && lexiconContent?.ahlb && (
          <div className="lexicon-panel">
            <div className="lexicon-divider">
              <h3>📜 Ancient Hebrew Lexicon</h3>
            </div>

            <div className="lexicon-section ahlb-section">
              <h3 className="lexicon-section-title">Pictographic Meaning</h3>
              <p className="ahlb-translation">{lexiconContent.ahlb.translation}</p>
            </div>

            {lexiconContent.ahlb.transliteration && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Transliteration</h3>
                <p className="lexicon-pronunciation">{lexiconContent.ahlb.transliteration}</p>
              </div>
            )}

            {lexiconContent.ahlb.wordType && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Word Type</h3>
                <p className="lexicon-pronunciation">{lexiconContent.ahlb.wordType}</p>
              </div>
            )}

            {lexiconContent.ahlb.definition && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Definition</h3>
                <div className="lexicon-definition ahlb-definition">
                  <p>{lexiconContent.ahlb.definition}</p>
                </div>
              </div>
            )}

            {lexiconContent.ahlb.relationship && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">Relationship to Root</h3>
                <div className="lexicon-definition ahlb-relationship">
                  <p>{lexiconContent.ahlb.relationship}</p>
                </div>
              </div>
            )}

            {lexiconContent.ahlb.kjvTranslations && (
              <div className="lexicon-section">
                <h3 className="lexicon-section-title">KJV Translations</h3>
                <p className="lexicon-pronunciation">{lexiconContent.ahlb.kjvTranslations}</p>
              </div>
            )}

            <div className="lexicon-attribution">
              <small>
                Data from <a href="https://www.ancient-hebrew.org" target="_blank" rel="noopener noreferrer">Ancient Hebrew Research Center</a>
              </small>
            </div>
          </div>
        )}

        {activeTab === 'hebrew' && hebrewLetterContent && (
          <div className="hebrew-letter-panel">
            <div className="hebrew-letter-header">
              <div className="hebrew-letter-display">
                <div className="hebrew-letter-modern">{hebrewLetterContent.letter}</div>
                <div className="hebrew-letter-ancient">{hebrewLetterContent.ancientScript}</div>
              </div>
              <div className="hebrew-letter-info">
                <h2 className="hebrew-letter-name">{hebrewLetterContent.name}</h2>
                <p className="hebrew-letter-pronunciation">
                  Pronounced: <em>{hebrewLetterContent.transliteration}</em>
                </p>
              </div>
            </div>

            <div className="hebrew-letter-section">
              <h3 className="hebrew-section-title">Meaning</h3>
              <p className="hebrew-letter-meaning">{hebrewLetterContent.meaning}</p>
            </div>

            <div className="hebrew-letter-section">
              <h3 className="hebrew-section-title">Definition</h3>
              <p className="hebrew-letter-meaning">{hebrewLetterContent.definition}</p>
            </div>

            <div className="hebrew-letter-section">
              <h3 className="hebrew-section-title">Numerical Value</h3>
              <p className="hebrew-letter-value">{hebrewLetterContent.number}</p>
            </div>

            <div className="hebrew-letter-section">
              <h3 className="hebrew-section-title">Scripts</h3>
              <div className="hebrew-scripts-comparison">
                <div className="script-item">
                  <span className="script-label">Modern Hebrew:</span>
                  <span className="script-display modern">{hebrewLetterContent.letter}</span>
                </div>
                <div className="script-item">
                  <span className="script-label">Proto-Sinaitic:</span>
                  <span className="script-display ancient">{hebrewLetterContent.ancientScript}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cross References Tab */}
        {activeTab === 'crossref' && crossRefContext && (
          <div className="cross-ref-tab-content cross-ref-redesign">
            {/* Header */}
            <div className="cross-ref-header-new">
              <span className="cross-ref-label">CROSS REFERENCES</span>
              <h2
                className="cross-ref-verse-title"
                onClick={() => onVerseClick?.(crossRefContext.bookId, crossRefContext.chapter, crossRefContext.verse)}
                title="Go to this verse"
              >
                {crossRefContext.bookName} {crossRefContext.chapter}:{crossRefContext.verse}
              </h2>
            </div>

            {/* Tabs */}
            <div className="cross-ref-tabs-new">
              <button
                className={`cross-ref-tab-new ${displaySettings.showUserRefs && !displaySettings.showTSK ? 'active' : ''}`}
                onClick={() => {
                  const newSettings = { ...displaySettings, showTSK: false, showUserRefs: true };
                  setDisplaySettings(newSettings);
                  userCrossRefService.saveDisplaySettings(newSettings);
                }}
              >
                My References
                <span className="cross-ref-tab-count-new">{userCrossRefs.length}</span>
              </button>
              <button
                className={`cross-ref-tab-new ${displaySettings.showTSK && !displaySettings.showUserRefs ? 'active' : ''}`}
                onClick={() => {
                  const newSettings = { ...displaySettings, showTSK: true, showUserRefs: false };
                  setDisplaySettings(newSettings);
                  userCrossRefService.saveDisplaySettings(newSettings);
                }}
              >
                Treasury of Scripture
                <span className="cross-ref-tab-count-new">{totalCrossRefs}</span>
              </button>
            </div>

            <div className="cross-ref-content">
              {/* TSK Cross References Section */}
              {displaySettings.showTSK && (
                <>
                  {crossRefLoading ? (
                    <div className="cross-ref-loading">Loading cross-references...</div>
                  ) : crossRefs.length === 0 ? (
                    <div className="cross-ref-empty">
                      <p>No cross-references found for this verse.</p>
                    </div>
                  ) : (
                    <>
                      {/* Filter by Phrase */}
                      <div className="cross-ref-filter-section">
                        <span className="cross-ref-filter-label">FILTER BY PHRASE</span>
                        <div className="cross-ref-filters">
                          <button
                            className={`cross-ref-filter-btn ${selectedCrossRefTopic === null ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedCrossRefTopic(null);
                              // Show all refs when "All" is selected
                              const allRefsWithText: CrossRefVerseWithText[] = [];
                              const seen = new Set<string>();
                              for (const entry of crossRefs) {
                                for (const ref of entry.refs) {
                                  const key = `${ref.bookId}:${ref.chapter}:${ref.verse}`;
                                  if (!seen.has(key)) {
                                    seen.add(key);
                                    allRefsWithText.push({
                                      ...ref,
                                      refKey: key,
                                      text: crossRefVerseTexts.get(key)
                                    });
                                  }
                                }
                              }
                              allRefsWithText.sort((a, b) => {
                                if (a.bookId !== b.bookId) return a.bookId - b.bookId;
                                if (a.chapter !== b.chapter) return a.chapter - b.chapter;
                                return a.verse - b.verse;
                              });
                              setDisplayedCrossRefs(allRefsWithText);
                              setSelectedCrossRefVerses(new Set());
                            }}
                          >
                            All
                          </button>
                          {crossRefs.map((entry, index) => (
                            <button
                              key={index}
                              className={`cross-ref-filter-btn ${selectedCrossRefTopic === index ? 'active' : ''}`}
                              onClick={() => handleCrossRefTopicClick(index)}
                            >
                              {entry.word || `Topic ${index + 1}`}
                              <span className="filter-count">{entry.refs.length}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Verses List */}
                      <div className="cross-ref-verses-list-new">
                        {displayedCrossRefs.length === 0 ? (
                          <div className="cross-ref-empty-topic">
                            <p>Select a filter above to view scriptures</p>
                          </div>
                        ) : (
                          displayedCrossRefs.map((ref, index) => (
                            <div
                              key={index}
                              className={`cross-ref-verse-item-new ${selectedCrossRefVerses.has(ref.refKey) ? 'selected' : ''}`}
                            >
                              <label
                                className="cross-ref-checkbox-wrapper"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCrossRefVerses.has(ref.refKey)}
                                  onChange={(e) => {
                                    setSelectedCrossRefVerses(prev => {
                                      const newSet = new Set(prev);
                                      if (e.target.checked) {
                                        newSet.add(ref.refKey);
                                      } else {
                                        newSet.delete(ref.refKey);
                                      }
                                      return newSet;
                                    });
                                  }}
                                />
                              </label>
                              <div
                                className="cross-ref-verse-content-new"
                                onClick={() => handleCrossRefNavigate(ref)}
                              >
                                <div className="cross-ref-verse-ref-new">
                                  {crossRefService.formatReference(ref)}
                                </div>
                                <div className="cross-ref-verse-text-new">
                                  {ref.text || 'Loading...'}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      <div className="cross-ref-footer-new">
                        <span className="cross-ref-footer-hint">Click verses to select</span>
                        <button
                          className={`cross-ref-copy-btn-new ${crossRefCopySuccess ? 'success' : ''}`}
                          onClick={handleCrossRefCopy}
                          disabled={selectedCrossRefVerses.size === 0}
                        >
                          {crossRefCopySuccess ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* User Cross References Section */}
              {displaySettings.showUserRefs && (
                <div className="user-cross-refs-section">
                  <div className="cross-ref-section-header">
                    <span>My Cross References</span>
                    <div className="cross-ref-header-actions">
                      <button
                        className="add-crossref-btn"
                        onClick={() => setShowAddCrossRefModal(true)}
                        title="Add cross reference"
                      >
                        + Reference
                      </button>
                      <button
                        className="manage-categories-btn"
                        onClick={() => handleOpenCategoryModal()}
                        title="Manage categories"
                      >
                        + Category
                      </button>
                    </div>
                  </div>

                  {/* Category Filter */}
                  {crossRefCategories.length > 0 && (
                    <div className="user-cross-ref-categories">
                      <button
                        className={`user-category-btn ${selectedUserCategory === null ? 'selected' : ''}`}
                        onClick={() => setSelectedUserCategory(null)}
                      >
                        All
                      </button>
                      {crossRefCategories.map(category => (
                        <button
                          key={category.id}
                          className={`user-category-btn ${selectedUserCategory === category.id ? 'selected' : ''}`}
                          onClick={() => setSelectedUserCategory(category.id)}
                          style={{
                            '--category-color': category.color,
                            borderColor: selectedUserCategory === category.id ? category.color : 'transparent',
                          } as React.CSSProperties}
                        >
                          <span
                            className="category-color-dot"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* User Cross Refs List */}
                  {filteredUserCrossRefs.length === 0 ? (
                    <div className="user-cross-refs-empty">
                      <p>No custom cross references yet.</p>
                      <button
                        className="add-first-crossref-btn"
                        onClick={() => setShowAddCrossRefModal(true)}
                      >
                        Add your first cross reference
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Selection Controls */}
                      <div className="user-cross-ref-selection-controls">
                        <div className="selection-actions">
                          {allUserCrossRefsSelected ? (
                            <button
                              className="select-action-btn"
                              onClick={handleUserCrossRefUnselectAll}
                            >
                              Unselect All
                            </button>
                          ) : (
                            <button
                              className="select-action-btn"
                              onClick={handleUserCrossRefSelectAll}
                            >
                              Select All
                            </button>
                          )}
                          {selectedUserCrossRefs.size > 0 && (
                            <span className="selection-count">
                              {selectedUserCrossRefs.size} selected
                            </span>
                          )}
                        </div>
                        {selectedUserCrossRefs.size > 0 && (
                          <button
                            className={`copy-selected-btn ${userCrossRefCopySuccess ? 'success' : ''}`}
                            onClick={handleUserCrossRefCopy}
                          >
                            {userCrossRefCopySuccess ? 'Copied!' : 'Copy Selected'}
                          </button>
                        )}
                      </div>

                      <div className="user-cross-refs-list">
                        {filteredUserCrossRefs.map(ref => {
                          const category = ref.categoryId ? getCategoryById(ref.categoryId) : null;
                          const refKey = `${ref.targetVerse.bookId}:${ref.targetVerse.chapter}:${ref.targetVerse.verse}`;
                          const verseText = userCrossRefVerseTexts.get(refKey);
                          const isDragging = draggedCrossRefId === ref.id;
                          const isDragOver = dragOverCrossRefId === ref.id;
                          const isSelected = selectedUserCrossRefs.has(ref.id);

                          return (
                            <div
                              key={ref.id}
                              className={`user-cross-ref-item ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''} ${isSelected ? 'selected' : ''}`}
                              draggable
                              onDragStart={(e) => handleCrossRefDragStart(e, ref.id)}
                              onDragEnd={handleCrossRefDragEnd}
                              onDragOver={(e) => handleCrossRefDragOver(e, ref.id)}
                              onDragLeave={handleCrossRefDragLeave}
                              onDrop={(e) => handleCrossRefDrop(e, ref.id)}
                              onClick={() => onVerseClick?.(ref.targetVerse.bookId, ref.targetVerse.chapter, ref.targetVerse.verse)}
                            >
                              <div className="user-cross-ref-header">
                                <input
                                  type="checkbox"
                                  className="user-cross-ref-checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const newSelected = new Set(selectedUserCrossRefs);
                                    if (isSelected) {
                                      newSelected.delete(ref.id);
                                    } else {
                                      newSelected.add(ref.id);
                                    }
                                    setSelectedUserCrossRefs(newSelected);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="user-cross-ref-drag-handle" title="Drag to reorder">
                                  ⋮⋮
                                </span>
                                <span className="user-cross-ref-reference">
                                  {userCrossRefService.formatVerseReference(ref.targetVerse)}
                                </span>
                                {category && (
                                  <span
                                    className="user-cross-ref-category"
                                    style={{ backgroundColor: category.color }}
                                  >
                                    {category.name}
                                  </span>
                                )}
                                <div className="user-cross-ref-actions">
                                  <button
                                    className="user-cross-ref-edit"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditCrossRef(ref);
                                    }}
                                    title="Edit"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    className="user-cross-ref-delete"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteUserCrossRef(ref.id);
                                    }}
                                    title="Delete"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                              {ref.word && (
                                <div className="user-cross-ref-word">
                                  "{ref.word}"
                                </div>
                              )}
                              <div className="user-cross-ref-text">
                                {verseText || 'Loading...'}
                              </div>
                              {ref.note && (
                                <div className="user-cross-ref-note">
                                  {ref.note}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Notes section for cross reference verse */}
              {crossRefVerseNotes.length > 0 && (
                <div className="cross-ref-notes-section">
                  <div className="cross-ref-notes-header">
                    <h4>Notes for this verse</h4>
                  </div>
                  <div className="cross-ref-notes-list">
                    {crossRefVerseNotes.map(note => (
                      <div
                        key={note.id}
                        className="cross-ref-note-item"
                        onClick={() => onEditNote?.(note)}
                      >
                        <div className="cross-ref-note-header">
                          <span className="cross-ref-note-title">
                            {note.title || 'Untitled Note'}
                          </span>
                          <span className="cross-ref-note-date">
                            {formatDate(note.updatedAt || note.timestamp)}
                          </span>
                        </div>
                        {note.topicIds && note.topicIds.length > 0 && (
                          <div className="cross-ref-note-topics">
                            {note.topicIds.map(topicId => {
                              const topic = getTopicById(topicId);
                              return topic ? (
                                <span
                                  key={topicId}
                                  className="cross-ref-note-topic"
                                  style={{ backgroundColor: topic.color }}
                                >
                                  {topic.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                        <p className="cross-ref-note-preview">
                          {note.content.plainText.slice(0, 100)}
                          {note.content.plainText.length > 100 ? '...' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add note button */}
              {onCreateNote && (
                <button
                  className="cross-ref-add-note-btn"
                  onClick={() => onCreateNote({
                    bookId: crossRefContext.bookId,
                    bookName: crossRefContext.bookName,
                    chapter: crossRefContext.chapter,
                    startVerse: crossRefContext.verse,
                    osisRef: `${crossRefContext.bookName}.${crossRefContext.chapter}.${crossRefContext.verse}`,
                  })}
                >
                  + Add Note for {crossRefContext.bookName} {crossRefContext.chapter}:{crossRefContext.verse}
                </button>
              )}
            </div>

            {/* Add/Edit Cross Reference Modal */}
            {showAddCrossRefModal && (
              <div className="cross-ref-modal-overlay" onClick={handleCloseAddCrossRefModal}>
                <div className="cross-ref-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="cross-ref-modal-header">
                    <h3>{editingCrossRef ? 'Edit Cross Reference' : 'Add Cross Reference'}</h3>
                    <button
                      className="cross-ref-modal-close"
                      onClick={handleCloseAddCrossRefModal}
                    >
                      ×
                    </button>
                  </div>
                  <div className="cross-ref-modal-content">
                    <div className="cross-ref-modal-field">
                      <label>From Verse</label>
                      <input
                        type="text"
                        value={`${crossRefContext.bookName} ${crossRefContext.chapter}:${crossRefContext.verse}`}
                        disabled
                      />
                    </div>
                    <div className="cross-ref-modal-field">
                      <label>Target Verse *</label>
                      <input
                        type="text"
                        placeholder="e.g., John 3:16 or Gen 1:1"
                        value={addCrossRefTarget}
                        onChange={(e) => setAddCrossRefTarget(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="cross-ref-modal-field">
                      <label>Category</label>
                      <select
                        value={addCrossRefCategory}
                        onChange={(e) => setAddCrossRefCategory(e.target.value)}
                      >
                        <option value="">No category</option>
                        {crossRefCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="cross-ref-modal-field">
                      <label>Keyword/Phrase</label>
                      <input
                        type="text"
                        placeholder="Word connecting these verses"
                        value={addCrossRefWord}
                        onChange={(e) => setAddCrossRefWord(e.target.value)}
                      />
                    </div>
                    <div className="cross-ref-modal-field">
                      <label>Note</label>
                      <textarea
                        placeholder="Explain the connection..."
                        value={addCrossRefNote}
                        onChange={(e) => setAddCrossRefNote(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="cross-ref-modal-actions">
                    <button
                      className="cross-ref-modal-cancel"
                      onClick={handleCloseAddCrossRefModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="cross-ref-modal-save"
                      onClick={handleSaveCrossRef}
                      disabled={!addCrossRefTarget.trim()}
                    >
                      {editingCrossRef ? 'Save Changes' : 'Add Cross Reference'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
              <div className="cross-ref-modal-overlay" onClick={() => setShowCategoryModal(false)}>
                <div className="cross-ref-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="cross-ref-modal-header">
                    <h3>{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                    <button
                      className="cross-ref-modal-close"
                      onClick={() => setShowCategoryModal(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="cross-ref-modal-content">
                    <div className="cross-ref-modal-field">
                      <label>Name *</label>
                      <input
                        type="text"
                        placeholder="Category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="cross-ref-modal-field">
                      <label>Color</label>
                      <div className="category-color-picker">
                        {CATEGORY_COLORS.map(color => (
                          <button
                            key={color.value}
                            className={`category-color-option ${newCategoryColor === color.value ? 'selected' : ''}`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => setNewCategoryColor(color.value)}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="cross-ref-modal-field">
                      <label>Description</label>
                      <textarea
                        placeholder="Optional description"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        rows={2}
                      />
                    </div>

                    {/* Existing categories list */}
                    {crossRefCategories.length > 0 && !editingCategory && (
                      <div className="existing-categories">
                        <label>Existing Categories</label>
                        <div className="existing-categories-list">
                          {crossRefCategories.map(cat => (
                            <div key={cat.id} className="existing-category-item">
                              <span
                                className="existing-category-color"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="existing-category-name">{cat.name}</span>
                              <button
                                className="existing-category-edit"
                                onClick={() => handleOpenCategoryModal(cat)}
                              >
                                Edit
                              </button>
                              <button
                                className="existing-category-delete"
                                onClick={() => handleDeleteCategory(cat.id)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="cross-ref-modal-actions">
                    <button
                      className="cross-ref-modal-cancel"
                      onClick={() => setShowCategoryModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="cross-ref-modal-save"
                      onClick={handleSaveCategory}
                      disabled={!newCategoryName.trim()}
                    >
                      {editingCategory ? 'Save Changes' : 'Create Category'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;
