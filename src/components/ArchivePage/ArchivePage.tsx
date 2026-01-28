import { useEffect, useState } from 'react';
import { getArchive, type ArchiveResponse } from '../../services/gameApi';
import { getPlayerId } from '../../utils/storage';
import { MUSIC_GAME_ID } from '../../config/gameConfig';
import './ArchivePage.css';

interface ArchivePageProps {
  onClose: () => void;
  onPlayDate?: (date: string, puzzleId: string | null) => void;
}

const ArchivePage = ({ onClose, onPlayDate }: ArchivePageProps) => {
  const [archive, setArchive] = useState<ArchiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'won':
        return '✓';
      case 'lost':
      case 'quit':
        return '✗';
      case 'abandoned':
      case 'in_progress':
        return '○';
      case 'not_played':
      default:
        return '';
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
  const groupByMonth = (puzzles: Array<{ date: string; puzzle_id: string | null; player_status: string | null }>) => {
    const months: { [key: string]: Array<{ date: string; puzzle_id: string | null; player_status: string | null }> } = {};
    
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
    monthPuzzles: Array<{ date: string; puzzle_id: string | null; player_status: string | null }>,
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
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    // Parse first puzzle date for comparison
    const firstPuzzleDateObj = firstPuzzleDate ? new Date(firstPuzzleDate + 'T00:00:00') : null;

    const grid: Array<{ 
      date: string | null; 
      puzzle: { date: string; puzzle_id: string | null; player_status: string | null } | null;
      isUnavailable: boolean;
      isToday: boolean;
    }> = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push({ date: null, puzzle: null, isUnavailable: false, isToday: false });
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

      grid.push({ date: dateStr, puzzle, isUnavailable, isToday });
    }

    return grid;
  };

  if (loading) {
    return (
      <div className="archive-page">
        <div className="archive-header">
          <h1>📅 Puzzle Archive</h1>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <div className="archive-content">
          <p>Loading archive...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="archive-page">
        <div className="archive-header">
          <h1>📅 Puzzle Archive</h1>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <div className="archive-content">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!archive || !archive.puzzles || archive.puzzles.length === 0) {
    return (
      <div className="archive-page">
        <div className="archive-header">
          <h1>📅 Puzzle Archive</h1>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <div className="archive-content">
          <p>No puzzles available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="archive-page">
      <div className="archive-header">
        <h1>📅 Puzzle Archive</h1>
        <button className="close-button" onClick={onClose}>✕</button>
      </div>
      <div className="archive-content">
        <div className="archive-legend">
          <div className="legend-item">
            <span className="status-indicator status-won">✓</span>
            <span>Won</span>
          </div>
          <div className="legend-item">
            <span className="status-indicator status-lost">✗</span>
            <span>Lost</span>
          </div>
          <div className="legend-item">
            <span className="status-indicator status-abandoned">○</span>
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
                  <div className="calendar-day-name">Sun</div>
                  <div className="calendar-day-name">Mon</div>
                  <div className="calendar-day-name">Tue</div>
                  <div className="calendar-day-name">Wed</div>
                  <div className="calendar-day-name">Thu</div>
                  <div className="calendar-day-name">Fri</div>
                  <div className="calendar-day-name">Sat</div>
                  
                  {/* Calendar days */}
                  {grid.map((cell, index) => {
                    if (!cell.date) {
                      return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                    }

                    const puzzle = cell.puzzle;
                    const statusClass = getStatusClass(puzzle?.player_status || null, cell.isUnavailable);
                    const statusIcon = puzzle ? getStatusIcon(puzzle.player_status) : '';
                    const isClickable = puzzle && puzzle.puzzle_id !== null && !cell.isUnavailable;

                    return (
                      <div
                        key={cell.date}
                        className={`calendar-day ${statusClass} ${isClickable ? 'clickable' : ''} ${cell.isUnavailable ? 'unavailable' : ''} ${cell.isToday ? 'today' : ''}`}
                        onClick={() => puzzle && !cell.isUnavailable && handleDateClick(puzzle.date, puzzle.puzzle_id)}
                        title={cell.isUnavailable 
                          ? `${formatDate(cell.date)} - Unavailable` 
                          : puzzle 
                            ? `${formatDate(puzzle.date)} - ${getStatusLabel(puzzle.player_status)}` 
                            : `${formatDate(cell.date)} - Not Played`}
                      >
                        <div className="day-number">{getDayNumber(cell.date)}</div>
                        {statusIcon && <div className="day-status-icon">{statusIcon}</div>}
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
  );
};

export default ArchivePage;
