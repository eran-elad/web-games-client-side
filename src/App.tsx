import { useState, useRef } from 'react'
import { setViewingArchive, clearViewingArchive } from './utils/storage'
import WelcomePage from './components/WelcomePage'
import ActiveGame from './components/ActiveGame/ActiveGame'
import StatisticsPage from './components/StatisticsPage/StatisticsPage'
import HelpPage from './components/HelpPage/HelpPage'
import ArchivePage from './components/ArchivePage/ArchivePage'
import SettingsPage from './components/SettingsPage/SettingsPage'
import PrivacyPolicy from './components/PrivacyPolicy/PrivacyPolicy'
import './App.css'

type View = 'welcome' | 'game' | 'statistics' | 'help' | 'archive' | 'settings' | 'privacy'

function App() {
  const [currentView, setCurrentView] = useState<View>('welcome')
  const [previousView, setPreviousView] = useState<View>('welcome')
  const statsClosedRef = useRef<boolean>(false)
  const cameFromArchiveRef = useRef<boolean>(false)

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

  const handleGoHome = () => {
    setCurrentView('welcome')
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
      {currentView === 'game' && <ActiveGame onShowStatistics={handleShowStatistics} userClosedStats={statsClosedRef.current} onShowHelp={handleShowHelp} onShowArchive={handleShowArchive} onShowSettings={handleShowSettings} onGoHome={handleGoHome} />}
      {currentView === 'statistics' && <StatisticsPage onClose={handleCloseStatistics} />}
      {currentView === 'help' && <HelpPage onClose={handleCloseHelp} />}
      {currentView === 'archive' && <ArchivePage onClose={handleCloseArchive} onPlayDate={handlePlayDate} />}
      {currentView === 'settings' && <SettingsPage onClose={handleCloseSettings} />}
      {currentView === 'privacy' && <PrivacyPolicy onClose={handleClosePrivacy} />}
    </div>
  )
}

export default App
