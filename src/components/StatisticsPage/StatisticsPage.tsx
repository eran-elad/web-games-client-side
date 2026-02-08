import { useState, useEffect } from 'react';
import PageMeta from '../PageMeta/PageMeta';
import { getPlayerStats, getPlayerBadges } from '../../services/gameApi';
import type { PlayerStatsResponse, Badge } from '../../services/gameApi';
import { getPlayerId, getGameId } from '../../utils/storage';
import './StatisticsPage.css';

const GENERIC_BADGE_URL = '/badges/generic_badge.svg';

function getBadgeIconPath(iconKeySmall: string): string {
  const filename = iconKeySmall.includes('/')
    ? iconKeySmall.split('/').pop() ?? iconKeySmall
    : iconKeySmall;
  return `/badges/${filename}.png`;
}

interface BadgeCardProps {
  badge: Badge;
}

const BadgeCard = ({ badge }: BadgeCardProps) => {
  const [useFallback, setUseFallback] = useState(false);
  const [showMobileTooltip, setShowMobileTooltip] = useState(false);
  const iconPath = useFallback ? GENERIC_BADGE_URL : getBadgeIconPath(badge.icon_key_small);

  const isMaxTier = badge.next_tier_threshold == null;
  const nextThreshold = badge.next_tier_threshold ?? 1;
  const progressPercent = isMaxTier
    ? 100
    : Math.min(100, (badge.current_progress / nextThreshold) * 100);

  const progressLeftLabel = isMaxTier
    ? 'Max tier'
    : `${badge.current_progress} / ${nextThreshold}`;
  const progressRightLabel = isMaxTier ? '' : 'Next';

  return (
    <div className="badge-card">
      <div
        className="badge-card-inner"
        title={badge.tooltip}
      >
        <div className="badge-frame-container">
          <img
            src="/badges/badge_frame.png"
            className="badge-frame"
            alt=""
            aria-hidden="true"
          />
          <div className="badge-icon-wrapper">
            <img
              src={iconPath}
              alt={badge.short_name}
              className="badge-icon"
              onError={() => setUseFallback(true)}
            />
          </div>
        </div>
        <div className="badge-short-name">{badge.short_name}</div>
        <div className="badge-tier-pill">
          Tier {badge.current_tier_threshold}
        </div>
        <div className="badge-progress-section">
          <div className="badge-progress-bar">
            <div
              className="badge-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="badge-progress-labels">
            <span className="badge-progress-left">{progressLeftLabel}</span>
            {progressRightLabel && (
              <span className="badge-progress-right">{progressRightLabel}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="badge-info-icon"
          aria-label="More info"
          onClick={() => setShowMobileTooltip(!showMobileTooltip)}
          onBlur={() => setShowMobileTooltip(false)}
        >
          i
        </button>
        {showMobileTooltip && (
          <div className="badge-mobile-tooltip">{badge.tooltip}</div>
        )}
      </div>
    </div>
  );
};

interface StatisticsPageProps {
  onClose: () => void;
}

const StatisticsPage = ({ onClose }: StatisticsPageProps) => {
  const [stats, setStats] = useState<PlayerStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [badgesLoading, setBadgesLoading] = useState<boolean>(true);
  const [badgesError, setBadgesError] = useState<string | null>(null);

  useEffect(() => {
    const playerId = getPlayerId();
    const gameId = getGameId();

    if (!playerId || !gameId) {
      setLoading(false);
      setBadgesLoading(false);
      if (!playerId) setError('No player ID found');
      else if (!gameId) setError('Game not configured');
      return;
    }

    setLoading(true);
    setError(null);
    setBadgesLoading(true);
    setBadgesError(null);

    getPlayerStats(playerId, gameId)
      .then((response) => {
        setStats(response);
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
        setError(errorMessage);
        console.error('Error fetching statistics:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    getPlayerBadges(playerId, gameId)
      .then((response) => {
        setBadges(response.badges);
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch badges';
        setBadgesError(errorMessage);
        console.error('Error fetching badges:', err);
      })
      .finally(() => {
        setBadgesLoading(false);
      });
  }, []);

  const formatPercentage = (value: number | null): string => {
    return value != null ? `${value.toFixed(1)}%` : 'N/A';
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
    <>
      <PageMeta
        title="Your Statistics – Hitfinder"
        description="View your Hitfinder game statistics, streaks, and performance. Track your wins, guess distribution, and game history."
        path="/statistics"
      />
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
                  <div className="stat-value">{stats.stats.total_games_attempted}</div>
                  <div className="stat-label">Attempted</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.total_games_completed}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.total_wins}</div>
                  <div className="stat-label">Wins</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.lifelines_used_on_wins}</div>
                  <div className="stat-label">Wins with Lifeline</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{formatPercentage(stats.stats.win_percentage)}</div>
                  <div className="stat-label">Win Rate</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {stats.stats.average_guesses_for_win != null
                      ? stats.stats.average_guesses_for_win.toFixed(1)
                      : 'N/A'}
                  </div>
                  <div className="stat-label">Avg Guesses for wins</div>
                </div>
              </div>
            </section>

            {/* Streaks Section */}
            <section className="statistics-section">
              <h2 className="section-title">Streaks</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.current_streak}</div>
                  <div className="stat-label">Current streak</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.best_streak}</div>
                  <div className="stat-label">Best streak</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.current_win_streak}</div>
                  <div className="stat-label">Current win streak</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.stats.best_win_streak}</div>
                  <div className="stat-label">Best win streak</div>
                </div>
              </div>
            </section>

            {/* Badges */}
            <section className="statistics-section badges-section">
              <h2 className="section-title">Badges</h2>
              {badgesLoading && (
                <div className="badges-loading">Loading badges...</div>
              )}
              {badgesError && (
                <div className="badges-error">Could not load badges: {badgesError}</div>
              )}
              {!badgesLoading && !badgesError && badges && (
                <div className="badges-grid">
                  {badges
                    .filter((b) => b.badge_id != null)
                    .map((badge) => (
                      <BadgeCard key={badge.family_code} badge={badge} />
                    ))}
                  {badges.filter((b) => b.badge_id != null).length === 0 && (
                    <div className="badges-empty">No badges earned yet.</div>
                  )}
                </div>
              )}
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
                              width: `${stats.stats.total_wins > 0 ? (wins / stats.stats.total_wins) * 100 : 0}%`,
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

            {/* History */}
            <section className="statistics-section">
              <h2 className="section-title">History</h2>
              <div className="history-info">
                <div className="history-item">
                  <span className="history-label">First Completed Puzzle:</span>
                  <span className="history-value">{formatDate(stats.stats.first_completed_puzzle_date)}</span>
                </div>
                <div className="history-item">
                  <span className="history-label">Last Completed Puzzle:</span>
                  <span className="history-value">{formatDate(stats.stats.last_completed_puzzle_date)}</span>
                </div>
              </div>
            </section>

            <div className="statistics-footer">
              <button className="back-button" onClick={onClose}>Back to Game</button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default StatisticsPage;
