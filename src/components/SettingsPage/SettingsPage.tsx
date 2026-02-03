import { useState, useEffect, useRef } from 'react';
import PageMeta from '../PageMeta/PageMeta';
import { getDistanceUnit, setDistanceUnit, getDisplayName, setDisplayName, getPlayerId } from '../../utils/storage';
import { updatePlayerDisplayName, getLeaderboards } from '../../services/gameApi';
import { getCountryMeasurementSystem } from '../../config/countryCodes';
import './SettingsPage.css';

interface SettingsPageProps {
  onClose: () => void;
}

/**
 * Detect user's likely country based on browser settings
 * Returns country code or null if cannot determine
 * Only returns a country code if we're confident it's a miles-using country
 * Otherwise returns null to default to km
 */
const detectUserCountry = (): string | null => {
  // Try to detect from timezone (most reliable indicator of physical location)
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Only check for miles-using countries via timezone
    // US timezones
    if (timezone.startsWith('America/') && (
        timezone.includes('New_York') || timezone.includes('Chicago') || 
        timezone.includes('Denver') || timezone.includes('Los_Angeles') ||
        timezone.includes('Phoenix') || timezone.includes('Anchorage') ||
        timezone.includes('Honolulu') || timezone.includes('Detroit') ||
        timezone.includes('Indianapolis') || timezone.includes('New_York'))) {
      return 'US';
    }
    // UK timezone
    if (timezone === 'Europe/London') {
      return 'GB';
    }
    // Liberia timezone
    if (timezone === 'Africa/Monrovia') {
      return 'LR';
    }
    // Myanmar timezones
    if (timezone === 'Asia/Yangon' || timezone === 'Asia/Rangoon') {
      return 'MM';
    }
  } catch (e) {
    // If timezone detection fails, don't fall back to language
    // Language doesn't reliably indicate physical location
  }
  
  // Don't use language detection - browser language doesn't match physical location
  // (e.g., someone in Israel might have browser set to "en-US")
  
  return null; // Return null to default to km (most countries use km)
};

