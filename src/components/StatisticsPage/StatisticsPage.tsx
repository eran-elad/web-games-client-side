import { useState, useEffect } from 'react';
import { getPlayerStats } from '../../services/gameApi';
import type { PlayerStatsResponse } from '../../services/gameApi';
import { getPlayerId, getGameId } from '../../utils/storage';
import './StatisticsPage.css';

interface StatisticsPageProps {
  onClose: () => void;
}

const StatisticsPage = ({ onClose }: StatisticsPageProps) => {
  const [stats, setStats] = useState<PlayerStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const playerId = getPlayerId();
        const gameId = getGameId();
        
        if (!playerId) {
          throw new Error('No player ID found');
        }
        
        const response = await getPlayerStats(playerId, gameId);
        setStats(response);
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to fetch statistics';
        setError(errorMessage);
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="statistics-page-container">
      <div className="statistics-page-content">
        <div className="statistics-header">
          <h1 className="statistics-title">Your Statistics</h1>
          <button className="app-close-button close-button-top" onClick={onClose} aria-label="Close" title="Close">
            ×
          </button>
        </div>

        {loading && (
          <div className="statistics-loading">Loading statistics...</div>
        )}

        {error && (
          <div className="statistics-error">
            <p>Error: {error}</p>
            <button className="back-button" onClick={onClose}>Back</button>
          </div>
        )}

        {!loading && !error && stats && (
          <div className="statistics-content">
            {/* Overview Section */}
            <section className="statistics-section">
              <h2 className="section-title">Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.total_games_played}</div>
                  <div className="stat-label">Games Played</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.total_wins}</div>
                  <div className="stat-label">Wins</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.total_losses}</div>
                  <div className="stat-label">Losses</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{formatPercentage(stats.stats.win_percentage)}</div>
                  <div className="stat-label">Win Rate</div>
                </div>
              </div>
            </section>

            {/* Streaks Section */}
            <section className="statistics-section">
              <h2 className="section-title">Streaks</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.current_win_streak}</div>
                  <div className="stat-label">Current Win Streak</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.max_win_streak}</div>
                  <div className="stat-label">Best Win Streak</div>
                </div>
              </div>
            </section>

            {/* Performance Section */}
            <section className="statistics-section">
              <h2 className="section-title">Performance</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.average_guesses_for_win.toFixed(1)}</div>
                  <div className="stat-label">Avg Guesses (Wins)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.average_guesses_per_game.toFixed(1)}</div>
                  <div className="stat-label">Avg Guesses (All)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.total_guesses}</div>
                  <div className="stat-label">Total Guesses</div>
                </div>
              </div>
            </section>

            {/* Wins by Guess Count */}
            {Object.keys(stats.stats.wins_by_guess_count).length > 0 && (
              <section className="statistics-section">
                <h2 className="section-title">Wins by Guess Count</h2>
                <div className="wins-distribution">
                  {Object.entries(stats.stats.wins_by_guess_count)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([guessCount, wins]) => (
                      <div key={guessCount} className="distribution-item">
                        <div className="distribution-label">{guessCount} guess{wins !== 1 ? 'es' : ''}</div>
                        <div className="distribution-bar-container">
                          <div 
                            className="distribution-bar"
                            style={{ 
                              width: `${(wins / stats.stats.total_wins) * 100}%`,
                              maxWidth: '100%'
                            }}
                          />
                        </div>
                        <div className="distribution-value">{wins}</div>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* Game History */}
            <section className="statistics-section">
              <h2 className="section-title">Game History</h2>
              <div className="history-info">
                <div className="history-item">
                  <span className="history-label">First Game:</span>
                  <span className="history-value">{formatDate(stats.stats.first_game_date)}</span>
                </div>
                <div className="history-item">
                  <span className="history-label">Last Game:</span>
                  <span className="history-value">{formatDate(stats.stats.last_game_date)}</span>
                </div>
                {stats.stats.total_abandoned > 0 && (
                  <div className="history-item">
                    <span className="history-label">Abandoned:</span>
                    <span className="history-value">{stats.stats.total_abandoned}</span>
                  </div>
                )}
              </div>
            </section>

            <div className="statistics-footer">
              <button className="back-button" onClick={onClose}>Back to Game</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;
