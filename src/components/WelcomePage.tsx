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
        <div className="title-icon">🎵</div>
        <h1 className="welcome-title">HitFinder</h1>
        <p className="welcome-subtitle">Can you reveal today's secret song?</p>
        <div className="welcome-buttons">
          <button className="play-button" onClick={onPlay}>
            <span className="play-icon">▶</span> Play
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

