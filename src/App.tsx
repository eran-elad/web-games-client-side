import { useState, useRef } from 'react'
import { setViewingArchive, clearViewingArchive } from './utils/storage'
import { clearSession } from './utils/storage'
import { getDailyPuzzleStatus } from './services/gameApi'
import { MUSIC_GAME_ID } from './config/gameConfig'
import { getPlayerId } from './utils/storage'
import WelcomePage from './components/WelcomePage'
import ActiveGame from './components/ActiveGame/ActiveGame'
import StatisticsPage from './components/StatisticsPage/StatisticsPage'
import HelpPage from './components/HelpPage/HelpPage'
import ArchivePage from './components/ArchivePage/ArchivePage'
import SettingsPage from './components/SettingsPage/SettingsPage'
import PrivacyPolicy from './components/PrivacyPolicy/PrivacyPolicy'
import CreditsPage from './components/CreditsPage/CreditsPage'
import './App.css'

type View = 'welcome' | 'game' | 'statistics' | 'help' | 'archive' | 'settings' | 'privacy' | 'credits'

function App() {
  const [currentView, setCurrentView] = useState<View>('game')
  const [previousView, setPreviousView] = useState<View>('game')
  const statsClosedRef = useRef<boolean>(false)
  const cameFromArchiveRef = useRef<boolean>(false)
  const [gameKey, setGameKey] = useState<number>(0) // Key to force remount of ActiveGame

  const handlePlay = () => {
    // Clear any archive puzzle parameters when starting a new daily game
    localStorage.removeItem('music_game_puzzle_id')
    localStorage.removeItem('music_game_local_date')
    setCurrentView('game')
    // Reset stats closed flag when starting a new game
    statsClosedRef.current = false
    // Reset archive flag when starting a new game
    cameFromArchiveRef.current = false
    clearViewingArchive()
  }

  const handleShowStatistics = () => {
    setCurrentView('statistics')
  }

  const handleCloseStatistics = () => {
    statsClosedRef.current = true // Mark that user manually closed stats
    // Always go back to game view when closing statistics
    // (even if the game was started from archive, we're still in the game view)
    setCurrentView('game')
  }

  const handleShowHelp = () => {
    setPreviousView(currentView) // Remember where we came from
    setCurrentView('help')
  }

  const handleCloseHelp = () => {
    setCurrentView(previousView) // Return to previous view
  }

  const handleShowArchive = () => {
    setPreviousView(currentView) // Remember where we came from
    setCurrentView('archive')
  }

  const handleCloseArchive = () => {
    setCurrentView(previousView) // Return to previous view
  }

  const handleShowSettings = () => {
    setPreviousView(currentView) // Remember where we came from
    setCurrentView('settings')
  }

  const handleCloseSettings = () => {
    setCurrentView(previousView) // Return to previous view
  }

  const handleShowPrivacy = () => {
    setPreviousView(currentView)
    setCurrentView('privacy')
  }

  const handleClosePrivacy = () => {
    setCurrentView(previousView)
  }

  const handleShowCredits = () => {
    setPreviousView(currentView)
    setCurrentView('credits')
  }

  const handleCloseCredits = () => {
    setCurrentView(previousView)
  }

  const handleGoToDailyPuzzle = async () => {
    console.log('App: handleGoToDailyPuzzle called');
    console.log('App: Current view:', currentView);
    console.log('App: Current gameKey:', gameKey);
    
    try {
      // First, get the daily puzzle status to get the puzzle_id
      const storedPlayerId = getPlayerId();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      
      console.log('App: Calling daily-puzzle-status endpoint');
      const statusResponse = await getDailyPuzzleStatus(
        MUSIC_GAME_ID,
        storedPlayerId,
        timezone
      );
      
      console.log('App: Daily puzzle status:', {
        puzzle_id: statusResponse.puzzle.puzzle_id,
        local_date: statusResponse.puzzle.local_date,
        new_daily_puzzle_available: statusResponse.new_daily_puzzle_available
      });
      
      // Clear any archive puzzle parameters to switch to daily puzzle
      localStorage.removeItem('music_game_puzzle_id')
      localStorage.removeItem('music_game_local_date')
      console.log('App: Cleared puzzle parameters from localStorage');
      
      // Store the daily puzzle_id so ActiveGame can use it
      localStorage.setItem('music_game_puzzle_id', statusResponse.puzzle.puzzle_id);
      localStorage.setItem('music_game_local_date', statusResponse.puzzle.local_date);
      console.log('App: Stored daily puzzle_id:', statusResponse.puzzle.puzzle_id, 'and local_date:', statusResponse.puzzle.local_date);
      
      // Clear session to force server to create new session for daily puzzle
      clearSession()
      console.log('App: Cleared session from localStorage');
      
      // Clear viewing archive flag
      clearViewingArchive()
      // Reset stats closed flag
      statsClosedRef.current = false
      // Reset archive flag
      cameFromArchiveRef.current = false
      // Force remount of ActiveGame by incrementing key
      setGameKey(prev => {
        const newKey = prev + 1;
        console.log('App: Incremented gameKey to:', newKey);
        return newKey;
      });
      
      // Navigate to game view (will initialize with daily puzzle)
      setCurrentView('game')
      console.log('App: Switched to game view');
    } catch (error) {
      console.error('App: Error getting daily puzzle status:', error);
      // Fallback to original behavior if daily-puzzle-status fails
      localStorage.removeItem('music_game_puzzle_id')
      localStorage.removeItem('music_game_local_date')
      clearSession()
      clearViewingArchive()
      statsClosedRef.current = false
      cameFromArchiveRef.current = false
      setGameKey(prev => prev + 1);
      setCurrentView('game')
    }
  }

  const handlePlayDate = (date: string, puzzleId: string | null) => {
    // Clear any existing puzzle parameters first (in case switching between archive puzzles)
    localStorage.removeItem('music_game_puzzle_id')
    localStorage.removeItem('music_game_local_date')
    // Store the puzzle info for ActiveGame to use
    if (puzzleId) {
      localStorage.setItem('music_game_puzzle_id', puzzleId)
    } else {
      localStorage.setItem('music_game_local_date', date)
    }
    // Reset stats closed flag when starting a historical puzzle
    statsClosedRef.current = false
    // Remember we came from archive so we can navigate back correctly
    cameFromArchiveRef.current = true
    setViewingArchive() // Also store in localStorage for persistence
    setCurrentView('game')
  }

  return (
    <div className="app">
      {currentView === 'welcome' && <WelcomePage onPlay={handlePlay} onShowStatistics={handleShowStatistics} onShowHelp={handleShowHelp} onShowArchive={handleShowArchive} onShowSettings={handleShowSettings} onShowPrivacy={handleShowPrivacy} />}
      {currentView === 'game' && <ActiveGame key={gameKey} onShowStatistics={handleShowStatistics} userClosedStats={statsClosedRef.current} onShowHelp={handleShowHelp} onShowPrivacy={handleShowPrivacy} onShowCredits={handleShowCredits} onShowArchive={handleShowArchive} onShowSettings={handleShowSettings} onGoToDailyPuzzle={handleGoToDailyPuzzle} />}
      {currentView === 'statistics' && <StatisticsPage onClose={handleCloseStatistics} />}
      {currentView === 'help' && <HelpPage onClose={handleCloseHelp} />}
      {currentView === 'archive' && <ArchivePage onClose={handleCloseArchive} onPlayDate={handlePlayDate} />}
      {currentView === 'settings' && <SettingsPage onClose={handleCloseSettings} />}
      {currentView === 'privacy' && <PrivacyPolicy onClose={handleClosePrivacy} />}
      {currentView === 'credits' && <CreditsPage onClose={handleCloseCredits} />}
    </div>
  )
}

export default App
