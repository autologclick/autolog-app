/**
 * Google Places (New) integration — photo enrichment for GarageDirectory.
 *
 * FULLY INERT until GOOGLE_PLACES_API_KEY is set: every network-calling function
 * early-returns null when the key is missing, so no Google request is ever made
 * and no behavior changes in production until a key is configured.
 *
 * ToS notes: place_id may be stored permanently; photo BYTES may not be stored —
 * we persist only the photo resource reference + author attribution and re-fetch
 * bytes on demand through our proxy, refreshing the reference every 30 days.
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('business');

const PLACES_BASE = 'https://places.googleapis.com/v1';
export const PHOTO_CACHE_DAYS = 30;

/** True only when a Places API key is configured. Gates every remote call. */
export function isPlacesConfigured(): boolean {
  return !!process.env.GOOGLE_PLACES_API_KEY;
}

/** Whether a stored photoRef is stale and should be refreshed. */
export function isPhotoStale(photoFetchedAt: Date | null | undefined): boolean {
  if (!photoFetchedAt) return true;
  const ageMs = Date.now() - new Date(photoFetchedAt).getTime();
  return ageMs > PHOTO_CACHE_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Geocode a MOT garage to coordinates via Places Text Search (name+address+city).
 * Returns the matched place's id + location. Uses the Places-restricted key (no
 * Geocoding API needed). Returns null when not configured or no match.
 */
export async function geocodeGarage(name: string, address: string, city: string): Promise<{ placeId: string; lat: number; lng: number } | null> {
  if (!isPlacesConfigured()) return null;
  try {
    const res = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY as string,
        'X-Goog-FieldMask': 'places.id,places.location',
      },
      body: JSON.stringify({ textQuery: `${name} ${address} ${city}`, languageCode: 'he', regionCode: 'IL', maxResultCount: 1 }),
    });
    if (!res.ok) { logger.warn('geocodeGarage failed', { status: res.status }); return null; }
    const data = await res.json();
    const p = data?.places?.[0];
    if (!p?.id || !p.location) return null;
    return { placeId: p.id, lat: p.location.latitude, lng: p.location.longitude };
  } catch (e) {
    logger.warn('geocodeGarage error', { message: (e as Error).message });
    return null;
  }
}

export interface PlacePhotoResult {
  placeId: string;
  photoRef: string | null;         // Places photo resource name, e.g. "places/XXX/photos/YYY"
  photoAttribution: string | null; // author display name (required attribution)
  rating: number | null;           // Google rating
  userRatingCount: number | null;  // number of Google reviews
  googleMapsUri: string | null;    // canonical link to the place (and its reviews)
}

/**
 * Match a directory garage to a Google place_id by name + address + city.
 * Returns null when not configured or no confident match.
 */
export async function matchPlaceId(name: string, address: string, city: string): Promise<string | null> {
  if (!isPlacesConfigured()) return null;
  try {
    const res = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY as string,
        // minimal field mask keeps this on the cheapest SKU tier
        'X-Goog-FieldMask': 'places.id,places.formattedAddress,places.displayName',
      },
      body: JSON.stringify({
        textQuery: `${name} ${address} ${city}`,
        languageCode: 'he',
        regionCode: 'IL',
        maxResultCount: 1,
      }),
    });
    if (!res.ok) {
      logger.warn('Places searchText failed', { status: res.status });
      return null;
    }
    const data = await res.json();
    return data?.places?.[0]?.id ?? null;
  } catch (e) {
    logger.warn('Places searchText error', { message: (e as Error).message });
    return null;
  }
}

/**
 * Fetch the primary photo reference + attribution for a place_id.
 * Returns null when not configured or the place has no photos.
 */
export async function fetchPlacePhoto(placeId: string): Promise<{
  photoRef: string | null;
  photoAttribution: string | null;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUri: string | null;
} | null> {
  if (!isPlacesConfigured()) return null;
  try {
    const res = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}?languageCode=he`, {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY as string,
        'X-Goog-FieldMask': 'photos,rating,userRatingCount,googleMapsUri',
      },
    });
    if (!res.ok) {
      logger.warn('Places details failed', { status: res.status });
      return null;
    }
    const data = await res.json();
    const photo = data?.photos?.[0];
    return {
      photoRef: photo?.name ?? null,
      photoAttribution: photo?.authorAttributions?.[0]?.displayName ?? null,
      rating: typeof data?.rating === 'number' ? data.rating : null,
      userRatingCount: typeof data?.userRatingCount === 'number' ? data.userRatingCount : null,
      googleMapsUri: data?.googleMapsUri ?? null,
    };
  } catch (e) {
    logger.warn('Places details error', { message: (e as Error).message });
    return null;
  }
}

/**
 * Full enrichment: match then fetch photo. Returns null when not configured or unmatched.
 */
export async function enrichGaragePhoto(name: string, address: string, city: string): Promise<PlacePhotoResult | null> {
  if (!isPlacesConfigured()) return null;
  const placeId = await matchPlaceId(name, address, city);
  if (!placeId) return null;
  const photo = await fetchPlacePhoto(placeId);
  return {
    placeId,
    photoRef: photo?.photoRef ?? null,
    photoAttribution: photo?.photoAttribution ?? null,
    rating: photo?.rating ?? null,
    userRatingCount: photo?.userRatingCount ?? null,
    googleMapsUri: photo?.googleMapsUri ?? null,
  };
}

export interface CarWashMatch {
  placeId: string;
  name: string | null;
  phone: string | null;
  photoRef: string | null;
  photoAttribution: string | null;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUri: string | null;
}

/**
 * Match a car wash by COORDINATES (not text — OSM names are often generic) using
 * Places Nearby Search restricted to type=car_wash, nearest first. Pulls the real
 * name, phone and photo in one call. Returns null when not configured or no match.
 */
export async function enrichCarWashByCoords(lat: number, lng: number, radiusM = 150): Promise<CarWashMatch | null> {
  if (!isPlacesConfigured()) return null;
  try {
    const res = await fetch(`${PLACES_BASE}/places:searchNearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY as string,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.nationalPhoneNumber,places.photos,places.rating,places.userRatingCount,places.googleMapsUri',
      },
      body: JSON.stringify({
        includedTypes: ['car_wash'],
        maxResultCount: 1,
        rankPreference: 'DISTANCE',
        languageCode: 'he',
        regionCode: 'IL',
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: radiusM } },
      }),
    });
    if (!res.ok) {
      logger.warn('Places searchNearby failed', { status: res.status });
      return null;
    }
    const data = await res.json();
    const p = data?.places?.[0];
    if (!p?.id) return null;
    const photo = p.photos?.[0];
    return {
      placeId: p.id,
      name: p.displayName?.text ?? null,
      phone: p.nationalPhoneNumber ?? null,
      photoRef: photo?.name ?? null,
      photoAttribution: photo?.authorAttributions?.[0]?.displayName ?? null,
      rating: typeof p.rating === 'number' ? p.rating : null,
      userRatingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
      googleMapsUri: p.googleMapsUri ?? null,
    };
  } catch (e) {
    logger.warn('Places searchNearby error', { message: (e as Error).message });
    return null;
  }
}

