import { useState, useEffect } from 'react';
import { getDistanceUnit, setDistanceUnit } from '../../utils/storage';
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

  const handleUnitChange = (unit: 'km' | 'miles') => {
    setDisplayUnit(unit);
    setDistanceUnit(unit);
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('distanceUnitChanged', { detail: { unit } }));
  };

  return (
    <div className="settings-page-container">
      <div className="settings-page-content">
        <div className="settings-page-header">
          <h1 className="settings-page-title">
            <span className="settings-icon">⚙️</span>
            Settings
          </h1>
          <button 
            className="settings-close-button" 
            onClick={onClose} 
            aria-label="Close settings"
            title="Close"
          >
            ×
          </button>
        </div>
        
        <div className="settings-sections">
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
  );
};

export default SettingsPage;
