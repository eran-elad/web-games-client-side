/**
 * Distance conversion and formatting utilities
 */

import { getCountryMeasurementSystem } from '../config/countryCodes';

// Conversion factor: 1 km = 0.621371 miles
const KM_TO_MILES = 0.621371;

/**
 * Detect user's country based on browser settings
 * Returns country code or null if cannot determine
 * Only returns a country code if we're confident it's a miles-using country
 */
const detectUserCountry = (): string | null => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // US timezones
    if (timezone.startsWith('America/') && (
        timezone.includes('New_York') || timezone.includes('Chicago') || 
        timezone.includes('Denver') || timezone.includes('Los_Angeles') ||
        timezone.includes('Phoenix') || timezone.includes('Anchorage') ||
        timezone.includes('Honolulu') || timezone.includes('Detroit') ||
        timezone.includes('Indianapolis'))) {
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
    // If timezone detection fails, return null
  }
  
  return null; // Return null to default to km
};

/**
 * Get the default distance unit based on user's location
 * @returns 'km' or 'miles'
 */
export const getDefaultDistanceUnit = (): 'km' | 'miles' => {
  const userCountry = detectUserCountry();
  return getCountryMeasurementSystem(userCountry);
};

/**
 * Convert distance from kilometers to the target unit
 * @param km - Distance in kilometers
 * @param targetUnit - Target unit ('km' or 'miles')
 * @returns Converted distance value
 */
export const convertDistance = (km: number, targetUnit: 'km' | 'miles'): number => {
  if (targetUnit === 'miles') {
    return km * KM_TO_MILES;
  }
  return km;
};

/**
 * Format distance with appropriate unit suffix
 * @param km - Distance in kilometers
 * @param preferredUnit - User's preferred unit ('km' | 'miles' | null)
 * @returns Formatted distance string (e.g., "500km", "310mi", "5.1k km", "3.2k mi")
 */
export const formatDistance = (km: number, preferredUnit: 'km' | 'miles' | null): string => {
  // Determine which unit to use: user preference > user's country default > km
  const unit = preferredUnit || getDefaultDistanceUnit();
  const value = convertDistance(km, unit);
  const suffix = unit === 'miles' ? 'mi' : 'km';
  
  // Format large distances (1000+)
  if (value >= 1000) {
    const thousands = (value / 1000).toFixed(1);
    return `${thousands.replace(/\.0$/, '')}K ${suffix}`;
  }
  
  // Round to nearest integer for smaller distances
  return `${Math.round(value)}${suffix}`;
};
