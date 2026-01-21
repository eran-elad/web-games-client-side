import { useState, useEffect } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import type { FilterOptionsState } from '@mui/material';
import { getApiUrl } from '../../config/apiConfig';

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  aliases: string;
  popularity_rank: number | null;
}

interface SongAutocompleteProps {
  onSongSelect?: (songId: string | null, song?: Song | null) => void;
  value?: Song | null;
  placeholder?: string;
  onSubmit?: () => void; // Called when Enter is pressed and a song is selected
}

// Helper function to tokenize query into lowercase tokens
const tokenizeQuery = (query: string): string[] => {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(token => token.length > 0);
};

// Helper function to remove accents/diacritics from text
const removeAccents = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Helper function to normalize text for matching (lowercase, trim, remove accents)
const normalizeText = (text: string | number | null | undefined): string => {
  // Convert to string first, handling null/undefined/numbers
  const textStr = text != null ? String(text) : '';
  const normalized = textStr.toLowerCase().trim();
  return removeAccents(normalized);
};

// Helper function to strip punctuation from text for matching
const stripPunctuation = (text: string): string => {
  return text.replace(/[^\w\s]/g, '');
};

// Helper function to check if a word starts with a token (ignoring punctuation)
const wordStartsWith = (word: string, token: string): boolean => {
  const normalizedWord = normalizeText(word);
  const strippedWord = stripPunctuation(normalizedWord);
  const strippedToken = stripPunctuation(token);
  return strippedWord.startsWith(strippedToken);
};

// Helper function to split text into words
const getWords = (text: string): string[] => {
  return normalizeText(text).split(/\s+/).filter(w => w.length > 0);
};

// Calculate relevance score for a song based on query
const calculateRelevanceScore = (song: Song, query: string, tokens: string[]): number => {
  let score = 0;
  
  const normalizedTitle = normalizeText(song.title);
  const normalizedArtist = normalizeText(song.artist);
  const normalizedAlbum = normalizeText(song.album || '');
  const normalizedAliases = normalizeText(song.aliases || '');
  const displayString = `${normalizedTitle} - ${normalizedArtist}`;
  const normalizedQuery = normalizeText(query);
  
  const titleWords = getWords(song.title);
  const artistWords = getWords(song.artist);
  
  // Track which fields matched for cross-field bonus
  const matchedFields = new Set<string>();
  
  for (const token of tokens) {
    let tokenMatched = false;
    
    // 1. Exact/Prefix Matches (highest weight)
    
    // Exact match in title
    if (normalizedTitle === token) {
      score += 150;
      tokenMatched = true;
      matchedFields.add('title');
    }
    // Title starts with token
    else if (normalizedTitle.startsWith(token)) {
      score += 100;
      tokenMatched = true;
      matchedFields.add('title');
    }
    
    // Exact match in artist
    if (normalizedArtist === token) {
      score += 120;
      tokenMatched = true;
      matchedFields.add('artist');
    }
    // Artist starts with token
    else if (normalizedArtist.startsWith(token)) {
      score += 80;
      tokenMatched = true;
      matchedFields.add('artist');
    }
    
    // Any word in title starts with token
    for (const word of titleWords) {
      if (wordStartsWith(word, token)) {
        score += 60;
        tokenMatched = true;
        matchedFields.add('title');
        break; // Only count once per token
      }
    }
    
    // Any word in artist starts with token
    for (const word of artistWords) {
      if (wordStartsWith(word, token)) {
        score += 60;
        tokenMatched = true;
        matchedFields.add('artist');
        break; // Only count once per token
      }
    }
    
    // 2. Token Coverage - base points for any match
    if (tokenMatched) {
      score += 40;
    }
    
    // Check album
    if (normalizedAlbum.includes(token)) {
      score += 30;
      tokenMatched = true;
      matchedFields.add('album');
    }
    
    // 4. Aliases (lower weight)
    if (normalizedAliases.includes(token)) {
      score += 30;
      tokenMatched = true;
      matchedFields.add('aliases');
    }
  }
  
  // 3. Phrase Match - query appears as substring in "title - artist"
  if (displayString.includes(normalizedQuery)) {
    score += 50;
  }
  
  // Bonus for tokens matching across different fields (title + artist)
  if (matchedFields.has('title') && matchedFields.has('artist')) {
    score += 30 * tokens.length; // Bonus per token that matches both
  }
  
  // 5. Popularity Boost
  if (song.popularity_rank !== null && song.popularity_rank > 0) {
    // Add (100 - popularity_rank) / 10 points (max ~10 points for rank 1)
    const popularityBoost = (100 - song.popularity_rank) / 10;
    score += Math.max(0, popularityBoost);
  }
  
  return score;
};

