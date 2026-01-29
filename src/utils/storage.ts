/**
 * LocalStorage utilities for managing player and session data
 */

const STORAGE_KEYS = {
  PLAYER_ID: 'music_game_player_id',
  DISPLAY_NAME: 'music_game_display_name',
  SESSION_ID: 'music_game_session_id',
  GAME_ID: 'music_game_game_id',
  PUZZLE_ID: 'music_game_puzzle_id',
  LOCAL_DATE: 'music_game_local_date',
  VIEWING_ARCHIVE: 'music_game_viewing_archive',
  DISTANCE_UNIT: 'music_game_distance_unit',
} as const;

/**
 * Get the stored player ID
 */
export const getPlayerId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
};

/**
 * Store the player ID
 */
export const setPlayerId = (playerId: string): void => {
  localStorage.setItem(STORAGE_KEYS.PLAYER_ID, playerId);
};

/**
 * Get the stored display name (cached after user updates)
 */
export const getDisplayName = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.DISPLAY_NAME);
};

/**
 * Store the display name (cache after API update)
 */
export const setDisplayName = (displayName: string | null): void => {
  if (displayName === null) {
    localStorage.removeItem(STORAGE_KEYS.DISPLAY_NAME);
  } else {
    localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, displayName);
  }
};

/**
 * Get the stored session ID
 */
export const getSessionId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.SESSION_ID);
};

/**
 * Store the session ID
 */
export const setSessionId = (sessionId: string): void => {
  localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
};

/**
 * Get the stored game ID
 */
export const getGameId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.GAME_ID);
};

/**
 * Store the game ID
 */
export const setGameId = (gameId: string): void => {
  localStorage.setItem(STORAGE_KEYS.GAME_ID, gameId);
};

/**
 * Clear all session-related data (keeps player ID for returning players)
 */
export const clearSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  localStorage.removeItem(STORAGE_KEYS.GAME_ID);
};

/**
 * Get the stored puzzle ID (for historical puzzles)
 */
export const getPuzzleId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.PUZZLE_ID);
};

/**
 * Store the puzzle ID
 */
export const setPuzzleId = (puzzleId: string): void => {
  localStorage.setItem(STORAGE_KEYS.PUZZLE_ID, puzzleId);
};

/**
 * Clear the puzzle ID
 */
export const clearPuzzleId = (): void => {
  localStorage.removeItem(STORAGE_KEYS.PUZZLE_ID);
};

/**
 * Get the stored local date (for historical puzzles)
 */
export const getLocalDate = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.LOCAL_DATE);
};

/**
 * Store the local date
 */
export const setLocalDate = (localDate: string): void => {
  localStorage.setItem(STORAGE_KEYS.LOCAL_DATE, localDate);
};

/**
 * Clear the local date
 */
export const clearLocalDate = (): void => {
  localStorage.removeItem(STORAGE_KEYS.LOCAL_DATE);
};

/**
 * Set flag indicating we're viewing an archive puzzle
 */
export const setViewingArchive = (): void => {
  localStorage.setItem(STORAGE_KEYS.VIEWING_ARCHIVE, 'true');
};

/**
 * Clear the viewing archive flag
 */
export const clearViewingArchive = (): void => {
  localStorage.removeItem(STORAGE_KEYS.VIEWING_ARCHIVE);
};

/**
 * Check if we're viewing an archive puzzle
 */
export const isViewingArchive = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.VIEWING_ARCHIVE) === 'true';
};

/**
 * Get the stored distance unit preference
 * @returns 'km' | 'miles' | null (null means use country default)
 */
export const getDistanceUnit = (): 'km' | 'miles' | null => {
  const unit = localStorage.getItem(STORAGE_KEYS.DISTANCE_UNIT);
  if (unit === 'km' || unit === 'miles') {
    return unit;
  }
  return null;
};

/**
 * Store the distance unit preference
 * @param unit - 'km' | 'miles' | null (null means use country default)
 */
export const setDistanceUnit = (unit: 'km' | 'miles' | null): void => {
  if (unit === null) {
    localStorage.removeItem(STORAGE_KEYS.DISTANCE_UNIT);
  } else {
    localStorage.setItem(STORAGE_KEYS.DISTANCE_UNIT, unit);
  }
};

/**
 * Clear the distance unit preference (revert to country default)
 */
export const clearDistanceUnit = (): void => {
  localStorage.removeItem(STORAGE_KEYS.DISTANCE_UNIT);
};

/**
 * Clear all game data including player ID
 */
export const clearAll = (): void => {
  localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
  localStorage.removeItem(STORAGE_KEYS.DISPLAY_NAME);
  localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  localStorage.removeItem(STORAGE_KEYS.GAME_ID);
  localStorage.removeItem(STORAGE_KEYS.PUZZLE_ID);
  localStorage.removeItem(STORAGE_KEYS.LOCAL_DATE);
  localStorage.removeItem(STORAGE_KEYS.VIEWING_ARCHIVE);
  localStorage.removeItem(STORAGE_KEYS.DISTANCE_UNIT);
};

