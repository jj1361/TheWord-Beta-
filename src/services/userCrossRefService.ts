/**
 * User Cross Reference Service
 * Manages user-created cross references, categories, and display settings
 * Uses localStorage for persistence
 */

import {
  CrossRefCategory,
  UserCrossReference,
  CrossRefDisplaySettings,
  UserCrossRefState,
  CrossRefVerseReference,
  DEFAULT_DISPLAY_SETTINGS,
  DEFAULT_CATEGORIES,
} from '../types/crossRef';

const BASE_STORAGE_KEYS = {
  CATEGORIES: 'bible-app-crossref-categories',
  CROSS_REFS: 'bible-app-user-crossrefs',
  DISPLAY_SETTINGS: 'bible-app-crossref-settings',
};

/**
 * Service for managing user cross references, categories, and settings
 * Uses localStorage for persistence
 * Supports user-scoped storage when a userId is set
 */
class UserCrossRefService {
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
    const anonymousCategories = localStorage.getItem(BASE_STORAGE_KEYS.CATEGORIES);
    const anonymousCrossRefs = localStorage.getItem(BASE_STORAGE_KEYS.CROSS_REFS);
    const anonymousSettings = localStorage.getItem(BASE_STORAGE_KEYS.DISPLAY_SETTINGS);

    const userCategoriesKey = `user-${userId}-${BASE_STORAGE_KEYS.CATEGORIES}`;
    const userHasData = localStorage.getItem(userCategoriesKey) !== null;

