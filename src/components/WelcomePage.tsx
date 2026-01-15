import './WelcomePage.css';

interface WelcomePageProps {
  onPlay: () => void;
  onShowStatistics?: () => void;
  onShowHelp?: () => void;
  onShowArchive?: () => void;
}

const WelcomePage = ({ onPlay, onShowStatistics, onShowHelp, onShowArchive }: WelcomePageProps) => {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 className="welcome-title">Welcome to Music Game</h1>
        <p className="welcome-subtitle">Get ready to test your musical skills!</p>
        <div className="welcome-buttons">
          <button className="play-button" onClick={onPlay}>
            Play
          </button>
          {onShowStatistics && (
            <button className="statistics-button" onClick={onShowStatistics}>
              Statistics
            </button>
          )}
          {onShowHelp && (
            <button className="help-button" onClick={onShowHelp} title="How to Play">
              ❓ Help
            </button>
          )}
          {onShowArchive && (
            <button className="archive-button" onClick={onShowArchive} title="View Archive">
              📅 Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;

