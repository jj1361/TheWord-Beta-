/**
 * Keyboard Shortcuts Configuration
 *
 * This file defines all keyboard shortcuts used in the application.
 * Shortcuts can use modifiers: ctrl, alt, shift, meta (Cmd on Mac)
 */

export interface KeyboardShortcut {
  key: string;           // The key to press (lowercase)
  ctrl?: boolean;        // Requires Ctrl key
  alt?: boolean;         // Requires Alt key
  shift?: boolean;       // Requires Shift key
  meta?: boolean;        // Requires Meta/Cmd key
  description: string;   // Human-readable description
  action: string;        // Action identifier
}

// Shortcut action identifiers
export const ShortcutActions = {
  TOGGLE_WEBCAM: 'toggleWebcam',
  TOGGLE_WEBCAM_FULLSCREEN: 'toggleWebcamFullscreen',
  TOGGLE_SCREEN_SHARE: 'toggleScreenShare',
  TOGGLE_SCREEN_SHARE_VERSES: 'toggleScreenShareVerses',
  TOGGLE_DARK_MODE: 'toggleDarkMode',
  TOGGLE_STUDY_MODE: 'toggleStudyMode',
  TOGGLE_YOUTH_MODE: 'toggleYouthMode',
  CLEAR_SELECTION: 'clearSelection',
  NAVIGATE_VERSE_UP: 'navigateVerseUp',
  NAVIGATE_VERSE_DOWN: 'navigateVerseDown',
  INCREASE_TEXT_SIZE: 'increaseTextSize',
  DECREASE_TEXT_SIZE: 'decreaseTextSize',
} as const;

export type ShortcutAction = typeof ShortcutActions[keyof typeof ShortcutActions];

// All keyboard shortcuts
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Media shortcuts
  {
    key: 'w',
    ctrl: true,
    description: 'Toggle webcam',
    action: ShortcutActions.TOGGLE_WEBCAM,
  },
  {
    key: 'f',
    ctrl: true,
    description: 'Toggle webcam fullscreen',
    action: ShortcutActions.TOGGLE_WEBCAM_FULLSCREEN,
  },
  {
    key: 's',
    ctrl: true,
    shift: true,
    description: 'Toggle screen share',
    action: ShortcutActions.TOGGLE_SCREEN_SHARE,
  },
  {
    key: 'v',
    ctrl: true,
    shift: true,
    description: 'Toggle verses panel (screen share)',
    action: ShortcutActions.TOGGLE_SCREEN_SHARE_VERSES,
  },

  // Display shortcuts
  {
    key: 'd',
    ctrl: true,
    description: 'Toggle dark mode',
    action: ShortcutActions.TOGGLE_DARK_MODE,
  },

  // Navigation shortcuts
  {
    key: 'escape',
    description: 'Clear verse selection',
    action: ShortcutActions.CLEAR_SELECTION,
  },
  {
    key: 'arrowup',
    description: 'Navigate to previous verse',
    action: ShortcutActions.NAVIGATE_VERSE_UP,
  },
  {
    key: 'arrowdown',
    description: 'Navigate to next verse',
    action: ShortcutActions.NAVIGATE_VERSE_DOWN,
  },

  // Text size shortcuts
  {
    key: '=',
    ctrl: true,
    description: 'Increase text size',
    action: ShortcutActions.INCREASE_TEXT_SIZE,
  },
  {
    key: '-',
    ctrl: true,
    description: 'Decrease text size',
    action: ShortcutActions.DECREASE_TEXT_SIZE,
  },
];

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const key = event.key.toLowerCase();

  // Check if the key matches
  if (key !== shortcut.key.toLowerCase()) {
    return false;
  }

  // Check modifiers
  if (shortcut.ctrl && !event.ctrlKey) return false;
  if (shortcut.alt && !event.altKey) return false;
  if (shortcut.shift && !event.shiftKey) return false;
  if (shortcut.meta && !event.metaKey) return false;

  // If shortcut doesn't require a modifier, make sure none are pressed (except for special keys)
  const isSpecialKey = ['escape', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key);
  if (!isSpecialKey) {
    if (!shortcut.ctrl && event.ctrlKey) return false;
    if (!shortcut.alt && event.altKey) return false;
    if (!shortcut.shift && event.shiftKey) return false;
    if (!shortcut.meta && event.metaKey) return false;
  }

  return true;
}

/**
 * Find the action for a keyboard event
 */
export function getShortcutAction(event: KeyboardEvent): ShortcutAction | null {
  for (const shortcut of KEYBOARD_SHORTCUTS) {
    if (matchesShortcut(event, shortcut)) {
      return shortcut.action as ShortcutAction;
    }
  }
  return null;
}

/**
 * Get a human-readable string for a shortcut (e.g., "Ctrl+W")
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.meta) parts.push('Cmd');

  // Format the key nicely
  let keyDisplay = shortcut.key.toUpperCase();
  if (shortcut.key === 'arrowup') keyDisplay = '↑';
  if (shortcut.key === 'arrowdown') keyDisplay = '↓';
  if (shortcut.key === 'arrowleft') keyDisplay = '←';
  if (shortcut.key === 'arrowright') keyDisplay = '→';
  if (shortcut.key === 'escape') keyDisplay = 'Esc';
  if (shortcut.key === '=') keyDisplay = '+';
  if (shortcut.key === '-') keyDisplay = '−';

  parts.push(keyDisplay);

  return parts.join('+');
}

/**
 * Get all shortcuts grouped by category
 */
export function getShortcutsByCategory(): Record<string, KeyboardShortcut[]> {
  const mediaActions: string[] = [ShortcutActions.TOGGLE_WEBCAM, ShortcutActions.TOGGLE_WEBCAM_FULLSCREEN, ShortcutActions.TOGGLE_SCREEN_SHARE, ShortcutActions.TOGGLE_SCREEN_SHARE_VERSES];
  const displayActions: string[] = [ShortcutActions.TOGGLE_DARK_MODE, ShortcutActions.INCREASE_TEXT_SIZE, ShortcutActions.DECREASE_TEXT_SIZE];
  const navigationActions: string[] = [ShortcutActions.CLEAR_SELECTION, ShortcutActions.NAVIGATE_VERSE_UP, ShortcutActions.NAVIGATE_VERSE_DOWN];

  return {
    'Media': KEYBOARD_SHORTCUTS.filter(s => mediaActions.includes(s.action)),
    'Display': KEYBOARD_SHORTCUTS.filter(s => displayActions.includes(s.action)),
    'Navigation': KEYBOARD_SHORTCUTS.filter(s => navigationActions.includes(s.action)),
  };
}
