import { useState, useRef } from 'react'
import { setViewingArchive, clearViewingArchive, isViewingArchive } from './utils/storage'
import WelcomePage from './components/WelcomePage'
import ActiveGame from './components/ActiveGame/ActiveGame'
import StatisticsPage from './components/StatisticsPage/StatisticsPage'
import HelpPage from './components/HelpPage/HelpPage'
import ArchivePage from './components/ArchivePage/ArchivePage'
import './App.css'

type View = 'welcome' | 'game' | 'statistics' | 'help' | 'archive'

function App() {
  const [currentView, setCurrentView] = useState<View>('welcome')
  const [previousView, setPreviousView] = useState<View>('welcome')
  const statsClosedRef = useRef<boolean>(false)
  const cameFromArchiveRef = useRef<boolean>(false)

  const handlePlay = () => {
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
    // If we came from archive (either via ref or localStorage flag), go back to archive
    if (cameFromArchiveRef.current || isViewingArchive()) {
      cameFromArchiveRef.current = false
      clearViewingArchive()
      setCurrentView('archive')
    } else {
      setCurrentView('game')
    }
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

  const handlePlayDate = (date: string, puzzleId: string | null) => {
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
      {currentView === 'welcome' && <WelcomePage onPlay={handlePlay} onShowStatistics={handleShowStatistics} onShowHelp={handleShowHelp} onShowArchive={handleShowArchive} />}
      {currentView === 'game' && <ActiveGame onShowStatistics={handleShowStatistics} userClosedStats={statsClosedRef.current} onShowHelp={handleShowHelp} onShowArchive={handleShowArchive} />}
      {currentView === 'statistics' && <StatisticsPage onClose={handleCloseStatistics} />}
      {currentView === 'help' && <HelpPage onClose={handleCloseHelp} />}
      {currentView === 'archive' && <ArchivePage onClose={handleCloseArchive} onPlayDate={handlePlayDate} />}
    </div>
  )
}

export default App
