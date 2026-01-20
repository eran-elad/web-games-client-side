import { useState } from 'react';
import './ShareResult.css';

interface ShareResultProps {
  guesses: Array<{
    songTitle: string;
    artist: string;
    clues: any;
  }>;
  guessCount: number;
  maxGuesses: number;
  isWon: boolean;
  puzzleDate?: string;
}

const ShareResult = ({ guesses, guessCount, maxGuesses, isWon, puzzleDate }: ShareResultProps) => {
  const [copied, setCopied] = useState(false);
  
  // Check if Web Share API is available (mobile browsers)
  // navigator.share is available on mobile browsers (iOS Safari, Chrome Android, etc.)
  // Note: Requires HTTPS (or localhost) to work
  const hasWebShareAPI = typeof navigator !== 'undefined' && 
                         'share' in navigator &&
                         typeof (navigator as any).share === 'function';
  
  // Detect mobile device (for better UX - show "Share" even if API check fails)
  const isMobileDevice = typeof window !== 'undefined' && 
                         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Show "Share" if we have the API OR if it's a mobile device (will try API on click anyway)
  const canUseNativeShare = hasWebShareAPI || isMobileDevice;

  const getClueEmoji = (clueObj: any, clueType: 'year' | 'country' | 'genre' | 'duration'): string => {
    if (!clueObj || typeof clueObj !== 'object') return '⬜';
    
    // Year clue
    if (clueType === 'year') {
      const diff = Math.abs(clueObj.diff || 0);
      if (diff === 0) return '🟩'; // Correct
      if (diff <= 5) return '🟨'; // Close (within 5 years)
      return '🟥'; // Incorrect
    }
    
    // Country clue
    if (clueType === 'country') {
      if (clueObj.status === 'correct') return '🟩';
      if (clueObj.distance_km === 0 || clueObj.status === 'neighboring') return '🟨'; // Neighboring
      return '🟥';
    }
    
    // Genre clue
    if (clueType === 'genre') {
      if (clueObj.status === 'correct') return '🟩';
      return '🟥';
    }
    
    // Duration clue
    if (clueType === 'duration') {
      const diff = Math.abs(clueObj.diff_sec || 0);
      if (diff === 0) return '🟩'; // Correct
      if (diff <= 60) return '🟨'; // Close (within 1 minute)
      return '🟥'; // Incorrect
    }
    
    return '⬜';
  };

  const generateShareText = (): string => {
    const dateStr = puzzleDate 
      ? new Date(puzzleDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const isToday = !puzzleDate || puzzleDate === new Date().toISOString().split('T')[0];
    const gameTitle = isToday 
      ? `🎵 Music Game - ${dateStr}`
      : `🎵 Music Game - ${dateStr} (Archive)`;
    
    const resultLine = isWon 
      ? `🎉 Solved in ${guessCount}/${maxGuesses} guesses!`
      : `😔 Couldn't solve it (${guessCount}/${maxGuesses} guesses)`;
    
    let shareText = `${gameTitle}\n${resultLine}\n\n`;
    
    // Add guess results with emoji grid
    shareText += 'Clue Results:\n';
    shareText += 'Y = Year | C = Country | G = Genre | D = Duration\n';
    shareText += '🟩 Correct | 🟨 Close | 🟥 Wrong\n\n';
    
    guesses.forEach((guess, index) => {
      const yearEmoji = getClueEmoji(guess.clues.year, 'year');
      const countryEmoji = getClueEmoji(guess.clues.country, 'country');
      const genreEmoji = getClueEmoji(guess.clues.genre, 'genre');
      const durationEmoji = getClueEmoji(guess.clues.duration || guess.clues.time, 'duration');
      
      shareText += `Guess ${index + 1}: ${yearEmoji}${countryEmoji}${genreEmoji}${durationEmoji}\n`;
    });
    
    // Add empty guesses if game was lost
    if (!isWon && guessCount < maxGuesses) {
      for (let i = guessCount; i < maxGuesses; i++) {
        shareText += `Guess ${i + 1}: ⬜⬜⬜⬜\n`;
      }
    }
    
    shareText += `\n🎮 Play Music Game: ${window.location.origin}`;
    
    return shareText;
  };

  const handleShare = async () => {
    const shareText = generateShareText();
    const shareUrl = window.location.origin;
    const fullText = `${shareText}\n\n${shareUrl}`;
    
    // Check if we're on HTTPS (required for Web Share API, except localhost)
    const isSecureContext = window.isSecureContext || 
                           window.location.protocol === 'https:' || 
                           window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('127.0.0.1');
    
    // ALWAYS try Web Share API first if available (mobile browsers)
    // This will open native share dialog with WhatsApp, Messages, etc.
    // Check directly for navigator.share function
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        console.log('Attempting Web Share API...', { 
          hasShare: true, 
          isSecureContext,
          protocol: window.location.protocol,
          userAgent: navigator.userAgent?.substring(0, 80)
        });
        
        // Try with all fields first (most common format)
        // If it fails, we'll try simpler formats
        try {
          await navigator.share({
            title: 'Music Game Result',
            text: shareText,
            url: shareUrl,
          });
          console.log('Web Share API succeeded (with all fields)!');
          return; // Successfully shared via native share
        } catch (allFieldsErr) {
          console.log('Share with all fields failed, trying text+url only...', allFieldsErr);
          
          // Try with just text and url (some browsers don't like title)
          try {
            await navigator.share({
              text: shareText,
              url: shareUrl,
            });
            console.log('Web Share API succeeded (text+url only)!');
            return;
          } catch (textUrlErr) {
            console.log('Share with text+url failed, trying text only...', textUrlErr);
            
            // Try with just text (some browsers require at least text)
            await navigator.share({
              text: `${shareText}\n${shareUrl}`,
            });
            console.log('Web Share API succeeded (text only)!');
            return;
          }
        }
      } catch (err) {
        // User cancelled sharing (AbortError) - don't show error, just return
        if ((err as Error).name === 'AbortError') {
          console.log('User cancelled sharing');
          return;
        }
        // Other error - log and fall through to clipboard
        console.error('Web Share API failed after all attempts:', err);
        console.log('Final error details:', {
          name: (err as Error).name,
          message: (err as Error).message,
          isSecureContext,
          hasShare: typeof navigator.share === 'function',
          userAgent: navigator.userAgent?.substring(0, 80)
        });
      }
    } else {
      console.log('Web Share API not available', {
        hasNavigator: typeof navigator !== 'undefined',
        shareType: typeof navigator !== 'undefined' ? typeof navigator.share : 'no navigator',
        shareValue: typeof navigator !== 'undefined' ? navigator.share : 'no navigator'
      });
    }
    
    // Fallback to clipboard (desktop or if Web Share API not available)
    // On mobile, if Web Share API failed, clipboard is unlikely to work well
    // So we should warn the user instead of showing false success
    
    // Only try clipboard on desktop, or if explicitly not mobile
    if (!isMobileDevice) {
      // Try modern Clipboard API first (requires secure context)
      if (isSecureContext && typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
          console.log('Trying Clipboard API (desktop)...');
          await navigator.clipboard.writeText(fullText);
          console.log('Clipboard API succeeded!');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        } catch (err) {
          console.error('Error copying to clipboard (Clipboard API):', err);
        }
      }
    } else {
      // On mobile, if Web Share API didn't work, clipboard won't work either
      console.log('On mobile device - clipboard fallback skipped (Web Share API should have been used)');
    }
    
    // Fallback: create a temporary textarea and copy manually (for desktop only)
    // On mobile, this rarely works, so skip it
    if (!isMobileDevice) {
      try {
        console.log('Trying execCommand copy (desktop)...');
        const textarea = document.createElement('textarea');
        textarea.value = fullText;
        textarea.style.position = 'fixed';
        textarea.style.left = '0';
        textarea.style.top = '0';
        textarea.style.width = '2em';
        textarea.style.height = '2em';
        textarea.style.padding = '0';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.boxShadow = 'none';
        textarea.style.background = 'transparent';
        textarea.setAttribute('readonly', '');
        textarea.setAttribute('aria-hidden', 'true');
        document.body.appendChild(textarea);
        
        // Focus and select the text
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, fullText.length);
        
        // Try to copy
        let successful = false;
        try {
          successful = document.execCommand('copy');
          console.log('execCommand result:', successful);
        } catch (execErr) {
          console.error('execCommand failed:', execErr);
        }
        
        document.body.removeChild(textarea);
        
        if (successful) {
          console.log('execCommand copy succeeded!');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        } else {
          console.error('execCommand returned false - copy may have failed');
        }
      } catch (err) {
        console.error('Error with manual copy:', err);
      }
    }
    
    // If all methods fail, show appropriate error message
    console.error('All share/copy methods failed. Share text:', fullText);
    if (isMobileDevice) {
      alert(`Unable to open share menu.\n\nYour browser may not support the Web Share API, or the site needs to be served over HTTPS.\n\nPlease try:\n1. Use your browser's share button\n2. Or copy the text from the console\n\n(Check browser console for the full text)`);
    } else {
      alert(`Unable to copy automatically.\n\nPlease try:\n1. Use your browser's share button\n2. Or manually copy from the console\n\n(Check browser console for the text)`);
    }
  };

  return (
    <button 
      className="share-result-button" 
      onClick={handleShare}
      title={canUseNativeShare ? "Share via WhatsApp, Messages, etc." : "Copy result to clipboard"}
    >
      <span className="sparkle sparkle-1">✨</span>
      <span className="sparkle sparkle-2">✨</span>
      <span className="sparkle sparkle-3">✨</span>
      {copied ? (
        <>
          <span className="share-icon">✓</span>
          <span>Copied to Clipboard!</span>
        </>
      ) : (
        <>
          <span className="share-icon">{canUseNativeShare ? '📱' : '📤'}</span>
          <span>{canUseNativeShare ? 'Share Result' : 'Copy Result'}</span>
        </>
      )}
    </button>
  );
};

export default ShareResult;
