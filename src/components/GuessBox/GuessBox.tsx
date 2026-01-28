import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './GuessBox.css';
import { getCountryName, normalizeCountryCode } from '../../config/countryCodes';
import { DEFAULT_CLUE_THRESHOLDS } from '../../config/clueThresholds';
import { formatDistance, getDefaultDistanceUnit } from '../../utils/distanceUtils';

interface ClueTooltipProps {
  helpText: string | React.ReactNode;
  clueType?: string; // For debugging - which clue this tooltip is for
}

const ClueTooltip = ({ helpText }: ClueTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({
    opacity: 0,
    visibility: 'hidden',
    pointerEvents: 'none'
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle click outside to close tooltip
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        tooltipRef.current &&
        buttonRef.current &&
        !tooltipRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setIsVisible(false);
      }
    };

    // Use both mousedown and touchstart for iOS
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible]);

  // Calculate and position tooltip when visible
  useEffect(() => {
    if (!isVisible) {
      setTooltipStyle({ 
        opacity: 0, 
        visibility: 'hidden',
        pointerEvents: 'none'
      });
      return;
    }

    if (!buttonRef.current) return;

    // Calculate position immediately
    const updatePosition = () => {
      if (!buttonRef.current) return;

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 10;
      
      // Estimate tooltip size
      const estimatedWidth = 240;
      const estimatedHeight = 60;
      
      const buttonCenterX = buttonRect.left + buttonRect.width / 2;
      const buttonTop = buttonRect.top;
      
      // Position above button, centered
      let left = buttonCenterX - estimatedWidth / 2;
      let top = buttonTop - estimatedHeight - 8;
      
      // Adjust if off-screen
      if (left < padding) left = padding;
      if (left + estimatedWidth > viewportWidth - padding) {
        left = viewportWidth - estimatedWidth - padding;
      }
      
      if (top < padding) {
        // Position below if no space above
        top = buttonRect.bottom + 8;
        if (top + estimatedHeight > viewportHeight - padding) {
          top = viewportHeight - estimatedHeight - padding;
        }
      }
      
      // Set position immediately
      setTooltipStyle({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        zIndex: 99999,
        opacity: 1,
        visibility: 'visible',
        pointerEvents: 'auto',
        transform: 'translate3d(0, 0, 0)'
      });
      
      // Refine position after tooltip renders with actual dimensions
      if (tooltipRef.current) {
        requestAnimationFrame(() => {
          if (!tooltipRef.current || !buttonRef.current) return;
          
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          const actualWidth = tooltipRect.width || estimatedWidth;
          const actualHeight = tooltipRect.height || estimatedHeight;
          
          // Recalculate with actual dimensions
          let finalLeft = buttonRect.left + buttonRect.width / 2 - actualWidth / 2;
          let finalTop = buttonRect.top - actualHeight - 8;
          
          // Adjust if off-screen
          if (finalLeft < padding) finalLeft = padding;
          if (finalLeft + actualWidth > viewportWidth - padding) {
            finalLeft = viewportWidth - actualWidth - padding;
          }
          
          if (finalTop < padding) {
            finalTop = buttonRect.bottom + 8;
            if (finalTop + actualHeight > viewportHeight - padding) {
              finalTop = viewportHeight - actualHeight - padding;
            }
          }
          
          setTooltipStyle({
            position: 'fixed',
            left: `${finalLeft}px`,
            top: `${finalTop}px`,
            zIndex: 99999,
            opacity: 1,
            visibility: 'visible',
            pointerEvents: 'auto',
            transform: 'translate3d(0, 0, 0)'
          });
        });
      }
    };

    // Update immediately
    updatePosition();
    
    // Also update on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  // Always render tooltip in portal, but control visibility via style
  const tooltipElement = (
    <div
      ref={tooltipRef}
      className="clue-tooltip"
      style={tooltipStyle}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {helpText}
    </div>
  );

  return (
    <div className="clue-tooltip-wrapper">
      <button
        ref={buttonRef}
        className="clue-help-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(prev => !prev);
        }}
        onTouchEnd={(e) => {
          // Handle touch separately for iOS
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(prev => !prev);
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
      {tooltipElement && createPortal(tooltipElement, document.body)}
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
  guessedGender?: string; // Gender from the guess object (guess.gender)
  guessedYear?: number; // Year from the guess object (guess.year)
  preferredDistanceUnit?: 'km' | 'miles' | null; // User's preferred distance unit (null = use country default)
  isWinning?: boolean; // Whether to show win animation
  pulseDelay?: number; // Delay in seconds for staggered pulse effect
  durationClueShown?: boolean; // Whether duration clue has been shown in this session (for threshold logic)
  isLifeline?: boolean; // Indicates this is a lifeline entry
  catalogSize?: number; // Catalog size for lifeline entries
  catalogSizeAfterGuess?: number; // Catalog size after this guess (when lifeline active)
  /** When true, show the artist clue for this guess (e.g. after near-match or once revealed in a previous guess) */
  showArtistClue?: boolean;
  /** Secret song artist name; shown when artist clue is revealed but guess was wrong */
  solutionArtist?: string;
}

const GuessBox = ({ songTitle, artist, clues, guessNumber, guessedCountry, guessedArtistType, guessedGender, guessedYear, preferredDistanceUnit = null, isWinning = false, pulseDelay = 0, isLifeline = false, catalogSize, catalogSizeAfterGuess, showArtistClue = false, solutionArtist }: GuessBoxProps) => {
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
      if (diff === 0) return ''; // Return empty string for exact match - we'll show checkmark instead
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
          // Use formatDistance utility to format with correct unit
          distance = formatDistance(distanceValue, preferredDistanceUnit);
        }
      }
      
      // Extract direction - check multiple possible field names
      direction = clueObj.direction || clueObj.dir || clueObj.direction_code || clueObj.d || '';
      
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
        // For neighboring countries, set distance to empty (we'll show ±0km in the UI)
        distance = '';
      }
    }
    
    // If distance is still empty and not neighboring, try to extract from object
    if (!distance && status !== 'neighboring') {
      distance = extractClueValue(clueObj);
    }
    
    // Always generate arrow if direction is available (for both regular and neighboring countries)
    const arrow = getDirectionArrow(direction);
    
    // Debug logging for neighboring countries
    if (status === 'neighboring') {
      console.log('Neighboring country debug:', {
        clueObj,
        direction,
        arrow,
        distanceValue,
        countryCode
      });
    }
    
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
  const genderObj = getClueObject('gender');
  
  // Debug: Log clues data to see what's coming from the server
  console.log('GuessBox Debug - All clues data:', clues);
  console.log('GuessBox Debug - CluesData:', cluesData);
  console.log('GuessBox Debug - artistObj:', artistObj);
  console.log('GuessBox Debug - albumObj:', albumObj);
  console.log('GuessBox Debug - artistTypeObj:', artistTypeObj);
  console.log('GuessBox Debug - artistTypeObj keys:', artistTypeObj ? Object.keys(artistTypeObj) : 'null');
  console.log('GuessBox Debug - All clue keys:', Object.keys(cluesData));
  console.log('GuessBox Debug - guessedArtistType prop:', guessedArtistType);
  console.log('GuessBox Debug - Full clues object:', JSON.stringify(clues, null, 2));
  
  const year = formatYearClue(yearObj);
  const country = formatCountryClue(countryObj);
  const genre = formatGenreClue(genreObj);
  const duration = formatTimeClue(durationObj);
  
  // Helper to format gender value for display
  const formatGenderValue = (gender: string): string => {
    if (!gender) return '';
    const lower = gender.toLowerCase();
    switch (lower) {
      case 'male':
        return 'Male';
      case 'female':
        return 'Female';
      case 'other':
        return 'Other';
      case 'non_binary':
      case 'non-binary':
        return 'Non-Binary';
      case 'all_male':
      case 'all males':
        return 'All Male';
      case 'all_female':
      case 'all_females':
      case 'all females':
        return 'All Female';
      case 'mixed':
        return 'Mixed';
      default:
        // Capitalize first letter of each word
        return gender.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }
  };

  // Helper to format gender for tooltip display (e.g., "Mixed" -> "mixed-gender")
  const formatGenderForTooltip = (gender: string): string => {
    if (!gender) return '';
    const lower = gender.toLowerCase();
    switch (lower) {
      case 'mixed':
        return 'mixed-gender';
      case 'all_male':
      case 'all males':
        return 'all-male';
      case 'all_female':
      case 'all_females':
      case 'all females':
        return 'all-female';
      case 'male':
        return 'male';
      case 'female':
        return 'female';
      case 'non_binary':
      case 'non-binary':
        return 'non-binary';
      case 'other':
        return 'other';
      default:
        // Convert snake_case to kebab-case and lowercase
        return gender.toLowerCase().replace(/_/g, '-');
    }
  };
  
  // Helper to get help text for clues
  const getHelpText = (clueType: 'year' | 'country' | 'genre' | 'duration' | 'artist' | 'album' | 'artist_type' | 'gender', clueObj: any, preferredUnit?: 'km' | 'miles' | null): string | React.ReactNode => {
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
          const directionText = dir ? ` Look ${dir === 'N' ? 'North' : dir === 'S' ? 'South' : dir === 'E' ? 'East' : dir === 'W' ? 'West' : dir === 'NE' ? 'Northeast' : dir === 'NW' ? 'Northwest' : dir === 'SE' ? 'Southeast' : dir === 'SW' ? 'Southwest' : dir.charAt(0).toUpperCase() + dir.slice(1).toLowerCase()}.` : '';
          
          if (countryName) {
            return `The artist's country is not ${countryName}. It is a neighboring country (Shares a border).${directionText}`;
          }
          return `It is a neighboring country (Shares a border).${directionText}`;
        }
        
        const dir = clueObj.dir || clueObj.direction || '';
        const directionText = dir ? ` in the ${dir === 'N' ? 'north' : dir === 'S' ? 'south' : dir === 'E' ? 'east' : dir === 'W' ? 'west' : dir === 'NE' ? 'northeast' : dir === 'NW' ? 'northwest' : dir === 'SE' ? 'southeast' : dir === 'SW' ? 'southwest' : dir.toLowerCase()} direction` : '';
        
        // Format distance with correct unit
        const distanceKm = Number(distance);
        if (!isNaN(distanceKm) && distanceKm > 0) {
          const formattedDistance = formatDistance(distanceKm, preferredUnit ?? null);
          if (countryName) {
            return `The secret song is not from ${countryName}. The secret song's country is ${formattedDistance} away${directionText}.`;
          }
          return `The secret song's country is ${formattedDistance} away${directionText}.`;
        }
        
        // Fallback for invalid distance
        if (countryName) {
          return `The secret song is not from ${countryName}.`;
        }
        return 'The secret song is from a different country.';
      }
      case 'genre': {
        // Get the genre name - for correct status, use the actual genre name from the clue
        // For incorrect, use the guessed genre
        const genreName = clueObj.status === 'correct' 
          ? (clueObj.name || clueObj.genre || clueObj.value || clueObj.given || '')
          : (clueObj.given || clueObj.name || '');
        
        if (clueObj.status === 'correct') {
          if (genreName) {
            return `The secret song's genre is ${genreName}.`;
          }
          return 'The genre matches exactly!';
        }
        if (genreName) return `The genre of the secret song is not ${genreName}.`;
        return 'The genre does not match.';
      }
      case 'duration': {
        const diff = clueObj.diff_sec || clueObj.diff || 0;
        const threshold = DEFAULT_CLUE_THRESHOLDS.duration.secondsThreshold;
        
        let mainText = '';
        if (diff === 0) {
          mainText = 'The duration matches exactly!';
        } else if (diff > 0) {
          const minutes = Math.floor(diff / 60);
          const seconds = diff % 60;
          const timeText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
          mainText = `The secret song is ${timeText} longer than your guess.`;
        } else {
          const absDiff = Math.abs(diff);
          const minutes = Math.floor(absDiff / 60);
          const seconds = absDiff % 60;
          const timeText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
          mainText = `The secret song is ${timeText} shorter than your guess.`;
        }
        
        if (threshold) {
          return `${mainText} The Duration clue starts showing up only after a guess with a duration difference larger than ${threshold} seconds is made.`;
        }
        return mainText;
      }
      case 'artist': {
        // Handled inline with artist/solutionArtist for correct vs incorrect wording
        return null;
      }
      case 'album': {
        // Try to get the album name from the clue object
        const albumName = clueObj.name || clueObj.album || clueObj.given || clueObj.value || '';
        if (albumName) {
          return `You guessed the correct album: ${albumName}! This helps confirm you're on the right track.`;
        }
        return 'You guessed the correct album! This helps confirm you\'re on the right track.';
      }
      case 'artist_type': {
        // Get the guessed type - use helper fields passed from rendering logic, or extract from clueObj
        const guessedType = clueObj._guessedType || clueObj.given || clueObj.type || clueObj.value || clueObj.artist_type || '';
        const guessedTypeLower = guessedType ? guessedType.toLowerCase() : '';
        
        // Use helper fields if available, otherwise determine from guessedType
        // Note: API sends "Person" but we display it as "Solo" for better UX
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
        
        // Format display name - convert "Person" to "Solo" for better UX
        const displayName = guessedTypeLower === 'person' ? 'Solo' : 
                           guessedTypeLower === 'group' ? 'Group' :
                           guessedType ? guessedType.charAt(0).toUpperCase() + guessedType.slice(1).toLowerCase() : '';
        
        if (clueObj.status === 'correct' || clueObj.status === true) {
          // When correct, the guessed type matches the secret type
          if (isPerson) {
            return 'The Artist Type is a Solo Artist.';
          } else if (isGroup) {
            return 'The Artist Type is a Group (e.g. band).';
          } else if (displayName) {
            return `The Artist Type is ${displayName}.`;
          } else {
            return 'The Artist Type matches.';
          }
        } else {
          // When wrong, the guessed type doesn't match
          if (isPerson) {
            return 'The Artist Type isn\'t a Solo Artist.';
          } else if (isGroup) {
            return 'The Artist Type isn\'t a Group (e.g. band).';
          } else if (displayName) {
            return `The Artist Type isn't ${displayName}.`;
          } else {
            return 'The Artist Type doesn\'t match.';
          }
        }
      }
      case 'gender': {
        const guessedGenderValue = clueObj._guessedGender || clueObj.given || clueObj.value || clueObj.gender || guessedGender || '';
        const genderLower = guessedGenderValue.toLowerCase();
        
        // Determine if this is a solo artist (male/female) or a group (all_male, all_female, mixed)
        const isSoloArtist = genderLower === 'male' || genderLower === 'female' || genderLower === 'non_binary' || genderLower === 'non-binary';
        
        if (isSoloArtist) {
          // For solo artists: "The secret artist is/isn't male/female"
          const genderDisplay = formatGenderForTooltip(guessedGenderValue);
          if (clueObj.status === 'correct') {
            return (
              <>
                The secret artist <strong>is</strong> {genderDisplay}
              </>
            );
          }
          return (
            <>
              The secret artist <strong>isn't</strong> {genderDisplay}
            </>
          );
        } else {
          // For groups: "The secret artist is/isn't an all-male/all-female/mixed-gender group"
          const genderForTooltip = formatGenderForTooltip(guessedGenderValue);
          if (clueObj.status === 'correct') {
            return (
              <>
                The secret artist <strong>is</strong> an {genderForTooltip} group
              </>
            );
          }
          return (
            <>
              The secret artist <strong>isn't</strong> an {genderForTooltip} group
            </>
          );
        }
      }
      default:
        return '';
    }
  };

  return (
    <div 
      className={`guess-box ${isWinning ? 'win-pulse' : ''} ${isLifeline ? 'lifeline-box' : ''}`}
      data-pulse-delay={isWinning ? pulseDelay : undefined}
      style={isWinning ? { '--pulse-delay': `${pulseDelay}s` } as React.CSSProperties : undefined}
    >
      {isLifeline ? (
        // Lifeline entry display
        <>
          {guessNumber && (
            <div className="guess-number-badge">Lifeline</div>
          )}
          <div className="guess-box-header">
            <h3 className="guess-song-title">
              Lifeline activated
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              at the cost of 1 guess
            </div>
          </div>
          {catalogSize !== null && catalogSize !== undefined && (
            <div className="lifeline-catalog-size">
              Search narrowed to {catalogSize} songs
            </div>
          )}
        </>
      ) : (
        // Regular guess display
        <>
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
          const isExactMatch = yearObj && typeof yearObj === 'object' && yearObj.diff !== undefined && Number(yearObj.diff) === 0;
          return (
            <div className={`clue-tag clue-status-${yearStatus}`}>
              <span className="clue-label year-icon-wrapper">
                <svg className="year-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM7 12h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
                </svg>
              </span>
              {isExactMatch ? (
                <>
                  <span className="clue-value clue-value-checkmark">✓</span>
                  {guessedYear && <span className="clue-value">{guessedYear}</span>}
                </>
              ) : (
                <span className="clue-value">{yearDisplay}</span>
              )}
              <ClueTooltip helpText={getHelpText('year', yearObj)} clueType="year" />
            </div>
          );
        })()}
        {(country.distance || country.status === 'correct' || country.status === 'neighboring' || country.countryCode) && countryObj && (() => {
          // Use the status from formatCountryClue, but fall back to getCountryStatus if needed
          const countryStatus = country.status === 'neighboring' ? 'neighboring' :
                               country.status === 'correct' ? 'correct' :
                               getCountryStatus(countryObj);
          return (
            <div className={`clue-tag clue-status-${countryStatus} country-clue`}>
              <span className="clue-label country-icon-wrapper">
                <svg className="country-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </span>
              {country.status === 'neighboring' ? (
                // Neighboring country: show country code, +/- 0 with correct unit, and arrow
                <>
                  {country.countryCode && <span className="clue-value">{country.countryCode}</span>}
                  <span className="clue-value neighboring">
                    {(() => {
                      const unit = preferredDistanceUnit || getDefaultDistanceUnit();
                      return unit === 'miles' ? '±0mi' : '±0km';
                    })()}
                  </span>
                  {country.arrow && <span className="clue-arrow">{country.arrow}</span>}
                  <ClueTooltip helpText={getHelpText('country', countryObj, preferredDistanceUnit)} clueType="country" />
                </>
              ) : (
                // Regular country: show country code, distance with arrow
                <>
                  {country.countryCode && <span className="clue-value">{country.countryCode}</span>}
                  {country.distance && <span className="clue-value">{country.distance}</span>}
                  {country.arrow && <span className="clue-arrow">{country.arrow}</span>}
                  <ClueTooltip helpText={getHelpText('country', countryObj, preferredDistanceUnit)} clueType="country" />
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
                <ClueTooltip helpText={getHelpText('genre', genreObj)} clueType="genre" />
              </div>
            );
          }
          return null;
        })()}
        {duration && durationObj && (() => {
          // Check if duration clue should be shown based on threshold for THIS specific guess
          const durationThreshold = DEFAULT_CLUE_THRESHOLDS.duration.secondsThreshold;
          let shouldShowDuration = true;
          
          if (durationThreshold && durationThreshold > 0) {
            // Get the absolute difference for THIS specific guess
            const durationDiff = durationObj.diff_sec !== undefined ? durationObj.diff_sec :
                                durationObj.diff !== undefined ? durationObj.diff : 0;
            const absDiff = Math.abs(Number(durationDiff));
            
            // Only show if THIS guess's diff meets or exceeds the threshold
            // Don't check session-level state - each guess is independent
            shouldShowDuration = absDiff >= durationThreshold;
          }
          
          // If threshold is not set (null/0/empty), always show (existing behavior)
          
          if (!shouldShowDuration) {
            return null; // Don't render the duration clue for this guess
          }
          
          const durationStatus = getDurationStatus(durationObj);
          return (
            <div className={`clue-tag clue-status-${durationStatus}`}>
              <span className="clue-label duration-icon-wrapper">
                <svg className="duration-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </span>
              <span className="clue-value">{duration}</span>
              <ClueTooltip helpText={getHelpText('duration', durationObj)} clueType="duration" />
            </div>
          );
        })()}
        {/* Artist Type clue - show icon only (no label) - before Artist and Album */}
        {artistTypeObj && (() => {
          // Determine status - show for both correct and incorrect
          const isCorrect = artistTypeObj.status === 'correct' || artistTypeObj.status === true;
          const statusClass = isCorrect ? 'correct' : 'incorrect';
          
          // Try to get the guessed artist_type value - this is what the user guessed
          // The artist_type comes from the guess object (guess.artist_type), not from the result clues
          // The result clues only contain the status, not the actual guessed value
          const guessedType = guessedArtistType || artistTypeObj?.given || artistTypeObj?.type || artistTypeObj?.value || artistTypeObj?.artist_type || '';
          const guessedTypeLower = guessedType ? guessedType.toLowerCase() : '';
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
          
          // Format the display text - convert "Person" to "Solo" for better UX
          let displayText = '';
          if (guessedType) {
            const guessedTypeLower = guessedType.toLowerCase();
            if (guessedTypeLower === 'person') {
              displayText = 'Solo';
            } else if (guessedTypeLower === 'group') {
              displayText = 'Group';
            } else if (guessedTypeLower === 'other') {
              displayText = 'Other';
            } else {
              // Capitalize first letter
              displayText = guessedType.charAt(0).toUpperCase() + guessedType.slice(1).toLowerCase();
            }
          }
          
          // Debug logging for display text
          console.log('=== ARTIST TYPE DISPLAY DEBUG ===');
          console.log('guessedType:', guessedType);
          console.log('guessedTypeLower:', guessedTypeLower);
          console.log('isPerson:', isPerson);
          console.log('isGroup:', isGroup);
          console.log('displayText:', displayText);
          console.log('artistTypeObj:', artistTypeObj);
          console.log('guessedArtistType prop:', guessedArtistType);
          console.log('================================');
          
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
              {displayText && <span className="clue-value">{displayText}</span>}
              <ClueTooltip helpText={helpText} clueType="artist_type" />
            </div>
          );
        })()}
        {/* Gender clue - only show when relevant (when artist types match) */}
        {genderObj && (() => {
          const isCorrect = genderObj.status === 'correct' || genderObj.status === true;
          const statusClass = isCorrect ? 'correct' : 'incorrect';
          
          // Get the guessed gender value
          const guessedGenderValue = guessedGender || genderObj?.given || genderObj?.value || genderObj?.gender || '';
          const formattedGender = formatGenderValue(guessedGenderValue);
          
          // Gender icon - using ⚧ symbol
          const genderIcon = <span className="gender-icon">⚧</span>;
          
          // Pass the guessed gender to help text function
          const helpText = getHelpText('gender', { 
            ...genderObj, 
            _guessedGender: guessedGenderValue
          });
          
          return (
            <div className={`clue-tag clue-status-${statusClass}`}>
              <span className="clue-label gender-icon-wrapper">
                {genderIcon}
              </span>
              {formattedGender && <span className="clue-value">{formattedGender}</span>}
              <ClueTooltip helpText={helpText} clueType="gender" />
            </div>
          );
        })()}
        {/* Artist clue - show when correct, or when showArtistClue (near-match or once revealed) */}
        {((artistObj && artistObj.status === 'correct') || showArtistClue) && (
          <div className={`clue-tag clue-status-${artistObj?.status === 'correct' ? 'correct' : 'incorrect'}`}>
            <span className="clue-label">ARTIST</span>
            {artistObj?.status === 'correct' ? (
              <>
                <span className="clue-value clue-value-checkmark">✓</span>
                <ClueTooltip helpText={<>The secret song&apos;s artist <strong>is</strong> {artist}.</>} clueType="artist" />
              </>
            ) : (
              <>
                {solutionArtist && <span className="clue-value">{solutionArtist}</span>}
                <ClueTooltip helpText={<>The secret song&apos;s artist <strong>is not</strong> {artist}.</>} clueType="artist" />
              </>
            )}
          </div>
        )}
        {/* Album clue - only show when correct */}
        {albumObj && albumObj.status === 'correct' && (
          <div className="clue-tag clue-status-correct">
            <span className="clue-label">ALBUM</span>
            <span className="clue-value clue-value-checkmark">✓</span>
            <ClueTooltip helpText={getHelpText('album', albumObj)} clueType="album" />
          </div>
        )}
        {/* Debug: show all keys if no clues found */}
        {!year && !country.distance && country.status !== 'correct' && country.status !== 'neighboring' && !genre.display && !duration && (
          <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: '8px', fontSize: '0.85rem' }}>
            <strong>Debug:</strong> No clues found. Available keys: {Object.keys(clues).join(', ')}
            <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>{JSON.stringify(clues, null, 2)}</pre>
          </div>
        )}
      </div>
      {catalogSizeAfterGuess !== null && catalogSizeAfterGuess !== undefined && (
        <div className="catalog-size-after-guess">
          Search narrowed to {catalogSizeAfterGuess} songs
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default GuessBox;


