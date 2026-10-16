export function distanceKm(a, b) {
  const rad = value => value * Math.PI / 180;
  const value = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, value))));
}
export function lodgingCandidates(catalog, stops, region) {
  return catalog.filter(place => place.category === '숙소' && (!region || region === '여러 지역' || place.region === region) && !stops.some(stop => stop.id === place.id))
    .map(place => ({place, distance: stops.length ? distanceKm(place, stops[0]) : null, returnDistance: stops.length ? distanceKm(place, stops.at(-1)) : null}))
    .filter(item => !stops.length || (item.distance <= 15 && item.returnDistance <= 15))
    .sort((a, b) => (a.distance ?? 0) + (a.returnDistance ?? 0) - (b.distance ?? 0) - (b.returnDistance ?? 0) || a.place.id.localeCompare(b.place.id));
}
export function courseRoute(stops, accommodation) {
  return accommodation && accommodation.category === '숙소' && !stops.some(p => p.id === accommodation.id) && stops.length ? [accommodation, ...stops, accommodation] : stops;
}
