import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageMeta from '../PageMeta/PageMeta';
import SongAutocomplete from '../SongAutocomplete/SongAutocomplete';
import GuessBox from '../GuessBox/GuessBox';
import WinConfetti from '../WinAnimation/WinConfetti';
import ShareResult from '../ShareResult/ShareResult';
import GameTopBar from '../GameTopBar/GameTopBar';
import LeaderboardsOverlay from '../Leaderboards/LeaderboardsOverlay';
import NewDailyPuzzleBanner from '../NewDailyPuzzleBanner/NewDailyPuzzleBanner';
import { MUSIC_GAME_ID } from '../../config/gameConfig';
import { getApiUrl } from '../../config/apiConfig';
import { DEFAULT_CLUE_THRESHOLDS } from '../../config/clueThresholds';
import { getPlayerId, setPlayerId, setSessionId, setGameId, clearSession, getPuzzleId, getLocalDate, getDistanceUnit, isViewingArchive, clearPuzzleId, clearLocalDate, clearViewingArchive, setPuzzleId, setLocalDate } from '../../utils/storage';
import { initGame, submitGuess, giveUp, activateLifeline } from '../../services/gameApi';
import type { GameInitResponse, ActivateLifelineResponse } from '../../services/gameApi';
import './ActiveGame.css';

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  aliases: string;
  popularity_rank: number | null;
}

interface Guess {
  songTitle: string;
  artist: string;
  clues: any;
  guessedCountry?: string; // Country code from guess.country
  guessedArtistType?: string; // Artist type from guess.artist_type
  guessedGender?: string; // Gender from guess.gender
  guessedYear?: number; // Year from guess.year
  guessedBpm?: number | null; // BPM from guess.bpm
  guessedBpmDetails?: string | null; // BPM details for tempo-shifting songs (guess.bpm_details)
  songId?: string; // Store song ID for duplicate checking
  isLifeline?: boolean; // Indicates this is a lifeline entry
  catalogSize?: number; // Catalog size for lifeline entries
  catalogSizeAfterGuess?: number; // Catalog size after this guess (when lifeline active)
}

interface SessionState {
  guess_count: number;
  guesses_remaining: number;
  is_solved: boolean;
  is_over: boolean;
  status: 'in_progress' | 'won' | 'lost' | 'abandoned' | 'quit';
  lifeline_min_songs?: number;
  lifeline_min_guesses_required?: number;
  give_up_min_guesses_required?: number;
  puzzle?: {
    max_guesses: number;
    solution?: {
      entity_id?: string;
      display?: string;
      title?: string;
      artist?: string;
    };
  };
  secret_song?: {
    entity_type: string;
    entity_id: string;
    display: string;
    title: string;
    artist: string;
    album?: string;
    year: number;
    country: string;
    genre: string;
    duration_sec: number;
    bpm?: number | null;
    bpm_details?: string | null;
    artist_type?: string;
    gender?: string;
  };
}

// Helper to get today's date in local timezone (YYYY-MM-DD) - matches server's local_date
const getTodayLocalDateStr = (): string => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

// Helper function to format duration
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to format country code to country name
const getCountryName = (countryCode: string): string => {
  // Simple mapping for common codes, can be expanded
  const countryMap: { [key: string]: string } = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'FR': 'France',
    'DE': 'Germany',
    'IT': 'Italy',
    'ES': 'Spain',
    'JP': 'Japan',
    'KR': 'South Korea',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'AR': 'Argentina',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'IE': 'Ireland',
    'NZ': 'New Zealand',
    'ZA': 'South Africa',
    'IN': 'India',
    'CN': 'China',
    'RU': 'Russia',
    'PL': 'Poland',
    'TR': 'Turkey',
    'GR': 'Greece',
    'PT': 'Portugal',
  };
  return countryMap[countryCode] || countryCode;
};

// Helper function to format gender value
const formatGenderValue = (gender?: string): string => {
  if (!gender) return 'N/A';
  const genderMap: { [key: string]: string } = {
    'male': 'Male',
    'female': 'Female',
    'non_binary': 'Non-Binary',
    'non-binary': 'Non-Binary',
    'all_male': 'All Male',
    'all_males': 'All Male',
    'all_female': 'All Female',
    'all_females': 'All Female',
    'mixed': 'Mixed',
  };
  return genderMap[gender.toLowerCase()] || gender;
};

