/**
 * Central configuration for clue display - icons, labels, and styling.
 * Used by GuessBox, ShareResult, and HelpPage for consistency.
 */

export type ClueType = 'year' | 'country' | 'genre' | 'duration' | 'artist_type' | 'gender' | 'artist' | 'album';

export interface ClueDefinition {
  label: string;
  icon: 'emoji' | 'svg';
  /** Emoji character (e.g. '🎵') when icon is 'emoji' */
  emoji?: string;
  /** SVG path for viewBox="0 0 24 24" when icon is 'svg' */
  svgPath?: string;
  /** Emoji for share/copy text (e.g. '🎤' for artist) */
  shareEmoji?: string;
}

export const CLUE_DEFINITIONS: Record<ClueType, ClueDefinition> = {
  year: {
    label: 'Year',
    icon: 'svg',
    svgPath: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z',
  },
  country: {
    label: 'Country',
    icon: 'svg',
    svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  },
  genre: {
    label: 'Genre',
    icon: 'emoji',
    emoji: '🎵',
  },
  duration: {
    label: 'Duration',
    icon: 'svg',
    svgPath: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
  },
  artist_type: {
    label: 'Artist Type',
    icon: 'svg',
    svgPath: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  },
  gender: {
    label: 'Gender',
    icon: 'emoji',
    emoji: '⚧',
  },
  artist: {
    label: 'Artist',
    icon: 'svg',
    svgPath: 'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2.7z',
    shareEmoji: '🎤',
  },
  album: {
    label: 'Album',
    icon: 'svg',
    svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
    shareEmoji: '💿',
  },
};
