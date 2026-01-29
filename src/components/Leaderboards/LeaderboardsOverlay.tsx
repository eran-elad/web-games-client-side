import { useEffect, useRef } from 'react';
import LeaderboardsContent from './LeaderboardsContent';
import './LeaderboardsOverlay.css';

interface LeaderboardsOverlayProps {
  onClose: () => void;
  playerId: string | null;
}

export default function LeaderboardsOverlay({ onClose, playerId }: LeaderboardsOverlayProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    backdropRef.current?.scrollTo(0, 0);
  }, []);

  return (
    <div
      ref={backdropRef}
      className="leaderboards-overlay-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboards-overlay-title"
    >
      <div
        className="leaderboards-overlay-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="leaderboards-overlay-header">
          <h1 id="leaderboards-overlay-title" className="leaderboards-overlay-title">
            <span className="leaderboards-icon">🏆</span>
            Leaderboards
          </h1>
          <button
            className="app-close-button leaderboards-overlay-close"
            onClick={onClose}
            aria-label="Close leaderboards"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="leaderboards-overlay-body">
          <LeaderboardsContent playerId={playerId} />
        </div>
      </div>
    </div>
  );
}