const SettingsPage = ({ onClose }: SettingsPageProps) => {
  const [displayUnit, setDisplayUnit] = useState<'km' | 'miles'>('km');
  const [displayName, setDisplayNameState] = useState(getDisplayName() ?? '');
  const [displayNameSaving, setDisplayNameSaving] = useState(false);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [displayNameSuccess, setDisplayNameSuccess] = useState(false);
  const [showDisplayNameTooltip, setShowDisplayNameTooltip] = useState(false);
  const displayNameTooltipRef = useRef<HTMLDivElement>(null);
  const displayNameIconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Load current preference on mount
    const userPreference = getDistanceUnit();
    
    if (userPreference) {
      // User has a preference, use it
      setDisplayUnit(userPreference);
    } else {
      // No user preference - detect what would be used as default
      const detectedCountry = detectUserCountry();
      const defaultUnit = getCountryMeasurementSystem(detectedCountry);
      setDisplayUnit(defaultUnit); // Show what would be used by default
    }
  }, []);

  // Fetch display name from server if we have a player but no cached name (e.g. "Player 12b4")
  useEffect(() => {
    const playerId = getPlayerId();
    const cached = getDisplayName();
    if (playerId && !cached) {
      getLeaderboards(playerId)
        .then((res) => {
          const ourRow = res.boards[0]?.rows?.find((r) => r.player_id === playerId);
          if (ourRow?.display_name) {
            setDisplayNameState(ourRow.display_name);
            setDisplayName(ourRow.display_name);
          }
        })
        .catch(() => { /* ignore - user can still type a new name */ });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDisplayNameTooltip &&
        displayNameTooltipRef.current &&
        displayNameIconRef.current &&
        !displayNameTooltipRef.current.contains(event.target as Node) &&
        !displayNameIconRef.current.contains(event.target as Node)
      ) {
        setShowDisplayNameTooltip(false);
      }
    };
    if (showDisplayNameTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDisplayNameTooltip]);

  const handleUnitChange = (unit: 'km' | 'miles') => {
    setDisplayUnit(unit);
    setDistanceUnit(unit);
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('distanceUnitChanged', { detail: { unit } }));
  };

  const handleDisplayNameSave = async () => {
    const playerId = getPlayerId();
    if (!playerId) {
      setDisplayNameError('No player ID found');
      return;
    }
    const trimmed = displayName.trim() || null;
    try {
      setDisplayNameSaving(true);
      setDisplayNameError(null);
      setDisplayNameSuccess(false);
      const res = await updatePlayerDisplayName(playerId, trimmed);
      setDisplayName(res.display_name);
      setDisplayNameState(res.display_name ?? '');
      setDisplayNameSuccess(true);
      setTimeout(() => setDisplayNameSuccess(false), 2000);
    } catch (err) {
      setDisplayNameError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setDisplayNameSaving(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Settings – Hitfinder"
        description="Configure your Hitfinder preferences: distance units (km or miles) and display name for leaderboards."
        path="/settings"
      />
    <div className="settings-page-container">
      <div className="settings-page-content">
        <div className="settings-page-header">
          <h1 className="settings-page-title">
            <span className="settings-icon">⚙️</span>
            Settings
          </h1>
          <button 
            className="app-close-button settings-close-button" 
            onClick={onClose} 
            aria-label="Close settings"
            title="Close"
          >
            ×
          </button>
        </div>
        
        <div className="settings-sections">
          <div className="settings-row settings-row-display-name">
            <span className="settings-label settings-display-name-label">
              Display Name
              <span className="settings-display-name-info-wrapper">
                <span
                  ref={displayNameIconRef}
                  className="settings-display-name-info-icon"
                  role="button"
                  tabIndex={0}
                  title="How you will be displayed publicly (e.g. on leaderboards)"
                  aria-label="How you will be displayed publicly (e.g. on leaderboards)"
                  onMouseEnter={() => setShowDisplayNameTooltip(true)}
                  onMouseLeave={() => setShowDisplayNameTooltip(false)}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDisplayNameTooltip((v) => !v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowDisplayNameTooltip((v) => !v);
                    }
                  }}
                >
                  ℹ
                </span>
                {showDisplayNameTooltip && (
                  <div
                    ref={displayNameTooltipRef}
                    className="settings-display-name-tooltip"
                    role="tooltip"
                  >
                    How you will be displayed publicly (e.g. on leaderboards)
                  </div>
                )}
              </span>
            </span>
            <div className="settings-display-name-controls">
              <input
                type="text"
                className="settings-display-name-input"
                value={displayName}
                onChange={(e) => setDisplayNameState(e.target.value)}
                maxLength={100}
                placeholder="Your name on leaderboards"
              />
              <button
                type="button"
                className="settings-display-name-save"
                onClick={handleDisplayNameSave}
                disabled={displayNameSaving}
              >
                {displayNameSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
            {displayNameError && <span className="settings-display-name-error">{displayNameError}</span>}
            {displayNameSuccess && <span className="settings-display-name-success">Saved!</span>}
          </div>
          <div className="settings-row">
            <span className="settings-label">Distance Units</span>
            <div className="settings-options">
              <button
                className={`settings-option ${displayUnit === 'km' ? 'selected' : ''}`}
                onClick={() => handleUnitChange('km')}
              >
                <span className="option-text">km</span>
                <span className="option-indicator">{displayUnit === 'km' ? '⦿' : '⦾'}</span>
              </button>
              <button
                className={`settings-option ${displayUnit === 'miles' ? 'selected' : ''}`}
                onClick={() => handleUnitChange('miles')}
              >
                <span className="option-text">mi</span>
                <span className="option-indicator">{displayUnit === 'miles' ? '⦿' : '⦾'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default SettingsPage;
