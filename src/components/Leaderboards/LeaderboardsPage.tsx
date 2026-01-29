import { getPlayerId } from '../../utils/storage';
import LeaderboardsContent from './LeaderboardsContent';
import './LeaderboardsPage.css';

interface LeaderboardsPageProps {
  onClose: () => void;
}

export default function LeaderboardsPage({ onClose }: LeaderboardsPageProps) {
  const playerId = getPlayerId();

  return (
    <div className="leaderboards-page-container">
      <div className="leaderboards-page-content">
        <div className="leaderboards-page-header">
          <h1 className="leaderboards-page-title">
            <span className="leaderboards-icon">🏆</span>
            Leaderboards
          </h1>
          <button
            className="app-close-button leaderboards-close-button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>

        <LeaderboardsContent playerId={playerId} />
      </div>
    </div>
  );
}
