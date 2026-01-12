/**
 * Configuration for determining when a clue is considered "close"
 * These thresholds define the range for each clue type to be considered close (but not exact)
 */

export interface ClueThresholds {
  year: {
    closeRange: number; // Years within which it's considered "close" (e.g., 5 means -5 to +5)
  };
  country: {
    closeRange: number; // Distance in km within which it's considered "close" (0 means exact only)
  };
  genre: {
    closeRange: number; // 0 means exact only (no "close" state for genre)
  };
  duration: {
    closeRangeSeconds: number; // Seconds within which it's considered "close" (e.g., 60 means -60s to +60s)
  };
}

export const DEFAULT_CLUE_THRESHOLDS: ClueThresholds = {
  year: {
    closeRange: 5, // Within 5 years is considered "close"
  },
  country: {
    closeRange: 0, // Exact only (0 means no "close" state)
  },
  genre: {
    closeRange: 0, // Exact only (0 means no "close" state)
  },
  duration: {
    closeRangeSeconds: 60, // Within 60 seconds (1 minute) is considered "close"
  },
};