    if (!userHasData) {
      if (anonymousCategories) {
        localStorage.setItem(userCategoriesKey, anonymousCategories);
      }
      if (anonymousCrossRefs) {
        localStorage.setItem(`user-${userId}-${BASE_STORAGE_KEYS.CROSS_REFS}`, anonymousCrossRefs);
      }
      if (anonymousSettings) {
        localStorage.setItem(`user-${userId}-${BASE_STORAGE_KEYS.DISPLAY_SETTINGS}`, anonymousSettings);
      }
    }
  }

  // ============ CATEGORIES ============

  /**
   * Get all categories from storage
   */
  getCategories(): CrossRefCategory[] {
    try {
      const key = this.getStorageKey(BASE_STORAGE_KEYS.CATEGORIES);
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize with default categories on first load
      const defaultCategories: CrossRefCategory[] = DEFAULT_CATEGORIES.map((c, index) => ({
        ...c,
        id: this.generateId(),
        sortOrder: index,
        timestamp: Date.now(),
      }));
      this.saveCategories(defaultCategories);
      return defaultCategories;
    } catch {
      return [];
    }
  }

  /**
   * Save categories to storage
   */
  private saveCategories(categories: CrossRefCategory[]): void {
    const key = this.getStorageKey(BASE_STORAGE_KEYS.CATEGORIES);
    localStorage.setItem(key, JSON.stringify(categories));
  }

  /**
   * Add a new category
   */
  addCategory(name: string, color: string, description?: string): CrossRefCategory {
    const categories = this.getCategories();
    const maxSortOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder), -1);

    const newCategory: CrossRefCategory = {
      id: this.generateId(),
      name,
      color,
      description,
      sortOrder: maxSortOrder + 1,
      timestamp: Date.now(),
    };
    categories.push(newCategory);
    this.saveCategories(categories);
    return newCategory;
  }

  /**
   * Update an existing category
   */
  updateCategory(
    id: string,
    updates: Partial<Omit<CrossRefCategory, 'id' | 'timestamp'>>
  ): CrossRefCategory | null {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) return null;

    categories[index] = {
      ...categories[index],
      ...updates,
      updatedAt: Date.now(),
    };
    this.saveCategories(categories);
    return categories[index];
  }

  /**
   * Delete a category (also removes it from all cross references)
   */
  deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    const filtered = categories.filter((c) => c.id !== id);
    if (filtered.length === categories.length) return false;
    this.saveCategories(filtered);

    // Remove category from all cross references
    const crossRefs = this.getCrossRefs();
    const updatedCrossRefs = crossRefs.map((ref) => ({
      ...ref,
      categoryId: ref.categoryId === id ? undefined : ref.categoryId,
    }));
    this.saveCrossRefs(updatedCrossRefs);

    // Remove from category sort order in display settings
    const settings = this.getDisplaySettings();
    if (settings.categorySortOrder.includes(id)) {
      settings.categorySortOrder = settings.categorySortOrder.filter((cid) => cid !== id);
      this.saveDisplaySettings(settings);
    }

    return true;
  }

  /**
   * Get a category by ID
   */
  getCategory(id: string): CrossRefCategory | undefined {
    return this.getCategories().find((c) => c.id === id);
  }

  /**
   * Reorder categories
   */
  reorderCategories(categoryIds: string[]): void {
    const categories = this.getCategories();
    const reordered: CrossRefCategory[] = [];

    categoryIds.forEach((id, index) => {
      const category = categories.find((c) => c.id === id);
      if (category) {
        reordered.push({ ...category, sortOrder: index, updatedAt: Date.now() });
      }
    });

    // Include any categories not in the reorder list at the end
    const includedIds = new Set(categoryIds);
    const remaining: CrossRefCategory[] = categories
      .filter((c) => !includedIds.has(c.id))
      .map((c, index) => ({ ...c, sortOrder: reordered.length + index }));

    this.saveCategories([...reordered, ...remaining]);
  }

  // ============ CROSS REFERENCES ============

  /**
   * Get all cross references from storage
   */
  getCrossRefs(): UserCrossReference[] {
    try {
      const key = this.getStorageKey(BASE_STORAGE_KEYS.CROSS_REFS);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save cross references to storage
   */
  private saveCrossRefs(crossRefs: UserCrossReference[]): void {
    const key = this.getStorageKey(BASE_STORAGE_KEYS.CROSS_REFS);
    localStorage.setItem(key, JSON.stringify(crossRefs));
  }

  /**
   * Add a new cross reference
   */
  addCrossRef(
    sourceVerse: CrossRefVerseReference,
    targetVerse: CrossRefVerseReference,
    categoryId?: string,
    word?: string,
    note?: string
  ): UserCrossReference {
    const crossRefs = this.getCrossRefs();

    // Get max sort order for this source verse
    const verseCrossRefs = crossRefs.filter(
      (r) =>
        r.sourceVerse.bookId === sourceVerse.bookId &&
        r.sourceVerse.chapter === sourceVerse.chapter &&
        r.sourceVerse.verse === sourceVerse.verse
    );
    const maxSortOrder = verseCrossRefs.reduce((max, r) => Math.max(max, r.sortOrder), -1);

    const newCrossRef: UserCrossReference = {
      id: this.generateId(),
      sourceVerse,
      targetVerse,
      categoryId,
      word,
      note,
      sortOrder: maxSortOrder + 1,
      timestamp: Date.now(),
    };
    crossRefs.push(newCrossRef);
    this.saveCrossRefs(crossRefs);
    return newCrossRef;
  }

  /**
   * Update an existing cross reference
   */
  updateCrossRef(
    id: string,
    updates: Partial<Omit<UserCrossReference, 'id' | 'timestamp' | 'sourceVerse'>>
  ): UserCrossReference | null {
    const crossRefs = this.getCrossRefs();
    const index = crossRefs.findIndex((r) => r.id === id);
    if (index === -1) return null;

    crossRefs[index] = {
      ...crossRefs[index],
      ...updates,
      updatedAt: Date.now(),
    };
    this.saveCrossRefs(crossRefs);
    return crossRefs[index];
  }

  /**
   * Delete a cross reference
   */
  deleteCrossRef(id: string): boolean {
    const crossRefs = this.getCrossRefs();
    const filtered = crossRefs.filter((r) => r.id !== id);
    if (filtered.length === crossRefs.length) return false;
    this.saveCrossRefs(filtered);
    return true;
  }

  /**
   * Get cross references for a specific source verse
   */
  getCrossRefsForVerse(
    bookId: number,
    chapter: number,
    verse: number
  ): UserCrossReference[] {
    const crossRefs = this.getCrossRefs();
    return crossRefs
      .filter(
        (r) =>
          r.sourceVerse.bookId === bookId &&
          r.sourceVerse.chapter === chapter &&
          r.sourceVerse.verse === verse
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get all cross references for a chapter
   */
  getCrossRefsForChapter(
    bookId: number,
    chapter: number
  ): Map<number, UserCrossReference[]> {
    const crossRefs = this.getCrossRefs();
    const result = new Map<number, UserCrossReference[]>();

    crossRefs
      .filter(
        (r) =>
          r.sourceVerse.bookId === bookId &&
          r.sourceVerse.chapter === chapter
      )
      .forEach((r) => {
        const verse = r.sourceVerse.verse;
        const existing = result.get(verse) || [];
        existing.push(r);
        result.set(verse, existing.sort((a, b) => a.sortOrder - b.sortOrder));
      });

    return result;
  }

  /**
   * Get cross references by category
   */
  getCrossRefsByCategory(categoryId: string): UserCrossReference[] {
    const crossRefs = this.getCrossRefs();
    return crossRefs.filter((r) => r.categoryId === categoryId);
  }

  /**
   * Reorder cross references for a verse
   */
  reorderCrossRefs(verseKey: string, crossRefIds: string[]): void {
    const crossRefs = this.getCrossRefs();
    const updated = crossRefs.map((r) => {
      const newIndex = crossRefIds.indexOf(r.id);
      if (newIndex !== -1) {
        return { ...r, sortOrder: newIndex, updatedAt: Date.now() };
      }
      return r;
    });
    this.saveCrossRefs(updated);
  }

  // ============ DISPLAY SETTINGS ============

  /**
   * Get display settings from storage
   */
  getDisplaySettings(): CrossRefDisplaySettings {
    try {
      const key = this.getStorageKey(BASE_STORAGE_KEYS.DISPLAY_SETTINGS);
      const stored = localStorage.getItem(key);
      if (stored) {
        return { ...DEFAULT_DISPLAY_SETTINGS, ...JSON.parse(stored) };
      }
      return { ...DEFAULT_DISPLAY_SETTINGS };
    } catch {
      return { ...DEFAULT_DISPLAY_SETTINGS };
    }
  }

  /**
   * Save display settings to storage
   */
  saveDisplaySettings(settings: CrossRefDisplaySettings): void {
    const key = this.getStorageKey(BASE_STORAGE_KEYS.DISPLAY_SETTINGS);
    localStorage.setItem(key, JSON.stringify(settings));
  }

  /**
   * Update display settings
   */
  updateDisplaySettings(
    updates: Partial<CrossRefDisplaySettings>
  ): CrossRefDisplaySettings {
    const settings = this.getDisplaySettings();
    const newSettings = { ...settings, ...updates };
    this.saveDisplaySettings(newSettings);
    return newSettings;
  }

  // ============ FORMAT HELPERS ============

  /**
   * Format a verse reference for display
   */
  formatVerseReference(ref: CrossRefVerseReference): string {
    if (ref.verseEnd && ref.verseEnd !== ref.verse) {
      return `${ref.bookName} ${ref.chapter}:${ref.verse}-${ref.verseEnd}`;
    }
    return `${ref.bookName} ${ref.chapter}:${ref.verse}`;
  }

  /**
   * Format a short verse reference for display
   */
  formatShortVerseReference(ref: CrossRefVerseReference): string {
    const shortNames: Record<number, string> = {
      1: 'Gen', 2: 'Exo', 3: 'Lev', 4: 'Num', 5: 'Deu',
      6: 'Jos', 7: 'Jdg', 8: 'Rut', 9: '1Sa', 10: '2Sa',
      11: '1Ki', 12: '2Ki', 13: '1Ch', 14: '2Ch', 15: 'Ezr',
      16: 'Neh', 17: 'Est', 18: 'Job', 19: 'Psa', 20: 'Pro',
      21: 'Ecc', 22: 'Son', 23: 'Isa', 24: 'Jer', 25: 'Lam',
      26: 'Eze', 27: 'Dan', 28: 'Hos', 29: 'Joe', 30: 'Amo',
      31: 'Oba', 32: 'Jon', 33: 'Mic', 34: 'Nah', 35: 'Hab',
      36: 'Zep', 37: 'Hag', 38: 'Zec', 39: 'Mal',
      40: 'Mat', 41: 'Mar', 42: 'Luk', 43: 'Joh', 44: 'Act',
      45: 'Rom', 46: '1Co', 47: '2Co', 48: 'Gal', 49: 'Eph',
      50: 'Php', 51: 'Col', 52: '1Th', 53: '2Th', 54: '1Ti',
      55: '2Ti', 56: 'Tit', 57: 'Phm', 58: 'Heb', 59: 'Jas',
      60: '1Pe', 61: '2Pe', 62: '1Jo', 63: '2Jo', 64: '3Jo',
      65: 'Jud', 66: 'Rev'
    };
    const shortName = shortNames[ref.bookId] || ref.bookName;

    if (ref.verseEnd && ref.verseEnd !== ref.verse) {
      return `${shortName} ${ref.chapter}:${ref.verse}-${ref.verseEnd}`;
    }
    return `${shortName} ${ref.chapter}:${ref.verse}`;
  }

  // ============ EXPORT/IMPORT ============

  /**
   * Export all user cross reference data
   */
  exportData(): UserCrossRefState {
    return {
      categories: this.getCategories(),
      crossRefs: this.getCrossRefs(),
      displaySettings: this.getDisplaySettings(),
    };
  }

  /**
   * Import user cross reference data
   */
  importData(data: UserCrossRefState): void {
    if (data.categories) this.saveCategories(data.categories);
    if (data.crossRefs) this.saveCrossRefs(data.crossRefs);
    if (data.displaySettings) this.saveDisplaySettings(data.displaySettings);
  }

  /**
   * Clear all user cross reference data
   */
  clearAllData(): void {
    localStorage.removeItem(this.getStorageKey(BASE_STORAGE_KEYS.CATEGORIES));
    localStorage.removeItem(this.getStorageKey(BASE_STORAGE_KEYS.CROSS_REFS));
    localStorage.removeItem(this.getStorageKey(BASE_STORAGE_KEYS.DISPLAY_SETTINGS));
  }
}

export const userCrossRefService = new UserCrossRefService();
