import HamburgerMenu from '../HamburgerMenu/HamburgerMenu';
import './GameTopBar.css';

interface GameTopBarProps {
  onShowArchive?: () => void;
  onShowStatistics?: () => void;
  onShowLeaderboards?: () => void;
  onShowLeaderboardsOverlay?: () => void;
  onShowHelp?: () => void;
  onShowSettings?: () => void;
  onGoToDailyPuzzle?: () => void;
}

export default function GameTopBar({
  onShowArchive,
  onShowStatistics,
  onShowLeaderboards,
  onShowLeaderboardsOverlay,
  onShowHelp,
  onShowSettings,
  onGoToDailyPuzzle,
}: GameTopBarProps) {
  return (
    <header className="game-top-bar" role="banner">
      <div className="game-top-bar-icons">
        {onShowArchive && (
          <button
            className="game-top-bar-icon"
            onClick={onShowArchive}
            aria-label="Archive"
            title="Archive"
            type="button"
          >
            📅
          </button>
        )}
        {onShowStatistics && (
          <button
            className="game-top-bar-icon"
            onClick={onShowStatistics}
            aria-label="Statistics"
            title="Statistics"
            type="button"
          >
            📊
          </button>
        )}
        {(onShowLeaderboardsOverlay || onShowLeaderboards) && (
          <button
            className="game-top-bar-icon"
            onClick={onShowLeaderboardsOverlay ?? onShowLeaderboards}
            aria-label="Leaderboards"
            title="Leaderboards"
            type="button"
          >
            🏆
          </button>
        )}
        {onShowHelp && (
          <button
            className="game-top-bar-icon"
            onClick={onShowHelp}
            aria-label="Help"
            title="Help"
            type="button"
          >
            ❓
          </button>
        )}
      </div>
      <div className="game-top-bar-hamburger">
        <HamburgerMenu
          onShowStatistics={onShowStatistics}
          onShowArchive={onShowArchive}
          onShowLeaderboards={onShowLeaderboards}
          onShowHelp={onShowHelp}
          onShowSettings={onShowSettings}
          onGoToDailyPuzzle={onGoToDailyPuzzle}
        />
      </div>
    </header>
  );
}
