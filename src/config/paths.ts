/**
 * Centralized path configuration for data fetching
 * Uses PUBLIC_URL to ensure paths work in sub-path deployments
 */

const PUBLIC_URL = process.env.PUBLIC_URL || '';

export const PATHS = {
  BIBLE_DATA: `${PUBLIC_URL}/xmlBible.org-main`,
  LEXICON: `${PUBLIC_URL}/lexicon`,
  DATA: `${PUBLIC_URL}/data`,
  APOCRYPHA: `${PUBLIC_URL}/apocrypha`,
};
