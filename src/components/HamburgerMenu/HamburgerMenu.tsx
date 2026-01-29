import { useState, useRef, useEffect } from 'react';
import './HamburgerMenu.css';

interface HamburgerMenuProps {
  onShowStatistics?: () => void;
  onShowArchive?: () => void;
  onShowLeaderboards?: () => void;
  onShowHelp?: () => void;
  onShowSettings?: () => void;
  onGoToDailyPuzzle?: () => void;
}

const HamburgerMenu = ({ 
  onShowStatistics, 
  onShowArchive, 
  onShowLeaderboards,
  onShowHelp, 
  onShowSettings,
  onGoToDailyPuzzle
}: HamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuClick = (action?: () => void) => {
    setIsOpen(false);
    if (action) {
      action();
    }
  };

  return (
    <div className="hamburger-menu-wrapper">
      <button
        ref={buttonRef}
        className={`hamburger-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open menu"
        aria-expanded={isOpen}
        type="button"
      >
        <span className="hamburger-icon">☰</span>
      </button>
      
      {isOpen && (
        <div ref={menuRef} className="hamburger-menu-dropdown">
          {onGoToDailyPuzzle && (
            <button
              className="hamburger-menu-item"
              onClick={() => handleMenuClick(onGoToDailyPuzzle)}
            >
              <span className="menu-item-icon">🎯</span>
              Daily Puzzle
            </button>
          )}
          {onShowStatistics && (
            <button
              className="hamburger-menu-item"
              onClick={() => handleMenuClick(onShowStatistics)}
            >
              <span className="menu-item-icon">📊</span>
              Statistics
            </button>
          )}
          {onShowLeaderboards && (
            <button
              className="hamburger-menu-item"
              onClick={() => handleMenuClick(onShowLeaderboards)}
            >
              <span className="menu-item-icon">🏆</span>
              Leaderboards
            </button>
          )}
          {onShowArchive && (
            <button
              className="hamburger-menu-item"
              onClick={() => handleMenuClick(onShowArchive)}
            >
              <span className="menu-item-icon">📅</span>
              Archive
            </button>
          )}
          {onShowHelp && (
            <button
              className="hamburger-menu-item"
              onClick={() => handleMenuClick(onShowHelp)}
            >
              <span className="menu-item-icon">❓</span>
              Help
            </button>
          )}
          {onShowSettings && (
            <button
              className="hamburger-menu-item"
              onClick={() => handleMenuClick(onShowSettings)}
            >
              <span className="menu-item-icon">⚙️</span>
              Settings
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;