/**
 * Fetch name + phone + photo for a KNOWN place_id (Google-discovered car washes,
 * where we already stored the place_id). Cheaper/more exact than a coord search.
 */
export async function fetchCarWashDetails(placeId: string): Promise<CarWashMatch | null> {
  if (!isPlacesConfigured()) return null;
  try {
    const res = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}?languageCode=he`, {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY as string,
        'X-Goog-FieldMask': 'id,displayName,nationalPhoneNumber,photos,rating,userRatingCount,googleMapsUri',
      },
    });
    if (!res.ok) {
      logger.warn('Places details (car wash) failed', { status: res.status });
      return null;
    }
    const p = await res.json();
    if (!p?.id) return null;
    const photo = p.photos?.[0];
    return {
      placeId: p.id,
      name: p.displayName?.text ?? null,
      phone: p.nationalPhoneNumber ?? null,
      photoRef: photo?.name ?? null,
      photoAttribution: photo?.authorAttributions?.[0]?.displayName ?? null,
      rating: typeof p.rating === 'number' ? p.rating : null,
      userRatingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
      googleMapsUri: p.googleMapsUri ?? null,
    };
  } catch (e) {
    logger.warn('Places details (car wash) error', { message: (e as Error).message });
    return null;
  }
}

/**
 * Discover car washes in/around a text location via Places Text Search
 * (type=car_wash). Returns place_id + coordinates + display name (name is only
 * used for logging/verification — we persist only place_id + coords, and pull
 * name/phone/photo later through the refresh mechanism). Handles one page;
 * pass a pageToken to continue. Returns { results, nextPageToken }.
 */
export async function searchCarWashesInCity(
  city: string,
  pageToken?: string,
): Promise<{ results: { placeId: string; lat: number; lng: number; name: string | null }[]; nextPageToken: string | null }> {
  if (!isPlacesConfigured()) return { results: [], nextPageToken: null };
  try {
    const res = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY as string,
        'X-Goog-FieldMask': 'places.id,places.location,places.displayName,nextPageToken',
      },
      // NB: no includedType filter on purpose — Google mistypes some real car
      // washes (e.g. "אוטו רונן" is typed store/establishment, not car_wash), so
      // the strict type filter drops them. Pure text relevance for "שטיפת רכב
      // <city>" catches them; dedupe + city scoping keep the set clean.
      body: JSON.stringify({
        textQuery: `שטיפת רכב ${city}`,
        languageCode: 'he',
        regionCode: 'IL',
        pageSize: 20,
        ...(pageToken ? { pageToken } : {}),
      }),
    });
    if (!res.ok) {
      logger.warn('Places text search (car wash) failed', { status: res.status, city });
      return { results: [], nextPageToken: null };
    }
    const data = await res.json();
    const results = (data.places || [])
      .filter((p: { id?: string; location?: { latitude: number; longitude: number } }) => p.id && p.location)
      .map((p: { id: string; location: { latitude: number; longitude: number }; displayName?: { text?: string } }) => ({
        placeId: p.id,
        lat: p.location.latitude,
        lng: p.location.longitude,
        name: p.displayName?.text ?? null,
      }));
    return { results, nextPageToken: data.nextPageToken || null };
  } catch (e) {
    logger.warn('Places text search (car wash) error', { message: (e as Error).message, city });
    return { results: [], nextPageToken: null };
  }
}

/**
 * Build the server-side Places Photo media URL (includes the key — never expose to the client;
 * used only by the /photo proxy route). Returns null when not configured.
 */
export function buildPhotoMediaUrl(photoRef: string, maxWidthPx = 800): string | null {
  if (!isPlacesConfigured()) return null;
  const key = process.env.GOOGLE_PLACES_API_KEY as string;
  return `${PLACES_BASE}/${photoRef}/media?maxWidthPx=${maxWidthPx}&key=${encodeURIComponent(key)}`;
}
