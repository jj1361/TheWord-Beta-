import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import SearchBox from './components/SearchBox';
import ChapterDisplay from './components/ChapterDisplay';
import RightPanel from './components/RightPanel';
import PersonProfile from './components/PersonProfile';
import WebcamDisplay from './components/WebcamDisplay';
import ScreenShareDisplay from './components/ScreenShareDisplay';
import Sidebar from './components/Sidebar';
import HistoryControls from './components/HistoryControls';
import WordSearchModal from './components/WordSearchModal';
import YouthImagePanel from './components/YouthImagePanel';
import OnboardingTour from './components/OnboardingTour';
import HelpModal from './components/HelpModal';
import NotesPanel from './components/NotesPanel';
import NoteEditor from './components/NoteEditor';
import TopicsManager from './components/TopicsManager';
import VerseHighlighter from './components/VerseHighlighter';
import { LoginModal, SignupModal, AuthButton } from './components/Auth';
import { AdminPanel } from './components/AdminPanel';
import PresentationViewer from './components/PresentationViewer';
import { useAuth } from './contexts/AuthContext';
import { bibleService } from './services/bibleService';
import { searchService } from './services/searchService';
import { lexiconService } from './services/lexiconService';
import { personService } from './services/personService';
import { notesService } from './services/notesService';
import { Chapter, BIBLE_BOOKS } from './types/bible';
import { getHebrewLetterInfo, HebrewLetterInfo } from './config/hebrewLetters';
import { WordImageMapping } from './config/youthModeConfig';
import { LexiconData } from './types/lexicon';
import { HistoryEntry, Bookmark } from './types/history';
import { Note, Topic, VerseReference, VerseHighlight, HighlightColor, RichTextContent, TextFormatting, TextFormatStyle } from './types/notes';
import { TextSelection } from './components/VerseHighlighter';
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

