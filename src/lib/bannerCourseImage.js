export function bannerCourseImageId(course, catalog, failedIds = []) {
  const byId = new Map(catalog.map(place => [place.id, place]));
  const ids = [...new Set([course.imagePlaceId, ...course.stopIds].filter(Boolean))];
  const usable = place => place && !failedIds.includes(place.id) && typeof place.imageUrl === 'string' && (/^https?:\/\//i.test(place.imageUrl) || /^data:image\/(png|jpe?g|webp|gif);/i.test(place.imageUrl));
  return ids.find(id => usable(byId.get(id))) || ids.find(id => byId.has(id));
}
