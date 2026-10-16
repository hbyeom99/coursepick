export const requestedProfileTaste = { activity: 50, space: 50, environment: 50, content: 50, pace: 50 };
export function validProfileTaste(value) {
  return value && [value.values, value.reference].every(scores => scores === null || Object.keys(requestedProfileTaste).every(key => Number.isFinite(scores?.[key]) && scores[key] >= 0 && scores[key] <= 100)) && value.values !== null;
}
export function adjustedProfileTaste(analysis, setting) {
  return Object.fromEntries(Object.keys(requestedProfileTaste).map(key => [key, Math.max(0, Math.min(100, Math.round(setting.values[key] + (setting.reference ? analysis[key] - setting.reference[key] : 0))))]));
}
