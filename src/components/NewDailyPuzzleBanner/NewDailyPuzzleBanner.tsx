import './NewDailyPuzzleBanner.css';

interface NewDailyPuzzleBannerProps {
  onSwitchToDaily: () => void;
  onDismiss: () => void;
}

const NewDailyPuzzleBanner = ({ onSwitchToDaily, onDismiss }: NewDailyPuzzleBannerProps) => {
  const handleSwitchClick = () => {
    console.log('NewDailyPuzzleBanner: Switch to Daily button clicked');
    onSwitchToDaily();
  };

  return (
    <div className="new-daily-puzzle-banner">
      <div className="banner-content">
        <span className="banner-icon">🎯</span>
        <span className="banner-message">A new daily puzzle is available!</span>
        <button 
          className="banner-button"
          onClick={handleSwitchClick}
        >
          Switch to Daily Puzzle
        </button>
      </div>
      <button 
        className="banner-close"
        onClick={onDismiss}
        aria-label="Dismiss banner"
      >
        ×
      </button>
    </div>
  );
};

export default NewDailyPuzzleBanner;
