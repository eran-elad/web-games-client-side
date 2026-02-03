import { useEffect, useRef } from 'react';
import PageMeta from '../PageMeta/PageMeta';
import { getPlayerId } from '../../utils/storage';
import LeaderboardsContent from './LeaderboardsContent';
import './LeaderboardsPage.css';

interface LeaderboardsPageProps {
  onClose: () => void;
}

export default function LeaderboardsPage({ onClose }: LeaderboardsPageProps) {
  const playerId = getPlayerId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo(0, 0);
  }, []);

  return (
    <>
      <PageMeta
        title="Leaderboards – Hitfinder"
        description="Compete on the Hitfinder global leaderboards. See top players, your rank, wins, and average guesses."
        path="/leaderboards"
      />
      <div ref={containerRef} className="leaderboards-page-container">
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
    </>
  );
}