// Sort songs for 0-1 char queries (popularity first, then alphabetical)
const sortByPopularity = (songs: Song[]): Song[] => {
  return [...songs].sort((a, b) => {
    // Sort by popularity_rank (ascending - lower rank = more popular)
    if (a.popularity_rank !== null && b.popularity_rank !== null) {
      if (a.popularity_rank !== b.popularity_rank) {
        return a.popularity_rank - b.popularity_rank;
      }
    } else if (a.popularity_rank !== null) {
      return -1; // a has rank, b doesn't - a comes first
    } else if (b.popularity_rank !== null) {
      return 1; // b has rank, a doesn't - b comes first
    }
    // Both null or equal popularity_rank, sort alphabetically
    return a.title.localeCompare(b.title);
  });
};

// Filter and sort options based on query
const filterOptions = (options: Song[], { inputValue }: FilterOptionsState<Song>): Song[] => {
  const query = inputValue.trim();
  const queryLength = query.length;
  
  // 0-1 char: return all songs sorted by popularity, then alphabetically
  if (queryLength <= 1) {
    return sortByPopularity(options);
  }
  
  // Normal query: score and filter
  const tokens = tokenizeQuery(query);
  const scored = options
    .map(song => ({ song, score: calculateRelevanceScore(song, query, tokens) }))
    .filter(({ score }) => score > 0) // Hard filter: at least one match
    .sort((a, b) => {
      // Sort by score (desc), then popularity (asc), then title (asc)
      if (a.score !== b.score) return b.score - a.score;
      
      // Tie-breaker: popularity
      if (a.song.popularity_rank !== null && b.song.popularity_rank !== null) {
        if (a.song.popularity_rank !== b.song.popularity_rank) {
          return a.song.popularity_rank - b.song.popularity_rank;
        }
      } else if (a.song.popularity_rank !== null) return -1;
      else if (b.song.popularity_rank !== null) return 1;
      
      // Final tie-breaker: alphabetical
      return a.song.title.localeCompare(b.song.title);
    })
    .map(({ song }) => song);
  
  return scored;
};

const SongAutocomplete = ({ 
  onSongSelect, 
  value = null, 
  placeholder = 'Type a song title or artist...',
  onSubmit
}: SongAutocompleteProps) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(value);
  const [inputValue, setInputValue] = useState<string>('');

  // Sync internal state with prop value (for clearing after guess)
  useEffect(() => {
    setSelectedSong(value);
    if (value === null) {
      // Clear input text when value is cleared
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(getApiUrl('/api/catalog/searchable'));
        
        if (!response.ok) {
          // Try to get error details from response
          let errorMessage = `Server error (${response.status})`;
          try {
            const errorData = await response.json();
            if (errorData.message || errorData.error) {
              errorMessage = errorData.message || errorData.error;
            }
          } catch {
            // If response is not JSON, use status text
            errorMessage = response.statusText || `Server error (${response.status})`;
          }
          throw new Error(errorMessage);
        }
        
        const data: Song[] = await response.json();
        setSongs(data);
      } catch (err) {
        // Log detailed error to console for developers
        console.error('Error fetching songs:', err);
        
        // Show user-friendly error message
        // Detailed error information is already logged to console above
        setError('Unable to load songs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  const getOptionLabel = (option: Song | string): string => {
    if (typeof option === 'string') {
      return option;
    }
    return `${option.title} - ${option.artist}`;
  };

  const isOptionEqualToValue = (option: Song, value: Song): boolean => {
    return option.id === value.id;
  };

  const handleChange = (_event: unknown, newValue: Song | string | null) => {
    // Only handle Song objects, ignore string values from freeSolo
    if (newValue && typeof newValue === 'object') {
      setSelectedSong(newValue);
      if (onSongSelect) {
        onSongSelect(newValue.id, newValue);
      }
    } else {
      setSelectedSong(null);
      if (onSongSelect) {
        onSongSelect(null, null);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Only submit on Enter if a song from the dropdown is selected (not free text)
    if (event.key === 'Enter' && selectedSong && typeof selectedSong === 'object' && onSubmit) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <Autocomplete
      freeSolo
      options={songs}
      value={selectedSong}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={handleChange}
      loading={loading}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      filterOptions={filterOptions}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          className="autocomplete-input"
          error={!!error}
          helperText={error || undefined}
          onKeyDown={handleKeyDown}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '50px',
              paddingLeft: '3rem',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '& fieldset': {
                borderColor: '#ddd',
              },
              '&:hover fieldset': {
                borderColor: '#667eea',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#667eea',
              },
            },
            '& .MuiInputBase-input': {
              padding: '1rem 1rem 1rem 0',
              color: '#333',
              fontSize: '1rem',
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#999',
              opacity: 1,
            },
            '& .MuiAutocomplete-clearIndicator': {
              color: '#666',
              '&:hover': {
                color: '#333',
              },
            },
            '& .MuiAutocomplete-popupIndicator': {
              color: '#666',
            },
          }}
        />
      )}
      className="mui-autocomplete"
    />
  );
};

export default SongAutocomplete;

