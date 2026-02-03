import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageMeta from './PageMeta/PageMeta';
import HamburgerMenu from './HamburgerMenu/HamburgerMenu';
import { initGame } from '../services/gameApi';
import { getPlayerId } from '../utils/storage';
import { MUSIC_GAME_ID } from '../config/gameConfig';
import './WelcomePage.css';

interface WelcomePageProps {
  onPlay: () => void;
  onShowStatistics?: () => void;
  onShowHelp?: () => void;
  onShowArchive?: () => void;
  onShowLeaderboards?: () => void;
  onShowSettings?: () => void;
  onShowPrivacy?: () => void;
}

const WelcomePage = ({ onPlay, onShowStatistics, onShowHelp, onShowArchive, onShowLeaderboards, onShowSettings, onShowPrivacy }: WelcomePageProps) => {
  const [dailyPuzzleStatus, setDailyPuzzleStatus] = useState<'in_progress' | 'won' | 'lost' | 'abandoned' | 'quit' | 'not_played' | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  useEffect(() => {
    const checkDailyPuzzleStatus = async () => {
      try {
        setIsLoadingStatus(true);
        const storedPlayerId = getPlayerId();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        
        // Call init API without puzzle_id/local_date to get today's puzzle
        const response = await initGame(
          MUSIC_GAME_ID,
          storedPlayerId,
          timezone,
          undefined,
          undefined
        );
        
        // Check if puzzle is completed
        if (response.session.state.is_over) {
          setDailyPuzzleStatus(response.session.status);
        } else {
          setDailyPuzzleStatus('in_progress');
        }
      } catch (err) {
        console.error('Error checking daily puzzle status:', err);
        setDailyPuzzleStatus('not_played');
      } finally {
        setIsLoadingStatus(false);
      }
    };

    checkDailyPuzzleStatus();
  }, []);

  const getPlayButtonText = () => {
    if (isLoadingStatus) {
      return 'Play';
    }
    
    switch (dailyPuzzleStatus) {
      case 'won':
        return 'View Daily Puzzle';
      case 'lost':
      case 'abandoned':
      case 'quit':
        return 'Review Daily Puzzle';
      case 'in_progress':
        return 'Continue Playing';
      default:
        return 'Play';
    }
  };

  return (
    <>
      <PageMeta
        title="Hitfinder – Daily Music Guessing Game | Guess the Hit Song"
        description="Hitfinder is a free daily music guessing game. Guess the secret hit song using clues like genre, BPM, year, and artist. New puzzle every day."
      />
      <div className="welcome-container">
      {/* Floating musical notes background */}
      <div className="musical-notes">
        <span className="note note-1">♪</span>
        <span className="note note-2">♫</span>
        <span className="note note-3">♪</span>
        <span className="note note-4">♬</span>
        <span className="note note-5">♪</span>
        <span className="note note-6">♫</span>
        <span className="note note-7">♪</span>
        <span className="note note-8">♬</span>
      </div>
      
      {/* Vinyl record decoration */}
      <div className="vinyl-record vinyl-1"></div>
      <div className="vinyl-record vinyl-2"></div>
      
      <div className="welcome-content">
        <div className="welcome-header-menu">
          <HamburgerMenu
            onShowStatistics={onShowStatistics}
            onShowArchive={onShowArchive}
            onShowLeaderboards={onShowLeaderboards}
            onShowHelp={onShowHelp}
            onShowSettings={onShowSettings}
          />
        </div>
        <div className="title-icon">🎵</div>
        <h1 className="welcome-title">HitFinder</h1>
        <p className="welcome-subtitle">Can you reveal today's secret song?</p>
        <div className="welcome-buttons">
          <button className="play-button" onClick={onPlay}>
            <span className="play-icon">▶</span> {getPlayButtonText()}
          </button>
        </div>
        <div className="welcome-footer-links">
          <button className="privacy-link" onClick={onShowPrivacy}>
            Privacy Policy
          </button>
          <span className="welcome-footer-sep"> · </span>
          <Link to="/about" className="privacy-link">About</Link>
          <span className="welcome-footer-sep"> · </span>
          <Link to="/faq" className="privacy-link">FAQ</Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default WelcomePage;

