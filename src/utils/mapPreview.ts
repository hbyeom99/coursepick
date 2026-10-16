import type { Place } from '../types/place.ts';

export interface PreviewPosition {
  placeId: string;
  left: number;
  top: number;
}

/** Converts geographic coordinates into percentages for the existing illustrative preview.
 * This is a local layout projection, not a map SDK or a route/distance calculation.
 * Screen positions are derived here and are never stored in Place data.
 */
export function projectPlacesForPreview(
  places: readonly Pick<Place, 'id' | 'latitude' | 'longitude'>[],
): PreviewPosition[] {
  if (places.length === 0) return [];
  for (const place of places) {
    if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)
      || Math.abs(place.latitude) > 90 || Math.abs(place.longitude) > 180) {
      throw new RangeError(`Invalid coordinates for place ${place.id}`);
    }
  }
  const latitudes = places.map(place => place.latitude);
  const longitudes = places.map(place => place.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeSpan = maxLatitude - minLatitude;
  const longitudeSpan = maxLongitude - minLongitude;

  return places.map(place => ({
    placeId: place.id,
    left: longitudeSpan > 0 ? 15 + (place.longitude - minLongitude) / longitudeSpan * 70 : 50,
    top: latitudeSpan > 0 ? 17 + (maxLatitude - place.latitude) / latitudeSpan * 58 : 46,
  }));
}
