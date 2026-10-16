// Stable demonstration counts; these are not real user statistics.
export function demoSaveCount(id) {
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return 20 + hash % 481;
}
export function popularCourses(courses, savedIds) {
  const saved = new Set(savedIds);
  return [...new Map(courses.map(c => [c.id, c])).values()].map(course => ({ ...course, demoSaveCount: demoSaveCount(course.id) + (saved.has(course.id) ? 1 : 0) }))
    .sort((a, b) => b.demoSaveCount - a.demoSaveCount || a.id.localeCompare(b.id));
}
export function coursePeriod(course) {
  const days = course.durationDays;
  if (Number.isInteger(days) && days > 0) return days === 1 ? '당일치기' : `${days - 1}박 ${days}일`;
  // A lodging connection alone does not establish a multi-day itinerary.
  if (Number.isFinite(course.hours) && course.hours > 0 && course.hours <= 12) return '당일치기';
  return '기간 미정';
}
