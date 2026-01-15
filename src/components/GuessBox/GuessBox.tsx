import { useState, useRef, useEffect } from 'react';
import './GuessBox.css';
import { getCountryName, normalizeCountryCode } from '../../config/countryCodes';
import { DEFAULT_CLUE_THRESHOLDS } from '../../config/clueThresholds';

interface ClueTooltipProps {
  helpText: string;
}

const ClueTooltip = ({ helpText }: ClueTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'left' | 'center' | 'right'>('center');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        buttonRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isVisible]);

  // Calculate tooltip position - simple rule: right-align if button is in left half of screen
  useEffect(() => {
    if (isVisible && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const buttonCenterX = buttonRect.left + buttonRect.width / 2;
      
      // If button is in left half of screen, use right alignment
      // Otherwise, center it
      if (buttonCenterX < viewportWidth / 2) {
        setTooltipPosition('right');
      } else {
        setTooltipPosition('center');
      }
    } else {
      setTooltipPosition('center');
    }
  }, [isVisible]);

  return (
    <div className="clue-tooltip-wrapper">
      <button
        ref={buttonRef}
        className="clue-help-button"
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        aria-label="Show clue help"
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <circle cx="7" cy="5" r="0.8" fill="currentColor" />
          <rect x="6.5" y="6.5" width="1" height="3.5" rx="0.5" fill="currentColor" />
        </svg>
      </button>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`clue-tooltip clue-tooltip-${tooltipPosition}`}
          onClick={(e) => e.stopPropagation()}
        >
          {helpText}
        </div>
      )}
    </div>
  );
};

interface GuessBoxProps {
  songTitle: string;
  artist: string;
  clues: {
    year?: string | number;
    country?: string;
    genre?: string;
    time?: string;
    [key: string]: any; // Allow flexible structure from API
  };
  guessNumber?: number;
  guessedCountry?: string; // Country code from the guess object (guess.country)
  guessedArtistType?: string; // Artist type from the guess object (guess.artist_type)
  isWinning?: boolean; // Whether to show win animation
  pulseDelay?: number; // Delay in seconds for staggered pulse effect
}

