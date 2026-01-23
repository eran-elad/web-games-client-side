import { useState, useEffect, useRef } from 'react';
import SongAutocomplete from '../SongAutocomplete/SongAutocomplete';
import GuessBox from '../GuessBox/GuessBox';
import WinConfetti from '../WinAnimation/WinConfetti';
import ShareResult from '../ShareResult/ShareResult';
import HamburgerMenu from '../HamburgerMenu/HamburgerMenu';
import { MUSIC_GAME_ID } from '../../config/gameConfig';
import { getApiUrl } from '../../config/apiConfig';
import { getPlayerId, setPlayerId, setSessionId, setGameId, clearSession, getPuzzleId, getLocalDate, getDistanceUnit } from '../../utils/storage';
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
    artist_type?: string;
    gender?: string;
  };
}

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
  onShowSettings?: () => void;
  onGoHome?: () => void;
}

const ActiveGame = ({ onShowStatistics, userClosedStats = false, onShowHelp, onShowArchive, onShowSettings, onGoHome }: ActiveGameProps = {}) => {
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
        
        // Check for historical puzzle parameters
        const puzzleId = getPuzzleId();
        const localDate = getLocalDate();
        
        // If loading a historical puzzle, clear existing session to force server to load the correct one
        if (puzzleId || localDate) {
          console.log('Loading historical puzzle:', { puzzleId, localDate });
          clearSession();
        }
        
        // Call init API - note: we're NOT sending session_id, only player_id
        const response: GameInitResponse = await initGame(
          MUSIC_GAME_ID,
          clearSessionData ? null : storedPlayerId, // Clear player_id on retry too
          timezone,
          puzzleId || undefined,
          localDate || undefined
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
        
        if (!isMounted) return;
        
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
        if (isMounted) {
          setInitLoading(false);
        }
      }
    };
    
    initializeGame();
    
    // Cleanup function
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
        puzzle: {
          max_guesses: response.session.puzzle.max_guesses,
          solution: response.session.puzzle.solution,
        },
        secret_song: response.session.secret_song,
      };
      setSessionState(newSessionState);
      
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

    // Check eligibility
    const minGuessesRequired = sessionState.lifeline_min_guesses_required ?? Math.floor((sessionState.puzzle?.max_guesses ?? 6) / 2);
    const minSongs = sessionState.lifeline_min_songs ?? 100;
    
    if (sessionState.guess_count < minGuessesRequired) {
      setError(`Not enough guesses yet. Need at least ${minGuessesRequired} guesses.`);
      return;
    }
    
    if (lifelineActivated) {
      setError('Lifeline already activated');
      return;
    }
    
    if (sessionState.guesses_remaining <= 1) {
      setError('Unavailable on the last guess');
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
          puzzle: {
            max_guesses: response.session.puzzle.max_guesses,
            solution: response.session.puzzle.solution,
          },
          secret_song: response.session.secret_song,
        });
        
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

  // Check if this is today's daily puzzle (regardless of how we accessed it)
  const todayDate = new Date().toISOString().split('T')[0];
  const isDailyPuzzle = puzzleDate === todayDate || puzzleDate === null;

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

  if (initLoading) {
    return (
      <div className="active-game-container">
        <div className="active-game-content">
          <h1 className="daily-song-title">
            <span className="music-icon">♪</span>
            {isDailyPuzzle ? (
              'Daily Puzzle'
            ) : (
              `Archived Puzzle: ${new Date(puzzleDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            )}
          </h1>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="active-game-container">
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
          <div className="header-buttons">
            <HamburgerMenu
              onShowStatistics={onShowStatistics}
              onShowArchive={onShowArchive}
              onShowHelp={onShowHelp}
              onShowSettings={onShowSettings}
              onGoHome={onGoHome}
            />
          </div>
        </div>
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
                    <ShareResult 
                      guesses={guesses}
                      guessCount={guessedCount}
                      maxGuesses={maxGuesses}
                      isWon={true}
                      puzzleDate={puzzleDate || undefined}
                    />
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
                    <ShareResult 
                      guesses={guesses}
                      guessCount={guessedCount}
                      maxGuesses={maxGuesses}
                      isWon={false}
                      puzzleDate={puzzleDate || undefined}
                    />
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
                    <ShareResult 
                      guesses={guesses}
                      guessCount={guessedCount}
                      maxGuesses={maxGuesses}
                      isWon={false}
                      puzzleDate={puzzleDate || undefined}
                    />
                    <SecretSongDetails secretSong={sessionState.secret_song} />
                  </>
                )}
              </>
            )}
          </div>
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
              {/* Give-up button - always shown, enabled after 3 guesses */}
              {!isGameOver && sessionState?.status === 'in_progress' && (
                <button 
                  className={`give-up-button ${guessedCount >= 3 ? 'enabled' : ''}`}
                  onClick={handleGiveUp}
                  disabled={loading || guessedCount < 3}
                  title={guessedCount < 3 ? 'Available after 3 guesses' : 'Give Up'}
                >
                  🏳️
                </button>
              )}
              {/* Info icon explaining both buttons */}
              {!isGameOver && sessionState?.status === 'in_progress' && (
                <HelpButtonsInfo
                  minGuessesRequired={sessionState.lifeline_min_guesses_required ?? Math.floor((sessionState.puzzle?.max_guesses ?? 6) / 2)}
                  minSongs={sessionState.lifeline_min_songs ?? 100}
                  lifelineActivated={lifelineActivated}
                />
              )}
            </div>
          </div>
        </div>
        {error && (
          <div className="error-message">{error}</div>
        )}
        {guesses.length > 0 && (
          <div className="guesses-container">
            {guesses.slice().reverse().map((guess, index) => (
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
                preferredDistanceUnit={getDistanceUnit()}
                isWinning={isWinning}
                pulseDelay={index * 0.1}
                isLifeline={guess.isLifeline}
                catalogSize={guess.catalogSize ?? undefined}
                catalogSizeAfterGuess={guess.catalogSizeAfterGuess}
              />
            ))}
          </div>
        )}
        <WinConfetti isActive={isWinning} />
      </div>
    </div>
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

  const isEnabled = !lifelineActivated && 
                    guessCount >= minGuessesRequired && 
                    guessesRemaining > 1;

  const disabledMessage = lifelineActivated 
    ? 'Lifeline already activated'
    : guessesRemaining <= 1
    ? 'Unavailable on the last guess'
    : guessCount < minGuessesRequired
    ? `Available after ${minGuessesRequired} guesses`
    : '';

  return (
    <div className="lifeline-button-wrapper">
      <button
        ref={buttonRef}
        className={`lifeline-button ${lifelineActivated ? 'activated' : ''}`}
        onClick={() => {
          if (lifelineActivated) {
            // Show message if already activated
            alert('Lifeline has already been activated for this puzzle.');
            return;
          }
          if (isEnabled && onActivate) {
            onActivate();
          }
        }}
        disabled={(!isEnabled && !lifelineActivated) || loading}
        title={disabledMessage || undefined}
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
}

const HelpButtonsInfo = ({ 
  minGuessesRequired, 
  minSongs,
  lifelineActivated 
}: HelpButtonsInfoProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const giveUpText = `🏳️ Give Up: Surrender and reveal the answer. Available after 3 guesses.`;
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

