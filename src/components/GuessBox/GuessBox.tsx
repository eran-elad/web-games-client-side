import { useState, useRef, useEffect } from 'react';
import './GuessBox.css';
import { getCountryName, normalizeCountryCode } from '../../config/countryCodes';
import { DEFAULT_CLUE_THRESHOLDS } from '../../config/clueThresholds';

interface ClueTooltipProps {
  helpText: string;
  clueType?: string; // For debugging - which clue this tooltip is for
}

const ClueTooltip = ({ helpText, clueType = 'unknown' }: ClueTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'left' | 'center' | 'right'>('center');
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
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
      // Use requestAnimationFrame to ensure tooltip is rendered and measured
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!buttonRef.current) return;
          
          const buttonRect = buttonRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const buttonLeft = buttonRect.left;
          const buttonRight = buttonRect.right;
          const buttonWidth = buttonRect.width;
          const buttonCenterX = buttonRect.left + buttonRect.width / 2;
          const buttonTop = buttonRect.top;
          
          // Get tooltip dimensions if available
          let tooltipWidth = 0;
          let tooltipHeight = 0;
          if (tooltipRef.current) {
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            tooltipWidth = tooltipRect.width || tooltipRef.current.offsetWidth || 240;
            tooltipHeight = tooltipRect.height || tooltipRef.current.offsetHeight || 0;
          } else {
            // Estimate tooltip width if not yet rendered
            tooltipWidth = 240; // Default estimate
          }
          
          // Calculate available space
          const spaceLeft = buttonLeft;
          const spaceRight = viewportWidth - buttonRight;
          const spaceAbove = buttonTop;
          const isLeftHalf = buttonCenterX < viewportWidth / 2;
          
          // Determine position based on available space
          let chosenPosition: 'left' | 'center' | 'right' = 'center';
          const padding = 10; // Minimum padding from viewport edge
          
          // Calculate where tooltip would be positioned in each alignment
          const centerLeftEdge = buttonCenterX - tooltipWidth / 2;
          const centerRightEdge = buttonCenterX + tooltipWidth / 2;
          const rightLeftEdge = buttonRight; // Right-aligned starts at button right edge
          const rightRightEdge = buttonRight + tooltipWidth;
          const leftRightEdge = buttonLeft; // Left-aligned ends at button left edge
          const leftLeftEdge = buttonLeft - tooltipWidth;
          
          // Check if each position would fit
          const centerFits = (centerLeftEdge >= padding) && (centerRightEdge <= viewportWidth - padding);
          const rightFits = (rightRightEdge <= viewportWidth - padding);
          const leftFits = (leftLeftEdge >= padding);
          
          // Choose best position: prefer center if it fits, otherwise right, otherwise left
          if (centerFits) {
            chosenPosition = 'center';
          } else if (rightFits) {
            chosenPosition = 'right';
          } else if (leftFits) {
            chosenPosition = 'left';
          } else {
            // None fit perfectly, choose the one with least overflow
            const centerOverflow = Math.max(0, padding - centerLeftEdge) + Math.max(0, centerRightEdge - (viewportWidth - padding));
            const rightOverflow = Math.max(0, rightRightEdge - (viewportWidth - padding));
            const leftOverflow = Math.max(0, padding - leftLeftEdge);
            
            if (centerOverflow <= rightOverflow && centerOverflow <= leftOverflow) {
              chosenPosition = 'center';
            } else if (rightOverflow <= leftOverflow) {
              chosenPosition = 'right';
            } else {
              chosenPosition = 'left';
            }
          }
          
          // Debug logging
          console.log('=== TOOLTIP POSITION DEBUG ===');
          console.log(`Clue Type: ${clueType}`);
          console.log(`Help Text: "${helpText.substring(0, 50)}..."`);
          console.log(`Button Position:`);
          console.log(`  - Left: ${buttonLeft.toFixed(1)}px`);
          console.log(`  - Right: ${buttonRight.toFixed(1)}px`);
          console.log(`  - Center X: ${buttonCenterX.toFixed(1)}px`);
          console.log(`  - Width: ${buttonWidth.toFixed(1)}px`);
          console.log(`  - Top: ${buttonTop.toFixed(1)}px`);
          console.log(`Viewport:`);
          console.log(`  - Width: ${viewportWidth}px`);
          console.log(`  - Height: ${viewportHeight}px`);
          console.log(`  - Center: ${(viewportWidth / 2).toFixed(1)}px`);
          console.log(`Tooltip:`);
          console.log(`  - Width: ${tooltipWidth.toFixed(1)}px (estimated: ${!tooltipRef.current})`);
          console.log(`  - Height: ${tooltipHeight.toFixed(1)}px`);
          console.log(`Available Space:`);
          console.log(`  - Left of button: ${spaceLeft.toFixed(1)}px`);
          console.log(`  - Right of button: ${spaceRight.toFixed(1)}px`);
          console.log(`  - Above button: ${spaceAbove.toFixed(1)}px`);
          console.log(`Position Calculations:`);
          console.log(`  - Button in left half: ${isLeftHalf}`);
          console.log(`  - Center position: left edge at ${centerLeftEdge.toFixed(1)}px, right edge at ${centerRightEdge.toFixed(1)}px`);
          console.log(`  - Right position: left edge at ${rightLeftEdge.toFixed(1)}px, right edge at ${rightRightEdge.toFixed(1)}px`);
          console.log(`  - Left position: left edge at ${leftLeftEdge.toFixed(1)}px, right edge at ${leftRightEdge.toFixed(1)}px`);
          console.log(`Position Fit Check:`);
          console.log(`  - Center fits: ${centerFits} (left: ${centerLeftEdge.toFixed(1)} >= ${padding}, right: ${centerRightEdge.toFixed(1)} <= ${viewportWidth - padding})`);
          console.log(`  - Right fits: ${rightFits} (right: ${rightRightEdge.toFixed(1)} <= ${viewportWidth - padding})`);
          console.log(`  - Left fits: ${leftFits} (left: ${leftLeftEdge.toFixed(1)} >= ${padding})`);
          console.log(`Chosen position: ${chosenPosition}`);
          if (!centerFits && !rightFits && !leftFits) {
            console.log(`  - All positions overflow, using least overflow option`);
            console.log(`  - Center overflow: ${centerOverflow.toFixed(1)}px`);
            console.log(`  - Right overflow: ${rightOverflow.toFixed(1)}px`);
            console.log(`  - Left overflow: ${leftOverflow.toFixed(1)}px`);
          }
          console.log('==============================');
          
          setTooltipPosition(chosenPosition);
        });
      });
    } else {
      setTooltipPosition('center');
      setTooltipStyle({});
    }
  }, [isVisible, clueType, helpText]);

  // Position tooltip after it's rendered
  useEffect(() => {
    if (isVisible && tooltipRef.current && buttonRef.current) {
      // Wait for tooltip to be rendered and measured
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!tooltipRef.current || !buttonRef.current) return;
          
          const buttonRect = buttonRef.current.getBoundingClientRect();
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const padding = 10; // Minimum padding from viewport edge
          
          const buttonLeft = buttonRect.left;
          const buttonRight = buttonRect.right;
          const buttonCenterX = buttonRect.left + buttonRect.width / 2;
          const buttonTop = buttonRect.top;
          
          const tooltipWidth = tooltipRect.width || tooltipRef.current.offsetWidth || 240;
          const tooltipHeight = tooltipRect.height || tooltipRef.current.offsetHeight || 0;
          
          let left = 0;
          let top = buttonTop - tooltipHeight - 8; // 8px margin
          
          // Recalculate position based on chosen alignment, ensuring it fits
          let finalPosition = tooltipPosition;
          
          if (tooltipPosition === 'center') {
            left = buttonCenterX - tooltipWidth / 2;
            // If center doesn't fit, try right, then left
            if (left < padding) {
              left = buttonRight;
              finalPosition = 'right';
            } else if (left + tooltipWidth > viewportWidth - padding) {
              left = buttonLeft - tooltipWidth;
              finalPosition = 'left';
            }
          } else if (tooltipPosition === 'right') {
            left = buttonRight;
            // If right doesn't fit, try center, then left
            if (left + tooltipWidth > viewportWidth - padding) {
              left = buttonCenterX - tooltipWidth / 2;
              finalPosition = 'center';
              if (left < padding) {
                left = buttonLeft - tooltipWidth;
                finalPosition = 'left';
              }
            }
          } else { // left
            left = buttonLeft - tooltipWidth;
            // If left doesn't fit, try center, then right
            if (left < padding) {
              left = buttonCenterX - tooltipWidth / 2;
              finalPosition = 'center';
              if (left + tooltipWidth > viewportWidth - padding) {
                left = buttonRight;
                finalPosition = 'right';
              }
            }
          }
          
          // Final constraint: ensure tooltip stays within viewport
          if (left < padding) left = padding;
          if (left + tooltipWidth > viewportWidth - padding) {
            left = viewportWidth - tooltipWidth - padding;
          }
          
          // Calculate arrow position relative to button (after final constraint)
          const tooltipLeft = left;
          const arrowLeft = buttonCenterX - tooltipLeft; // Distance from tooltip left edge to button center
          
          // Constrain arrow to stay within tooltip bounds (with some padding from edges)
          const arrowPadding = 12; // Minimum distance from tooltip edges
          const constrainedArrowLeft = Math.max(arrowPadding, Math.min(arrowLeft, tooltipWidth - arrowPadding));
          
          setTooltipStyle({
            position: 'fixed',
            left: `${left}px`,
            top: `${top}px`,
            zIndex: 99999,
            opacity: 1 // Make visible once positioned
          });
          
          // Position arrow to point at button center (or constrained position)
          setArrowStyle({
            position: 'absolute',
            left: `${constrainedArrowLeft}px`,
            top: '100%',
            transform: 'translateX(-50%)',
            border: '6px solid transparent',
            borderTopColor: '#333',
            pointerEvents: 'none'
          });
        });
      });
    } else {
      setArrowStyle({});
    }
  }, [isVisible, tooltipPosition]);

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
          style={tooltipStyle}
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
          // Format large distances more compactly
          if (distanceValue >= 1000) {
            const thousands = (distanceValue / 1000).toFixed(1);
            distance = `${thousands.replace(/\.0$/, '')}k`; // e.g., "5.1k" or "5k" (more compact, no "km")
          } else {
            distance = `${distanceValue}km`;
          }
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
  console.log('GuessBox Debug - artistTypeObj keys:', artistTypeObj ? Object.keys(artistTypeObj) : 'null');
  console.log('GuessBox Debug - All clue keys:', Object.keys(cluesData));
  console.log('GuessBox Debug - guessedArtistType prop:', guessedArtistType);
  console.log('GuessBox Debug - Full clues object:', JSON.stringify(clues, null, 2));
  
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
          const isExactMatch = yearObj && typeof yearObj === 'object' && yearObj.diff !== undefined && Number(yearObj.diff) === 0;
          return (
            <div className={`clue-tag clue-status-${yearStatus}`}>
              <span className="clue-label year-icon-wrapper">
                <svg className="year-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM7 12h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
                </svg>
              </span>
              {isExactMatch ? (
                <span className="clue-value clue-value-checkmark">✓</span>
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
                  <ClueTooltip helpText={getHelpText('country', countryObj)} clueType="country" />
                </>
              ) : (
                // Regular country: show country code, distance with arrow
                <>
                  {country.distance && <span className="clue-value">{country.distance}</span>}
                  {country.arrow && <span className="clue-arrow">{country.arrow}</span>}
                  <ClueTooltip helpText={getHelpText('country', countryObj)} clueType="country" />
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
        {/* Artist clue - only show when correct */}
        {artistObj && artistObj.status === 'correct' && (
          <div className="clue-tag clue-status-correct">
            <span className="clue-label">ARTIST</span>
            <span className="clue-value clue-value-checkmark">✓</span>
            <ClueTooltip helpText={getHelpText('artist', artistObj)} clueType="artist" />
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
    </div>
  );
};

export default GuessBox;