const GuessBox = ({ songTitle, artist, clues, guessNumber, guessedCountry, guessedArtistType, isWinning = false, pulseDelay = 0 }: GuessBoxProps) => {
  // Helper to determine clue status (correct/close/incorrect/neighboring) based on thresholds
  type ClueStatus = 'correct' | 'close' | 'incorrect' | 'neighboring' | 'unknown';
  
  const getYearStatus = (clueObj: any): ClueStatus => {
    if (!clueObj || typeof clueObj !== 'object' || clueObj.diff === undefined) return 'unknown';
    const diff = Math.abs(Number(clueObj.diff));
    if (diff === 0) return 'correct';
    if (diff <= DEFAULT_CLUE_THRESHOLDS.year.closeRange) return 'close';
    return 'incorrect';
  };
  
  const getCountryStatus = (clueObj: any): ClueStatus => {
    if (!clueObj || typeof clueObj !== 'object') return 'unknown';
    if (clueObj.status === 'correct' || clueObj.status === true) return 'correct';
    
    // Check if it's a neighboring country (distance = 0 and status is incorrect/different)
    const distValue = clueObj.distance_km !== undefined ? clueObj.distance_km :
                     clueObj.distance !== undefined ? clueObj.distance :
                     clueObj.km !== undefined ? clueObj.km :
                     clueObj.value !== undefined ? clueObj.value : undefined;
    
    if (distValue !== undefined) {
      const distanceValue = Number(distValue);
      // Check if status is incorrect/different (not correct)
      const isIncorrect = clueObj.status === 'incorrect' || 
                         clueObj.status === 'different' || 
                         clueObj.status === false ||
                         (clueObj.status !== 'correct' && clueObj.status !== true);
      
      if (distanceValue === 0 && isIncorrect) {
        return 'neighboring';
      }
    }
    
    // Country must be exact (closeRange is 0), so no "close" state
    return 'incorrect';
  };
  
  const getGenreStatus = (clueObj: any): ClueStatus => {
    if (!clueObj || typeof clueObj !== 'object') return 'unknown';
    if (clueObj.status === 'correct' || clueObj.status === true) return 'correct';
    // Genre must be exact (closeRange is 0), so no "close" state
    return 'incorrect';
  };
  
  const getDurationStatus = (clueObj: any): ClueStatus => {
    if (!clueObj || typeof clueObj !== 'object') return 'unknown';
    const diff = clueObj.diff_sec !== undefined ? clueObj.diff_sec :
                 clueObj.diff !== undefined ? clueObj.diff : undefined;
    if (diff === undefined) return 'unknown';
    const absDiff = Math.abs(Number(diff));
    if (absDiff === 0) return 'correct';
    if (absDiff <= DEFAULT_CLUE_THRESHOLDS.duration.closeRangeSeconds) return 'close';
    return 'incorrect';
  };
  
  // Helper to format year clue: {"diff": 21} -> "+21y"
  const formatYearClue = (clueObj: any): string => {
    if (clueObj === null || clueObj === undefined) return '';
    
    if (typeof clueObj === 'object' && clueObj.diff !== undefined) {
      const diff = Number(clueObj.diff);
      if (diff === 0) return '±0y';
      if (diff > 0) return `+${diff}y`;
      return `${diff}y`; // Already negative, so just show the number
    }
    
    // Fallback to regular extraction
    return extractClueValue(clueObj);
  };
  
  // Helper to get arrow for direction
  const getDirectionArrow = (direction: string): string => {
    const dir = direction?.toUpperCase();
    const arrowMap: { [key: string]: string } = {
      'N': '↑',
      'S': '↓',
      'E': '→',
      'W': '←',
      'NE': '↗',
      'SE': '↘',
      'SW': '↙',
      'NW': '↖'
    };
    return arrowMap[dir] || '';
  };
  
  // Helper to format country clue: {"distance_km": 5117, "direction": "W", "status": "incorrect", "given": "US"} -> returns distance, arrow, status, and country code
  const formatCountryClue = (clueObj: any): { distance: string; arrow: string; status: 'correct' | 'incorrect' | 'neighboring' | 'unknown'; countryCode: string } => {
    if (clueObj === null || clueObj === undefined) {
      return { distance: '', arrow: '', status: 'unknown', countryCode: '' };
    }
    
    let distance = '';
    let direction = '';
    let status: 'correct' | 'incorrect' | 'neighboring' | 'unknown' = 'unknown';
    let distanceValue = 0;
    let countryCode = '';
    
    // If it's already a string, try to parse it
    if (typeof clueObj === 'string') {
      distance = clueObj;
    }
    // If it's a number, assume it's distance in km
    else if (typeof clueObj === 'number') {
      distanceValue = clueObj;
      distance = `${clueObj}km`;
    }
    // If it's an object, extract distance, direction, and status
    else if (typeof clueObj === 'object') {
      // Extract distance
      const distValue = clueObj.distance_km !== undefined ? clueObj.distance_km :
                       clueObj.distance !== undefined ? clueObj.distance :
                       clueObj.km !== undefined ? clueObj.km :
                       clueObj.value !== undefined ? clueObj.value : undefined;
      
      if (distValue !== undefined) {
        distanceValue = Number(distValue);
        if (!isNaN(distanceValue)) {
          distance = `${distanceValue}km`;
        }
      }
      
      // Extract direction
      direction = clueObj.direction || clueObj.dir || '';
      
      // Extract country code (similar to genre, check 'given', 'name', 'code', etc.)
      // Also check the guessedCountry prop which comes from guess.country
      countryCode = normalizeCountryCode(
        clueObj.given || clueObj.name || clueObj.code || clueObj.country_code || clueObj.country || guessedCountry || ''
      );
      
      // Extract status
      // API returns "correct" or "different" for country status
      if (clueObj.status === 'correct' || clueObj.status === true) {
        status = 'correct';
      } else if (clueObj.status === 'incorrect' || clueObj.status === 'different' || clueObj.status === false) {
        status = 'incorrect';
      }
      
      // Check if it's a neighboring country (distance = 0 and status is incorrect)
      if (distanceValue === 0 && status === 'incorrect') {
        status = 'neighboring';
      }
    }
    
    // If distance is still empty, try to extract from object
    if (!distance) {
      distance = extractClueValue(clueObj);
    }
    
    const arrow = getDirectionArrow(direction);
    
    return { distance, arrow, status, countryCode };
  };
  
  // Helper to format genre clue: {"status": "correct", "genre": "Rock"} -> returns object with display and status
  const formatGenreClue = (clueObj: any): { display: string; status: 'correct' | 'incorrect' | 'unknown' } => {
    if (clueObj === null || clueObj === undefined) {
      return { display: '', status: 'unknown' };
    }
    
    if (typeof clueObj === 'object') {
      // Check status - be more explicit about incorrect detection
      let status: 'correct' | 'incorrect' | 'unknown' = 'unknown';
      if (clueObj.status === 'correct' || clueObj.status === true) {
        status = 'correct';
      } else if (clueObj.status === 'incorrect' || clueObj.status === false || clueObj.status === 'wrong' || clueObj.status === 'false') {
        status = 'incorrect';
      } else if (clueObj.status !== undefined && clueObj.status !== 'correct') {
        // If status exists but is not 'correct', assume it's incorrect
        status = 'incorrect';
      }
      
      // Try to get the genre name from various possible properties
      // Prioritize 'name' property as it's where the genre name is stored
      const genreName = clueObj.name || clueObj.genre || clueObj.value || clueObj.text || clueObj.label || clueObj.display || clueObj.genre_name || '';
      return { display: genreName, status };
    }
    
    // Fallback: treat as string/number
    const fallbackValue = extractClueValue(clueObj);
    return { display: fallbackValue, status: 'unknown' };
  };
  
  // Helper to format time/duration clue: converts seconds to "+2m10s" format
  const formatTimeClue = (clueObj: any): string => {
    if (clueObj === null || clueObj === undefined) return '';
    
    // If it's already a string, try to parse it or return as is
    if (typeof clueObj === 'string') {
      // Try to parse if it's a number string
      const num = Number(clueObj);
      if (!isNaN(num)) {
        return formatDuration(num);
      }
      return clueObj;
    }
    
    // If it's a number, format it
    if (typeof clueObj === 'number') {
      return formatDuration(clueObj);
    }
    
    // If it's an object, try to find the duration value
    if (typeof clueObj === 'object') {
      // Check diff_sec first (the actual property name from API)
      const duration = clueObj.diff_sec !== undefined ? clueObj.diff_sec :
                      clueObj.diff !== undefined ? clueObj.diff : 
                      clueObj.difference !== undefined ? clueObj.difference :
                      clueObj.value !== undefined ? clueObj.value :
                      clueObj.duration !== undefined ? clueObj.duration :
                      clueObj.seconds !== undefined ? clueObj.seconds : undefined;
      
      if (duration !== undefined) {
        const num = Number(duration);
        if (!isNaN(num)) {
          return formatDuration(num);
        }
      }
    }
    
    return extractClueValue(clueObj);
  };
  
  // Helper to format duration in seconds to "+2m10s" format
  const formatDuration = (seconds: number): string => {
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const sign = seconds >= 0 ? '+' : '-';
    
    if (minutes > 0 && secs > 0) {
      return `${sign}${minutes}m${secs}s`;
    } else if (minutes > 0) {
      return `${sign}${minutes}m`;
    } else {
      return `${sign}${secs}s`;
    }
  };
  
  // Helper to extract value from clue object (handles both objects and primitives)
  const extractClueValue = (clueObj: any): string => {
    if (clueObj === null || clueObj === undefined) return '';
    
    // If it's already a string or number, return it
    if (typeof clueObj === 'string' || typeof clueObj === 'number') {
      return String(clueObj);
    }
    
    // If it's an object, try to find common properties
    if (typeof clueObj === 'object') {
      // Try common property names that might contain the display value
      if (clueObj.value !== undefined) return String(clueObj.value);
      if (clueObj.text !== undefined) return String(clueObj.text);
      if (clueObj.label !== undefined) return String(clueObj.label);
      if (clueObj.display !== undefined) return String(clueObj.display);
      if (clueObj.difference !== undefined) return String(clueObj.difference);
      if (clueObj.distance !== undefined) return String(clueObj.distance);
      if (clueObj.message !== undefined) return String(clueObj.message);
      if (clueObj.hint !== undefined) return String(clueObj.hint);
      
      // If it has a toString method, use it
      if (typeof clueObj.toString === 'function' && clueObj.toString() !== '[object Object]') {
        return clueObj.toString();
      }
      
      // Last resort: stringify the object (but this shouldn't happen if structure is correct)
      return JSON.stringify(clueObj);
    }
    
    return String(clueObj);
  };
  
  // Extract clues from the nested structure: clues.clues.year, clues.clues.country, etc.
  const cluesData = clues.clues || clues;
  

  const getClueObject = (key: string, altKey?: string): any => {
    if (cluesData[key] !== undefined) {
      return cluesData[key];
    }
    if (altKey && cluesData[altKey] !== undefined) {
      return cluesData[altKey];
    }
    const lowerKey = key.toLowerCase();
    if (cluesData[lowerKey] !== undefined) {
      return cluesData[lowerKey];
    }
    return undefined;
  };

  const yearObj = getClueObject('year');
  const countryObj = getClueObject('country');
  const genreObj = getClueObject('genre');
  const durationObj = getClueObject('time', 'duration');
  const artistObj = getClueObject('artist');
  const albumObj = getClueObject('album');
  const artistTypeObj = getClueObject('artist_type');
  
  // Debug: Log clues data to see what's coming from the server
  console.log('GuessBox Debug - All clues data:', clues);
  console.log('GuessBox Debug - CluesData:', cluesData);
  console.log('GuessBox Debug - artistObj:', artistObj);
  console.log('GuessBox Debug - albumObj:', albumObj);
  console.log('GuessBox Debug - artistTypeObj:', artistTypeObj);
  console.log('GuessBox Debug - All clue keys:', Object.keys(cluesData));
  
  const year = formatYearClue(yearObj);
  const country = formatCountryClue(countryObj);
  const genre = formatGenreClue(genreObj);
  const duration = formatTimeClue(durationObj);
  
  // Helper to get help text for clues
  const getHelpText = (clueType: 'year' | 'country' | 'genre' | 'duration' | 'artist' | 'album' | 'artist_type', clueObj: any): string => {
    if (!clueObj || typeof clueObj !== 'object') return '';
    
    switch (clueType) {
      case 'year': {
        const diff = clueObj.diff;
        if (diff === 0) return 'The release year matches exactly!';
        if (diff > 0) return `The secret song is ${diff} year${diff !== 1 ? 's' : ''} newer than your guess.`;
        return `The secret song is ${Math.abs(diff)} year${Math.abs(diff) !== 1 ? 's' : ''} older than your guess.`;
      }
      case 'country': {
        const countryCode = normalizeCountryCode(
          clueObj.given || clueObj.name || clueObj.code || clueObj.country_code || clueObj.country || guessedCountry || ''
        );
        const countryName = getCountryName(countryCode);
        
        if (clueObj.status === 'correct') {
          if (countryName) {
            return `The country matches exactly! The secret song is from ${countryName}.`;
          }
          return 'The country matches exactly!';
        }
        
        const distance = clueObj.distance_km || clueObj.distance || 0;
        if (distance === 0 && clueObj.status !== 'correct') {
          const dir = clueObj.dir || clueObj.direction || '';
          const directionText = dir ? ` Look ${dir === 'N' ? 'north' : dir === 'S' ? 'south' : dir === 'E' ? 'east' : dir === 'W' ? 'west' : dir === 'NE' ? 'northeast' : dir === 'NW' ? 'northwest' : dir === 'SE' ? 'southeast' : dir === 'SW' ? 'southwest' : dir.toLowerCase()} (${dir}).` : '';
          
          if (countryName) {
            return `The secret song is not from ${countryName}. This is a neighboring country (shares a border).${directionText}`;
          }
          return `This is a neighboring country (shares a border).${directionText}`;
        }
        
        const dir = clueObj.dir || clueObj.direction || '';
        const directionText = dir ? ` in the ${dir === 'N' ? 'north' : dir === 'S' ? 'south' : dir === 'E' ? 'east' : dir === 'W' ? 'west' : dir === 'NE' ? 'northeast' : dir === 'NW' ? 'northwest' : dir === 'SE' ? 'southeast' : dir === 'SW' ? 'southwest' : dir.toLowerCase()} direction` : '';
        
        if (countryName) {
          return `The secret song is not from ${countryName}. The secret song's country is ${distance}km away${directionText}.`;
        }
        return `The secret song's country is ${distance}km away${directionText}.`;
      }
      case 'genre': {
        const guessedGenre = clueObj.given || clueObj.name || genre.display || '';
        if (clueObj.status === 'correct') return 'The genre matches exactly!';
        if (guessedGenre) return `The genre of the secret song is not ${guessedGenre}.`;
        return 'The genre does not match.';
      }
      case 'duration': {
        const diff = clueObj.diff_sec || clueObj.diff || 0;
        if (diff === 0) return 'The duration matches exactly!';
        if (diff > 0) {
          const minutes = Math.floor(diff / 60);
          const seconds = diff % 60;
          const timeText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
          return `The secret song is ${timeText} longer than your guess.`;
        }
        const absDiff = Math.abs(diff);
        const minutes = Math.floor(absDiff / 60);
        const seconds = absDiff % 60;
        const timeText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        return `The secret song is ${timeText} shorter than your guess.`;
      }
      case 'artist': {
        return 'You guessed the correct artist! This is a great clue to narrow down your search.';
      }
      case 'album': {
        return 'You guessed the correct album! This helps confirm you\'re on the right track.';
      }
      case 'artist_type': {
        // Get the guessed type - use helper fields passed from rendering logic, or extract from clueObj
        const guessedType = clueObj._guessedType || clueObj.given || clueObj.type || clueObj.value || clueObj.artist_type || '';
        const guessedTypeLower = guessedType ? guessedType.toLowerCase() : '';
        
        // Use helper fields if available, otherwise determine from guessedType
        const isPerson = clueObj._isPerson !== undefined ? clueObj._isPerson : 
                        (guessedTypeLower === 'person' || guessedTypeLower === 'solo');
        const isGroup = clueObj._isGroup !== undefined ? clueObj._isGroup :
                       (guessedTypeLower === 'group' || guessedTypeLower === 'band' || guessedTypeLower === 'duo');
        
        console.log('getHelpText artist_type:', {
          guessedType,
          guessedTypeLower,
          isPerson,
          isGroup,
          status: clueObj.status,
          _guessedType: clueObj._guessedType,
          _isPerson: clueObj._isPerson,
          _isGroup: clueObj._isGroup
        });
        
        if (clueObj.status === 'correct' || clueObj.status === true) {
          // When correct, the guessed type matches the secret type
          if (isPerson) {
            return 'The Artist Type is a Solo Artist.';
          } else if (isGroup) {
            return 'The Artist Type is a Group (e.g. band).';
          } else if (guessedType) {
            return `The Artist Type is ${guessedType}.`;
          } else {
            return 'The Artist Type matches.';
          }
        } else {
          // When wrong, the guessed type doesn't match
          if (isPerson) {
            return 'The Artist Type isn\'t a Solo Artist.';
          } else if (isGroup) {
            return 'The Artist Type isn\'t a Group (e.g. band).';
          } else if (guessedType) {
            return `The Artist Type isn't ${guessedType}.`;
          } else {
            return 'The Artist Type doesn\'t match.';
          }
        }
      }
      default:
        return '';
    }
  };

  return (
    <div 
      className={`guess-box ${isWinning ? 'win-pulse' : ''}`}
      data-pulse-delay={isWinning ? pulseDelay : undefined}
      style={isWinning ? { '--pulse-delay': `${pulseDelay}s` } as React.CSSProperties : undefined}
    >
      {guessNumber && (
        <div className="guess-number-badge">Guess {guessNumber}</div>
      )}
      <div className="guess-box-header">
        <h3 className="guess-song-title">
          {songTitle} — {artist}
        </h3>
      </div>
      <div className="guess-clues">
        {yearObj && (() => {
          const yearStatus = getYearStatus(yearObj);
          const yearDisplay = year || '?';
          return (
            <div className={`clue-tag clue-status-${yearStatus}`}>
              <span className="clue-label">YEAR</span>
              <span className="clue-value">{yearDisplay}</span>
              <ClueTooltip helpText={getHelpText('year', yearObj)} />
            </div>
          );
        })()}
        {(country.distance || country.status === 'correct' || country.status === 'neighboring' || country.countryCode) && countryObj && (() => {
          // Use the status from formatCountryClue, but fall back to getCountryStatus if needed
          const countryStatus = country.status === 'neighboring' ? 'neighboring' :
                               country.status === 'correct' ? 'correct' :
                               getCountryStatus(countryObj);
          return (
            <div className={`clue-tag clue-status-${countryStatus}`}>
              <span className="clue-label country-icon-wrapper">
                <svg className="country-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </span>
              {country.countryCode && <span className="clue-value">{country.countryCode}</span>}
              {country.status === 'neighboring' ? (
                // Neighboring country: show country code, border country text, and arrow if direction is available
                <>
                  <span className="clue-value neighboring">border country</span>
                  {country.arrow && <span className="clue-arrow">{country.arrow}</span>}
                  <ClueTooltip helpText={getHelpText('country', countryObj)} />
                </>
              ) : (
                // Regular country: show country code, distance with arrow
                <>
                  {country.distance && <span className="clue-value">{country.distance}</span>}
                  {country.arrow && <span className="clue-arrow">{country.arrow}</span>}
                  <ClueTooltip helpText={getHelpText('country', countryObj)} />
                </>
              )}
            </div>
          );
        })()}
        {(() => {
          const genreObj = getClueObject('genre');
          
          if (genreObj) {
            // Check status directly from the object as fallback
            let status = genre.status;
            if (status === 'unknown') {
              // Fallback to checking the raw object
              if (genreObj.status === 'correct' || genreObj.status === true) {
                status = 'correct';
              } else if (genreObj.status === 'incorrect' || genreObj.status === false || genreObj.status === 'wrong') {
                status = 'incorrect';
              } else if (genreObj.status !== undefined && genreObj.status !== 'correct' && genreObj.status !== null) {
                // If status exists but is not 'correct', assume it's incorrect
                status = 'incorrect';
              }
            }
            
            // Get genre name from the clue object if not already extracted
            // Check 'given' first as it contains the guessed genre name (used in tooltip)
            // Then prioritize 'name' property as it's where the genre name is stored
            const genreName = genre.display || genreObj.given || genreObj.name || genreObj.genre || genreObj.value || genreObj.text || genreObj.label || genreObj.genre_name || '';
            const genreStatus = getGenreStatus(genreObj);
            
            return (
              <div className={`clue-tag clue-status-${genreStatus}`}>
                <span className="clue-label genre-icon-wrapper">🎵</span>
                {genreName && <span className="clue-value">{genreName}</span>}
                <ClueTooltip helpText={getHelpText('genre', genreObj)} />
              </div>
            );
          }
          return null;
        })()}
        {duration && durationObj && (() => {
          const durationStatus = getDurationStatus(durationObj);
          return (
            <div className={`clue-tag clue-status-${durationStatus}`}>
              <span className="clue-label duration-icon-wrapper">
                <svg className="duration-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </span>
              <span className="clue-value">{duration}</span>
              <ClueTooltip helpText={getHelpText('duration', durationObj)} />
            </div>
          );
        })()}
        {/* Artist clue - only show when correct */}
        {artistObj && artistObj.status === 'correct' && (
          <div className="clue-tag clue-status-correct">
            <span className="clue-label">ARTIST</span>
            <span className="clue-value">✓</span>
            <ClueTooltip helpText={getHelpText('artist', artistObj)} />
          </div>
        )}
        {/* Album clue - only show when correct */}
        {albumObj && albumObj.status === 'correct' && (
          <div className="clue-tag clue-status-correct">
            <span className="clue-label">ALBUM</span>
            <span className="clue-value">✓</span>
            <ClueTooltip helpText={getHelpText('album', albumObj)} />
          </div>
        )}
        {/* Artist Type clue - show icon only (no label) */}
        {artistTypeObj && (() => {
          // Determine status - show for both correct and incorrect
          const isCorrect = artistTypeObj.status === 'correct' || artistTypeObj.status === true;
          const statusClass = isCorrect ? 'correct' : 'incorrect';
          
          // Try to get the guessed artist_type value - this is what the user guessed
          // First check the prop (from guess object), then check clue object fields
          const guessedType = guessedArtistType || artistTypeObj.given || artistTypeObj.type || artistTypeObj.value || artistTypeObj.artist_type || '';
          const guessedTypeLower = guessedType.toLowerCase();
          const isPerson = guessedTypeLower === 'person' || guessedTypeLower === 'solo';
          const isGroup = guessedTypeLower === 'group' || guessedTypeLower === 'band' || guessedTypeLower === 'duo';
          
          // Debug logging
          console.log('Artist Type Debug:', {
            artistTypeObj,
            guessedType,
            guessedTypeLower,
            isPerson,
            isGroup,
            status: artistTypeObj.status
          });
          
          // Default to person icon if we can't determine, or show appropriate icon
          const iconSvg = isGroup ? (
            // Multiple persons icon (Group)
            <svg className="artist-type-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          ) : (
            // Single person icon (Person/Solo)
            <svg className="artist-type-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          );
          
          // Pass the guessed type info to help text function so it knows what was guessed
          const helpText = getHelpText('artist_type', { 
            ...artistTypeObj, 
            _guessedType: guessedType, 
            _isPerson: isPerson, 
            _isGroup: isGroup 
          });
          
          console.log('Help text result:', helpText);
          
          return (
            <div className={`clue-tag clue-status-${statusClass}`}>
              <span className="clue-value artist-type-icon-wrapper">{iconSvg}</span>
              <ClueTooltip helpText={helpText} />
            </div>
          );
        })()}
        {/* Debug: show all keys if no clues found */}
        {!year && !country.distance && country.status !== 'correct' && country.status !== 'neighboring' && !genre.display && !duration && (
          <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: '8px', fontSize: '0.85rem' }}>
            <strong>Debug:</strong> No clues found. Available keys: {Object.keys(clues).join(', ')}
            <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>{JSON.stringify(clues, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuessBox;


