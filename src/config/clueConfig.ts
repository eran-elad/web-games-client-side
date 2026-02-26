/**
 * Central configuration for clue display - icons, labels, and styling.
 * Used by GuessBox, ShareResult, and HelpPage for consistency.
 */

export type ClueType = 'year' | 'country' | 'genre' | 'duration' | 'tempo' | 'artist_type' | 'gender' | 'artist' | 'album';

export interface ClueDefinition {
  label: string;
  icon: 'emoji' | 'svg';
  /** Path to icon in public/clue_icons (e.g. '/clue_icons/year.svg') - used for display */
  iconFile?: string;
  /** Emoji character (e.g. '🎵') when icon is 'emoji' (fallback if no iconFile) */
  emoji?: string;
  /** SVG path for viewBox="0 0 24 24" when icon is 'svg' (fallback if no iconFile) */
  svgPath?: string;
  /** Custom viewBox when path uses non-standard dimensions (e.g. "0 0 64 122") */
  svgViewBox?: string;
  /** For artist_type: path to group icon when guessed type is group */
  iconFileGroup?: string;
  /** Emoji for share/copy text (e.g. '🎤' for artist) */
  shareEmoji?: string;
}

export const CLUE_DEFINITIONS: Record<ClueType, ClueDefinition> = {
  year: {
    label: 'Year',
    icon: 'svg',
    iconFile: '/clue_icons/year.svg',
    svgPath: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z',
  },
  country: {
    label: 'Country',
    icon: 'svg',
    iconFile: '/clue_icons/country.svg',
    svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  },
  genre: {
    label: 'Genre',
    icon: 'emoji',
    iconFile: '/clue_icons/genre.svg',
    emoji: '🎵',
  },
  duration: {
    label: 'Duration',
    icon: 'svg',
    iconFile: '/clue_icons/duration.svg',
    svgPath: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
  },
  tempo: {
    label: 'Tempo',
    icon: 'svg',
    iconFile: '/clue_icons/tempo.svg',
    svgPath: 'M16.482,44.784l-4.404,1.87l1.941-7.674L16.482,44.784L16.482,44.784z M0,94.402l12.073-47.728l5.267,5.998l-2.545,10.063h9.307h1.325l-3.76-8.86l-1.2,0.51l-6.375-7.26l3.989-1.694L4.517,13.475c-0.312-0.736,0.792-1.205,1.104-0.469l13.564,31.956l3.991-1.693l0.794,9.629l-1.2,0.51l3.96,9.328h1.325h0.567V14.71h7.064v2.149h-3.178v1.198h3.178v4.796h-3.178v1.199h3.178v4.795h-3.178v1.2h3.178v4.795h-3.178v1.199h3.178v4.797h-3.178v1.198h3.178v4.796h-3.178v1.199h3.178v4.794h-3.178v1.201h3.178v8.708h13.83L37.101,13.638h-9.887l-7.468,29.523l-4.25-10.015L22.46,5.617L32.087,0l9.627,5.617l22.46,88.785h-4.95v1.225c0,1.104-0.896,1.998-1.998,1.998h-0.361c-1.104,0-1.997-0.895-1.997-1.998v-1.225H9.309v1.225c0,1.104-0.894,1.998-1.999,1.998H6.949c-1.103,0-1.999-0.895-1.999-1.998v-1.225H0L0,94.402z',
    svgViewBox: '0 0 64.174 122.03125',
    shareEmoji: '🎵',
  },
  artist_type: {
    label: 'Artist Type',
    icon: 'svg',
    iconFile: '/clue_icons/artist-type-person.svg',
    iconFileGroup: '/clue_icons/artist-type-group.svg',
    svgPath: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  },
  gender: {
    label: 'Gender',
    icon: 'emoji',
    iconFile: '/clue_icons/gender.svg',
    emoji: '⚧',
  },
  artist: {
    label: 'Artist',
    icon: 'svg',
    iconFile: '/clue_icons/artist.svg',
    svgPath: 'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2.7z',
    shareEmoji: '🎤',
  },
  album: {
    label: 'Album',
    icon: 'svg',
    iconFile: '/clue_icons/album.svg',
    svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
    shareEmoji: '💿',
  },
};
