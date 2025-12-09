import {
  Note,
  VerseHighlight,
  Topic,
  NotesState,
  VerseReference,
  HighlightColor,
  RichTextContent,
  DEFAULT_TOPICS,
  TextFormatting,
  TextFormatStyle,
} from '../types/notes';

const BASE_STORAGE_KEYS = {
  NOTES: 'bible-app-notes',
  HIGHLIGHTS: 'bible-app-highlights',
  TOPICS: 'bible-app-topics',
  TEXT_FORMATTING: 'bible-app-text-formatting',
};

/**
 * Service for managing notes, highlights, and topics
 * Uses localStorage for persistence
 * Supports user-scoped storage when a userId is set
 */
class NotesService {
  private currentUserId: string | null = null;

  /**
   * Set the current user ID for user-scoped storage
   * Pass null to use anonymous/global storage
   */
  setCurrentUserId(userId: string | null): void {
    this.currentUserId = userId;
  }

  /**
   * Get the current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Get the storage key with optional user prefix
   */
  private getStorageKey(baseKey: string): string {
    if (this.currentUserId) {
      return `user-${this.currentUserId}-${baseKey}`;
    }
    return baseKey;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Migrate anonymous data to user-scoped storage
   * Call this when a user logs in for the first time
   */
  migrateAnonymousDataToUser(userId: string): void {
    // Get anonymous data
    const anonymousNotes = localStorage.getItem(BASE_STORAGE_KEYS.NOTES);
    const anonymousHighlights = localStorage.getItem(BASE_STORAGE_KEYS.HIGHLIGHTS);
    const anonymousTopics = localStorage.getItem(BASE_STORAGE_KEYS.TOPICS);
    const anonymousFormatting = localStorage.getItem(BASE_STORAGE_KEYS.TEXT_FORMATTING);

    // Check if user already has data
    const userNotesKey = `user-${userId}-${BASE_STORAGE_KEYS.NOTES}`;
    const userHasData = localStorage.getItem(userNotesKey) !== null;

    if (!userHasData) {
      // Migrate anonymous data to user storage
      if (anonymousNotes) {
        localStorage.setItem(userNotesKey, anonymousNotes);
      }
      if (anonymousHighlights) {
        localStorage.setItem(`user-${userId}-${BASE_STORAGE_KEYS.HIGHLIGHTS}`, anonymousHighlights);
      }
      if (anonymousTopics) {
        localStorage.setItem(`user-${userId}-${BASE_STORAGE_KEYS.TOPICS}`, anonymousTopics);
      }
      if (anonymousFormatting) {
        localStorage.setItem(`user-${userId}-${BASE_STORAGE_KEYS.TEXT_FORMATTING}`, anonymousFormatting);
      }
    }
  }

  /**
   * Create an OSIS reference string from verse reference
   */
  createOsisRef(ref: Omit<VerseReference, 'osisRef'>): string {
    const bookCode = ref.bookName.replace(/\s+/g, '');
    if (ref.endVerse && ref.endVerse !== ref.startVerse) {
      return `${bookCode}.${ref.chapter}.${ref.startVerse}-${ref.endVerse}`;
    }
    return `${bookCode}.${ref.chapter}.${ref.startVerse}`;
  }

  // ============ NOTES ============

  /**
   * Get all notes from storage
   */
  getNotes(): Note[] {
    try {
      const key = this.getStorageKey(BASE_STORAGE_KEYS.NOTES);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save notes to storage
   */
  private saveNotes(notes: Note[]): void {
    const key = this.getStorageKey(BASE_STORAGE_KEYS.NOTES);
    localStorage.setItem(key, JSON.stringify(notes));
  }

  /**
   * Add a new note
   */
  addNote(
    content: RichTextContent,
    verses?: VerseReference[],
    topicIds?: string[],
    title?: string
  ): Note {
    const notes = this.getNotes();
    const newNote: Note = {
      id: this.generateId(),
      title,
      content,
      verses,
      topicIds,
      timestamp: Date.now(),
    };
    notes.push(newNote);
    this.saveNotes(notes);
    return newNote;
  }

  /**
   * Update an existing note
   */
  updateNote(
    id: string,
    updates: Partial<Omit<Note, 'id' | 'timestamp'>>
  ): Note | null {
    const notes = this.getNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) return null;

    notes[index] = {
      ...notes[index],
      ...updates,
      updatedAt: Date.now(),
    };
    this.saveNotes(notes);
    return notes[index];
  }

  /**
   * Delete a note
   */
  deleteNote(id: string): boolean {
    const notes = this.getNotes();
    const filtered = notes.filter((n) => n.id !== id);
    if (filtered.length === notes.length) return false;
    this.saveNotes(filtered);
    return true;
  }

  /**
   * Get notes for a specific verse
   */
  getNotesForVerse(
    bookId: number,
    chapter: number,
    verse: number
  ): Note[] {
    const notes = this.getNotes();
    return notes.filter((note) =>
      note.verses?.some(
        (ref) =>
          ref.bookId === bookId &&
          ref.chapter === chapter &&
          verse >= ref.startVerse &&
          verse <= (ref.endVerse || ref.startVerse)
      )
    );
  }

  /**
   * Get notes for a specific topic
   */
  getNotesForTopic(topicId: string): Note[] {
    const notes = this.getNotes();
    return notes.filter((note) => note.topicIds?.includes(topicId));
  }

  // ============ HIGHLIGHTS ============

  /**
   * Get all highlights from storage
   */
  getHighlights(): VerseHighlight[] {
    try {
      const key = this.getStorageKey(BASE_STORAGE_KEYS.HIGHLIGHTS);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save highlights to storage
   */
  private saveHighlights(highlights: VerseHighlight[]): void {
    const key = this.getStorageKey(BASE_STORAGE_KEYS.HIGHLIGHTS);
    localStorage.setItem(key, JSON.stringify(highlights));
  }

  /**
   * Add or update a highlight for verses
   */
  setHighlight(verses: VerseReference, color: HighlightColor): VerseHighlight {
    const highlights = this.getHighlights();

    // Check if highlight exists for these verses
    const existingIndex = highlights.findIndex(
      (h) =>
        h.verses.bookId === verses.bookId &&
        h.verses.chapter === verses.chapter &&
        h.verses.startVerse === verses.startVerse &&
        h.verses.endVerse === verses.endVerse
    );

    if (existingIndex !== -1) {
      // Update existing highlight
      highlights[existingIndex].color = color;
      highlights[existingIndex].updatedAt = Date.now();
      this.saveHighlights(highlights);
      return highlights[existingIndex];
    }

    // Create new highlight
    const newHighlight: VerseHighlight = {
      id: this.generateId(),
      verses,
      color,
      timestamp: Date.now(),
    };
    highlights.push(newHighlight);
    this.saveHighlights(highlights);
    return newHighlight;
  }

  /**
   * Remove a highlight
   */
  removeHighlight(id: string): boolean {
    const highlights = this.getHighlights();
    const filtered = highlights.filter((h) => h.id !== id);
    if (filtered.length === highlights.length) return false;
    this.saveHighlights(filtered);
    return true;
  }

  /**
   * Remove highlight for specific verses
   */
  removeHighlightForVerses(
    bookId: number,
    chapter: number,
    startVerse: number,
    endVerse?: number
  ): boolean {
    const highlights = this.getHighlights();
    const filtered = highlights.filter(
      (h) =>
        !(
          h.verses.bookId === bookId &&
          h.verses.chapter === chapter &&
          h.verses.startVerse === startVerse &&
          h.verses.endVerse === endVerse
        )
    );
    if (filtered.length === highlights.length) return false;
    this.saveHighlights(filtered);
    return true;
  }

  /**
   * Get highlight for a specific verse
   */
  getHighlightForVerse(
    bookId: number,
    chapter: number,
    verse: number
  ): VerseHighlight | undefined {
    const highlights = this.getHighlights();
    return highlights.find(
      (h) =>
        h.verses.bookId === bookId &&
        h.verses.chapter === chapter &&
        verse >= h.verses.startVerse &&
        verse <= (h.verses.endVerse || h.verses.startVerse)
    );
  }

  /**
   * Get all highlights for a chapter
   */
  getHighlightsForChapter(
    bookId: number,
    chapter: number
  ): VerseHighlight[] {
    const highlights = this.getHighlights();
    return highlights.filter(
      (h) => h.verses.bookId === bookId && h.verses.chapter === chapter
    );
  }

  // ============ TOPICS ============

  /**
   * Get all topics from storage
   */
  getTopics(): Topic[] {
    try {
      const key = this.getStorageKey(BASE_STORAGE_KEYS.TOPICS);
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize with default topics on first load
      const defaultTopics: Topic[] = DEFAULT_TOPICS.map((t) => ({
        ...t,
        id: this.generateId(),
        timestamp: Date.now(),
      }));
      this.saveTopics(defaultTopics);
      return defaultTopics;
    } catch {
      return [];
    }
  }

  /**
   * Save topics to storage
   */
  private saveTopics(topics: Topic[]): void {
    const key = this.getStorageKey(BASE_STORAGE_KEYS.TOPICS);
    localStorage.setItem(key, JSON.stringify(topics));
  }

  /**
   * Add a new topic
   */
  addTopic(name: string, color?: string, description?: string): Topic {
    const topics = this.getTopics();
    const newTopic: Topic = {
      id: this.generateId(),
      name,
      color,
      description,
      timestamp: Date.now(),
    };
    topics.push(newTopic);
    this.saveTopics(topics);
    return newTopic;
  }

  /**
   * Update an existing topic
   */
  updateTopic(
    id: string,
    updates: Partial<Omit<Topic, 'id' | 'timestamp'>>
  ): Topic | null {
    const topics = this.getTopics();
    const index = topics.findIndex((t) => t.id === id);
    if (index === -1) return null;

    topics[index] = {
      ...topics[index],
      ...updates,
      updatedAt: Date.now(),
    };
    this.saveTopics(topics);
    return topics[index];
  }

  /**
   * Delete a topic (also removes it from all notes)
   */
  deleteTopic(id: string): boolean {
    const topics = this.getTopics();
    const filtered = topics.filter((t) => t.id !== id);
    if (filtered.length === topics.length) return false;
    this.saveTopics(filtered);

    // Remove topic from all notes
    const notes = this.getNotes();
    const updatedNotes = notes.map((note) => ({
      ...note,
      topicIds: note.topicIds?.filter((tid) => tid !== id),
    }));
    this.saveNotes(updatedNotes);

    return true;
  }

  /**
   * Get a topic by ID
   */
  getTopic(id: string): Topic | undefined {
    return this.getTopics().find((t) => t.id === id);
  }

  // ============ TEXT FORMATTING ============

  /**
   * Get all text formatting from storage
   */
  getTextFormatting(): TextFormatting[] {
    try {
      const key = this.getStorageKey(BASE_STORAGE_KEYS.TEXT_FORMATTING);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save text formatting to storage
   */
  private saveTextFormatting(formatting: TextFormatting[]): void {
    const key = this.getStorageKey(BASE_STORAGE_KEYS.TEXT_FORMATTING);
    localStorage.setItem(key, JSON.stringify(formatting));
  }

  /**
   * Add text formatting to a verse (supports toggling)
   */
  addTextFormatting(
    bookId: number,
    chapter: number,
    verse: number,
    startOffset: number,
    endOffset: number,
    selectedText: string,
    style: TextFormatStyle
  ): TextFormatting | null {
    const formatting = this.getTextFormatting();

    // Check for overlapping formatting - find entries that overlap with the selected range
    // This allows toggling even when the selection isn't exactly the same
    const existingIndex = formatting.findIndex(
      (f) =>
        f.bookId === bookId &&
        f.chapter === chapter &&
        f.verse === verse &&
        // Check for overlap: ranges overlap if start1 < end2 AND start2 < end1
        f.startOffset < endOffset &&
        startOffset < f.endOffset &&
        // Also check if the selected text matches or is contained in the existing formatting
        (f.selectedText === selectedText ||
         f.selectedText.includes(selectedText) ||
         selectedText.includes(f.selectedText))
    );

    if (existingIndex !== -1) {
      const existing = formatting[existingIndex];

      // Toggle boolean styles (bold, italic, underline)
      const newStyle = { ...existing.style };

      if (style.bold !== undefined) {
        newStyle.bold = existing.style.bold ? false : true;
      }
      if (style.italic !== undefined) {
        newStyle.italic = existing.style.italic ? false : true;
      }
      if (style.underline !== undefined) {
        newStyle.underline = existing.style.underline ? false : true;
      }
      // Colors don't toggle - they replace or reset
      if (style.fontColor !== undefined) {
        newStyle.fontColor = style.fontColor === 'inherit' ? undefined : style.fontColor;
      }
      if (style.backgroundColor !== undefined) {
        newStyle.backgroundColor = style.backgroundColor;
      }

      // Check if all styles are now empty/false - if so, remove the formatting
      const hasActiveStyle = newStyle.bold || newStyle.italic || newStyle.underline ||
        (newStyle.fontColor && newStyle.fontColor !== 'inherit') ||
        (newStyle.backgroundColor && newStyle.backgroundColor !== 'transparent');

      if (!hasActiveStyle) {
        // Remove the formatting entry entirely
        formatting.splice(existingIndex, 1);
        this.saveTextFormatting(formatting);
        return null;
      }

      formatting[existingIndex].style = newStyle;
      formatting[existingIndex].updatedAt = Date.now();
      this.saveTextFormatting(formatting);
      return formatting[existingIndex];
    }

    const newFormatting: TextFormatting = {
      id: this.generateId(),
      bookId,
      chapter,
      verse,
      startOffset,
      endOffset,
      selectedText,
      style,
      timestamp: Date.now(),
    };
    formatting.push(newFormatting);
    this.saveTextFormatting(formatting);
    return newFormatting;
  }

  /**
   * Remove text formatting by ID
   */
  removeTextFormatting(id: string): boolean {
    const formatting = this.getTextFormatting();
    const filtered = formatting.filter((f) => f.id !== id);
    if (filtered.length === formatting.length) return false;
    this.saveTextFormatting(filtered);
    return true;
  }

  /**
   * Get all text formatting for a specific verse
   */
  getTextFormattingForVerse(
    bookId: number,
    chapter: number,
    verse: number
  ): TextFormatting[] {
    const formatting = this.getTextFormatting();
    return formatting.filter(
      (f) => f.bookId === bookId && f.chapter === chapter && f.verse === verse
    );
  }

  /**
   * Get all text formatting for a chapter
   */
  getTextFormattingForChapter(
    bookId: number,
    chapter: number
  ): TextFormatting[] {
    const formatting = this.getTextFormatting();
    return formatting.filter(
      (f) => f.bookId === bookId && f.chapter === chapter
    );
  }

  /**
   * Clear all text formatting for a verse
   */
  clearTextFormattingForVerse(
    bookId: number,
    chapter: number,
    verse: number
  ): void {
    const formatting = this.getTextFormatting();
    const filtered = formatting.filter(
      (f) => !(f.bookId === bookId && f.chapter === chapter && f.verse === verse)
    );
    this.saveTextFormatting(filtered);
  }

  /**
   * Clear text formatting for a specific text range (overlapping selections)
   */
  clearTextFormattingForRange(
    bookId: number,
    chapter: number,
    verse: number,
    startOffset: number,
    endOffset: number,
    selectedText: string
  ): boolean {
    const formatting = this.getTextFormatting();
    const initialLength = formatting.length;

    // Remove any formatting that overlaps with the selected range
    const filtered = formatting.filter(
      (f) => !(
        f.bookId === bookId &&
        f.chapter === chapter &&
        f.verse === verse &&
        // Check for overlap
        f.startOffset < endOffset &&
        startOffset < f.endOffset &&
        // Also check text match
        (f.selectedText === selectedText ||
         f.selectedText.includes(selectedText) ||
         selectedText.includes(f.selectedText))
      )
    );

    if (filtered.length !== initialLength) {
      this.saveTextFormatting(filtered);
      return true;
    }
    return false;
  }

  // ============ EXPORT/IMPORT ============

  /**
   * Export all notes data
   */
  exportData(): NotesState {
    return {
      notes: this.getNotes(),
      highlights: this.getHighlights(),
      topics: this.getTopics(),
      textFormatting: this.getTextFormatting(),
    };
  }

  /**
   * Import notes data
   */
  importData(data: NotesState): void {
    if (data.notes) this.saveNotes(data.notes);
    if (data.highlights) this.saveHighlights(data.highlights);
    if (data.topics) this.saveTopics(data.topics);
    if (data.textFormatting) this.saveTextFormatting(data.textFormatting);
  }

  /**
   * Clear all notes data
   */
  clearAllData(): void {
    localStorage.removeItem(this.getStorageKey(BASE_STORAGE_KEYS.NOTES));
    localStorage.removeItem(this.getStorageKey(BASE_STORAGE_KEYS.HIGHLIGHTS));
    localStorage.removeItem(this.getStorageKey(BASE_STORAGE_KEYS.TOPICS));
    localStorage.removeItem(this.getStorageKey(BASE_STORAGE_KEYS.TEXT_FORMATTING));
  }
}

export const notesService = new NotesService();
