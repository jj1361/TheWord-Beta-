import { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import ChapterDisplay from './components/ChapterDisplay';
import RightPanel from './components/RightPanel';
import PersonProfile from './components/PersonProfile';
import WebcamDisplay from './components/WebcamDisplay';
import ScreenShareDisplay from './components/ScreenShareDisplay';
import ChapterHeader from './components/ChapterHeader';
import WordSearchModal from './components/WordSearchModal';
import YouthImagePanel from './components/YouthImagePanel';
import OnboardingTour from './components/OnboardingTour';
import HelpModal from './components/HelpModal';
import NotesPanel from './components/NotesPanel';
import NoteEditor from './components/NoteEditor';
import TopicsManager from './components/TopicsManager';
import VerseHighlighter from './components/VerseHighlighter';
import { LoginModal, SignupModal, ForgotPasswordModal } from './components/Auth';
import { AdminPanel } from './components/AdminPanel';
import PresentationViewer from './components/PresentationViewer';
import ScripturePresentationView from './components/ScripturePresentationView';
import SplitView from './components/SplitView';
import { useAuth } from './contexts/AuthContext';
import { useTranslation } from './contexts/TranslationContext';
import { bibleService } from './services/bibleService';
import { searchService } from './services/searchService';
import { lexiconService } from './services/lexiconService';
import { personService } from './services/personService';
import { notesService } from './services/notesService';
import { crossRefService } from './services/crossRefService';
import { footnoteService } from './services/footnoteService';
import MediaControlPanel from './components/MediaControlPanel';
import MediaDisplayScreen from './components/MediaDisplayScreen';
import ScreenRecorder from './components/ScreenRecorder';
import { Chapter, BIBLE_BOOKS, FootnoteEntry } from './types/bible';
import { getHebrewLetterInfo, HebrewLetterInfo } from './config/hebrewLetters';
import { WordImageMapping } from './config/youthModeConfig';
import { getShortcutAction, ShortcutActions } from './config/keyboardShortcuts';
import { LexiconData } from './types/lexicon';
import { useVoiceCommands } from './hooks/useVoiceCommands';
import VoiceCommandButton from './components/VoiceCommandButton';
import { useTTS } from './hooks/useTTS';
import TTSButton from './components/TTSButton';
import { HistoryEntry, Bookmark } from './types/history';
import { Note, Topic, VerseReference, VerseHighlight, HighlightColor, RichTextContent, TextFormatting, TextFormatStyle } from './types/notes';
import { TextSelection } from './components/VerseHighlighter';
import { getScripturePath, parseScriptureParams } from './utils/routeUtils';
import './App.css';
import './theme.css';

// Mapping from full book names to OSIS abbreviations
const BOOK_NAME_TO_OSIS: Record<string, string> = {
  'Genesis': 'Gen', 'Exodus': 'Exod', 'Leviticus': 'Lev', 'Numbers': 'Num', 'Deuteronomy': 'Deut',
  'Joshua': 'Josh', 'Judges': 'Judg', 'Ruth': 'Ruth', '1 Samuel': '1Sam', '2 Samuel': '2Sam',
  '1 Kings': '1Kgs', '2 Kings': '2Kgs', '1 Chronicles': '1Chr', '2 Chronicles': '2Chr',
  'Ezra': 'Ezra', 'Nehemiah': 'Neh', 'Esther': 'Esth', 'Job': 'Job', 'Psalms': 'Ps',
  'Proverbs': 'Prov', 'Ecclesiastes': 'Eccl', 'Song of Solomon': 'Song', 'Isaiah': 'Isa',
  'Jeremiah': 'Jer', 'Lamentations': 'Lam', 'Ezekiel': 'Ezek', 'Daniel': 'Dan',
  'Hosea': 'Hos', 'Joel': 'Joel', 'Amos': 'Amos', 'Obadiah': 'Obad', 'Jonah': 'Jonah',
  'Micah': 'Mic', 'Nahum': 'Nah', 'Habakkuk': 'Hab', 'Zephaniah': 'Zeph', 'Haggai': 'Hag',
  'Zechariah': 'Zech', 'Malachi': 'Mal', 'Matthew': 'Matt', 'Mark': 'Mark', 'Luke': 'Luke',
  'John': 'John', 'Acts': 'Acts', 'Romans': 'Rom', '1 Corinthians': '1Cor', '2 Corinthians': '2Cor',
  'Galatians': 'Gal', 'Ephesians': 'Eph', 'Philippians': 'Phil', 'Colossians': 'Col',
  '1 Thessalonians': '1Thess', '2 Thessalonians': '2Thess', '1 Timothy': '1Tim', '2 Timothy': '2Tim',
  'Titus': 'Titus', 'Philemon': 'Phlm', 'Hebrews': 'Heb', 'James': 'Jas', '1 Peter': '1Pet',
  '2 Peter': '2Pet', '1 John': '1John', '2 John': '2John', '3 John': '3John', 'Jude': 'Jude',
  'Revelation': 'Rev'
};

// Scripture view component that handles URL params
function ScriptureView() {
  const { book: bookParam, chapter: chapterParam, verse: verseParam } = useParams<{
    book: string;
    chapter: string;
    verse?: string;
  }>();
  const navigate = useNavigate();

  // Parse URL params to get book/chapter/verse
  const scriptureParams = parseScriptureParams(bookParam, chapterParam, verseParam);
  const urlBookId = scriptureParams?.bookId || 1;
  const urlChapter = scriptureParams?.chapter || 1;
  const urlVerse = scriptureParams?.verse;

  // Auth state
  const { user, isAdmin } = useAuth();
  // Translation state
  const { currentTranslation } = useTranslation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const [currentBookId, setCurrentBookId] = useState(urlBookId);
  const [currentChapter, setCurrentChapter] = useState(urlChapter);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlightVerse, setHighlightVerse] = useState<number | undefined>();
  const [selectedVerse, setSelectedVerse] = useState<number | undefined>();
  const [selectedLetter, setSelectedLetter] = useState<HebrewLetterInfo | null>(null);
  const [selectedStrongs, setSelectedStrongs] = useState<string | null>(null);
  const [lexiconData, setLexiconData] = useState<LexiconData | null>(null);
  const [keyBuffer, setKeyBuffer] = useState<string>('');
  const [selectedPersonID, setSelectedPersonID] = useState<string | null>(null);
  const [navigatedVerse, setNavigatedVerse] = useState<number | undefined>();
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [webcamSettings, setWebcamSettings] = useState(false);
  const [webcamFullscreen, setWebcamFullscreen] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [screenShareWithVerses, setScreenShareWithVerses] = useState(false);

  // Screen share verses panel resize state
  const [screenShareVersesWidth, setScreenShareVersesWidth] = useState(() => {
    const saved = localStorage.getItem('screenShareVersesWidth');
    return saved ? parseInt(saved, 10) : 75; // Default 75% width for chapter display
  });
  const [isResizingScreenShare, setIsResizingScreenShare] = useState(false);
  const screenShareWrapperRef = useRef<HTMLDivElement>(null);
  const [useProtoSinaitic, setUseProtoSinaitic] = useState(true);
  const [wordSearchStrongsId, setWordSearchStrongsId] = useState<string | null>(null);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState<string | null>(null);
  const [selectedYouthWord, setSelectedYouthWord] = useState<WordImageMapping | null>(null);
  const [youthMode, setYouthMode] = useState(() => {
    // Load youth mode preference from localStorage
    const saved = localStorage.getItem('youthMode');
    return saved === 'true';
  });
  const [studyMode, setStudyMode] = useState(() => {
    // Load study mode preference from localStorage (default to true)
    const saved = localStorage.getItem('studyMode');
    return saved !== 'false'; // Default to true if not set
  });
  // Theme state: 'light', 'dark', or 'sepia'
  type ThemeMode = 'light' | 'dark' | 'sepia';
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // Load theme preference from localStorage
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'sepia' || saved === 'light') {
      return saved;
    }
    // Migrate from old darkMode setting
    const oldDarkMode = localStorage.getItem('darkMode');
    if (oldDarkMode === 'true') return 'dark';
    return 'light';
  });
  // Legacy support: derive darkMode from theme for any code still using it
  const darkMode = theme === 'dark';
  const [personProfileEnabled, setPersonProfileEnabled] = useState(() => {
    // Load person profile preference from localStorage (default to false/disabled)
    const saved = localStorage.getItem('personProfileEnabled');
    return saved === 'true'; // Default to false (disabled) if not set
  });

  // Text size state
  const MIN_TEXT_SIZE = 12;
  const MAX_TEXT_SIZE = 50;
  const DEFAULT_TEXT_SIZE = 18;
  const TEXT_SIZE_STEP = 2;
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem('verseTextSize');
    return saved ? parseInt(saved, 10) : DEFAULT_TEXT_SIZE;
  });

  const handleIncreaseTextSize = () => {
    setTextSize(prev => {
      const newSize = Math.min(prev + TEXT_SIZE_STEP, MAX_TEXT_SIZE);
      localStorage.setItem('verseTextSize', newSize.toString());
      return newSize;
    });
  };

  const handleDecreaseTextSize = () => {
    setTextSize(prev => {
      const newSize = Math.max(prev - TEXT_SIZE_STEP, MIN_TEXT_SIZE);
      localStorage.setItem('verseTextSize', newSize.toString());
      return newSize;
    });
  };

  // Onboarding tour state
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Show tour on first visit (if not completed before)
    const hasCompletedTour = localStorage.getItem('onboardingCompleted');
    return !hasCompletedTour;
  });

  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Presentation viewer state
  const [showPresentation, setShowPresentation] = useState(false);
  const [showScripturePresentation, setShowScripturePresentation] = useState(false);

  // Split view state (translation comparison)
  const [splitViewEnabled, setSplitViewEnabled] = useState(false);
  const [presentationUrl, setPresentationUrl] = useState(() => {
    const saved = localStorage.getItem('presentationUrl');
    // Default to the embed URL format from OneDrive's "Embed" share option
    return saved || 'https://1drv.ms/p/c/9ed1633fdc382776/IQR2JzjcP2PRIICe21EAAAAAAYy_DDwijAINBjx85YazFsg?em=2&wdAr=1.7777777777777777';
  });

  // Notes feature state
  const [notes, setNotes] = useState<Note[]>(() => notesService.getNotes());
  const [highlights, setHighlights] = useState<VerseHighlight[]>(() => notesService.getHighlights());
  const [topics, setTopics] = useState<Topic[]>(() => notesService.getTopics());
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [notesPanelVerseFilter, setNotesPanelVerseFilter] = useState<{ bookId: number; chapter: number; verse: number } | null>(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteEditorFullscreen, setNoteEditorFullscreen] = useState(false);
  const [noteEditorWideView, setNoteEditorWideView] = useState(false);
  const [showTopicsManager, setShowTopicsManager] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [noteVerses, setNoteVerses] = useState<VerseReference[] | undefined>();
  const [highlighterPosition, setHighlighterPosition] = useState<{ x: number; y: number } | null>(null);
  const [highlighterVerse, setHighlighterVerse] = useState<number | null>(null);
  const [highlighterSelectedText, setHighlighterSelectedText] = useState<string>('');
  const [highlighterTextSelection, setHighlighterTextSelection] = useState<TextSelection | null>(null);
  const [textFormatting, setTextFormatting] = useState<TextFormatting[]>(() => notesService.getTextFormatting());

  // Cross-reference state - stores full context so panel doesn't change when navigating
  const [crossRefContext, setCrossRefContext] = useState<{
    bookId: number;
    bookName: string;
    chapter: number;
    verse: number;
  } | null>(null);
  const [versesWithCrossRefs, setVersesWithCrossRefs] = useState<Set<number>>(new Set());
  // Pending cross ref target from context menu (to open modal with pre-populated target)
  const [pendingCrossRefTarget, setPendingCrossRefTarget] = useState<string | null>(null);

  // Footnotes (1611 KJV Marginal Notes) state
  const [chapterFootnotes, setChapterFootnotes] = useState<Map<number, FootnoteEntry[]>>(new Map());
  const [showFootnotes, setShowFootnotes] = useState(() => {
    // Load footnote preference from localStorage (default to true)
    const saved = localStorage.getItem('showFootnotes');
    return saved !== 'false'; // Default to true if not set
  });

  // Media presentation state
  const [showMediaControl, setShowMediaControl] = useState(false);
  const [showMediaDisplay, setShowMediaDisplay] = useState(false);

  // Screen recorder state
  const [showScreenRecorder, setShowScreenRecorder] = useState(false);

  // Navigation History State
  const [navigationHistory, setNavigationHistory] = useState<HistoryEntry[]>(() => {
    // Load history from sessionStorage on mount
    const saved = sessionStorage.getItem('navigationHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [historyIndex, setHistoryIndex] = useState<number>(() => {
    const saved = sessionStorage.getItem('historyIndex');
    return saved ? parseInt(saved, 10) : -1;
  });

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    // Load bookmarks from localStorage on mount
    const saved = localStorage.getItem('bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  // Apply theme on mount and when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Save youth mode preference
  useEffect(() => {
    localStorage.setItem('youthMode', youthMode.toString());
  }, [youthMode]);

  // Save study mode preference
  useEffect(() => {
    localStorage.setItem('studyMode', studyMode.toString());
  }, [studyMode]);

  // Reload highlights and text formatting when studyMode is enabled
  useEffect(() => {
    if (studyMode) {
      // Force refresh of highlights and text formatting to ensure they display
      setHighlights([...notesService.getHighlights()]);
      setTextFormatting([...notesService.getTextFormatting()]);
    }
  }, [studyMode]);

  // Save person profile preference
  useEffect(() => {
    localStorage.setItem('personProfileEnabled', personProfileEnabled.toString());
  }, [personProfileEnabled]);

  // Save history to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('navigationHistory', JSON.stringify(navigationHistory));
    sessionStorage.setItem('historyIndex', historyIndex.toString());
  }, [navigationHistory, historyIndex]);

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Save presentation URL to localStorage whenever it changes
  const handleUpdatePresentationUrl = (url: string) => {
    setPresentationUrl(url);
    localStorage.setItem('presentationUrl', url);
  };

  // Screen share resize handlers
  const handleScreenShareResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingScreenShare(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingScreenShare || !screenShareWrapperRef.current) return;

      const wrapperRect = screenShareWrapperRef.current.getBoundingClientRect();
      const wrapperWidth = wrapperRect.width;
      // Calculate verses section width as percentage (it's on the right side)
      const versesWidth = ((wrapperRect.right - e.clientX) / wrapperWidth) * 100;
      // Clamp between 20% and 85%
      const clampedWidth = Math.min(Math.max(versesWidth, 20), 85);
      setScreenShareVersesWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      if (isResizingScreenShare) {
        setIsResizingScreenShare(false);
        localStorage.setItem('screenShareVersesWidth', screenShareVersesWidth.toString());
      }
    };

    if (isResizingScreenShare) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingScreenShare, screenShareVersesWidth]);

  // Connect notesService to user and reload notes when user changes
  useEffect(() => {
    if (user) {
      // Migrate any anonymous data to the user's storage on first login
      notesService.migrateAnonymousDataToUser(user.uid);
      // Set the current user for scoped storage
      notesService.setCurrentUserId(user.uid);
    } else {
      // Clear user context when logged out
      notesService.setCurrentUserId(null);
    }
    // Reload notes, highlights, topics for the current user
    setNotes(notesService.getNotes());
    setHighlights(notesService.getHighlights());
    setTopics(notesService.getTopics());
  }, [user]);

  // Load chapter helper function (without adding to history)
  const loadChapterWithoutHistory = useCallback(async (bookId: number, chapterNum: number, verseNum?: number) => {
    console.log('[loadChapterWithoutHistory] Called with:', { bookId, chapterNum, verseNum, currentBookId, currentChapter });
    // Only clear highlight/selection if loading a different chapter
    const isDifferentChapter = bookId !== currentBookId || chapterNum !== currentChapter;
    console.log('[loadChapterWithoutHistory] isDifferentChapter:', isDifferentChapter);
    if (isDifferentChapter) {
      console.log('[loadChapterWithoutHistory] Clearing highlight/selection/navigated');
      setHighlightVerse(undefined);
      setSelectedVerse(undefined);
      setNavigatedVerse(undefined);
    } else {
      console.log('[loadChapterWithoutHistory] Same chapter - NOT clearing highlight');
    }
    setLoading(true);
    try {
      const chapterData = await bibleService.loadChapter(bookId, chapterNum, currentTranslation);

      // Load verse data from CSV to get person information
      await personService.loadVerses();

      // Enhance verses with mdText and people data from CSV
      const bookName = chapterData.bookName;
      const osisBookName = BOOK_NAME_TO_OSIS[bookName] || bookName;
      const enhancedVerses = await Promise.all(
        chapterData.kjvVerses.map(async (verse) => {
          const osisRef = `${osisBookName}.${chapterNum}.${verse.num}`;
          const verseData = await personService.getVerseByRef(osisRef);

          if (verseData) {
            return {
              ...verse,
              mdText: verseData.mdText,
              people: verseData.people
            };
          }
          return verse;
        })
      );

      setChapter({
        ...chapterData,
        kjvVerses: enhancedVerses
      });
      setCurrentBookId(bookId);
      setCurrentChapter(chapterNum);

      // If a specific verse was requested, scroll to it
      if (verseNum) {
        setTimeout(() => {
          const verseElement = document.getElementById(`verse-${verseNum}`);
          if (verseElement) {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
      alert('Failed to load chapter. Please make sure the XML files are accessible.');
    } finally {
      setLoading(false);
    }
  }, [currentTranslation, currentBookId, currentChapter]);

  // Add entry to navigation history
  const addToHistory = (bookId: number, bookName: string, chapterNum: number, verse?: number) => {
    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    if (!book) return;

    const osisBookName = BOOK_NAME_TO_OSIS[bookName] || bookName;
    const osisRef = verse
      ? `${osisBookName}.${chapterNum}.${verse}`
      : `${osisBookName}.${chapterNum}`;

    const newEntry: HistoryEntry = {
      bookId,
      bookName,
      chapter: chapterNum,
      verse,
      timestamp: Date.now(),
      osisRef
    };

    // Remove any entries after current index (when navigating back then going to new location)
    const newHistory = navigationHistory.slice(0, historyIndex + 1);

    // Add new entry
    newHistory.push(newEntry);

    // Limit to 50 entries
    const limitedHistory = newHistory.slice(-50);

    setNavigationHistory(limitedHistory);
    setHistoryIndex(limitedHistory.length - 1);
  };

  // Navigate back in history - use browser history
  const goBack = () => {
    navigate(-1);
  };

  // Navigate forward in history - use browser history
  const goForward = () => {
    navigate(1);
  };

  // Bookmark management functions
  const addBookmark = (label?: string) => {
    const book = BIBLE_BOOKS.find(b => b.id === currentBookId);
    if (!book) return;

    const osisBookName = BOOK_NAME_TO_OSIS[book.name] || book.name;
    const osisRef = selectedVerse
      ? `${osisBookName}.${currentChapter}.${selectedVerse}`
      : `${osisBookName}.${currentChapter}`;

    const newBookmark: Bookmark = {
      id: `${Date.now()}-${Math.random()}`,
      bookId: currentBookId,
      bookName: book.name,
      chapter: currentChapter,
      verse: selectedVerse,
      osisRef,
      label,
      timestamp: Date.now()
    };

    setBookmarks([...bookmarks, newBookmark]);
  };

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const updateBookmarkLabel = (id: string, label: string) => {
    setBookmarks(bookmarks.map(b =>
      b.id === id ? { ...b, label: label || undefined } : b
    ));
  };

  const navigateToBookmark = (bookmark: Bookmark) => {
    const path = getScripturePath(bookmark.bookId, bookmark.chapter, bookmark.verse);
    navigate(path);
  };

  const navigateToHistoryEntry = (entry: HistoryEntry) => {
    const path = getScripturePath(entry.bookId, entry.chapter, entry.verse);
    navigate(path);
  };

  const clearHistory = () => {
    setNavigationHistory([]);
    setHistoryIndex(-1);
  };

  // Notes management functions
  const createVerseReference = (verseNum: number, endVerse?: number): VerseReference => {
    const book = BIBLE_BOOKS.find(b => b.id === currentBookId);
    const bookName = book?.name || '';
    const osisBookName = BOOK_NAME_TO_OSIS[bookName] || bookName;
    return {
      bookId: currentBookId,
      bookName,
      chapter: currentChapter,
      startVerse: verseNum,
      endVerse,
      osisRef: endVerse && endVerse !== verseNum
        ? `${osisBookName}.${currentChapter}.${verseNum}-${endVerse}`
        : `${osisBookName}.${currentChapter}.${verseNum}`,
    };
  };

  const handleSaveNote = (
    content: RichTextContent,
    verses?: VerseReference[],
    topicIds?: string[],
    title?: string
  ) => {
    if (editingNote) {
      notesService.updateNote(editingNote.id, { content, verses, topicIds, title });
    } else {
      notesService.addNote(content, verses, topicIds, title);
    }
    setNotes(notesService.getNotes());
    setShowNoteEditor(false);
    setEditingNote(undefined);
    setNoteVerses(undefined);
  };

  const handleDeleteNote = (id: string) => {
    notesService.deleteNote(id);
    setNotes(notesService.getNotes());
    setShowNoteEditor(false);
    setEditingNote(undefined);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteVerses(note.verses);
    setShowNoteEditor(true);
  };

  const handleCreateNote = (verseNum?: number) => {
    setEditingNote(undefined);
    if (verseNum) {
      setNoteVerses([createVerseReference(verseNum)]);
    } else {
      setNoteVerses(undefined);
    }
    setShowNoteEditor(true);
  };

  // Get notes for a specific verse (for showing notes button on verses)
  const getNotesForVerse = (verseNum: number): Note[] => {
    return notesService.getNotesForVerse(currentBookId, currentChapter, verseNum);
  };

  // Handle click on verse notes button - open notes panel filtered to that verse
  const handleVerseNoteClick = (verseNum: number, verseNotes: Note[]) => {
    if (verseNotes.length === 1) {
      // If only one note, open it directly in the editor
      handleEditNote(verseNotes[0]);
    } else {
      // If multiple notes, open the notes panel filtered to this verse
      setNotesPanelVerseFilter({ bookId: currentBookId, chapter: currentChapter, verse: verseNum });
      setShowNotesPanel(true);
    }
  };

  // Clear the verse filter and show all notes
  const handleClearNotesPanelVerseFilter = () => {
    setNotesPanelVerseFilter(null);
  };

  const handleSetHighlight = (verseNum: number, color: HighlightColor) => {
    // Clear all existing highlights first - only one verse can be highlighted at a time
    const existingHighlights = notesService.getHighlights();
    existingHighlights.forEach(h => notesService.removeHighlight(h.id));

    const verseRef = createVerseReference(verseNum);
    notesService.setHighlight(verseRef, color);
    setHighlights(notesService.getHighlights());
    setHighlighterPosition(null);
    setHighlighterVerse(null);
  };

  const handleRemoveHighlight = (verseNum: number) => {
    notesService.removeHighlightForVerses(currentBookId, currentChapter, verseNum);
    setHighlights(notesService.getHighlights());
    setHighlighterPosition(null);
    setHighlighterVerse(null);
  };

  // Toggle study mode
  const handleToggleStudyMode = useCallback(() => {
    setStudyMode(prev => !prev);
  }, []);

  const handleAddTopic = (name: string, color?: string, description?: string) => {
    notesService.addTopic(name, color, description);
    setTopics(notesService.getTopics());
  };

  const handleUpdateTopic = (id: string, updates: Partial<Omit<Topic, 'id' | 'timestamp'>>) => {
    notesService.updateTopic(id, updates);
    setTopics(notesService.getTopics());
  };

  const handleDeleteTopic = (id: string) => {
    notesService.deleteTopic(id);
    setTopics(notesService.getTopics());
    setNotes(notesService.getNotes()); // Refresh notes as topic references may have changed
  };

  const handleVerseRightClick = (verseNum: number, event: React.MouseEvent) => {
    event.preventDefault();
    // Capture any selected text and its position within the verse
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    setHighlighterSelectedText(selectedText);

    // Try to get the selection offset within the verse text
    let textSelection: TextSelection | null = null;
    if (selection && selection.rangeCount > 0 && selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const verseElement = document.getElementById(`verse-${verseNum}`);

      if (verseElement) {
        // Find the verse text element
        const verseTextElement = verseElement.querySelector('.verse-text');

        if (verseTextElement) {
          // Get the full text content of the verse (this collapses all nested spans)
          const fullText = verseTextElement.textContent || '';

          // Normalize the selected text to handle any whitespace differences
          const normalizedSelectedText = selectedText.replace(/\s+/g, ' ').trim();
          const normalizedFullText = fullText.replace(/\s+/g, ' ');

          // Check if the selection is within the verse text element
          if (verseTextElement.contains(range.startContainer)) {
            try {
              // Find where the selection starts within the full text
              // Create a range from start of verse-text to start of selection
              const preSelectionRange = document.createRange();
              preSelectionRange.selectNodeContents(verseTextElement);
              preSelectionRange.setEnd(range.startContainer, range.startOffset);
              const startOffset = preSelectionRange.toString().length;
              const endOffset = startOffset + selectedText.length;

              // Validate that the text matches
              if (fullText.substring(startOffset, endOffset) === selectedText) {
                textSelection = {
                  text: selectedText,
                  startOffset,
                  endOffset,
                };
              }
            } catch {
              // Range operations failed, will use fallback below
            }
          }

          // Fallback: search for the selected text in the full verse text
          // This handles cases where range operations fail or text spans multiple elements
          if (!textSelection) {
            // First try exact match
            let foundIndex = fullText.indexOf(selectedText);

            // If not found, try with normalized whitespace
            if (foundIndex === -1 && normalizedSelectedText.length > 0) {
              foundIndex = normalizedFullText.indexOf(normalizedSelectedText);
            }

            if (foundIndex !== -1) {
              textSelection = {
                text: selectedText,
                startOffset: foundIndex,
                endOffset: foundIndex + selectedText.length,
              };
            }
          }
        }
      }
    }

    setHighlighterTextSelection(textSelection);
    setHighlighterVerse(verseNum);
    setHighlighterPosition({ x: event.clientX, y: event.clientY });
  };

  const getHighlightForVerse = (verseNum: number): VerseHighlight | undefined => {
    return highlights.find(
      h => h.verses.bookId === currentBookId &&
           h.verses.chapter === currentChapter &&
           verseNum >= h.verses.startVerse &&
           verseNum <= (h.verses.endVerse || h.verses.startVerse)
    );
  };

  const getTextFormattingForVerse = (verseNum: number): TextFormatting[] => {
    return textFormatting.filter(
      f => f.bookId === currentBookId &&
           f.chapter === currentChapter &&
           f.verse === verseNum
    );
  };

  // Get verse text from KJVs phrases (CSV source) when available, otherwise fall back to KJV (XML source)
  // This ensures the copied text matches what's displayed (e.g., "Lord" vs "LORD" for H136 vs H3068)
  const getVerseTextForCopy = (verseNum: number): string => {
    if (!chapter) return '';

    // Try to get text from KJVs (CSV with Strong's numbers) - this is what's displayed
    const kjvsVerse = chapter.kjvsVerses?.find(v => v.num === verseNum);
    if (kjvsVerse && kjvsVerse.phrases.length > 0) {
      // Reconstruct text from phrases, adding spaces between them appropriately
      return kjvsVerse.phrases
        .map((p, idx) => {
          const text = p.text;
          // Don't add space before punctuation or if text already ends with space
          if (idx === 0) return text;
          const prevText = kjvsVerse.phrases[idx - 1].text;
          if (prevText.endsWith(' ') || /^[,;:.!?'\-]/.test(text)) return text;
          return ' ' + text;
        })
        .join('');
    }

    // Fall back to KJV (XML source)
    return chapter.kjvVerses.find(v => v.num === verseNum)?.text || '';
  };

  const handleApplyTextFormat = (style: TextFormatStyle) => {
    if (!highlighterVerse || !highlighterTextSelection) {
      return;
    }

    notesService.addTextFormatting(
      currentBookId,
      currentChapter,
      highlighterVerse,
      highlighterTextSelection.startOffset,
      highlighterTextSelection.endOffset,
      highlighterTextSelection.text,
      style
    );

    // Refresh text formatting state with a new array reference
    setTextFormatting([...notesService.getTextFormatting()]);
  };

  const handleClearTextFormat = () => {
    if (!highlighterVerse || !highlighterTextSelection) {
      return;
    }

    notesService.clearTextFormattingForRange(
      currentBookId,
      currentChapter,
      highlighterVerse,
      highlighterTextSelection.startOffset,
      highlighterTextSelection.endOffset,
      highlighterTextSelection.text
    );

    // Refresh text formatting state with a new array reference
    setTextFormatting([...notesService.getTextFormatting()]);
  };

  const navigateToNoteVerse = (verse: VerseReference) => {
    const path = getScripturePath(verse.bookId, verse.chapter, verse.startVerse);
    navigate(path);
  };

  // Sync state from URL params and load chapter
  useEffect(() => {
    console.log('[URL Effect] Triggered with:', { urlBookId, urlChapter, urlVerse, currentBookId, currentChapter });
    // Update state from URL params
    if (urlBookId !== currentBookId || urlChapter !== currentChapter) {
      console.log('[URL Effect] Updating currentBookId/currentChapter');
      setCurrentBookId(urlBookId);
      setCurrentChapter(urlChapter);
    }

    // Load chapter data
    console.log('[URL Effect] Calling loadChapterWithoutHistory');
    loadChapterWithoutHistory(urlBookId, urlChapter, urlVerse);

    // Handle verse highlighting from URL
    if (urlVerse) {
      console.log('[URL Effect] Setting highlightVerse from URL to:', urlVerse);
      setHighlightVerse(urlVerse);
      setNavigatedVerse(urlVerse);
      setTimeout(() => {
        const verseElement = document.getElementById(`verse-${urlVerse}`);
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlBookId, urlChapter, urlVerse]);

  // Reload chapter when translation changes
  useEffect(() => {
    if (chapter) {
      loadChapterWithoutHistory(urlBookId, urlChapter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTranslation]);

  // Update browser title for history
  useEffect(() => {
    const book = BIBLE_BOOKS.find(b => b.id === currentBookId);
    if (book) {
      const versePart = selectedVerse ? `:${selectedVerse}` : '';
      document.title = `${book.name} ${currentChapter}${versePart} - Bible App`;
    } else {
      document.title = 'Bible App';
    }
  }, [currentBookId, currentChapter, selectedVerse]);

  // Load cross-references for current chapter
  useEffect(() => {
    const loadCrossRefs = async () => {
      const chapterCrossRefs = await crossRefService.getChapterCrossRefs(currentBookId, currentChapter);
      setVersesWithCrossRefs(new Set(chapterCrossRefs.keys()));
    };
    loadCrossRefs();
  }, [currentBookId, currentChapter]);

  // Load footnotes for current chapter
  useEffect(() => {
    const loadFootnotes = async () => {
      const footnotes = await footnoteService.getChapterFootnotes(currentBookId, currentChapter);
      setChapterFootnotes(footnotes);
    };
    loadFootnotes();
  }, [currentBookId, currentChapter]);

  // Save footnote preference
  useEffect(() => {
    localStorage.setItem('showFootnotes', showFootnotes.toString());
  }, [showFootnotes]);

  // Handler for cross-reference button click
  const handleCrossRefClick = (verseNum: number) => {
    if (crossRefContext?.verse === verseNum && crossRefContext?.bookId === currentBookId && crossRefContext?.chapter === currentChapter) {
      setCrossRefContext(null);
    } else {
      // Hide webcam when showing cross references
      if (webcamEnabled) {
        setWebcamEnabled(false);
      }
      setCrossRefContext({
        bookId: currentBookId,
        bookName: chapter?.bookName || '',
        chapter: currentChapter,
        verse: verseNum
      });
    }
  };

  // Toggle webcam - close right panel when enabling
  const handleToggleWebcam = useCallback(() => {
    setWebcamEnabled(prev => {
      if (!prev) {
        // Enabling webcam - close the right panel
        setSelectedStrongs(null);
        setSelectedLetter(null);
        setLexiconData(null);
        setCrossRefContext(null);
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle keys when not typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Also check for contenteditable elements (rich text editors)
      if (e.target instanceof HTMLElement && e.target.isContentEditable) {
        return;
      }

      // Check for keyboard shortcuts from config
      const action = getShortcutAction(e);
      if (action) {
        switch (action) {
          case ShortcutActions.TOGGLE_WEBCAM:
            e.preventDefault();
            handleToggleWebcam();
            return;
          case ShortcutActions.TOGGLE_WEBCAM_FULLSCREEN:
            e.preventDefault();
            // Only toggle fullscreen if webcam is enabled, otherwise enable it first
            if (webcamEnabled) {
              setWebcamFullscreen(prev => !prev);
            } else {
              // Close right panel when enabling webcam
              setSelectedStrongs(null);
              setSelectedLetter(null);
              setLexiconData(null);
              setCrossRefContext(null);
              setWebcamEnabled(true);
              setWebcamFullscreen(true);
            }
            return;
          case ShortcutActions.TOGGLE_SCREEN_SHARE:
            e.preventDefault();
            setScreenShareEnabled(prev => !prev);
            return;
          case ShortcutActions.TOGGLE_SCREEN_SHARE_VERSES:
            e.preventDefault();
            // Only toggle verses if screen share is enabled
            if (screenShareEnabled) {
              setScreenShareWithVerses(prev => !prev);
            }
            return;
          case ShortcutActions.TOGGLE_DARK_MODE:
            e.preventDefault();
            // Cycle through themes: light -> dark -> sepia -> light
            setTheme(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'sepia' : 'light');
            return;
          case ShortcutActions.TOGGLE_STUDY_MODE:
            e.preventDefault();
            handleToggleStudyMode();
            return;
          case ShortcutActions.TOGGLE_YOUTH_MODE:
            e.preventDefault();
            setYouthMode(prev => !prev);
            return;
          case ShortcutActions.CLEAR_SELECTION:
            // Clear selection and navigation highlight
            setSelectedVerse(undefined);
            setNavigatedVerse(undefined);
            setKeyBuffer('');
            return;
          case ShortcutActions.NAVIGATE_VERSE_UP:
            e.preventDefault();
            if (!chapter || chapter.kjvVerses.length === 0) return;
            {
              const currentVerse = navigatedVerse || highlightVerse || 1;
              const currentIndex = chapter.kjvVerses.findIndex(v => v.num === currentVerse);
              if (currentIndex > 0) {
                const nextVerse = chapter.kjvVerses[currentIndex - 1].num;
                setHighlightVerse(undefined); // Clear URL-based highlight
                setNavigatedVerse(nextVerse);
                const verseElement = document.getElementById(`verse-${nextVerse}`);
                if (verseElement) {
                  verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }
            return;
          case ShortcutActions.NAVIGATE_VERSE_DOWN:
            e.preventDefault();
            if (!chapter || chapter.kjvVerses.length === 0) return;
            {
              const currentVerse = navigatedVerse || highlightVerse || 1;
              const currentIndex = chapter.kjvVerses.findIndex(v => v.num === currentVerse);
              if (currentIndex < chapter.kjvVerses.length - 1) {
                const nextVerse = chapter.kjvVerses[currentIndex + 1].num;
                setHighlightVerse(undefined); // Clear URL-based highlight
                setNavigatedVerse(nextVerse);
                const verseElement = document.getElementById(`verse-${nextVerse}`);
                if (verseElement) {
                  verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }
            return;
          case ShortcutActions.INCREASE_TEXT_SIZE:
            e.preventDefault();
            handleIncreaseTextSize();
            return;
          case ShortcutActions.DECREASE_TEXT_SIZE:
            e.preventDefault();
            handleDecreaseTextSize();
            return;
        }
      }

      // Handle number keys for verse navigation (not in shortcuts config)
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        const newBuffer = keyBuffer + e.key;
        setKeyBuffer(newBuffer);

        // Clear buffer after 1.5 seconds of inactivity
        setTimeout(() => {
          setKeyBuffer('');
        }, 1500);

        // Try to scroll to verse and highlight it
        const verseNum = parseInt(newBuffer, 10);
        if (chapter && chapter.kjvVerses.some(v => v.num === verseNum)) {
          setHighlightVerse(undefined); // Clear URL-based highlight
          setNavigatedVerse(verseNum);
          // Scroll to verse but don't select it (no interlinear)
          const verseElement = document.getElementById(`verse-${verseNum}`);
          if (verseElement) {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keyBuffer, chapter, navigatedVerse, highlightVerse, webcamEnabled, screenShareEnabled, handleToggleStudyMode, handleToggleWebcam]);

  const loadChapter = async (bookId: number, chapterNum: number) => {
    console.log('[loadChapter] Called with:', { bookId, chapterNum });
    // Navigate to new URL - this will trigger a re-render with new params
    const path = getScripturePath(bookId, chapterNum);
    console.log('[loadChapter] Navigating to path:', path);
    navigate(path);
  };

  const handleSearch = async (query: string) => {
    // Use the optimized search service with indexing, filtered by current translation
    return await searchService.search(query, 100, currentTranslation);
  };

  const handleSearchResultClick = (bookId: number, chapterNum: number, verseNum: number) => {
    // Navigate to the verse URL - this will load the chapter and highlight
    const path = getScripturePath(bookId, chapterNum, verseNum);
    navigate(path);
  };

  const handleLetterClick = (letter: string) => {
    const letterInfo = getHebrewLetterInfo(letter);
    if (letterInfo) {
      // Hide webcam to show the right panel with Hebrew letter info
      if (webcamEnabled) {
        setWebcamEnabled(false);
      }
      setSelectedLetter(letterInfo);
    }
  };

  const handleStrongsClick = async (strongs: string) => {
    // Hide webcam to show the right panel with lexicon data
    if (webcamEnabled) {
      setWebcamEnabled(false);
    }

    setSelectedStrongs(strongs);
    setLexiconData(null);

    try {
      // Add appropriate prefix based on book ID
      // Books 1-39 are Old Testament (Hebrew), 40-66 are New Testament (Greek)
      let prefixedStrongs = strongs;
      if (!strongs.startsWith('G') && !strongs.startsWith('H')) {
        if (currentBookId >= 40 && currentBookId <= 66) {
          // New Testament - use Greek prefix
          prefixedStrongs = `G${strongs}`;
        } else {
          // Old Testament - use Hebrew prefix
          prefixedStrongs = `H${strongs}`;
        }
      }

      const data = await lexiconService.getLexiconData(prefixedStrongs);
      console.log('[App] Lexicon data received:', {
        hasStepBible: !!data.stepBible,
        hasStrongs: !!data.strongs,
        hasBdb: !!data.bdb,
        stepBibleWord: data.stepBible?.word,
        stepBibleGloss: data.stepBible?.gloss
      });
      if (data.stepBible || data.strongs || data.bdb) {
        console.log('[App] Setting lexicon data in state');
        setLexiconData(data);
      } else {
        console.log('[App] No lexicon data to set');
      }
    } catch (error) {
      console.error('Error loading lexicon data:', error);
      alert('Failed to load lexicon data. Please ensure the XML files are accessible.');
    }
  };

  const handleVerseClick = (verseNum: number) => {
    // Toggle verse selection
    if (selectedVerse === verseNum) {
      setSelectedVerse(undefined);
    } else {
      setSelectedVerse(verseNum);
      // Record verse selection in history
      const book = BIBLE_BOOKS.find(b => b.id === currentBookId);
      if (book) {
        addToHistory(currentBookId, book.name, currentChapter, verseNum);
      }
    }
  };

  const handlePersonClick = (personID: string) => {
    setSelectedPersonID(personID);
  };

  const handleClosePersonProfile = () => {
    setSelectedPersonID(null);
  };

  const handleYouthImageClick = (wordMapping: WordImageMapping) => {
    setSelectedYouthWord(wordMapping);
  };

  // Voice command handlers for navigation
  const handleNextChapter = () => {
    const book = BIBLE_BOOKS.find(b => b.id === currentBookId);
    if (book && currentChapter < book.chapters) {
      loadChapter(currentBookId, currentChapter + 1);
    } else if (currentBookId < 66) {
      // Go to first chapter of next book
      loadChapter(currentBookId + 1, 1);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      loadChapter(currentBookId, currentChapter - 1);
    } else if (currentBookId > 1) {
      // Go to last chapter of previous book
      const prevBook = BIBLE_BOOKS.find(b => b.id === currentBookId - 1);
      if (prevBook) {
        loadChapter(currentBookId - 1, prevBook.chapters);
      }
    }
  };

  const handleGoToVerse = (verse: number) => {
    if (chapter && verse >= 1 && verse <= chapter.kjvVerses.length) {
      setNavigatedVerse(verse);
      setSelectedVerse(verse);
      // Scroll to verse
      setTimeout(() => {
        const verseElement = document.getElementById(`verse-${verse}`);
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Text-to-Speech Hook
  const tts = useTTS({
    onVerseStart: (verse) => {
      // Highlight the verse being read
      setNavigatedVerse(verse);
      // Scroll to verse
      setTimeout(() => {
        const verseElement = document.getElementById(`verse-${verse}`);
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    },
  });

  // TTS handler functions
  const handleTTSReadChapter = useCallback(() => {
    if (chapter && chapter.kjvVerses.length > 0) {
      tts.readChapter(
        chapter.kjvVerses.map(v => ({ num: v.num, text: v.text })),
        chapter.bookName,
        chapter.chapterNum
      );
    }
  }, [chapter, tts]);

  const handleTTSReadVerse = useCallback((verse: number) => {
    if (chapter) {
      const verseData = chapter.kjvVerses.find(v => v.num === verse);
      if (verseData) {
        tts.readVerse(verse, verseData.text, chapter.bookName, chapter.chapterNum);
      }
    }
  }, [chapter, tts]);

  const handleTTSReadVerseRange = useCallback((startVerse: number, endVerse: number) => {
    if (chapter && chapter.kjvVerses.length > 0) {
      tts.readVerseRange(
        chapter.kjvVerses.map(v => ({ num: v.num, text: v.text })),
        startVerse,
        endVerse,
        chapter.bookName,
        chapter.chapterNum
      );
    }
  }, [chapter, tts]);

  // Voice Commands Hook
  const voiceCommands = useVoiceCommands({
    handlers: {
      // Navigation
      navigateToScripture: (bookId, chapterNum, verse) => {
        const path = getScripturePath(bookId, chapterNum, verse);
        navigate(path);
      },
      nextChapter: handleNextChapter,
      previousChapter: handlePrevChapter,
      goToVerse: handleGoToVerse,
      goBack: goBack,
      goForward: goForward,
      // Mode toggles
      setWebcamEnabled: (enabled: boolean) => {
        if (enabled) {
          // Close right panel when enabling webcam
          setSelectedStrongs(null);
          setSelectedLetter(null);
          setLexiconData(null);
          setCrossRefContext(null);
        }
        setWebcamEnabled(enabled);
      },
      setDarkMode: (value: boolean) => setTheme(value ? 'dark' : 'light'),
      setStudyMode: setStudyMode,
      setYouthMode: setYouthMode,
      setFullscreen: setWebcamFullscreen,
      // Person
      showPersonProfile: (personId) => {
        if (personProfileEnabled) {
          setSelectedPersonID(personId);
        }
      },
      // Study tools
      lookupStrongs: handleStrongsClick,
      searchText: (query) => {
        // Trigger voice-initiated search
        setVoiceSearchQuery(query);
      },
      addBookmark: () => addBookmark(),
      createNote: () => handleCreateNote(),
      // Cross references and interlinear
      showCrossReferences: (verse) => {
        // Show cross references for the specified verse
        if (chapter) {
          setCrossRefContext({
            bookId: currentBookId,
            bookName: chapter.bookName,
            chapter: currentChapter,
            verse: verse,
          });
        }
      },
      showInterlinear: (verse) => {
        // Show interlinear view by selecting the verse
        setSelectedVerse(verse);
        // Scroll to the verse
        setTimeout(() => {
          const verseElement = document.getElementById(`verse-${verse}`);
          if (verseElement) {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      },
      // Text size
      increaseTextSize: handleIncreaseTextSize,
      decreaseTextSize: handleDecreaseTextSize,
      setTextSize: (size) => {
        const clampedSize = Math.max(MIN_TEXT_SIZE, Math.min(MAX_TEXT_SIZE, size));
        setTextSize(clampedSize);
        localStorage.setItem('verseTextSize', clampedSize.toString());
      },
      // Footnotes
      setShowFootnotes: setShowFootnotes,
      // Reading (TTS) - connected to TTS service
      readChapter: handleTTSReadChapter,
      readVerse: handleTTSReadVerse,
      readVerseRange: handleTTSReadVerseRange,
      readBook: () => {
        // TODO: Implement reading entire book (requires loading multiple chapters)
        console.log('Read entire book - requires multi-chapter loading');
      },
      stopReading: tts.stop,
      pauseReading: tts.pause,
      resumeReading: tts.resume,
      setRepeatCount: tts.setRepeatCount,
    },
    currentVerse: selectedVerse || navigatedVerse,
  });

  return (
    <div className="App">
      {/* Fixed Chapter Header with Menu, Title, Navigation, Search, and Feature Toggles */}
      {chapter && !screenShareEnabled && !splitViewEnabled && (
        <ChapterHeader
          bookId={currentBookId}
          bookName={chapter.bookName}
          chapterNum={currentChapter}
          totalChapters={BIBLE_BOOKS.find(b => b.id === currentBookId)?.chapters || 1}
          onChapterSelect={(chapterNum) => loadChapter(currentBookId, chapterNum)}
          onNavigate={loadChapter}
          studyMode={studyMode}
          onToggleStudyMode={handleToggleStudyMode}
          showFootnotes={showFootnotes}
          onToggleFootnotes={() => setShowFootnotes(!showFootnotes)}
          personProfileEnabled={personProfileEnabled}
          onTogglePersonProfile={() => setPersonProfileEnabled(!personProfileEnabled)}
          youthMode={youthMode}
          onToggleYouthMode={() => setYouthMode(!youthMode)}
          showNotesPanel={showNotesPanel}
          onToggleNotesPanel={() => setShowNotesPanel(!showNotesPanel)}
          onSearch={handleSearch}
          onSearchResultClick={handleSearchResultClick}
          onWordSearch={(strongsId) => setWordSearchStrongsId(strongsId)}
          voiceSearchQuery={voiceSearchQuery}
          onVoiceSearchHandled={() => setVoiceSearchQuery(null)}
          // HamburgerMenu props
          useProtoSinaitic={useProtoSinaitic}
          webcamEnabled={webcamEnabled}
          webcamFullscreen={webcamFullscreen}
          screenShareEnabled={screenShareEnabled}
          screenShareWithVerses={screenShareWithVerses}
          darkMode={darkMode}
          theme={theme}
          onToggleProtoSinaitic={() => setUseProtoSinaitic(!useProtoSinaitic)}
          onToggleWebcam={handleToggleWebcam}
          onToggleWebcamSettings={() => setWebcamSettings(!webcamSettings)}
          onToggleWebcamFullscreen={() => setWebcamFullscreen(!webcamFullscreen)}
          onToggleScreenShare={() => setScreenShareEnabled(!screenShareEnabled)}
          onToggleScreenShareWithVerses={() => setScreenShareWithVerses(!screenShareWithVerses)}
          onToggleDarkMode={() => setTheme(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'sepia' : 'light')}
          onSetTheme={setTheme}
          // History props
          navigationHistory={navigationHistory}
          historyIndex={historyIndex}
          onNavigateToHistoryEntry={navigateToHistoryEntry}
          onClearHistory={clearHistory}
          // Bookmarks props
          bookmarks={bookmarks}
          currentVerse={selectedVerse}
          onNavigateToBookmark={navigateToBookmark}
          onAddBookmark={addBookmark}
          onRemoveBookmark={removeBookmark}
          onUpdateBookmarkLabel={updateBookmarkLabel}
          // Notes props
          notesCount={notes.length}
          // Presentation props
          onTogglePresentation={() => setShowPresentation(true)}
          onToggleScripturePresentation={() => setShowScripturePresentation(true)}
          // Media control props
          onToggleMediaControl={() => setShowMediaControl(!showMediaControl)}
          // Auth props
          isSignedIn={!!user}
          onSignInClick={() => setShowLoginModal(true)}
          isAdmin={isAdmin}
          onAdminClick={() => setShowAdminPanel(true)}
          // Text size props
          textSize={textSize}
          minTextSize={MIN_TEXT_SIZE}
          maxTextSize={MAX_TEXT_SIZE}
          onIncreaseTextSize={handleIncreaseTextSize}
          onDecreaseTextSize={handleDecreaseTextSize}
          // Help props
          onOpenHelp={() => setShowHelpModal(true)}
          // Split view props
          splitViewEnabled={splitViewEnabled}
          onToggleSplitView={() => setSplitViewEnabled(!splitViewEnabled)}
          // Screen recorder props
          showScreenRecorder={showScreenRecorder}
          onToggleScreenRecorder={() => setShowScreenRecorder(!showScreenRecorder)}
        />
      )}

      <div className={`app-container ${showNoteEditor && !noteEditorFullscreen ? 'with-bottom-panel' : ''}`}>
        <div className={`content-with-webcam ${(webcamFullscreen && webcamEnabled) || screenShareEnabled ? 'webcam-fullscreen' : ''}`}>
          {screenShareEnabled ? (
            <div
              className={`screen-share-fullscreen-wrapper ${screenShareWithVerses ? 'with-verses' : ''} ${isResizingScreenShare ? 'resizing' : ''}`}
              ref={screenShareWrapperRef}
            >
              <div
                className={`screen-share-section ${screenShareWithVerses ? 'half-width' : 'full-width'}`}
                style={screenShareWithVerses ? { width: `${100 - screenShareVersesWidth}%` } : undefined}
              >
                <ScreenShareDisplay
                  isVisible={screenShareEnabled}
                  isFullscreen={true}
                  onShareStopped={() => setScreenShareEnabled(false)}
                />
              </div>
              {screenShareWithVerses && (
                <>
                  <div
                    className="screen-share-resize-divider"
                    onMouseDown={handleScreenShareResizeStart}
                    title="Drag to resize"
                  />
                  <div
                    className="screen-share-verses-section"
                    style={{ width: `${screenShareVersesWidth}%` }}
                  >
                    <ChapterDisplay
                      chapter={chapter}
                      loading={loading}
                      highlightVerse={highlightVerse}
                      selectedVerse={selectedVerse}
                      navigatedVerse={navigatedVerse}
                      onLetterClick={handleLetterClick}
                      onStrongsClick={handleStrongsClick}
                      onPersonClick={personProfileEnabled ? handlePersonClick : undefined}
                      onVerseClick={handleVerseClick}
                      onYouthImageClick={youthMode ? handleYouthImageClick : undefined}
                      useProtoSinaitic={useProtoSinaitic}
                      onToggleProtoSinaitic={() => setUseProtoSinaitic(!useProtoSinaitic)}
                      youthMode={youthMode}
                      studyMode={studyMode}
                      currentBookId={currentBookId}
                      textSize={textSize}
                    />
                  </div>
                </>
              )}
            </div>
          ) : webcamFullscreen && webcamEnabled ? (
            <div className="webcam-section fullscreen">
              <WebcamDisplay
                isVisible={webcamEnabled}
                showSettings={webcamSettings}
                isFullscreen={true}
                onExitFullscreen={() => setWebcamFullscreen(false)}
              />
            </div>
          ) : (
            <>
              <div className="verses-section">
                <ChapterDisplay
                  chapter={chapter}
                  loading={loading}
                  highlightVerse={highlightVerse}
                  selectedVerse={selectedVerse}
                  navigatedVerse={navigatedVerse}
                  onLetterClick={handleLetterClick}
                  onStrongsClick={handleStrongsClick}
                  onPersonClick={personProfileEnabled ? handlePersonClick : undefined}
                  onVerseClick={handleVerseClick}
                  onYouthImageClick={youthMode ? handleYouthImageClick : undefined}
                  onVerseRightClick={handleVerseRightClick}
                  onCrossRefClick={handleCrossRefClick}
                  versesWithCrossRefs={versesWithCrossRefs}
                  getVerseHighlightColor={(verseNum) => getHighlightForVerse(verseNum)?.color}
                  getVerseTextFormatting={getTextFormattingForVerse}
                  useProtoSinaitic={useProtoSinaitic}
                  onToggleProtoSinaitic={() => setUseProtoSinaitic(!useProtoSinaitic)}
                  youthMode={youthMode}
                  studyMode={studyMode}
                  currentBookId={currentBookId}
                  textSize={textSize}
                  chapterFootnotes={chapterFootnotes}
                  showFootnotes={showFootnotes}
                  getNotesForVerse={studyMode ? getNotesForVerse : undefined}
                  onNoteClick={studyMode ? handleVerseNoteClick : undefined}
                />
              </div>

              {webcamEnabled && (
                <div className="webcam-section">
                  <WebcamDisplay isVisible={webcamEnabled} showSettings={webcamSettings} />
                </div>
              )}

              {screenShareEnabled && (
                <div className="webcam-section">
                  <ScreenShareDisplay isVisible={screenShareEnabled} isFullscreen={false} />
                </div>
              )}

              {/* Right Panel */}
              {(selectedStrongs || selectedLetter || crossRefContext) && (
                <RightPanel
                  lexiconContent={lexiconData}
                  hebrewLetterContent={selectedLetter}
                  onClose={() => {
                    setSelectedStrongs(null);
                    setSelectedLetter(null);
                    setLexiconData(null);
                    setCrossRefContext(null);
                  }}
                  onVerseClick={(bookId, chapterNum, verse) => {
                    console.log('[CrossRef Click] onVerseClick called:', { bookId, chapterNum, verse, currentBookId, currentChapter });
                    console.log('[CrossRef Click] Same chapter?', bookId === currentBookId && chapterNum === currentChapter);
                    // If already on the same chapter, just highlight and scroll
                    if (bookId === currentBookId && chapterNum === currentChapter) {
                      console.log('[CrossRef Click] Setting highlightVerse to:', verse);
                      setHighlightVerse(verse);
                      setTimeout(() => {
                        const verseElement = document.getElementById(`verse-${verse}`);
                        if (verseElement) {
                          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 100);
                    } else {
                      // Navigate to different chapter WITH the verse in the URL
                      // This ensures the URL effect sets the highlight correctly
                      console.log('[CrossRef Click] Navigating to different chapter with verse');
                      const path = getScripturePath(bookId, chapterNum, verse);
                      console.log('[CrossRef Click] Navigating to path:', path);
                      navigate(path);
                    }
                  }}
                  onStrongsClick={handleStrongsClick}
                  crossRefContext={crossRefContext}
                  notes={notes}
                  topics={topics}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                  onCreateNote={(verseRef) => {
                    if (verseRef) {
                      setNoteVerses([verseRef]);
                    }
                    setEditingNote(undefined);
                    setShowNoteEditor(true);
                  }}
                  pendingCrossRefTarget={pendingCrossRefTarget}
                  onClearPendingCrossRefTarget={() => setPendingCrossRefTarget(null)}
                  textSize={textSize}
                />
              )}

              {youthMode && selectedYouthWord && (
                <div className="youth-panel-section">
                  <YouthImagePanel
                    selectedWord={selectedYouthWord}
                    onClose={() => setSelectedYouthWord(null)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <PersonProfile
        personID={selectedPersonID}
        onClose={handleClosePersonProfile}
        onPersonClick={handlePersonClick}
      />

      {wordSearchStrongsId && (
        <WordSearchModal
          strongsId={wordSearchStrongsId}
          onClose={() => setWordSearchStrongsId(null)}
          onVerseClick={(bookId, chapter, verse) => {
            loadChapter(bookId, chapter).then(() => {
              setHighlightVerse(verse);
              setTimeout(() => {
                const verseElement = document.getElementById(`verse-${verse}`);
                if (verseElement) {
                  verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 300);
            });
          }}
        />
      )}

      {/* Media Control Panel */}
      {showMediaControl && (
        <MediaControlPanel
          onClose={() => setShowMediaControl(false)}
          onOpenDisplay={() => setShowMediaDisplay(true)}
        />
      )}

      {/* Media Display Screen */}
      {showMediaDisplay && (
        <MediaDisplayScreen
          onClose={() => setShowMediaDisplay(false)}
        />
      )}

      {/* Screen Recorder */}
      {showScreenRecorder && (
        <ScreenRecorder
          onClose={() => setShowScreenRecorder(false)}
        />
      )}

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('onboardingCompleted', 'true');
        }}
        onComplete={() => {
          setShowOnboarding(false);
          localStorage.setItem('onboardingCompleted', 'true');
        }}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onStartTour={() => {
          setShowHelpModal(false);
          setShowOnboarding(true);
        }}
      />

      {/* Help button moved to hamburger menu */}

      {/* Voice Command Button */}
      <VoiceCommandButton
        state={voiceCommands.state}
        isListening={voiceCommands.isListening}
        isSupported={voiceCommands.isSupported}
        onToggle={voiceCommands.toggleListening}
        feedback={voiceCommands.feedback}
        interimTranscript={voiceCommands.interimTranscript}
        suggestions={voiceCommands.suggestions}
      />

      {/* Text-to-Speech Button */}
      <TTSButton
        isSupported={tts.isSupported}
        isPlaying={tts.isPlaying}
        isPaused={tts.isPaused}
        currentVerse={tts.currentVerse}
        currentRepeat={tts.currentRepeat}
        totalRepeats={tts.totalRepeats}
        progress={tts.progress}
        onPlay={handleTTSReadChapter}
        onPause={tts.pause}
        onResume={tts.resume}
        onStop={tts.stop}
        onSkipNext={tts.skipToNextVerse}
        onSkipPrevious={tts.skipToPreviousVerse}
      />

      {/* Notes Panel (Sidebar) */}
      {showNotesPanel && (
        <div className="notes-panel-sidebar">
          <NotesPanel
            notes={notes}
            topics={topics}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onCreateNote={() => handleCreateNote()}
            onNavigateToVerse={navigateToNoteVerse}
            onManageTopics={() => setShowTopicsManager(true)}
            filterByVerse={notesPanelVerseFilter || undefined}
            onClearVerseFilter={handleClearNotesPanelVerseFilter}
          />
          <button
            className="notes-panel-close"
            onClick={() => {
              setShowNotesPanel(false);
              setNotesPanelVerseFilter(null);
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Note Editor - Bottom Panel or Fullscreen */}
      {showNoteEditor && (
        <NoteEditor
          note={editingNote}
          verses={noteVerses}
          topics={topics}
          onSave={handleSaveNote}
          onCancel={() => {
            setShowNoteEditor(false);
            setEditingNote(undefined);
            setNoteVerses(undefined);
            setNoteEditorFullscreen(false);
            setNoteEditorWideView(false);
          }}
          onDelete={editingNote ? () => handleDeleteNote(editingNote.id) : undefined}
          mode={noteEditorFullscreen ? 'panel' : 'bottom'}
          isFullscreen={noteEditorFullscreen}
          onToggleFullscreen={() => setNoteEditorFullscreen(!noteEditorFullscreen)}
          isWideView={noteEditorWideView}
          onToggleWideView={() => setNoteEditorWideView(!noteEditorWideView)}
        />
      )}

      {/* Topics Manager Modal */}
      {showTopicsManager && (
        <TopicsManager
          topics={topics}
          onAddTopic={handleAddTopic}
          onUpdateTopic={handleUpdateTopic}
          onDeleteTopic={handleDeleteTopic}
          onClose={() => setShowTopicsManager(false)}
        />
      )}

      {/* Verse Highlighter Popup */}
      {highlighterPosition && highlighterVerse !== null && chapter && (
        <VerseHighlighter
          currentColor={getHighlightForVerse(highlighterVerse)?.color}
          onSelectColor={(color) => handleSetHighlight(highlighterVerse, color)}
          onRemoveHighlight={() => handleRemoveHighlight(highlighterVerse)}
          onAddNote={() => {
            handleCreateNote(highlighterVerse);
            setHighlighterPosition(null);
            setHighlighterVerse(null);
          }}
          onClose={() => {
            setHighlighterPosition(null);
            setHighlighterVerse(null);
            setHighlighterSelectedText('');
            setHighlighterTextSelection(null);
            // Clear browser text selection so formatted text is visible
            window.getSelection()?.removeAllRanges();
          }}
          position={highlighterPosition}
          selectedText={highlighterSelectedText}
          textSelection={highlighterTextSelection || undefined}
          onApplyTextFormat={handleApplyTextFormat}
          onClearTextFormat={handleClearTextFormat}
          verseNum={highlighterVerse}
          bookName={chapter.bookName}
          chapterNum={chapter.chapterNum}
          bookId={currentBookId}
          verseText={getVerseTextForCopy(highlighterVerse)}
          totalVerses={chapter.kjvVerses.length}
          onCopyVerseRange={async (startVerse, endVerse) => {
            const versesToCopy = chapter.kjvVerses
              .filter(v => v.num >= startVerse && v.num <= endVerse)
              .map(v => `${v.num}. ${getVerseTextForCopy(v.num)}`)
              .join('\n');
            const reference = startVerse === endVerse
              ? `${chapter.bookName} ${chapter.chapterNum}:${startVerse}`
              : `${chapter.bookName} ${chapter.chapterNum}:${startVerse}-${endVerse}`;
            const textToCopy = `${reference}\n${versesToCopy}`;
            try {
              await navigator.clipboard.writeText(textToCopy);
            } catch (err) {
              console.error('Failed to copy verses:', err);
            }
          }}
          crossRefContext={crossRefContext}
          onAddAsCrossRef={(_targetBookId, targetBookName, targetChapter, targetVerseStart, targetVerseEnd) => {
            if (!crossRefContext) return;

            // Format the target verse reference string
            const targetRef = targetVerseEnd && targetVerseEnd !== targetVerseStart
              ? `${targetBookName} ${targetChapter}:${targetVerseStart}-${targetVerseEnd}`
              : `${targetBookName} ${targetChapter}:${targetVerseStart}`;

            // Set the pending target to open the modal in RightPanel
            setPendingCrossRefTarget(targetRef);

            // Close the highlighter
            setHighlighterPosition(null);
            setHighlighterVerse(null);
          }}
        />
      )}

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
        onForgotPassword={() => {
          setShowLoginModal(false);
          setShowForgotPasswordModal(true);
        }}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onBackToLogin={() => {
          setShowForgotPasswordModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* Admin Panel */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />

      {/* Presentation Viewer */}
      <PresentationViewer
        isOpen={showPresentation}
        onClose={() => setShowPresentation(false)}
        presentationUrl={presentationUrl}
        onUpdateUrl={handleUpdatePresentationUrl}
      />

      {/* Scripture Presentation View */}
      {showScripturePresentation && chapter && (
        <ScripturePresentationView
          bookName={chapter.bookName}
          bookId={currentBookId}
          chapterNum={chapter.chapterNum}
          verses={chapter.kjvVerses}
          onClose={() => setShowScripturePresentation(false)}
          onNavigate={(bookId, chapterNum) => {
            loadChapter(bookId, chapterNum);
          }}
          initialVerse={selectedVerse || navigatedVerse || 1}
        />
      )}

      {/* Split View for Translation Comparison */}
      {splitViewEnabled && (
        <SplitView
          bookId={currentBookId}
          chapterNum={currentChapter}
          textSize={textSize}
          highlightVerse={highlightVerse}
          onClose={() => setSplitViewEnabled(false)}
        />
      )}

      <footer className="app-footer">
        <div className="footer-content">
          <div className="logo-title-container">
            <img src="/Logo.png" alt="The Word Logo" className="footer-logo fade-element" />
            <div className="text-content fade-element">
              <p className="footer-title">THE WORD</p>
              <p className="footer-subtitle">Bible data from xmlBible.org</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Main App component with routing
function App() {
  return (
    <Routes>
      {/* Default route redirects to Genesis 1 */}
      <Route path="/" element={<Navigate to="/genesis/1" replace />} />

      {/* Scripture routes */}
      <Route path="/:book/:chapter/:verse" element={<ScriptureView />} />
      <Route path="/:book/:chapter" element={<ScriptureView />} />
      <Route path="/:book" element={<ScriptureView />} />

      {/* Fallback for invalid routes */}
      <Route path="*" element={<Navigate to="/genesis/1" replace />} />
    </Routes>
  );
}

export default App;
