import { useState, useEffect } from 'react';
import SongAutocomplete from '../SongAutocomplete/SongAutocomplete';
import GuessBox from '../GuessBox/GuessBox';
import WinConfetti from '../WinAnimation/WinConfetti';
import ShareResult from '../ShareResult/ShareResult';
import { DEFAULT_CLUE_THRESHOLDS } from '../../config/clueThresholds';
import { MUSIC_GAME_ID } from '../../config/gameConfig';
import { getPlayerId, setPlayerId, setSessionId, setGameId, clearSession, getPuzzleId, clearPuzzleId, getLocalDate, clearLocalDate } from '../../utils/storage';
import { initGame, submitGuess } from '../../services/gameApi';
import type { GameInitResponse } from '../../services/gameApi';
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
  songId?: string; // Store song ID for duplicate checking
}

interface SessionState {
  guess_count: number;
  guesses_remaining: number;
  is_solved: boolean;
  is_over: boolean;
  status: 'in_progress' | 'won' | 'lost' | 'abandoned';
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
  };
}

interface ActiveGameProps {
  onShowStatistics?: () => void;
  userClosedStats?: boolean; // True if user manually closed statistics
  onShowHelp?: () => void;
  onShowArchive?: () => void;
}

const ActiveGame = ({ onShowStatistics, userClosedStats = false, onShowHelp, onShowArchive }: ActiveGameProps = {}) => {
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
        
        // Clear puzzle parameters after successful API call (they're one-time use)
        if (puzzleId) {
          clearPuzzleId();
        }
        if (localDate) {
          clearLocalDate();
        }
        
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
          puzzle: {
            max_guesses: response.session.puzzle.max_guesses,
            solution: response.session.puzzle.solution,
          },
          secret_song: response.session.secret_song,
        });
        
        // Store puzzle date to show in title
        setPuzzleDate(response.session.puzzle.local_date);
        
        // Load historical guesses
        const historicalGuesses: Guess[] = response.session.history.guesses.map((guess) => {
          // Parse display string "Title - Artist" to extract title and artist
          const displayParts = guess.guess.display.split(' - ');
          const songTitle = displayParts[0] || guess.guess.display;
          const artist = displayParts.slice(1).join(' - ') || '';
          
          return {
            songTitle,
            artist,
            clues: guess.result.clues,
            guessedCountry: guess.guess.country, // Extract country code from the guess
            guessedArtistType: (guess.guess as any).artist_type, // Extract artist_type from the guess
            guessedGender: (guess.guess as any).gender, // Extract gender from the guess
            songId: guess.guess.entity_id, // Store song ID for duplicate checking
          };
        });
        
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
        puzzle: {
          max_guesses: response.session.puzzle.max_guesses,
          solution: response.session.puzzle.solution,
        },
        secret_song: response.session.secret_song,
      };
      setSessionState(newSessionState);
      
      // Get the latest guess from history (should be the last one)
      const latestGuess = response.session.history.guesses[response.session.history.guesses.length - 1];
      if (latestGuess) {
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
          songId: latestGuess.guess.entity_id, // Store song ID for duplicate checking
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
        }, 1500);
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
            {puzzleDate && puzzleDate !== new Date().toISOString().split('T')[0] ? (
              `Puzzle: ${new Date(puzzleDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            ) : (
              'Daily Song'
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
            {puzzleDate && puzzleDate !== new Date().toISOString().split('T')[0] ? (
              `Puzzle: ${new Date(puzzleDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            ) : (
              'Daily Song'
            )}
          </h1>
          <div className="header-buttons">
            {onShowHelp && (
              <button className="help-link-button" onClick={onShowHelp} title="How to Play">
                ❓ Help
              </button>
            )}
            {onShowStatistics && (
              <button className="statistics-link-button" onClick={onShowStatistics} title="View Statistics">
                📊 Stats
              </button>
            )}
            {onShowArchive && (
              <button className="archive-link-button" onClick={onShowArchive} title="View Archive">
                📅 Archive
              </button>
            )}
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
                  <div className="solution-display">
                    The secret song was: <strong>{sessionState.secret_song.display || 
                      `${sessionState.secret_song.title || ''} - ${sessionState.secret_song.artist || ''}`.trim() || 
                      'Unknown'}</strong>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>😔 Game Over. Better luck next time!</div>
                {sessionState?.secret_song && (
                  <div className="solution-display">
                    The secret song was: <strong>{sessionState.secret_song.display || 
                      `${sessionState.secret_song.title || ''} - ${sessionState.secret_song.artist || ''}`.trim() || 
                      'Unknown'}</strong>
                  </div>
                )}
              </>
            )}
            <ShareResult 
              guesses={guesses}
              guessCount={guessedCount}
              maxGuesses={maxGuesses}
              isWon={gameStatus === 'won'}
              puzzleDate={puzzleDate || undefined}
            />
          </div>
        )}
        <div className="search-container">
          <div className="search-box-wrapper">
            <SongAutocomplete
              onSongSelect={handleSongSelect}
              placeholder="Type a song title or artist..."
              value={selectedSong}
              onSubmit={handleGuess}
            />
            <span className="search-icon">🔍</span>
          </div>
          <button 
            className="submit-button" 
            onClick={handleGuess}
            disabled={loading || !selectedSongId || !canSubmit}
          >
            {loading ? 'Loading...' : 'Guess'}
          </button>
        </div>
        {error && (
          <div className="error-message">{error}</div>
        )}
        {guesses.length > 0 && (
          <div className="guesses-container">
            {guesses.slice().reverse().map((guess, index) => (
              <GuessBox
                key={guesses.length - index}
                songTitle={guess.songTitle}
                artist={guess.artist}
                clues={guess.clues}
                guessNumber={guesses.length - index}
                guessedCountry={guess.guessedCountry}
                guessedArtistType={guess.guessedArtistType}
                guessedGender={guess.guessedGender}
                isWinning={isWinning}
                pulseDelay={index * 0.1}
              />
            ))}
          </div>
        )}
        <WinConfetti isActive={isWinning} />
      </div>
    </div>
  );
};

export default ActiveGame;

