import {validGoogleRefs,coursePlaceCount} from './googlePlaceRefs.js';
import {validKakaoRefs} from './kakaoPlaceRefs.js';
import {validItineraryOrder} from './itineraryOrder.js';
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
export function normalizePublicCourse(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const c = {...value};
  if (!['id','name','region','author'].every(key => nonempty(c[key]))) return null;
  if (!validKakaoRefs(c.kakaoPlaceRefs) || !validGoogleRefs(c.googlePlaceRefs) || !validItineraryOrder(c)) return null;
  if (!Array.isArray(c.stopIds) || c.stopIds.length>100 || coursePlaceCount(c) < 2 || !c.stopIds.every(nonempty) || new Set(c.stopIds).size !== c.stopIds.length) return null;
  if (!Number.isFinite(c.hours) || c.hours <= 0 || !['도보','대중교통','자동차'].includes(c.transport) || (!c.stopIds.includes(c.imagePlaceId) && !(c.stopIds.length===0 && (c.googlePlaceRefs?.length||c.kakaoPlaceRefs?.length) && c.imagePlaceId===null))) return null;
  for (const key of ['tags','representativeTags']) {
    if (c[key] === undefined) c[key] = [];
    if (!Array.isArray(c[key]) || !c[key].every(nonempty)) return null;
    c[key] = [...new Set(c[key])];
  }
  if (c.description === undefined) c.description = '';
  if (typeof c.description !== 'string' || c.isPublic !== true) return null;
  if (c.schedule != null && (!Array.isArray(c.schedule) || c.schedule.length !== c.stopIds.length || c.schedule.some((v,i) => !v || v.placeId !== c.stopIds[i] || !nonempty(v.label) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time) || !Number.isFinite(v.minutes) || v.minutes <= 0))) return null;
  return c;
}

export function safePublicCourses(values) {
  if (!Array.isArray(values)) return [];
  const ids = new Set();
  return values.map(normalizePublicCourse).filter(c => c && !ids.has(c.id) && ids.add(c.id));
}
