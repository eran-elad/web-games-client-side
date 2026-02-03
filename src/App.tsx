import { useState, useRef } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { setViewingArchive, clearViewingArchive } from './utils/storage'
import { clearSession } from './utils/storage'
import { getDailyPuzzleStatus } from './services/gameApi'
import { MUSIC_GAME_ID } from './config/gameConfig'
import { getPlayerId } from './utils/storage'
import ActiveGame from './components/ActiveGame/ActiveGame'
import StatisticsPage from './components/StatisticsPage/StatisticsPage'
import HelpPage from './components/HelpPage/HelpPage'
import ArchivePage from './components/ArchivePage/ArchivePage'
import SettingsPage from './components/SettingsPage/SettingsPage'
import LeaderboardsPage from './components/Leaderboards/LeaderboardsPage'
import PrivacyPolicy from './components/PrivacyPolicy/PrivacyPolicy'
import AboutPage from './components/AboutPage/AboutPage'
import FaqPage from './components/FaqPage/FaqPage'
import './App.css'

function AppContent() {
  const navigate = useNavigate()
  const statsClosedRef = useRef<boolean>(false)
  const cameFromArchiveRef = useRef<boolean>(false)
  const [gameKey, setGameKey] = useState<number>(0)

  const handleCloseStatistics = () => {
    statsClosedRef.current = true
    navigate('/play')
  }

  const handleCloseHelp = () => {
    navigate(-1)
  }

  const handleCloseArchive = () => {
    navigate(-1)
  }

  const handleCloseSettings = () => {
    navigate(-1)
  }

  const handleCloseLeaderboards = () => {
    navigate(-1)
  }

  const handleClosePrivacy = () => {
    navigate(-1)
  }

  const handleGoToDailyPuzzle = async () => {
    try {
      const storedPlayerId = getPlayerId()
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      const statusResponse = await getDailyPuzzleStatus(
        MUSIC_GAME_ID,
        storedPlayerId,
        timezone
      )
      localStorage.removeItem('music_game_puzzle_id')
      localStorage.removeItem('music_game_local_date')
      localStorage.setItem('music_game_puzzle_id', statusResponse.puzzle.puzzle_id)
      localStorage.setItem('music_game_local_date', statusResponse.puzzle.local_date)
      clearSession()
      clearViewingArchive()
      statsClosedRef.current = false
      cameFromArchiveRef.current = false
      setGameKey((prev) => prev + 1)
      navigate('/play')
    } catch (error) {
      console.error('App: Error getting daily puzzle status:', error)
      localStorage.removeItem('music_game_puzzle_id')
      localStorage.removeItem('music_game_local_date')
      clearSession()
      clearViewingArchive()
      statsClosedRef.current = false
      cameFromArchiveRef.current = false
      setGameKey((prev) => prev + 1)
      navigate('/play')
    }
  }

  const handlePlayDate = (date: string, puzzleId: string | null) => {
    localStorage.removeItem('music_game_puzzle_id')
    localStorage.removeItem('music_game_local_date')
    if (puzzleId) {
      localStorage.setItem('music_game_puzzle_id', puzzleId)
    } else {
      localStorage.setItem('music_game_local_date', date)
    }
    statsClosedRef.current = false
    cameFromArchiveRef.current = true
    setViewingArchive()
    navigate('/play')
  }

  return (
    <div className="app">
      <Routes>
        <Route
          path="/"
          element={
            <ActiveGame
              key={gameKey}
              onShowStatistics={() => navigate('/statistics')}
              userClosedStats={statsClosedRef.current}
              onShowHelp={() => navigate('/help')}
              onShowArchive={() => navigate('/archive')}
              onShowLeaderboards={() => navigate('/leaderboards')}
              onShowSettings={() => navigate('/settings')}
              onGoToDailyPuzzle={handleGoToDailyPuzzle}
            />
          }
        />
        <Route
          path="/play"
          element={
            <ActiveGame
              key={gameKey}
              onShowStatistics={() => navigate('/statistics')}
              userClosedStats={statsClosedRef.current}
              onShowHelp={() => navigate('/help')}
              onShowArchive={() => navigate('/archive')}
              onShowLeaderboards={() => navigate('/leaderboards')}
              onShowSettings={() => navigate('/settings')}
              onGoToDailyPuzzle={handleGoToDailyPuzzle}
            />
          }
        />
        <Route
          path="/statistics"
          element={<StatisticsPage onClose={handleCloseStatistics} />}
        />
        <Route path="/help" element={<HelpPage onClose={handleCloseHelp} />} />
        <Route
          path="/archive"
          element={
            <ArchivePage onClose={handleCloseArchive} onPlayDate={handlePlayDate} />
          }
        />
        <Route
          path="/leaderboards"
          element={<LeaderboardsPage onClose={handleCloseLeaderboards} />}
        />
        <Route
          path="/settings"
          element={<SettingsPage onClose={handleCloseSettings} />}
        />
        <Route
          path="/privacy"
          element={<PrivacyPolicy onClose={handleClosePrivacy} />}
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FaqPage />} />
      </Routes>
    </div>
  )
}

function App() {
  // Don't render React app for /credits - it's served as static credits.html
  if (typeof window !== 'undefined' && window.location.pathname === '/credits') {
    return null
  }

  return <AppContent />
}

export default App
