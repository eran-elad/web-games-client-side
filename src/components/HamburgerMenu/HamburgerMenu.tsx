import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { GOOGLE_CLIENT_ID } from '../../config/apiConfig';
import GoogleSignInButton from '../GoogleSignInButton/GoogleSignInButton';
import './HamburgerMenu.css';

interface HamburgerMenuProps {
  onShowStatistics?: () => void;
  onShowArchive?: () => void;
  onShowLeaderboards?: () => void;
  onShowHelp?: () => void;
  onShowSettings?: () => void;
  onShowFeedback?: () => void;
  onGoToDailyPuzzle?: () => void;
}

const HamburgerMenu = ({ 
  onShowStatistics, 
  onShowArchive, 
  onShowLeaderboards,
  onShowHelp, 
  onShowSettings,
  onShowFeedback,
  onGoToDailyPuzzle
}: HamburgerMenuProps) => {
  const { auth, signOut, signInError } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
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
          {auth.status !== 'loading' && (
            <div className="hamburger-menu-account">
              {auth.status === 'authenticated' ? (
                <>
                  <div className="hamburger-menu-account-name">
                    {auth.displayName || auth.email || 'Signed in'}
                  </div>
                  {auth.displayName && auth.email ? (
                    <div className="hamburger-menu-account-email">{auth.email}</div>
                  ) : null}
                  <div className="hamburger-menu-account-provider">Signed in with Google</div>
                  <button
                    type="button"
                    className="hamburger-menu-sign-out"
                    disabled={signingOut}
                    onClick={() => {
                      void (async () => {
                        setSigningOut(true);
                        try {
                          await signOut();
                        } finally {
                          setSigningOut(false);
                        }
                        setIsOpen(false);
                      })();
                    }}
                  >
                    {signingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </>
              ) : (
                <>
                  <div className="hamburger-menu-account-title">Sign in</div>
                  <div className="hamburger-menu-account-sub">Save your progress across devices</div>
                  {GOOGLE_CLIENT_ID ? <GoogleSignInButton variant="compact" /> : null}
                </>
              )}
              {signInError ? <div className="hamburger-menu-account-error">{signInError}</div> : null}
            </div>
          )}
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
          {onShowFeedback && (
            <button
              className="hamburger-menu-item"
              onClick={() => handleMenuClick(onShowFeedback)}
            >
              <span className="menu-item-icon">💬</span>
              Send Feedback
            </button>
          )}
          <Link
            to="/about"
            className="hamburger-menu-item"
            onClick={() => handleMenuClick()}
          >
            <span className="menu-item-icon">ℹ️</span>
            About
          </Link>
          <Link
            to="/faq"
            className="hamburger-menu-item"
            onClick={() => handleMenuClick()}
          >
            <span className="menu-item-icon">❔</span>
            FAQ
          </Link>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;
