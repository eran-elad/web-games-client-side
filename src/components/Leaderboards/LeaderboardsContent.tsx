import { useState, useEffect, useCallback, useRef } from 'react';
import { getLeaderboards, updatePlayerDisplayName } from '../../services/gameApi';
import type { LeaderboardsResponse, LeaderboardRow } from '../../services/gameApi';
import { setDisplayName } from '../../utils/storage';
import './LeaderboardsContent.css';

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function formatDateRange(start: string, end: string): string {
  try {
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr}–${endStr}`;
  } catch {
    return `${start}–${end}`;
  }
}

interface LeaderboardsContentProps {
  playerId: string | null;
  onRefresh?: () => void;
}

export default function LeaderboardsContent({ playerId, onRefresh }: LeaderboardsContentProps) {
  const [data, setData] = useState<LeaderboardsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [explanationExpanded, setExplanationExpanded] = useState(false);
  const lastFetchedAtRef = useRef<number | null>(null);

  const fetchLeaderboards = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && lastFetchedAtRef.current && now - lastFetchedAtRef.current < CACHE_TTL_MS) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await getLeaderboards(playerId);
      setData(response);
      lastFetchedAtRef.current = now;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leaderboards';
      setError(errorMessage);
      console.error('Error fetching leaderboards:', err);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchLeaderboards(true);
  }, [fetchLeaderboards]);

  const handleRetry = () => {
    fetchLeaderboards(true);
  };

  const handleRefresh = () => {
    fetchLeaderboards(true);
    onRefresh?.();
  };

  if (loading && !data) {
    return (
      <div className="leaderboards-loading">
        <div className="leaderboards-spinner" aria-hidden="true" />
        <p>Loading leaderboards...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="leaderboards-error">
        <p>Error: {error}</p>
        <button className="leaderboards-retry-button" onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.boards.length === 0) {
    return (
      <div className="leaderboards-empty">
        <p>No leaderboards available.</p>
      </div>
    );
  }

  const board = data.boards[selectedTabIndex];
  const topNRows = board.rows.filter((r) => r.rank <= board.top_n);
  const playerRow = playerId && board.rows.length > board.top_n
    ? board.rows.find((r) => r.player_id === playerId)
    : null;
  const showGapRow = playerRow && playerRow.rank > board.top_n;
  const currentPlayerNotOnBoard = playerId != null && !board.rows.some((r) => r.player_id === playerId);

  return (
    <div className="leaderboards-content">
      <div className="leaderboards-explanation">
        <button
          type="button"
          className="leaderboards-explanation-toggle"
          onClick={() => setExplanationExpanded(!explanationExpanded)}
          aria-expanded={explanationExpanded}
          aria-controls="leaderboards-explanation-content"
        >
          <span className="leaderboards-explanation-toggle-icon">
            {explanationExpanded ? '▼' : '▶'}
          </span>
          How ranking works
        </button>
        <div
          id="leaderboards-explanation-content"
          className={`leaderboards-explanation-content ${explanationExpanded ? 'expanded' : ''}`}
        >
          <div className="leaderboards-explanation-body">
            <p className="leaderboards-explanation-section">
            Players are ranked using these tie-breakers, in order:
            </p>
            <ol className="leaderboards-explanation-list">
              <li>
                <strong>1️⃣ Wins (W)</strong>
                <br />
                More wins = higher rank.
              </li>
              <li>
                <strong>2️⃣ Avg guesses (AvgG)</strong>
                <br />
                Fewer guesses per win ranks higher. Counting only guesses of wins.
              </li>
              <li>
                <strong>3️⃣ Attempts (A)</strong>
                <br />
                More played puzzles ranks higher.
              </li>
            </ol>
            <p className="leaderboards-explanation-section">
              <strong>📅 Time periods</strong>
            </p>
            <ul className="leaderboards-explanation-list">
              <li>Current periods update live</li>
              <li>Past periods are frozen</li>
              <li>Finishing an old puzzle later won&apos;t change past rankings.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="leaderboards-tabs" role="tablist">
        {data.boards.map((b, i) => (
          <button
            key={b.id}
            role="tab"
            aria-selected={i === selectedTabIndex}
            className={`leaderboards-tab ${i === selectedTabIndex ? 'active' : ''}`}
            onClick={() => setSelectedTabIndex(i)}
          >
            {b.display_name || b.id}
          </button>
        ))}
      </div>

      <div className="leaderboards-board-header">
        <h2 className="leaderboards-board-title">
          {board.display_name || board.id}
          {board.time_range && (
            <span className="leaderboards-date-range">
              {' · '}{formatDateRange(board.time_range.start, board.time_range.end)}
            </span>
          )}
        </h2>
        <button
          className="leaderboards-refresh-button"
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Refresh leaderboards"
          title="Refresh"
        >
          <svg
            className={`leaderboards-refresh-icon ${loading ? 'spinning' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 12a9 9 0 1 1-6.22-8.56" />
            <path d="M21 3v6h-6" />
          </svg>
        </button>
      </div>

      <div className="leaderboards-table-wrapper">
        <table className="leaderboards-table">
          <thead>
            <tr>
              <th className="leaderboards-col-rank">#</th>
              <th className="leaderboards-col-player">Player</th>
              <th className="leaderboards-col-won">
                <span className="leaderboards-col-label-full" title="Wins">Wins</span>
                <span className="leaderboards-col-label-short" title="Wins">W</span>
              </th>
              <th className="leaderboards-col-avg">
                <span className="leaderboards-col-label-full" title="Guesses per win">Avg Guesses</span>
                <span className="leaderboards-col-label-short" title="Guesses per win">AvgG</span>
              </th>
              <th className="leaderboards-col-attempted">
                <span className="leaderboards-col-label-full" title="Puzzles attempted">Attempts</span>
                <span className="leaderboards-col-label-short" title="Puzzles attempted">A</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {topNRows.map((row) => (
              <LeaderboardRow
                key={row.player_id}
                row={row}
                isCurrentPlayer={playerId === row.player_id}
                playerId={playerId}
                onDisplayNameUpdated={handleRefresh}
              />
            ))}
            {showGapRow && (
              <>
                <tr className="leaderboards-gap-row">
                  <td colSpan={5}>…</td>
                </tr>
                {playerRow && (
                  <LeaderboardRow
                    key={playerRow.player_id}
                    row={playerRow}
                    isCurrentPlayer={true}
                    playerId={playerId}
                    onDisplayNameUpdated={handleRefresh}
                  />
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {currentPlayerNotOnBoard && (
        <p className="leaderboards-play-to-enter" role="status">
          Play a puzzle to enter the leaderboard.
        </p>
      )}

      <p className="leaderboards-rotate-hint" aria-hidden="true">
        <span className="leaderboards-rotate-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </span>
        Rotate your device to see a detailed list
      </p>
    </div>
  );
}

function LeaderboardRow({
  row,
  isCurrentPlayer,
  playerId,
  onDisplayNameUpdated,
}: {
  row: LeaderboardRow;
  isCurrentPlayer: boolean;
  playerId: string | null;
  onDisplayNameUpdated?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(row.display_name);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const avgDisplay = row.won > 0
    ? (row.avg_guesses_per_win ?? row.total_guesses_for_wins / row.won).toFixed(1)
    : '–';

  const handleSave = async () => {
    if (!playerId) return;
    const trimmed = editValue?.trim() || null;
    try {
      setSaving(true);
      setEditError(null);
      const res = await updatePlayerDisplayName(playerId, trimmed);
      setDisplayName(res.display_name);
      setIsEditing(false);
      onDisplayNameUpdated?.();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(row.display_name);
    setEditError(null);
    setIsEditing(false);
  };

  return (
    <tr className={isCurrentPlayer ? 'leaderboards-row-you' : ''}>
      <td className="leaderboards-col-rank">{row.rank}</td>
      <td className="leaderboards-col-player">
        {isEditing && isCurrentPlayer && playerId ? (
          <div className="leaderboards-edit-name">
            <input
              type="text"
              className="leaderboards-edit-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              maxLength={100}
              placeholder="Display name"
              disabled={saving}
              autoFocus
            />
            <button
              type="button"
              className="leaderboards-edit-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '…' : 'Save'}
            </button>
            <button
              type="button"
              className="leaderboards-edit-cancel"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            {editError && <span className="leaderboards-edit-error">{editError}</span>}
          </div>
        ) : (
          <span className="leaderboards-player-name">
            {row.display_name}
            {isCurrentPlayer && (
              <>
                <span className="leaderboards-you-badge">You</span>
                <button
                  type="button"
                  className="leaderboards-edit-pencil"
                  onClick={() => {
                    setEditValue(row.display_name);
                    setEditError(null);
                    setIsEditing(true);
                  }}
                  aria-label="Edit display name"
                  title="Edit display name"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </>
            )}
          </span>
        )}
      </td>
      <td className="leaderboards-col-won">{row.won}</td>
      <td className="leaderboards-col-avg">{avgDisplay}</td>
      <td className="leaderboards-col-attempted">{row.attempted}</td>
    </tr>
  );
}
