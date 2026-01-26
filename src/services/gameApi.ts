/**
 * API service for game-related endpoints
 */

import { getApiUrl } from '../config/apiConfig';

/**
 * Response structure from /api/game/init and /api/game/guess
 */
export type GameInitResponse = {
  meta: {
    schema_version: string;
    request_id: string;
    server_time_utc: string;
  };
  player: {
    player_uuid: string;
    was_created: boolean;
    timezone: string;
  };
  session: {
    session_id: string;
    status: 'in_progress' | 'won' | 'lost' | 'abandoned' | 'quit';
    game: string;
    puzzle: {
      puzzle_id: string;
      puzzle_key: string;
      local_date: string;
      type: string;
      max_guesses: number;
      solution?: {
        entity_id?: string;
        display?: string;
        title?: string;
        artist?: string;
      };
    };
    state: {
      guess_count: number;
      guesses_remaining: number;
      is_solved: boolean;
      is_over: boolean;
      started_at_utc: string;
      last_activity_at_utc: string;
      ended_at_utc: string | null;
      lifeline_min_songs?: number;
      lifeline_min_guesses_required?: number;
      give_up_min_guesses_required?: number;
    };
    history: {
      guesses: Array<{
        guess_id: string;
        submitted_at_utc: string;
        type?: 'lifeline';
        message?: string;
        guess?: {
          entity_type: string;
          entity_id: string;
          display: string;
          year: number;
          country: string;
          genre: string;
          duration_sec: number;
        };
        result?: {
          is_correct: boolean;
          clues: {
            year?: {
              diff: number;
              direction?: string;
            };
            country?: {
              status: string;
              distance_km?: number;
              dir?: string;
            };
            genre?: {
              status: string;
              expected?: string | null;
              given?: string;
              name?: string;
            };
            duration?: {
              diff_sec: number;
              direction?: string;
            };
          };
        };
      }>;
    };
    update: {
      event: string;
      latest_guess_id?: string;
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
  };
  lifeline_active?: boolean;
  narrowed_catalog?: Array<{
    id: string;
    title: string;
    artist: string;
    album: string;
    aliases: string;
    popularity_rank: number | null;
  }>;
  catalog_size?: number;
  new_daily_puzzle_available?: boolean;
};

/**
 * Initialize or resume a game session
 */
export const initGame = async (
  gameId: string,
  playerId?: string | null,
  timezone?: string,
  puzzleId?: string | null,
  localDate?: string | null
): Promise<GameInitResponse> => {
  const params = new URLSearchParams();
  params.append('game_id', gameId);
  
  if (playerId) {
    params.append('player_id', playerId);
  }
  
  if (timezone) {
    params.append('timezone', timezone);
  }

  if (puzzleId) {
    params.append('puzzle_id', puzzleId);
  }

  if (localDate) {
    params.append('local_date', localDate);
  }

  const response = await fetch(getApiUrl(`/api/game/init?${params.toString()}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      errorMessage = response.statusText || `Server error (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};

/**
 * Submit a guess for the current puzzle session
 */
export const submitGuess = async (
  sessionId: string,
  guessSongId: string,
  rawInput?: string
): Promise<GameInitResponse> => {
  const response = await fetch(getApiUrl('/api/game/guess'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      guess_song_id: guessSongId,
      raw_input: rawInput,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      errorMessage = response.statusText || `Server error (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};

/**
 * Give up on the current puzzle session
 */
export const giveUp = async (
  sessionId: string
): Promise<GameInitResponse> => {
  const response = await fetch(getApiUrl('/api/game/give-up'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      errorMessage = response.statusText || `Server error (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};

/**
 * Response structure from /api/game/activate-lifeline
 */
export type ActivateLifelineResponse = {
  success: boolean;
  lifeline_activated?: boolean;
  narrowed_catalog?: Array<{
    id: string;
    title: string;
    artist: string;
    album: string;
    aliases: string;
    popularity_rank: number | null;
  }>;
  catalog_size?: number;
  message?: string;
  session?: GameInitResponse['session'];
  error?: string;
  guesses_required?: number;
  current_guesses?: number;
  new_daily_puzzle_available?: boolean;
};

/**
 * Activate lifeline for the current puzzle session
 */
export const activateLifeline = async (
  sessionId: string
): Promise<ActivateLifelineResponse> => {
  const response = await fetch(getApiUrl('/api/game/activate-lifeline'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      errorMessage = response.statusText || `Server error (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};

/**
 * Response structure from /api/game/stats/{player_id}
 */
export type PlayerStatsResponse = {
  meta: {
    schema_version: string;
    request_id: string;
    server_time_utc: string;
  };
  player_id: string;
  game_id: string | null;
  stats: {
    total_games_played: number;
    total_wins: number;
    total_losses: number;
    total_abandoned: number;
    win_percentage: number;
    wins_by_guess_count: {
      [key: string]: number;
    };
    average_guesses_for_win: number;
    current_win_streak: number;
    max_win_streak: number;
    average_guesses_per_game: number;
    total_guesses: number;
    first_game_date: string | null;
    last_game_date: string | null;
  };
};

/**
 * Get player statistics
 */
export const getPlayerStats = async (
  playerId: string,
  gameId?: string | null
): Promise<PlayerStatsResponse> => {
  const params = new URLSearchParams();
  
  if (gameId) {
    params.append('game_id', gameId);
  }

  const endpoint = `/api/game/stats/${playerId}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(getApiUrl(endpoint), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      errorMessage = response.statusText || `Server error (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};

/**
 * Response structure from /api/game/daily-puzzle-status
 */
export type DailyPuzzleStatusResponse = {
  meta: {
    schema_version: string;
    request_id: string;
    server_time_utc: string;
  };
  game_id: string;
  puzzle: {
    puzzle_id: string;
    puzzle_key: string;
    local_date: string;
    type: string;
    max_guesses: number;
  };
  new_daily_puzzle_available?: boolean;
};

/**
 * Get daily puzzle status
 */
export const getDailyPuzzleStatus = async (
  gameId: string,
  playerId?: string | null,
  timezone?: string
): Promise<DailyPuzzleStatusResponse> => {
  const params = new URLSearchParams();
  params.append('game_id', gameId);
  
  if (playerId) {
    params.append('player_id', playerId);
  }
  
  if (timezone) {
    params.append('timezone', timezone);
  }

  const response = await fetch(getApiUrl(`/api/game/daily-puzzle-status?${params.toString()}`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      errorMessage = response.statusText || `Server error (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};

/**
 * Response structure from /api/game/archive
 */
export type ArchiveResponse = {
  meta: {
    schema_version: string;
    request_id: string;
    server_time_utc: string;
  };
  game_id: string;
  date_range: {
    first_puzzle_date: string | null;
    last_date: string;
  };
  puzzles: Array<{
    date: string;
    puzzle_id: string | null;
    player_status: 'won' | 'lost' | 'abandoned' | 'in_progress' | 'not_played' | 'quit' | null;
  }>;
};

/**
 * Get historical puzzles archive
 */
export const getArchive = async (
  gameId: string,
  playerId?: string | null
): Promise<ArchiveResponse> => {
  const params = new URLSearchParams();
  params.append('game_id', gameId);
  
  if (playerId) {
    params.append('player_id', playerId);
  }

  const response = await fetch(getApiUrl(`/api/game/archive?${params.toString()}`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      errorMessage = response.statusText || `Server error (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};