function App() {
  // Auth state
  const { user, isAdmin } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const [currentBookId, setCurrentBookId] = useState(1);
  const [currentChapter, setCurrentChapter] = useState(1);
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
  const [useProtoSinaitic, setUseProtoSinaitic] = useState(false);
  const [wordSearchStrongsId, setWordSearchStrongsId] = useState<string | null>(null);
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
  const [darkMode, setDarkMode] = useState(() => {
    // Load theme preference from localStorage
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [personProfileEnabled, setPersonProfileEnabled] = useState(() => {
    // Load person profile preference from localStorage (default to false/disabled)
    const saved = localStorage.getItem('personProfileEnabled');
    return saved === 'true'; // Default to false (disabled) if not set
  });

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
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showTopicsManager, setShowTopicsManager] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [noteVerses, setNoteVerses] = useState<VerseReference[] | undefined>();
  const [highlighterPosition, setHighlighterPosition] = useState<{ x: number; y: number } | null>(null);
  const [highlighterVerse, setHighlighterVerse] = useState<number | null>(null);
  const [highlighterSelectedText, setHighlighterSelectedText] = useState<string>('');
  const [highlighterTextSelection, setHighlighterTextSelection] = useState<TextSelection | null>(null);
  const [textFormatting, setTextFormatting] = useState<TextFormatting[]>(() => notesService.getTextFormatting());

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

  // Apply theme on mount and when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    // Save to localStorage
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Save youth mode preference
  useEffect(() => {
    localStorage.setItem('youthMode', youthMode.toString());
  }, [youthMode]);

  // Save study mode preference
  useEffect(() => {
    localStorage.setItem('studyMode', studyMode.toString());
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
  const loadChapterWithoutHistory = async (bookId: number, chapterNum: number, verseNum?: number) => {
    setLoading(true);
    setHighlightVerse(undefined);
    setSelectedVerse(undefined);
    setNavigatedVerse(undefined);
    try {
      const chapterData = await bibleService.loadChapter(bookId, chapterNum);

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
  };

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

  // Navigate back in history
  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const entry = navigationHistory[newIndex];
      setHistoryIndex(newIndex);

      // Load the chapter without adding to history
      loadChapterWithoutHistory(entry.bookId, entry.chapter, entry.verse);
    }
  };

  // Navigate forward in history
  const goForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const entry = navigationHistory[newIndex];
      setHistoryIndex(newIndex);

      // Load the chapter without adding to history
      loadChapterWithoutHistory(entry.bookId, entry.chapter, entry.verse);
    }
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < navigationHistory.length - 1;

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
    loadChapterWithoutHistory(bookmark.bookId, bookmark.chapter, bookmark.verse);
  };

  const navigateToHistoryEntry = (entry: HistoryEntry) => {
    const index = navigationHistory.indexOf(entry);
    if (index !== -1) {
      setHistoryIndex(index);
      loadChapterWithoutHistory(entry.bookId, entry.chapter, entry.verse);
    }
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

  const handleSetHighlight = (verseNum: number, color: HighlightColor) => {
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
    loadChapter(verse.bookId, verse.chapter).then(() => {
      setHighlightVerse(verse.startVerse);
      setTimeout(() => {
        const verseElement = document.getElementById(`verse-${verse.startVerse}`);
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    });
  };

  useEffect(() => {
    loadChapter(currentBookId, currentChapter);
  }, [currentBookId, currentChapter]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle number keys when not typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

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
          setNavigatedVerse(verseNum);
          // Scroll to verse but don't select it (no interlinear)
          const verseElement = document.getElementById(`verse-${verseNum}`);
          if (verseElement) {
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!chapter || chapter.kjvVerses.length === 0) return;

        const currentVerse = navigatedVerse || 1;
        let nextVerse: number;

        if (e.key === 'ArrowDown') {
          // Find next verse
          const currentIndex = chapter.kjvVerses.findIndex(v => v.num === currentVerse);
          if (currentIndex < chapter.kjvVerses.length - 1) {
            nextVerse = chapter.kjvVerses[currentIndex + 1].num;
          } else {
            return; // Already at last verse
          }
        } else {
          // ArrowUp - Find previous verse
          const currentIndex = chapter.kjvVerses.findIndex(v => v.num === currentVerse);
          if (currentIndex > 0) {
            nextVerse = chapter.kjvVerses[currentIndex - 1].num;
          } else {
            return; // Already at first verse
          }
        }

        setNavigatedVerse(nextVerse);
        const verseElement = document.getElementById(`verse-${nextVerse}`);
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (e.key === 'Escape') {
        // Clear selection and navigation highlight
        setSelectedVerse(undefined);
        setNavigatedVerse(undefined);
        setKeyBuffer('');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keyBuffer, chapter, navigatedVerse]);

  const loadChapter = async (bookId: number, chapterNum: number) => {
    await loadChapterWithoutHistory(bookId, chapterNum);

    // Add to navigation history after successful load
    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    if (book) {
      addToHistory(bookId, book.name, chapterNum);
    }
  };

  const handleSearch = async (query: string) => {
    // Use the optimized search service with indexing
    return await searchService.search(query, 100);
  };

  const handleSearchResultClick = (bookId: number, chapterNum: number, verseNum: number) => {
    loadChapter(bookId, chapterNum).then(() => {
      setHighlightVerse(verseNum);
      setTimeout(() => {
        const verseElement = document.getElementById(`verse-${verseNum}`);
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    });
  };

  const handleLetterClick = (letter: string) => {
    const letterInfo = getHebrewLetterInfo(letter);
    if (letterInfo) {
      setSelectedLetter(letterInfo);
    }
  };

  const handleStrongsClick = async (strongs: string) => {
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

  return (
    <div className="App">
      <Sidebar
        useProtoSinaitic={useProtoSinaitic}
        webcamEnabled={webcamEnabled}
        webcamFullscreen={webcamFullscreen}
        screenShareEnabled={screenShareEnabled}
        screenShareWithVerses={screenShareWithVerses}
        youthMode={youthMode}
        studyMode={studyMode}
        darkMode={darkMode}
        personProfileEnabled={personProfileEnabled}
        onToggleProtoSinaitic={() => setUseProtoSinaitic(!useProtoSinaitic)}
        onToggleWebcam={() => setWebcamEnabled(!webcamEnabled)}
        onToggleWebcamSettings={() => setWebcamSettings(!webcamSettings)}
        onToggleWebcamFullscreen={() => setWebcamFullscreen(!webcamFullscreen)}
        onToggleScreenShare={() => setScreenShareEnabled(!screenShareEnabled)}
        onToggleScreenShareWithVerses={() => setScreenShareWithVerses(!screenShareWithVerses)}
        onToggleYouthMode={() => setYouthMode(!youthMode)}
        onToggleStudyMode={() => setStudyMode(!studyMode)}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onTogglePersonProfile={() => setPersonProfileEnabled(!personProfileEnabled)}
        // History props
        navigationHistory={navigationHistory}
        historyIndex={historyIndex}
        onNavigateToHistoryEntry={navigateToHistoryEntry}
        onClearHistory={clearHistory}
        // Bookmarks props
        bookmarks={bookmarks}
        currentBookId={currentBookId}
        currentChapter={currentChapter}
        currentVerse={selectedVerse}
        onNavigateToBookmark={navigateToBookmark}
        onAddBookmark={addBookmark}
        onRemoveBookmark={removeBookmark}
        onUpdateBookmarkLabel={updateBookmarkLabel}
        // Notes props
        showNotesPanel={showNotesPanel}
        notesCount={notes.length}
        onToggleNotesPanel={() => setShowNotesPanel(!showNotesPanel)}
        // Presentation props
        onTogglePresentation={() => setShowPresentation(true)}
        // Auth props
        isSignedIn={!!user}
        onSignInClick={() => setShowLoginModal(true)}
      />

      {!screenShareEnabled && (
        <header className="app-header">
          <div className="header-row-1">
            <div className="header-left">
              <div className="logo-title-container">
                <a href="https://goshengroup.net"><img src="/Logo.png" alt="The Word Logo" className="app-logo fade-element" /></a>
                <div className="text-content fade-element">
                  <h1 className="app-title">THE BOOK</h1>
                  <p className="app-subtitle">Prove ALL Things...</p>
                </div>
              </div>
            </div>

            <div className="header-navigation-wrapper">
              <HistoryControls
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onGoBack={goBack}
                onGoForward={goForward}
              />
              <Navigation
                currentBookId={currentBookId}
                currentChapter={currentChapter}
                onNavigate={loadChapter}
              />
            </div>

            <div className="header-right">
              <SearchBox
                onSearch={handleSearch}
                onResultClick={handleSearchResultClick}
                onWordSearch={(strongsId) => setWordSearchStrongsId(strongsId)}
              />
              <AuthButton
                onLoginClick={() => setShowLoginModal(true)}
                onAdminClick={isAdmin ? () => setShowAdminPanel(true) : undefined}
              />
            </div>
          </div>

        </header>
      )}

      <div className="app-container">
        <div className={`content-with-webcam ${(webcamFullscreen && webcamEnabled) || screenShareEnabled ? 'webcam-fullscreen' : ''}`}>
          {screenShareEnabled ? (
            <div className={`screen-share-fullscreen-wrapper ${screenShareWithVerses ? 'with-verses' : ''}`}>
              <div className={`screen-share-section ${screenShareWithVerses ? 'half-width' : 'full-width'}`}>
                <ScreenShareDisplay
                  isVisible={screenShareEnabled}
                  isFullscreen={true}
                  onShareStopped={() => setScreenShareEnabled(false)}
                />
              </div>
              {screenShareWithVerses && (
                <div className="screen-share-verses-section">
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
                    youthMode={youthMode}
                    studyMode={studyMode}
                    totalChapters={BIBLE_BOOKS.find(b => b.id === currentBookId)?.chapters}
                    onChapterSelect={(chapterNum) => loadChapter(currentBookId, chapterNum)}
                    screenShareMode={true}
                    currentBookId={currentBookId}
                    onNavigate={loadChapter}
                    onSearch={handleSearch}
                    onSearchResultClick={handleSearchResultClick}
                    onWordSearch={(strongsId) => setWordSearchStrongsId(strongsId)}
                  />
                </div>
              )}
            </div>
          ) : webcamFullscreen && webcamEnabled ? (
            <div className="webcam-section fullscreen">
              <WebcamDisplay isVisible={webcamEnabled} showSettings={webcamSettings} isFullscreen={true} />
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
                  getVerseHighlightColor={(verseNum) => getHighlightForVerse(verseNum)?.color}
                  getVerseTextFormatting={getTextFormattingForVerse}
                  useProtoSinaitic={useProtoSinaitic}
                  youthMode={youthMode}
                  studyMode={studyMode}
                  totalChapters={BIBLE_BOOKS.find(b => b.id === currentBookId)?.chapters}
                  onChapterSelect={(chapterNum) => loadChapter(currentBookId, chapterNum)}
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

              {(selectedStrongs || selectedLetter) && (
                <RightPanel
                  lexiconContent={lexiconData}
                  hebrewLetterContent={selectedLetter}
                  onClose={() => {
                    setSelectedStrongs(null);
                    setSelectedLetter(null);
                    setLexiconData(null);
                  }}
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

      {/* Help button to open help modal */}
      {!showOnboarding && !showHelpModal && (
        <button
          className="help-tour-btn"
          onClick={() => setShowHelpModal(true)}
          title="Help & Documentation"
        >
          ?
        </button>
      )}

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
          />
          <button
            className="notes-panel-close"
            onClick={() => setShowNotesPanel(false)}
          >
            ×
          </button>
        </div>
      )}

      {/* Note Editor Modal */}
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
          }}
          onDelete={editingNote ? () => handleDeleteNote(editingNote.id) : undefined}
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
      {highlighterPosition && highlighterVerse !== null && (
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
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
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

export default App;
