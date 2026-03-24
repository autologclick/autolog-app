/**
 * Maps Integration (Google Maps or Mapbox)
 * Provides geolocation, directions, and nearby garage search
 * Gracefully disabled when env vars are missing
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('business');

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GarageLocation extends Coordinates {
  id: string;
  name: string;
  address: string;
  phone?: string;
  distance: number; // in kilometers
  rating?: number;
}

export interface DirectionRoute {
  distance: number; // in kilometers
  duration: number; // in minutes
  steps: DirectionStep[];
}

export interface DirectionStep {
  instruction: string;
  distance: number;
  duration: number;
}

interface GeocodeResult {
  lat: number;
  lng: number;
  address?: string;
}

/**
 * Check if Maps integration is configured
 */
export function isMapsConfigured(): boolean {
  return !!process.env.MAPS_API_KEY;
}

/**
 * Get the maps provider (google or mapbox)
 */
export function getMapsProvider(): 'google' | 'mapbox' {
  return (process.env.MAPS_PROVIDER as 'google' | 'mapbox') || 'google';
}

/**
 * Search for nearby garages
 * @param latitude - Center point latitude
 * @param longitude - Center point longitude
 * @param radiusKm - Search radius in kilometers
 * @returns List of garages sorted by distance
 */
export async function searchNearbyGarages(
  latitude: number,
  longitude: number,
  radiusKm: number = 15
): Promise<GarageLocation[]> {
  if (!isMapsConfigured()) {
    logger.warn('Maps API not configured, cannot search nearby garages');
    return [];
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    logger.error('Invalid coordinates', { latitude, longitude });
    return [];
  }

  // Validate radius
  if (radiusKm < 1 || radiusKm > 50) {
    logger.error('Invalid search radius', { radiusKm });
    return [];
  }

  try {
    const provider = getMapsProvider();

    if (provider === 'google') {
      return await searchNearbyGaragesGoogle(latitude, longitude, radiusKm);
    } else {
      return await searchNearbyGaragesMapbox(latitude, longitude, radiusKm);
    }
  } catch (error) {
    logger.error('Failed to search nearby garages', {
      latitude,
      longitude,
      radiusKm,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Get directions between two points
 * @param fromLat - Starting point latitude
 * @param fromLng - Starting point longitude
 * @param toLat - Destination latitude
 * @param toLng - Destination longitude
 */
export async function getDirections(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<DirectionRoute | null> {
  if (!isMapsConfigured()) {
    logger.warn('Maps API not configured, cannot get directions');
    return null;
  }

  // Validate coordinates
  if (
    fromLat < -90 || fromLat > 90 || fromLng < -180 || fromLng > 180 ||
    toLat < -90 || toLat > 90 || toLng < -180 || toLng > 180
  ) {
    logger.error('Invalid coordinates for directions', { fromLat, fromLng, toLat, toLng });
    return null;
  }

  try {
    const provider = getMapsProvider();

    if (provider === 'google') {
      return await getDirectionsGoogle(fromLat, fromLng, toLat, toLng);
    } else {
      return await getDirectionsMapbox(fromLat, fromLng, toLat, toLng);
    }
  } catch (error) {
    logger.error('Failed to get directions', {
      from: { lat: fromLat, lng: fromLng },
      to: { lat: toLat, lng: toLng },
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Geocode an address to coordinates
 * @param address - Street address
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!isMapsConfigured()) {
    logger.warn('Maps API not configured, cannot geocode address');
    return null;
  }

  if (!address || address.trim().length === 0) {
    logger.error('Empty address provided for geocoding');
    return null;
  }

  try {
    const provider = getMapsProvider();
    let result: GeocodeResult | null = null;

    if (provider === 'google') {
      result = await geocodeAddressGoogle(address);
    } else {
      result = await geocodeAddressMapbox(address);
    }

    if (result) {
      return {
        latitude: result.lat,
        longitude: result.lng,
      };
    }

    return null;
  } catch (error) {
    logger.error('Failed to geocode address', {
      address,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - First point latitude
 * @param lng1 - First point longitude
 * @param lat2 - Second point latitude
 * @param lng2 - Second point longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Google Maps implementations (mock placeholders)
async function searchNearbyGaragesGoogle(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<GarageLocation[]> {
  logger.debug('Searching nearby garages via Google Maps API', {
    latitude,
    longitude,
    radiusKm,
  });

  // TODO: Implement actual Google Maps API call
  // This would use the Places API to search for auto repair shops
  return [];
}

async function getDirectionsGoogle(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<DirectionRoute | null> {
  logger.debug('Getting directions via Google Maps API', {
    from: { lat: fromLat, lng: fromLng },
    to: { lat: toLat, lng: toLng },
  });

  // TODO: Implement actual Google Directions API call
  return null;
}

async function geocodeAddressGoogle(address: string): Promise<GeocodeResult | null> {
  logger.debug('Geocoding address via Google Maps API', { address });

  // TODO: Implement actual Google Geocoding API call
  return null;
}

// Mapbox implementations (mock placeholders)
async function searchNearbyGaragesMapbox(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<GarageLocation[]> {
  logger.debug('Searching nearby garages via Mapbox API', {
    latitude,
    longitude,
    radiusKm,
  });

  // TODO: Implement actual Mapbox Places API call
  return [];
}

async function getDirectionsMapbox(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<DirectionRoute | null> {
  logger.debug('Getting directions via Mapbox API', {
    from: { lat: fromLat, lng: fromLng },
    to: { lat: toLat, lng: toLng },
  });

  // TODO: Implement actual Mapbox Directions API call
  return null;
}

async function geocodeAddressMapbox(address: string): Promise<GeocodeResult | null> {
  logger.debug('Geocoding address via Mapbox API', { address });

  // TODO: Implement actual Mapbox Geocoding API call
  return null;
}
