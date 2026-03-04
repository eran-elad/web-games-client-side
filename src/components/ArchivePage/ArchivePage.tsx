import { useEffect, useState } from 'react';
import PageMeta from '../PageMeta/PageMeta';
import { getArchive, type ArchiveResponse, type PuzzleDifficultyLevel } from '../../services/gameApi';
import { getPlayerId } from '../../utils/storage';
import { MUSIC_GAME_ID } from '../../config/gameConfig';
import './ArchivePage.css';

interface ArchivePageProps {
  onClose: () => void;
  onPlayDate?: (date: string, puzzleId: string | null) => void;
}

type ArchivePuzzle = ArchiveResponse['puzzles'][number];
type CalendarCell = {
  date: string | null;
  puzzle: ArchivePuzzle | null;
  isUnavailable: boolean;
  isToday: boolean;
  connectWonLeft: boolean;
  connectWonRight: boolean;
};

const ArchivePage = ({ onClose, onPlayDate }: ArchivePageProps) => {
  const [archive, setArchive] = useState<ArchiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  useEffect(() => {
    const loadArchive = async () => {
      try {
        setLoading(true);
        setError(null);
        const playerId = getPlayerId();
        const data = await getArchive(MUSIC_GAME_ID, playerId);
        setArchive(data);
      } catch (err) {
        console.error('Error loading archive:', err);
        setError('Failed to load archive. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadArchive();
  }, []);

  const getDifficultyLabel = (difficulty: PuzzleDifficultyLevel | null) => {
    switch (difficulty) {
      case 1:
        return 'Easy';
      case 2:
        return 'Medium';
      case 3:
        return 'Hard';
      default:
        return null;
    }
  };

  const getDifficultyStars = (difficulty: PuzzleDifficultyLevel | null) => {
    if (!difficulty) return '';
    return '★'.repeat(difficulty);
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'won':
        return (
          <span className="day-status-icon day-status-icon-won" aria-label="Won">
            <span className="won-icon-glyph" aria-hidden="true">🏆</span>
          </span>
        );
      case 'lost':
      case 'quit':
        return <span className="day-status-icon day-status-icon-lost">✗</span>;
      case 'abandoned':
      case 'in_progress':
        return null;
      case 'not_played':
      default:
        return null;
    }
  };

  const getStatusClass = (status: string | null, isUnavailable: boolean = false) => {
    if (isUnavailable) {
      return 'status-unavailable';
    }
    switch (status) {
      case 'won':
        return 'status-won';
      case 'lost':
      case 'quit':
        return 'status-lost';
      case 'abandoned':
      case 'in_progress':
        return 'status-abandoned';
      case 'not_played':
      default:
        return 'status-not-played';
    }
  };

  const getStatusLabel = (status: string | null, isUnavailable: boolean = false) => {
    if (isUnavailable) {
      return 'Unavailable';
    }
    switch (status) {
      case 'won':
        return 'Won';
      case 'lost':
        return 'Lost';
      case 'quit':
        return 'Quit';
      case 'abandoned':
        return 'Abandoned';
      case 'in_progress':
        return 'In Progress';
      case 'not_played':
      default:
        return 'Not Played';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatMonthYear = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric'
    });
  };

  const formatRecommendationDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDayNumber = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.getDate();
  };

  const handleDateClick = (date: string, puzzleId: string | null) => {
    if (onPlayDate) {
      onPlayDate(date, puzzleId);
    }
  };

  // Group puzzles by month
  const groupByMonth = (puzzles: ArchivePuzzle[]) => {
    const months: Record<string, ArchivePuzzle[]> = {};
    
    puzzles.forEach(puzzle => {
      const date = new Date(puzzle.date + 'T00:00:00');
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      months[monthKey].push(puzzle);
    });

    // Sort months chronologically (newest first)
    return Object.keys(months).sort().reverse().map(monthKey => ({
      monthKey,
      puzzles: months[monthKey].sort((a, b) => a.date.localeCompare(b.date))
    }));
  };

  // Today's date in YYYY-MM-DD (local) for comparison
  const getTodayDateStr = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  };

  // Create calendar grid for a month
  const createCalendarGrid = (
    monthPuzzles: ArchivePuzzle[],
    firstPuzzleDate: string | null
  ) => {
    if (monthPuzzles.length === 0) return [];

    const firstDate = new Date(monthPuzzles[0].date + 'T00:00:00');
    const todayStr = getTodayDateStr();

    // Create a map of date -> puzzle for quick lookup
    const puzzleMap = new Map(monthPuzzles.map(p => [p.date, p]));

    // Get first day of month and how many days in month
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Monday

    // Parse first puzzle date for comparison
    const firstPuzzleDateObj = firstPuzzleDate ? new Date(firstPuzzleDate + 'T00:00:00') : null;

    const grid: CalendarCell[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push({
        date: null,
        puzzle: null,
        isUnavailable: false,
        isToday: false,
        connectWonLeft: false,
        connectWonRight: false
      });
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const puzzle = puzzleMap.get(dateStr) || null;
      const dateObj = new Date(dateStr + 'T00:00:00');

      // Unavailable: before first puzzle date OR after today
      const beforeFirst = firstPuzzleDateObj !== null && dateObj < firstPuzzleDateObj;
      const afterToday = dateStr > todayStr;
      const isUnavailable = beforeFirst || afterToday;
      const isToday = dateStr === todayStr;
      const cellIndex = grid.length;
      const col = cellIndex % 7;
      const prevDate = new Date(dateObj);
      prevDate.setDate(prevDate.getDate() - 1);
      const nextDate = new Date(dateObj);
      nextDate.setDate(nextDate.getDate() + 1);
      const prevDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
      const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      const connectWonLeft =
        col > 0 &&
        puzzle?.player_status === 'won' &&
        puzzleMap.get(prevDateStr)?.player_status === 'won';
      const connectWonRight =
        col < 6 &&
        puzzle?.player_status === 'won' &&
        puzzleMap.get(nextDateStr)?.player_status === 'won';

      grid.push({ date: dateStr, puzzle, isUnavailable, isToday, connectWonLeft: !!connectWonLeft, connectWonRight: !!connectWonRight });
    }

    return grid;
  };

  if (loading) {
    return (
      <>
        <PageMeta
          title="Puzzle Archive – Hitfinder"
          description="Play past Hitfinder daily puzzles. Browse the archive and replay previous music guessing challenges."
          path="/archive"
        />
      <div className="archive-page">
        <div className="archive-header">
          <h1>📅 Puzzle Archive</h1>
          <button className="app-close-button close-button" onClick={onClose}>×</button>
        </div>
        <div className="archive-content">
          <p>Loading archive...</p>
        </div>
      </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta
          title="Puzzle Archive – Hitfinder"
          description="Play past Hitfinder daily puzzles. Browse the archive and replay previous music guessing challenges."
          path="/archive"
        />
      <div className="archive-page">
        <div className="archive-header">
          <h1>📅 Puzzle Archive</h1>
          <button className="app-close-button close-button" onClick={onClose}>×</button>
        </div>
        <div className="archive-content">
          <p className="error-message">{error}</p>
        </div>
      </div>
      </>
    );
  }

  if (!archive || !archive.puzzles || archive.puzzles.length === 0) {
    return (
      <>
        <PageMeta
          title="Puzzle Archive – Hitfinder"
          description="Play past Hitfinder daily puzzles. Browse the archive and replay previous music guessing challenges."
          path="/archive"
        />
        <div className="archive-page">
          <div className="archive-header">
            <h1>📅 Puzzle Archive</h1>
            <button className="app-close-button close-button" onClick={onClose}>×</button>
          </div>
          <div className="archive-content">
            <p>No puzzles available yet.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Puzzle Archive – Hitfinder"
        description="Play past Hitfinder daily puzzles. Browse the archive and replay previous music guessing challenges."
        path="/archive"
      />
    <div className="archive-page">
      <div className="archive-header">
        <h1>📅 Puzzle Archive</h1>
        <button className="app-close-button close-button" onClick={onClose}>×</button>
      </div>
      <div className="archive-content">
        {archive.recommended_puzzles.length > 0 && (
          <div className="archive-recommended">
            <div className="recommended-header">
              <span className="recommended-title">Recommended for you:</span>
            </div>

            <div className="recommended-item primary" role="button" tabIndex={0} onClick={() => handleDateClick(archive.recommended_puzzles[0].date, archive.recommended_puzzles[0].puzzle_id)} onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDateClick(archive.recommended_puzzles[0].date, archive.recommended_puzzles[0].puzzle_id);
              }
            }}>
              <span className="recommended-date">{formatRecommendationDate(archive.recommended_puzzles[0].date)}</span>
              <span className="recommended-difficulty">
                {getDifficultyStars(archive.recommended_puzzles[0].difficulty_level)} {getDifficultyLabel(archive.recommended_puzzles[0].difficulty_level)}
              </span>
              <button
                type="button"
                className="recommended-play"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDateClick(archive.recommended_puzzles[0].date, archive.recommended_puzzles[0].puzzle_id);
                }}
              >
                ▶ Play
              </button>
            </div>

            {archive.recommended_puzzles.length > 1 && (
              <div className="recommended-expand">
                <button
                  type="button"
                  className="recommended-toggle"
                  onClick={() => setShowAllRecommendations((prev) => !prev)}
                >
                  {showAllRecommendations ? 'Hide recommendations' : `Show all (${archive.recommended_puzzles.length})`}
                </button>
              </div>
            )}

            {showAllRecommendations && archive.recommended_puzzles.length > 1 && (
              <div className="recommended-list">
                {archive.recommended_puzzles.slice(1).map((rec) => (
                  <div
                    key={rec.puzzle_id}
                    className="recommended-item"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleDateClick(rec.date, rec.puzzle_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDateClick(rec.date, rec.puzzle_id);
                      }
                    }}
                  >
                    <span className="recommended-date">{formatRecommendationDate(rec.date)}</span>
                    <span className="recommended-difficulty">
                      {getDifficultyStars(rec.difficulty_level)} {getDifficultyLabel(rec.difficulty_level)}
                    </span>
                    <span className="recommended-play secondary">Play</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="archive-legend">
          <div className="legend-section">
            <span className="legend-title">Legend</span>
            <div className="legend-item">
              <span className="status-indicator status-won">
                <span className="legend-won-glyph" aria-hidden="true">🏆</span>
              </span>
              <span>Won</span>
            </div>
            <div className="legend-item">
              <span className="status-indicator status-lost">✗</span>
              <span>Lost</span>
            </div>
            <div className="legend-item">
              <span className="status-indicator status-abandoned"></span>
              <span>In Progress</span>
            </div>
            <div className="legend-item">
              <span className="status-indicator status-not-played"></span>
              <span>Not Played</span>
            </div>
            <div className="legend-item">
              <span className="status-indicator status-unavailable"></span>
              <span>Unavailable</span>
            </div>
            <div className="legend-item">
              <span className="status-indicator status-no-puzzle"></span>
              <span>No Puzzle</span>
            </div>
          </div>

          <div className="legend-section">
            <span className="legend-title">Difficulty</span>
            <div className="legend-item">
              <span className="difficulty-indicator">★</span>
              <span>Easy</span>
            </div>
            <div className="legend-item">
              <span className="difficulty-indicator">★★</span>
              <span>Medium</span>
            </div>
            <div className="legend-item">
              <span className="difficulty-indicator">★★★</span>
              <span>Hard</span>
            </div>
          </div>
        </div>
        <div className="archive-calendars">
          {groupByMonth(archive.puzzles).map(({ monthKey, puzzles }) => {
            const grid = createCalendarGrid(puzzles, archive.date_range.first_puzzle_date);
            const firstPuzzle = puzzles[0];
            
            return (
              <div key={monthKey} className="calendar-month">
                <h2 className="month-header">{formatMonthYear(firstPuzzle.date)}</h2>
                <div className="calendar-grid">
                  {/* Day names header */}
                  <div className="calendar-day-name">Mon</div>
                  <div className="calendar-day-name">Tue</div>
                  <div className="calendar-day-name">Wed</div>
                  <div className="calendar-day-name">Thu</div>
                  <div className="calendar-day-name">Fri</div>
                  <div className="calendar-day-name">Sat</div>
                  <div className="calendar-day-name">Sun</div>
                  
                  {/* Calendar days */}
                  {grid.map((cell, index) => {
                    if (!cell.date) {
                      return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                    }

                    const puzzle = cell.puzzle;
                    const hasPuzzle = puzzle?.puzzle_id !== null;
                    const statusClass = cell.isUnavailable
                      ? getStatusClass(null, true)
                      : hasPuzzle
                        ? getStatusClass(puzzle?.player_status || null, false)
                        : 'status-no-puzzle';
                    const statusIcon = puzzle ? getStatusIcon(puzzle.player_status) : null;
                    const difficultyStars = puzzle ? getDifficultyStars(puzzle.difficulty_level) : '';
                    const difficultyLabel = puzzle ? getDifficultyLabel(puzzle.difficulty_level) : null;
                    const isClickable = puzzle && puzzle.puzzle_id !== null && !cell.isUnavailable;

                    return (
                      <div
                        key={cell.date}
                        className={`calendar-day ${statusClass} ${isClickable ? 'clickable' : ''} ${cell.isUnavailable ? 'unavailable' : ''} ${cell.isToday ? 'today' : ''} ${cell.connectWonLeft ? 'streak-left' : ''} ${cell.connectWonRight ? 'streak-right' : ''} ${difficultyStars ? 'has-difficulty' : ''}`}
                        onClick={() => puzzle && !cell.isUnavailable && handleDateClick(puzzle.date, puzzle.puzzle_id)}
                        title={cell.isUnavailable 
                          ? `${formatDate(cell.date)} - Unavailable` 
                          : puzzle 
                            ? `${formatDate(puzzle.date)} - ${puzzle.puzzle_id ? getStatusLabel(puzzle.player_status) : 'No Puzzle'}${difficultyLabel ? ` - ${difficultyLabel}` : ''}` 
                            : `${formatDate(cell.date)} - Not Played`}
                      >
                        <div className="day-number">{getDayNumber(cell.date)}</div>
                        {statusIcon}
                        {difficultyStars && (
                          <div className="day-difficulty-stars" aria-label={`Difficulty: ${difficultyLabel}`}>
                            {difficultyStars}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
};

export default ArchivePage;
