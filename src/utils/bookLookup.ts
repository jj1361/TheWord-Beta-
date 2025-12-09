import { BIBLE_BOOKS, Book } from '../types/bible';

// Pre-built Map for O(1) book lookup by ID
const BOOK_BY_ID = new Map<number, Book>();
BIBLE_BOOKS.forEach(book => BOOK_BY_ID.set(book.id, book));

// Pre-built Map for O(1) book lookup by lowercase name
const BOOK_BY_NAME = new Map<string, Book>();
BIBLE_BOOKS.forEach(book => BOOK_BY_NAME.set(book.name.toLowerCase(), book));

/**
 * Get a book by its ID - O(1) lookup
 */
export function getBookById(bookId: number): Book | undefined {
  return BOOK_BY_ID.get(bookId);
}

/**
 * Get a book by its name (case-insensitive) - O(1) lookup
 */
export function getBookByName(name: string): Book | undefined {
  return BOOK_BY_NAME.get(name.toLowerCase());
}

/**
 * Check if a book ID exists - O(1) lookup
 */
export function isValidBookId(bookId: number): boolean {
  return BOOK_BY_ID.has(bookId);
}