// Component to display secret song details
const SecretSongDetails = ({ secretSong }: { secretSong: NonNullable<SessionState['secret_song']> }) => {
  return (
    <div className="secret-song-details">
      <div className="secret-song-details-title">Details</div>
      <div className="secret-song-info-grid">
        <div className="secret-song-info-item">
          <span className="secret-song-label">Title:</span>
          <span className="secret-song-value">{secretSong.title}</span>
        </div>
        <div className="secret-song-info-item">
          <span className="secret-song-label">Artist:</span>
          <span className="secret-song-value">{secretSong.artist}</span>
        </div>
        {secretSong.album && (
          <div className="secret-song-info-item">
            <span className="secret-song-label">Album:</span>
            <span className="secret-song-value">{secretSong.album}</span>
          </div>
        )}
        <div className="secret-song-info-item">
          <span className="secret-song-label">Year:</span>
          <span className="secret-song-value">{secretSong.year}</span>
        </div>
        <div className="secret-song-info-item">
          <span className="secret-song-label">Country:</span>
          <span className="secret-song-value">{getCountryName(secretSong.country)}</span>
        </div>
        <div className="secret-song-info-item">
          <span className="secret-song-label">Genre:</span>
          <span className="secret-song-value">{secretSong.genre}</span>
        </div>
        <div className="secret-song-info-item">
          <span className="secret-song-label">Duration:</span>
          <span className="secret-song-value">{formatDuration(secretSong.duration_sec)}</span>
        </div>
        {secretSong.bpm != null && secretSong.bpm !== undefined && (
          <div className="secret-song-info-item">
            <span className="secret-song-label">BPM:</span>
            <span className="secret-song-value">{secretSong.bpm}</span>
          </div>
        )}
        {secretSong.artist_type && (
          <div className="secret-song-info-item">
            <span className="secret-song-label">Type:</span>
            <span className="secret-song-value">{secretSong.artist_type === 'Person' ? 'Solo' : secretSong.artist_type}</span>
          </div>
        )}
        {secretSong.gender && (
          <div className="secret-song-info-item">
            <span className="secret-song-label">Gender:</span>
            <span className="secret-song-value">{formatGenderValue(secretSong.gender)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActiveGameProps {
  onShowStatistics?: () => void;
  userClosedStats?: boolean; // True if user manually closed statistics
  onShowHelp?: () => void;
  onShowArchive?: () => void;
  onShowLeaderboards?: () => void;
  onShowSettings?: () => void;
  onShowFeedback?: () => void;
  onGoToDailyPuzzle?: () => void;
}

/** Returns true when country, genre, artist_type, and gender are correct and year is exact or close (blue). Used to reveal artist clue so user sees they missed the artist. */
function shouldShowArtistByNearMatch(clues: any): boolean {
  const c = clues?.clues ?? clues ?? {};
  const country = c.country;
  const genre = c.genre;
  const artistType = c.artist_type;
  const gender = c.gender;
  const year = c.year;
  const countryCorrect = country && (country.status === 'correct' || country.status === true);
  const genreCorrect = genre && (genre.status === 'correct' || genre.status === true);
  const artistTypeCorrect = artistType && (artistType.status === 'correct' || artistType.status === true);
  const genderCorrect = gender && (gender.status === 'correct' || gender.status === true);
  let yearMatchOrClose = false;
  if (year && typeof year === 'object' && year.diff !== undefined) {
    const diff = Math.abs(Number(year.diff));
    yearMatchOrClose = diff === 0 || diff <= DEFAULT_CLUE_THRESHOLDS.year.closeRange;
  }
  return !!(countryCorrect && genreCorrect && artistTypeCorrect && genderCorrect && yearMatchOrClose);
}

const ActiveGame = ({ onShowStatistics, userClosedStats = false, onShowHelp, onShowArchive, onShowLeaderboards, onShowSettings, onShowFeedback, onGoToDailyPuzzle }: ActiveGameProps = {}) => {
  const { pathname } = useLocation();
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initLoading, setInitLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [hasShownStats, setHasShownStats] = useState<boolean>(false);
  const [isWinning, setIsWinning] = useState<boolean>(false);
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);
  const [lifelineActivated, setLifelineActivated] = useState<boolean>(false);
  const [narrowedCatalog, setNarrowedCatalog] = useState<Song[] | null>(null);
  const [, setCatalogSize] = useState<number | null>(null); // Used to store catalog size state
  const [distanceUnitKey, setDistanceUnitKey] = useState<number>(0); // Force re-render when distance unit changes
  const [newDailyPuzzleAvailable, setNewDailyPuzzleAvailable] = useState<boolean>(false);
  const [puzzleType, setPuzzleType] = useState<string | null>(null); // Track puzzle type from API
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false); // Track dismissal state
  const [showLeaderboardsOverlay, setShowLeaderboardsOverlay] = useState<boolean>(false);
  const [seoIntroExpanded, setSeoIntroExpanded] = useState<boolean>(false);
  const initInProgressRef = useRef<boolean>(false);

  // Listen for distance unit changes from settings
  useEffect(() => {
    const handleDistanceUnitChange = () => {
      setDistanceUnitKey(prev => prev + 1); // Force re-render of GuessBox components
    };
    
    window.addEventListener('distanceUnitChanged', handleDistanceUnitChange);
    return () => {
      window.removeEventListener('distanceUnitChanged', handleDistanceUnitChange);
    };
  }, []);

  // Initialize game session on mount
  useEffect(() => {
    // Prevent double init when React Strict Mode runs the effect twice (mount → cleanup → mount)
    if (initInProgressRef.current) return;
    initInProgressRef.current = true;

    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 1; // Only retry once
    
    const initializeGame = async (clearSessionData = false) => {
      try {
        setInitLoading(true);
        setError(null);
        
        // Clear session data if requested (for retry after error)
        if (clearSessionData) {
          clearSession();
        }
        
        // Get stored player ID or use null for new player
        const storedPlayerId = getPlayerId();
        
        // Detect timezone or default to UTC
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        
        // Only use puzzle_id/local_date if we're explicitly viewing an archive puzzle
        // OR if we have a puzzle_id that matches today's daily puzzle (from daily-puzzle-status)
        // Otherwise, clear old puzzle parameters and let the server decide which puzzle to show
        // (server will show daily puzzle if idle-expired, or resume current puzzle if active)
        let puzzleId: string | undefined = undefined;
        let localDate: string | undefined = undefined;
        
        const storedPuzzleId = getPuzzleId();
        const storedLocalDate = getLocalDate();
        const todayDateStr = getTodayLocalDateStr();
        
        // Prefer today's daily puzzle first - ensures correct puzzle when returning from statistics
        // (avoids UTC vs local date mismatch and stale viewing_archive from previous sessions)
        if (storedPuzzleId && storedLocalDate === todayDateStr) {
          // We have a puzzle_id for today's date (from daily-puzzle-status) - use it
          puzzleId = storedPuzzleId;
          console.log('Using daily puzzle_id from daily-puzzle-status:', { puzzleId, localDate: storedLocalDate });
          clearSession(); // Clear session to force server to load the daily puzzle
        } else if (isViewingArchive()) {
          // User explicitly navigated from archive - use stored puzzle parameters
          puzzleId = storedPuzzleId || undefined;
          localDate = storedLocalDate || undefined;
          if (puzzleId || localDate) {
            console.log('Loading historical puzzle from archive:', { puzzleId, localDate });
            clearSession(); // Clear session to force server to load the correct puzzle
          }
        } else {
          // Not viewing archive and no valid daily puzzle_id - clear old puzzle parameters
          if (storedPuzzleId || storedLocalDate) {
            console.log('Clearing old puzzle parameters on initial load:', { storedPuzzleId, storedLocalDate });
            clearPuzzleId();
            clearLocalDate();
          }
        }
        
        // Call init API - note: we're NOT sending session_id, only player_id
        console.log('ActiveGame: Calling initGame with:', {
          gameId: MUSIC_GAME_ID,
          playerId: clearSessionData ? null : storedPlayerId,
          timezone,
          puzzleId,
          localDate
        });
        const response: GameInitResponse = await initGame(
          MUSIC_GAME_ID,
          clearSessionData ? null : storedPlayerId, // Clear player_id on retry too
          timezone,
          puzzleId,
          localDate
        );
        
        console.log('Game initialized:', {
          puzzle_date: response.session.puzzle.local_date,
          status: response.session.status,
          is_over: response.session.state.is_over,
          guess_count: response.session.state.guess_count
        });
        
        // Don't clear puzzle parameters here - they should persist when navigating back from statistics
        // They will be cleared when:
        // 1. User starts a new daily game (via handlePlay in App.tsx)
        // 2. User selects a different puzzle from archive
        
        // Apply state even when isMounted is false: under Strict Mode the effect cleanup runs
        // before the init response arrives, but the component is still mounted and we must
        // show the loaded game (setInitLoading(false) is always called in finally).
        
        // Always sync localStorage to the puzzle we actually received from the server.
        // This ensures correct puzzle when returning from statistics, handles server idle
        // redirects (e.g. archive requested but daily returned), and fixes multi-tab sync.
        const responsePuzzleId = response.session.puzzle.puzzle_id;
        const responseLocalDate = response.session.puzzle.local_date;
        setPuzzleId(responsePuzzleId);
        setLocalDate(responseLocalDate);
        if (
          response.session.puzzle.type === 'daily' ||
          responseLocalDate === todayDateStr
        ) {
          clearViewingArchive();
        }
        
        // Store player and session data in localStorage
        setPlayerId(response.player.player_uuid);
        setSessionIdState(response.session.session_id);
        setSessionId(response.session.session_id);
        setGameId(MUSIC_GAME_ID);
        
        // Update session state
        setSessionState({
          guess_count: response.session.state.guess_count,
          guesses_remaining: response.session.state.guesses_remaining,
          is_solved: response.session.state.is_solved,
          is_over: response.session.state.is_over,
          status: response.session.status,
          lifeline_min_songs: response.session.state.lifeline_min_songs,
          lifeline_min_guesses_required: response.session.state.lifeline_min_guesses_required,
          give_up_min_guesses_required: response.session.state.give_up_min_guesses_required,
          puzzle: {
            max_guesses: response.session.puzzle.max_guesses,
            solution: response.session.puzzle.solution,
          },
          secret_song: response.session.secret_song,
        });
        
        // Check if lifeline is already activated
        // The server may not return lifeline_active in init response, so check history
        const hasLifelineInHistory = response.session.history.guesses.some(g => g.type === 'lifeline');
        const isLifelineActive = response.lifeline_active === true || hasLifelineInHistory;
        console.log('ActiveGame: Checking lifeline status on init:', {
          lifeline_active: response.lifeline_active,
          narrowed_catalog: response.narrowed_catalog ? response.narrowed_catalog.length : null,
          catalog_size: response.catalog_size,
          has_lifeline_in_history: hasLifelineInHistory,
          inferred_lifeline_active: isLifelineActive
        });
        setLifelineActivated(isLifelineActive);
        
        // Track catalog size for use in guess history
        let catalogSizeFromResponse: number | undefined = undefined;
        
        // If lifeline is active but server didn't provide narrowed catalog, fetch it
        if (isLifelineActive && !response.narrowed_catalog && response.session.session_id) {
          console.log('ActiveGame: Lifeline active but no catalog in response, fetching narrowed catalog...');
          try {
            const hintResponse = await fetch(getApiUrl(`/api/catalog/hint?session_id=${response.session.session_id}`));
            if (hintResponse.ok) {
              const narrowedCatalogData: Song[] = await hintResponse.json();
              console.log('ActiveGame: Fetched narrowed catalog:', narrowedCatalogData.length, 'songs');
              catalogSizeFromResponse = narrowedCatalogData.length;
              setNarrowedCatalog(narrowedCatalogData);
              setCatalogSize(narrowedCatalogData.length);
            }
          } catch (err) {
            console.error('ActiveGame: Error fetching narrowed catalog:', err);
          }
        }
        
        // Fetch full catalog on init (if lifeline not active)
        if (!isLifelineActive) {
          try {
            const catalogResponse = await fetch(getApiUrl('/api/catalog/searchable'));
            if (catalogResponse.ok) {
              await catalogResponse.json(); // Just fetch to ensure catalog is available
            }
          } catch (err) {
            console.error('Error fetching catalog:', err);
          }
        }
        
        // If lifeline is active and we have narrowed catalog from response, use it
        if (isLifelineActive && response.narrowed_catalog) {
          console.log('ActiveGame: Setting narrowed catalog on init:', response.narrowed_catalog.length, 'songs');
          catalogSizeFromResponse = response.catalog_size || response.narrowed_catalog.length;
          setNarrowedCatalog(response.narrowed_catalog);
          setCatalogSize(catalogSizeFromResponse);
        }
        
        // Store puzzle date to show in title
        setPuzzleDate(response.session.puzzle.local_date);
        
        // Store puzzle type
        setPuzzleType(response.session.puzzle.type);
        
        // Capture new_daily_puzzle_available from response
        if (response.new_daily_puzzle_available !== undefined) {
          setNewDailyPuzzleAvailable(response.new_daily_puzzle_available);
        }
        
        // Load historical guesses
        // First, find if there's a lifeline entry to get its catalog size
        const lifelineEntryIndex = response.session.history.guesses.findIndex(g => g.type === 'lifeline');
        // If lifeline is active, use catalog size from response or fetched catalog
        let lifelineCatalogSize: number | undefined = undefined;
        if (isLifelineActive && lifelineEntryIndex !== -1) {
          lifelineCatalogSize = catalogSizeFromResponse;
          console.log('ActiveGame: Lifeline entry found, catalog size:', lifelineCatalogSize);
        }
        
        const historicalGuesses: Guess[] = response.session.history.guesses
          .map((guess, index) => {
            // Check if this is a lifeline entry
            if (guess.type === 'lifeline') {
              console.log('ActiveGame: Found lifeline entry in history at index', index, 'catalog size:', lifelineCatalogSize);
              return {
                songTitle: '',
                artist: '',
                clues: {},
                isLifeline: true,
                catalogSize: lifelineCatalogSize,
              };
            }
            
            // Regular guess entry - skip if no guess/result
            if (!guess.guess || !guess.result) {
              return null;
            }
            
            // Parse display string "Title - Artist" to extract title and artist
            const displayParts = guess.guess.display.split(' - ');
            const songTitle = displayParts[0] || guess.guess.display;
            const artist = displayParts.slice(1).join(' - ') || '';
            
            // Get catalog size after this guess if lifeline is active
            // For historical guesses, we don't have the catalog size at that point in time
            // So we'll only set it for the last guess if lifeline is active
            let catalogSizeAfterGuess: number | undefined = undefined;
            if (isLifelineActive && index === response.session.history.guesses.length - 1) {
              catalogSizeAfterGuess = catalogSizeFromResponse;
              console.log('ActiveGame: Setting catalog size after last guess:', catalogSizeAfterGuess);
            }
            
            return {
              songTitle,
              artist,
              clues: guess.result.clues,
              guessedCountry: guess.guess.country,
              guessedArtistType: (guess.guess as any).artist_type,
              guessedGender: (guess.guess as any).gender,
              guessedYear: guess.guess.year,
              guessedBpm: (guess.guess as any).bpm,
              guessedBpmDetails: (guess.guess as any).bpm_details,
              songId: guess.guess.entity_id,
              catalogSizeAfterGuess,
            };
          })
          .filter((g) => g !== null) as Guess[];
        
        console.log('ActiveGame: Loaded', historicalGuesses.length, 'guesses, lifeline activated:', isLifelineActive, 'lifeline catalog size:', lifelineCatalogSize);
        setGuesses(historicalGuesses);
        
        // Don't auto-show statistics when loading a game (even if completed)
        // Statistics should only auto-show when the user just completes a game by submitting a guess
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to initialize game';
        
        console.error('Error initializing game:', err, errorMessage);
        
        // If session not found error and we haven't retried yet, try once more with cleared data
        if (err instanceof Error && 
            err.message.includes('Session') && 
            err.message.includes('not found') &&
            retryCount < MAX_RETRIES) {
          retryCount++;
          // Retry with cleared session data
          await initializeGame(true);
          return;
        }
        
        // If we've exhausted retries or it's a different error, show user-friendly error message
        // Detailed error information is already logged to console above
        setError('Unable to load the game. Please try refreshing the page.');
      } finally {
        initInProgressRef.current = false;
        // Always clear loading when init attempt finishes so the UI does not stay stuck
        // (isMounted can be false under Strict Mode cleanup even though the component is still visible)
        setInitLoading(false);
      }
    };
    
    initializeGame();
    
    // Cleanup function - do not clear initInProgressRef here so Strict Mode's second run
    // sees init still in progress and skips
    return () => {
      isMounted = false;
    };
  }, []);

  // Win animation trigger
  useEffect(() => {
    const isGameWon = sessionState?.status === 'won' && sessionState?.is_over === true;
    
    if (isGameWon) {
      setIsWinning(true);
      // Reset after 4 seconds
      const timer = setTimeout(() => {
        setIsWinning(false);
      }, 4000);
      
      return () => clearTimeout(timer);
    } else {
      setIsWinning(false);
    }
  }, [sessionState?.status, sessionState?.is_over]);

  const handleSongSelect = (songId: string | null, song?: Song | null) => {
    setSelectedSongId(songId);
    setSelectedSong(song ?? null);
  };

  const handleGuess = async () => {
    if (!selectedSongId || !sessionId) {
      setError('Please select a song first');
      return;
    }
    
    if (!sessionState || sessionState.is_over || sessionState.status !== 'in_progress') {
      setError('Game is over. Cannot submit more guesses.');
      return;
    }

    // Check for duplicate guesses (client-side validation)
    const isDuplicate = guesses.some(guess => {
      // First try to match by song ID (most reliable)
      if (guess.songId && selectedSongId) {
        return guess.songId === selectedSongId;
      }
      // Fallback to title and artist comparison
      return guess.songTitle === selectedSong?.title && guess.artist === selectedSong?.artist;
    });
    
    if (isDuplicate) {
      setError('You have already guessed this song. Please try a different one.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Submit guess using the API
      const response: GameInitResponse = await submitGuess(
        sessionId,
        selectedSongId,
        selectedSong ? `${selectedSong.title} - ${selectedSong.artist}` : undefined
      );
      
      // Update session state
      const newSessionState = {
        guess_count: response.session.state.guess_count,
        guesses_remaining: response.session.state.guesses_remaining,
        is_solved: response.session.state.is_solved,
        is_over: response.session.state.is_over,
        status: response.session.status,
        lifeline_min_songs: response.session.state.lifeline_min_songs,
        lifeline_min_guesses_required: response.session.state.lifeline_min_guesses_required,
        give_up_min_guesses_required: response.session.state.give_up_min_guesses_required,
        puzzle: {
          max_guesses: response.session.puzzle.max_guesses,
          solution: response.session.puzzle.solution,
        },
        secret_song: response.session.secret_song,
      };
      setSessionState(newSessionState);
      
      // Capture new_daily_puzzle_available from response
      if (response.new_daily_puzzle_available !== undefined) {
        setNewDailyPuzzleAvailable(response.new_daily_puzzle_available);
      }
      
      // When game ends, sync puzzle to localStorage so closing statistics returns to correct puzzle
      if (newSessionState.is_over) {
        setPuzzleId(response.session.puzzle.puzzle_id);
        setLocalDate(response.session.puzzle.local_date);
        const todayStr = getTodayLocalDateStr();
        if (
          response.session.puzzle.type === 'daily' ||
          response.session.puzzle.local_date === todayStr
        ) {
          clearViewingArchive();
        }
      }
      
      // Handle lifeline catalog updates
      if (response.lifeline_active && response.narrowed_catalog) {
        setNarrowedCatalog(response.narrowed_catalog);
        setCatalogSize(response.catalog_size || response.narrowed_catalog.length);
      }
      
      // Get the latest guess from history (should be the last one)
      const latestGuess = response.session.history.guesses[response.session.history.guesses.length - 1];
      if (latestGuess && latestGuess.guess && latestGuess.result) {
        // Parse display string "Title - Artist" to extract title and artist
        const displayParts = latestGuess.guess.display.split(' - ');
        const songTitle = displayParts[0] || latestGuess.guess.display;
        const artist = displayParts.slice(1).join(' - ') || '';
        
        // Extract artist_type from guess object (not from result clues)
        const artistTypeFromGuess = (latestGuess.guess as any).artist_type;
        const genderFromGuess = (latestGuess.guess as any).gender;
        
        console.log('ActiveGame Debug - latestGuess.guess.artist_type:', artistTypeFromGuess);
        console.log('ActiveGame Debug - latestGuess.guess.gender:', genderFromGuess);
        
        const newGuess: Guess = {
          songTitle,
          artist,
          clues: latestGuess.result.clues,
          guessedCountry: latestGuess.guess.country, // Extract country code from the guess
          guessedArtistType: artistTypeFromGuess, // Extract artist_type from the guess object
          guessedGender: genderFromGuess, // Extract gender from the guess object
          guessedYear: latestGuess.guess.year, // Extract year from the guess
          guessedBpm: (latestGuess.guess as any).bpm,
          guessedBpmDetails: (latestGuess.guess as any).bpm_details,
          songId: latestGuess.guess.entity_id, // Store song ID for duplicate checking
          catalogSizeAfterGuess: response.lifeline_active ? (response.catalog_size ?? undefined) : undefined,
        };
        
        setGuesses(prev => [...prev, newGuess]);
      }
      
      // Clear selection after successful guess
      setSelectedSongId(null);
      setSelectedSong(null);
      
      // If game is over, show statistics after a short delay
      // Only auto-show if user hasn't manually closed it
      if (newSessionState.is_over && onShowStatistics && !hasShownStats && !userClosedStats) {
        setTimeout(() => {
          setHasShownStats(true);
          onShowStatistics();
        }, 3000);
      }
    } catch (err) {
      // Log detailed error to console for developers
      console.error('Error submitting guess:', err);
      
      // Check if it's a duplicate guess error from server
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.toLowerCase().includes('duplicate') || 
          errorMessage.toLowerCase().includes('already') ||
          errorMessage.toLowerCase().includes('guessed')) {
        setError('You have already guessed this song. Please try a different one.');
      } else {
        // Show user-friendly error message
        // Detailed error information is already logged to console above
        setError('Unable to submit your guess. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLifelineActivation = async () => {
    if (!sessionId || !sessionState) {
      setError('Session not found. Please refresh the page.');
      return;
    }

    // Check eligibility (safety check - button click handler already validated)
    const minGuessesRequired = sessionState.lifeline_min_guesses_required ?? Math.floor((sessionState.puzzle?.max_guesses ?? 6) / 2);
    const minSongs = sessionState.lifeline_min_songs ?? 100;
    
    if (sessionState.guess_count < minGuessesRequired) {
      // This shouldn't happen as button handler checks, but keep as safety
      return;
    }
    
    if (lifelineActivated) {
      // This shouldn't happen as button handler checks, but keep as safety
      return;
    }
    
    if (sessionState.guesses_remaining <= 1) {
      // This shouldn't happen as button handler checks, but keep as safety
      return;
    }

    // Show confirmation dialog with tooltip text
    const tooltipText = `Using a Lifeline reduces the song list in the search box using your clues (approximate).\nUpdates after every guess, but never below ${minSongs} songs.\nAvailable after ${minGuessesRequired} guesses. One use per puzzle. Costs 1 guess.`;
    const confirmed = window.confirm(tooltipText + '\n\nDo you want to activate the lifeline?');
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Call activate-lifeline API
      const response: ActivateLifelineResponse = await activateLifeline(sessionId);
      
      if (!response.success || !response.lifeline_activated) {
        setError(response.error || 'Failed to activate lifeline');
        return;
      }
      
      // Update state with narrowed catalog
      if (response.narrowed_catalog) {
        console.log('ActiveGame: Lifeline activated, setting narrowed catalog:', response.narrowed_catalog.length, 'songs');
        setNarrowedCatalog(response.narrowed_catalog);
        setCatalogSize(response.catalog_size || response.narrowed_catalog.length);
      }
      
      setLifelineActivated(true);
      
      // Update session state if provided
      if (response.session) {
        setSessionState({
          guess_count: response.session.state.guess_count,
          guesses_remaining: response.session.state.guesses_remaining,
          is_solved: response.session.state.is_solved,
          is_over: response.session.state.is_over,
          status: response.session.status,
          lifeline_min_songs: response.session.state.lifeline_min_songs,
          lifeline_min_guesses_required: response.session.state.lifeline_min_guesses_required,
          give_up_min_guesses_required: response.session.state.give_up_min_guesses_required,
          puzzle: {
            max_guesses: response.session.puzzle.max_guesses,
            solution: response.session.puzzle.solution,
          },
          secret_song: response.session.secret_song,
        });
        
        // Capture new_daily_puzzle_available from response
        if (response.new_daily_puzzle_available !== undefined) {
          setNewDailyPuzzleAvailable(response.new_daily_puzzle_available);
        }
        
        // Add lifeline entry to guess history
        const lifelineGuess: Guess = {
          songTitle: '',
          artist: '',
          clues: {},
          isLifeline: true,
          catalogSize: response.catalog_size ?? undefined,
        };
        setGuesses(prev => [...prev, lifelineGuess]);
      }
    } catch (err) {
      console.error('Error activating lifeline:', err);
      const errorMessage = err instanceof Error ? err.message : '';
      setError(errorMessage || 'Unable to activate lifeline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGiveUp = async () => {
    if (!sessionId) {
      setError('Session not found. Please refresh the page.');
      return;
    }

    // Confirm with user
    const confirmed = window.confirm('Are you sure you want to give up? This will end the game and reveal the secret song.');
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Call give-up API
      const response: GameInitResponse = await giveUp(sessionId);
      
      // Update session state (same structure as handleGuess)
      const newSessionState = {
        guess_count: response.session.state.guess_count,
        guesses_remaining: response.session.state.guesses_remaining,
        is_solved: response.session.state.is_solved,
        is_over: response.session.state.is_over,
        status: response.session.status,
        lifeline_min_songs: response.session.state.lifeline_min_songs,
        lifeline_min_guesses_required: response.session.state.lifeline_min_guesses_required,
        puzzle: {
          max_guesses: response.session.puzzle.max_guesses,
          solution: response.session.puzzle.solution,
        },
        secret_song: response.session.secret_song,
      };
      setSessionState(newSessionState);
      
      // Capture new_daily_puzzle_available from response
      if (response.new_daily_puzzle_available !== undefined) {
        setNewDailyPuzzleAvailable(response.new_daily_puzzle_available);
      }
      
      // When game ends, sync puzzle to localStorage so closing statistics returns to correct puzzle
      if (newSessionState.is_over) {
        setPuzzleId(response.session.puzzle.puzzle_id);
        setLocalDate(response.session.puzzle.local_date);
        const todayStr = getTodayLocalDateStr();
        if (
          response.session.puzzle.type === 'daily' ||
          response.session.puzzle.local_date === todayStr
        ) {
          clearViewingArchive();
        }
      }
      
      // If game is over, show statistics after a short delay
      // Only auto-show if user hasn't manually closed it
      if (newSessionState.is_over && onShowStatistics && !hasShownStats && !userClosedStats) {
        setTimeout(() => {
          setHasShownStats(true);
          onShowStatistics();
        }, 3000);
      }
    } catch (err) {
      // Log detailed error to console for developers
      console.error('Error giving up:', err);
      
      // Show user-friendly error message
      const errorMessage = err instanceof Error ? err.message : '';
      setError(errorMessage || 'Unable to give up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if this is today's daily puzzle
  const todayDate = getTodayLocalDateStr();
  const isDailyPuzzle = puzzleType === 'daily' && (puzzleDate === todayDate || puzzleDate === null);
  
  // Check if banner is dismissed for today
  useEffect(() => {
    const todayDateStr = new Date().toISOString().split('T')[0];
    const dismissedKey = `daily_puzzle_banner_dismissed_${todayDateStr}`;
    const isDismissed = localStorage.getItem(dismissedKey) === 'true';
    setBannerDismissed(isDismissed);
  }, []); // Only check on mount
  
  // Helper function to check if banner is dismissed for today
  const isBannerDismissed = (): boolean => {
    return bannerDismissed;
  };
  
  // Handler to dismiss banner
  const handleDismissBanner = () => {
    const todayDateStr = getTodayLocalDateStr();
    const dismissedKey = `daily_puzzle_banner_dismissed_${todayDateStr}`;
    localStorage.setItem(dismissedKey, 'true');
    // Update state to force re-render
    setBannerDismissed(true);
  };
  
  // Handler to switch to daily puzzle
  const handleSwitchToDailyPuzzle = async () => {
    console.log('ActiveGame: handleSwitchToDailyPuzzle called, onGoToDailyPuzzle:', !!onGoToDailyPuzzle);
    if (onGoToDailyPuzzle) {
      console.log('ActiveGame: Calling onGoToDailyPuzzle');
      onGoToDailyPuzzle();
    } else {
      console.warn('ActiveGame: onGoToDailyPuzzle is not defined');
    }
  };
  
  // Determine if banner should be shown
  const shouldShowBanner = (): boolean => {
    if (!newDailyPuzzleAvailable) return false;
    if (isBannerDismissed()) return false;
    return true;
  };

  // Use server's session state as the source of truth
  const maxGuesses = sessionState?.puzzle?.max_guesses ?? 6;
  const guessedCount = sessionState 
    ? sessionState.guess_count 
    : guesses.length;
  
  // Use server's guesses_remaining directly (server is the source of truth)
  const guessesRemaining = sessionState?.guesses_remaining ?? (maxGuesses - guesses.length);
  
  // Check if game is over or cannot submit
  const canSubmit = sessionState 
    ? !sessionState.is_over && sessionState.status === 'in_progress' && sessionState.guesses_remaining > 0
    : true;
  const isGameOver = sessionState?.is_over ?? false;
  const gameStatus = sessionState?.status;

  // Determine instruction text to show above search box
  const getInstructionText = (): string | null => {
    // Don't show instruction if game is over
    if (isGameOver) {
      return null;
    }
    
    // Only show instruction when game is in progress
    if (sessionState?.status !== 'in_progress') {
      return null;
    }
    
    // First guess - show initial instruction
    if (guessedCount === 0) {
      return "You don't hear the song. You hunt it. Type any song to begin.";
    }
    
    // Don't show instruction if lifeline is already activated
    if (lifelineActivated) {
      return null;
    }
    
    // Check if lifeline is available
    const minGuessesRequired = sessionState?.lifeline_min_guesses_required ?? Math.floor((maxGuesses) / 2);
    if (guessedCount >= minGuessesRequired) {
      return "Need help? A lifeline (🛟) is now available.";
    }
    
    // After first guess, show clue guidance
    return "Use the clues below to guide your next guess.";
  };
  
  const instructionText = getInstructionText();

  if (initLoading) {
    return (
      <>
        <PageMeta
          title="Play Hitfinder – Daily Music Guessing Game"
          description="Guess the secret hit song using clues like genre, BPM, year, and artist. New puzzle every day."
          path={pathname}
        />
      <div className="active-game-container active-game-with-top-bar">
        <GameTopBar
          onShowArchive={onShowArchive}
          onShowStatistics={onShowStatistics}
          onShowLeaderboardsOverlay={() => setShowLeaderboardsOverlay(true)}
          onShowLeaderboards={onShowLeaderboards}
          onShowHelp={onShowHelp}
          onShowSettings={onShowSettings}
          onShowFeedback={onShowFeedback}
          onGoToDailyPuzzle={onGoToDailyPuzzle}
        />
        <div className="active-game-content">
          <h1 className="daily-song-title">
            <span className="music-icon">♪</span>
            Daily Puzzle
          </h1>
          <p className="puzzle-loading-text">Loading game...</p>
          <div className="puzzle-page-footer">
            <Link to="/privacy" className="puzzle-footer-link">Privacy Policy</Link>
            <span className="puzzle-footer-sep"> · </span>
            <Link to="/about" className="puzzle-footer-link">About</Link>
            <span className="puzzle-footer-sep"> · </span>
            <Link to="/faq" className="puzzle-footer-link">FAQ</Link>
            <span className="puzzle-footer-sep"> · </span>
            <a href="/credits" className="puzzle-footer-link">Credits</a>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Play Hitfinder – Daily Music Guessing Game"
        description="Guess the secret hit song using clues like genre, BPM, year, and artist. New puzzle every day."
        path={pathname}
      />
    <div className="active-game-container active-game-with-top-bar">
      <GameTopBar
        onShowArchive={onShowArchive}
        onShowStatistics={onShowStatistics}
        onShowLeaderboardsOverlay={() => setShowLeaderboardsOverlay(true)}
        onShowLeaderboards={onShowLeaderboards}
        onShowHelp={onShowHelp}
        onShowSettings={onShowSettings}
        onShowFeedback={onShowFeedback}
        onGoToDailyPuzzle={onGoToDailyPuzzle}
      />
      <div className="active-game-content">
        <div className="game-header">
          <h1 className="daily-song-title">
            <span className="music-icon">♪</span>
            {isDailyPuzzle ? (
              'Daily Puzzle'
            ) : (
              `Archived Puzzle: ${new Date(puzzleDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            )}
          </h1>
        </div>
        {/* Show banner at top during gameplay if playing non-daily puzzle */}
        {!isDailyPuzzle && !isGameOver && shouldShowBanner() && (
          <NewDailyPuzzleBanner
            onSwitchToDaily={handleSwitchToDailyPuzzle}
            onDismiss={handleDismissBanner}
          />
        )}
        <p className="guess-counter">
          Guessed {guessedCount} / {maxGuesses}
          {sessionState && ` (${guessesRemaining} remaining)`}
        </p>
        {isGameOver && gameStatus && (
          <div className={`game-status-message ${gameStatus === 'won' ? 'won' : 'lost'}`}>
            {gameStatus === 'won' ? (
              <>
                <div>🎉 Congratulations! You guessed it!</div>
                {sessionState?.secret_song && (
                  <>
                    <div className="solution-display">
                      The secret song was: <strong>{sessionState.secret_song.display || 
                        `${sessionState.secret_song.title || ''} - ${sessionState.secret_song.artist || ''}`.trim() || 
                        'Unknown'}</strong>
                    </div>
                    <div className="game-over-actions">
                      <ShareResult 
                        guesses={guesses}
                        guessCount={guessedCount}
                        maxGuesses={maxGuesses}
                        isWon={true}
                        puzzleDate={puzzleDate || undefined}
                      />
                      {onShowFeedback && (
                        <button
                          type="button"
                          className="feedback-result-button"
                          onClick={onShowFeedback}
                        >
                          💬 Send Feedback
                        </button>
                      )}
                    </div>
                    {/* Show banner after puzzle ends if new daily puzzle is available */}
                    {shouldShowBanner() && (
                      <NewDailyPuzzleBanner
                        onSwitchToDaily={handleSwitchToDailyPuzzle}
                        onDismiss={handleDismissBanner}
                      />
                    )}
                    <SecretSongDetails secretSong={sessionState.secret_song} />
                  </>
                )}
              </>
            ) : gameStatus === 'quit' ? (
              <>
                <div>😔 You gave up. Better luck next time!</div>
                {sessionState?.secret_song && (
                  <>
                    <div className="solution-display">
                      The secret song was: <strong>{sessionState.secret_song.display || 
                        `${sessionState.secret_song.title || ''} - ${sessionState.secret_song.artist || ''}`.trim() || 
                        'Unknown'}</strong>
                    </div>
                    <div className="game-over-actions">
                      <ShareResult 
                        guesses={guesses}
                        guessCount={guessedCount}
                        maxGuesses={maxGuesses}
                        isWon={false}
                        puzzleDate={puzzleDate || undefined}
                      />
                      {onShowFeedback && (
                        <button
                          type="button"
                          className="feedback-result-button"
                          onClick={onShowFeedback}
                        >
                          💬 Send Feedback
                        </button>
                      )}
                    </div>
                    {/* Show banner after puzzle ends if new daily puzzle is available */}
                    {shouldShowBanner() && (
                      <NewDailyPuzzleBanner
                        onSwitchToDaily={handleSwitchToDailyPuzzle}
                        onDismiss={handleDismissBanner}
                      />
                    )}
                    <SecretSongDetails secretSong={sessionState.secret_song} />
                  </>
                )}
              </>
            ) : (
              <>
                <div>😔 Game Over. Better luck next time!</div>
                {sessionState?.secret_song && (
                  <>
                    <div className="solution-display">
                      The secret song was: <strong>{sessionState.secret_song.display || 
                        `${sessionState.secret_song.title || ''} - ${sessionState.secret_song.artist || ''}`.trim() || 
                        'Unknown'}</strong>
                    </div>
                    <div className="game-over-actions">
                      <ShareResult 
                        guesses={guesses}
                        guessCount={guessedCount}
                        maxGuesses={maxGuesses}
                        isWon={false}
                        puzzleDate={puzzleDate || undefined}
                      />
                      {onShowFeedback && (
                        <button
                          type="button"
                          className="feedback-result-button"
                          onClick={onShowFeedback}
                        >
                          💬 Send Feedback
                        </button>
                      )}
                    </div>
                    {/* Show banner after puzzle ends if new daily puzzle is available */}
                    {shouldShowBanner() && (
                      <NewDailyPuzzleBanner
                        onSwitchToDaily={handleSwitchToDailyPuzzle}
                        onDismiss={handleDismissBanner}
                      />
                    )}
                    <SecretSongDetails secretSong={sessionState.secret_song} />
                  </>
                )}
              </>
            )}
          </div>
        )}
        {instructionText && (
          <p className="instruction-text">{instructionText}</p>
        )}
        <div className="search-container">
          <div className="search-box-wrapper">
            <SongAutocomplete
              onSongSelect={handleSongSelect}
              placeholder="Type a song title or artist..."
              value={selectedSong}
              onSubmit={handleGuess}
              catalog={lifelineActivated && narrowedCatalog ? narrowedCatalog : undefined}
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="action-buttons">
            <div className="action-buttons-group">
              <button 
                className="submit-button" 
                onClick={handleGuess}
                disabled={loading || !selectedSongId || !canSubmit}
              >
                {loading ? 'Loading...' : 'Guess'}
              </button>
              {/* Lifeline button */}
              {!isGameOver && sessionState?.status === 'in_progress' && (
                <LifelineButton
                  lifelineActivated={lifelineActivated}
                  guessCount={guessedCount}
                  guessesRemaining={guessesRemaining}
                  minGuessesRequired={sessionState.lifeline_min_guesses_required ?? Math.floor((sessionState.puzzle?.max_guesses ?? 6) / 2)}
                  onActivate={handleLifelineActivation}
                  loading={loading}
                />
              )}
              {/* Give-up button - always shown, enabled after minimum guesses */}
              {!isGameOver && sessionState?.status === 'in_progress' && (() => {
                const minGiveUpGuesses = sessionState?.give_up_min_guesses_required ?? 5;
                const canGiveUp = guessedCount >= minGiveUpGuesses;
                
                return (
                  <button 
                    className={`give-up-button ${canGiveUp ? 'enabled' : ''}`}
                    onClick={() => {
                      if (guessedCount < minGiveUpGuesses) {
                        alert(`Giving-up is only available after ${minGiveUpGuesses} guesses`);
                        return;
                      }
                      handleGiveUp();
                    }}
                    disabled={loading}
                    title="Give-Up"
                  >
                    🏳️
                  </button>
                );
              })()}
              {/* Info icon explaining both buttons */}
              {!isGameOver && sessionState?.status === 'in_progress' && (
                <HelpButtonsInfo
                  minGuessesRequired={sessionState.lifeline_min_guesses_required ?? Math.floor((sessionState.puzzle?.max_guesses ?? 6) / 2)}
                  minSongs={sessionState.lifeline_min_songs ?? 100}
                  lifelineActivated={lifelineActivated}
                  giveUpMinGuessesRequired={sessionState.give_up_min_guesses_required ?? 5}
                />
              )}
            </div>
          </div>
        </div>
        {error && (
          <div className="error-message">{error}</div>
        )}
        {guesses.length > 0 && (() => {
          // Once artist clue is shown for any guess (correct or near-match), show it for all subsequent guesses
          let artistRevealed = false;
          const showArtistClueForGuess = guesses.map((guess) => {
            const artistCorrect = (guess.clues?.clues?.artist?.status === 'correct') || (guess.clues?.artist?.status === 'correct');
            const nearMatch = shouldShowArtistByNearMatch(guess.clues);
            const show = artistCorrect || nearMatch || artistRevealed;
            if (show) artistRevealed = true;
            return show;
          });
          const solutionArtist = sessionState?.secret_song?.artist;
          return (
            <div className="guesses-container">
              {guesses.slice().reverse().map((guess, index) => {
                const originalIndex = guesses.length - 1 - index;
                return (
                  <GuessBox
                    key={`guess-${guesses.length - index}-${distanceUnitKey}`}
                    songTitle={guess.songTitle}
                    artist={guess.artist}
                    clues={guess.clues}
                    guessNumber={guesses.length - index}
                    guessedCountry={guess.guessedCountry}
                    guessedArtistType={guess.guessedArtistType}
                    guessedGender={guess.guessedGender}
                    guessedYear={guess.guessedYear}
                    guessedBpm={guess.guessedBpm}
                    guessedBpmDetails={guess.guessedBpmDetails}
                    preferredDistanceUnit={getDistanceUnit()}
                    isWinning={isWinning}
                    pulseDelay={index * 0.1}
                    isLifeline={guess.isLifeline}
                    catalogSize={guess.catalogSize ?? undefined}
                    catalogSizeAfterGuess={guess.catalogSizeAfterGuess}
                    showArtistClue={showArtistClueForGuess[originalIndex]}
                    solutionArtist={solutionArtist}
                  />
                );
              })}
            </div>
          );
        })()}
        <WinConfetti isActive={isWinning} />
        <div className="puzzle-page-footer">
          <Link to="/privacy" className="puzzle-footer-link">Privacy Policy</Link>
          <span className="puzzle-footer-sep"> · </span>
          <Link to="/about" className="puzzle-footer-link">About</Link>
          <span className="puzzle-footer-sep"> · </span>
          <Link to="/faq" className="puzzle-footer-link">FAQ</Link>
          <span className="puzzle-footer-sep"> · </span>
          <a href="/credits" className="puzzle-footer-link">Credits</a>
        </div>
        <section className="seo-intro">
          <button
            type="button"
            className="seo-intro-toggle"
            onClick={() => setSeoIntroExpanded((v) => !v)}
            aria-expanded={seoIntroExpanded}
          >
            What is Hitfinder?
            <span className="seo-intro-chevron">{seoIntroExpanded ? '▼' : '▶'}</span>
          </button>
          <div className={`seo-intro-content ${seoIntroExpanded ? 'expanded' : ''}`}>
            <h1 className="seo-intro-title">Hitfinder – Daily Music Guessing Game</h1>
            <p className="seo-intro-text">
              Hitfinder is a free daily music guessing game where players try to guess
              the secret hit song using clues like genre, BPM, release year, and artist.
              A new puzzle is available every day.
            </p>
          </div>
        </section>
      </div>
      {showLeaderboardsOverlay && (
        <LeaderboardsOverlay
          onClose={() => setShowLeaderboardsOverlay(false)}
          playerId={getPlayerId()}
        />
      )}
    </div>
    </>
  );
};

// Lifeline Button Component with Tooltip
interface LifelineButtonProps {
  lifelineActivated: boolean;
  guessCount: number;
  guessesRemaining: number;
  minGuessesRequired: number;
  onActivate: () => void;
  loading: boolean;
}

const LifelineButton = ({ 
  lifelineActivated, 
  guessCount, 
  guessesRemaining, 
  minGuessesRequired, 
  onActivate, 
  loading 
}: LifelineButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasShownBubbleRef = useRef(false);
  const [showBubble, setShowBubble] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);

  const isEnabled = !lifelineActivated && 
                    guessCount >= minGuessesRequired && 
                    guessesRemaining > 1;

  // When lifeline is available: pulse for 3 seconds (re-triggers each guess while available)
  // Bubble shows only when lifeline first becomes available (exactly at threshold)
  useEffect(() => {
    if (!isEnabled) {
      setPulseActive(false);
      return;
    }

    // Start pulse animation for 3 seconds (runs each time guessCount changes while available)
    setPulseActive(true);
    const pulseTimer = setTimeout(() => setPulseActive(false), 3000);

    // Show bubble only when lifeline first becomes available (exactly at threshold)
    if (guessCount === minGuessesRequired && !hasShownBubbleRef.current) {
      hasShownBubbleRef.current = true;
      setShowBubble(true);
      const bubbleTimer = setTimeout(() => setShowBubble(false), 3000);
      return () => {
        clearTimeout(pulseTimer);
        clearTimeout(bubbleTimer);
      };
    }

    return () => clearTimeout(pulseTimer);
  }, [isEnabled, guessCount, minGuessesRequired]);

  return (
    <div className="lifeline-button-wrapper">
      {showBubble && (
        <div className="lifeline-available-bubble">
          Lifeline is now available
        </div>
      )}
      <button
        ref={buttonRef}
        className={`lifeline-button ${lifelineActivated ? 'activated' : ''} ${isEnabled ? 'enabled' : ''} ${pulseActive ? 'lifeline-pulse' : ''}`}
        onClick={() => {
          if (lifelineActivated) {
            // Show message if already activated
            alert('Lifeline has already been activated for this puzzle.');
            return;
          }
          if (guessCount < minGuessesRequired) {
            alert(`Lifeline is only available after ${minGuessesRequired} guesses`);
            return;
          }
          if (guessesRemaining <= 1) {
            alert('Lifeline is unavailable on the last guess');
            return;
          }
          if (isEnabled && onActivate) {
            onActivate();
          }
        }}
        disabled={loading}
        title="Lifeline"
      >
        <span className="lifeline-icon">🛟</span>
      </button>
    </div>
  );
};

export default ActiveGame;

// Help Buttons Info Component
interface HelpButtonsInfoProps {
  minGuessesRequired: number;
  minSongs: number;
  lifelineActivated: boolean;
  giveUpMinGuessesRequired: number;
}

const HelpButtonsInfo = ({ 
  minGuessesRequired, 
  minSongs,
  lifelineActivated,
  giveUpMinGuessesRequired
}: HelpButtonsInfoProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const giveUpText = `🏳️ Give Up: Surrender and reveal the answer. Available after ${giveUpMinGuessesRequired} guesses.`;
  const lifelineText = `🛟 Lifeline: Reduces the song list in the search box using your clues (approximate). Updates after every consequent guess, but never below ${minSongs} songs. Available after ${minGuessesRequired} guesses. One use per puzzle. Costs 1 guess.${lifelineActivated ? ' (Already activated)' : ''}`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        iconRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !iconRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);

  return (
    <div className="help-buttons-info-wrapper">
      <span 
        ref={iconRef}
        className="help-buttons-info-icon"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        title="Button information"
      >
        ℹ
      </span>
      {showTooltip && (
        <div 
          ref={tooltipRef}
          className="help-buttons-tooltip"
          onClick={(e) => e.stopPropagation()}
        >
          <div>{giveUpText}</div>
          <div style={{ marginTop: '0.5rem' }}>{lifelineText}</div>
        </div>
      )}
    </div>
  );
};

