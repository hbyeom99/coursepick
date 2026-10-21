import {evaluateCourseTraits,courseTraitAffinity} from './courseTraitsV2.js';
import { distanceKm } from './courseRoute.js';
import { scoreTags } from './exploreTags.js';

const aliases = { '서울특별시': '서울', '경기도': '경기', '인천광역시': '인천', '부산광역시': '부산', '대전광역시': '대전', '대구광역시': '대구', '울산광역시': '울산', '강원특별자치도': '강원', '전북특별자치도': '전북', '제주특별자치도': '제주' };
const regionName = value => aliases[value] || value;
const located = p => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
export function courseRegion(stops) {
  const counts = new Map();
  stops.forEach(p => counts.set(regionName(p.region), (counts.get(regionName(p.region)) || 0) + 1));
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] || '전체';
}
export function insertPlace(ids, id, afterId = 'end') {
  if (ids.includes(id)) return ids;
  const index = afterId === 'end' || !ids.includes(afterId) ? ids.length : ids.indexOf(afterId) + 1;
  return [...ids.slice(0, index), id, ...ids.slice(index)];
}
export function recommendAdditions({ candidates, stops, region, afterId = 'end', accommodation, interests = [], taste = {}, replaceId,courseContext={},traitContext={} }) {
  const traitIndex=new Map([...stops,...candidates].map(p=>[p.id,p]));
  const replacing = stops.find(p => p.id === replaceId);
  const remaining = replacing ? stops.filter(p => p.id !== replaceId) : stops;
  const index = replacing ? stops.indexOf(replacing) : afterId === 'end' || !stops.some(p => p.id === afterId) ? stops.length : stops.findIndex(p => p.id === afterId) + 1;
  const before = stops[index - 1] || accommodation;
  const after = stops[index + (replacing ? 1 : 0)] || accommodation;
  const anchor = located(replacing) ? replacing : located(before) ? before : located(after) ? after : null;
  const wanted = new Set(scoreTags(interests));
  const courseTags = new Set(scoreTags(remaining.flatMap(p => p.tags)));
  const excluded = new Set(stops.map(p => p.id));
  if (accommodation) excluded.add(accommodation.id);
  const hasTaste=["planning","experience","exploration","spending"].some(k=>Number.isFinite(taste?.[k]));
  const ranked = [...new Map(candidates.map(p => [p.id, p])).values()]
    .filter(p => p.category !== '숙소' && !excluded.has(p.id) && (region === '전체' || regionName(p.region) === regionName(region)))
    .sort((a,b)=>{if(!hasTaste)return 0;const score=p=>scoreTags(p.tags).filter(t=>wanted.has(t)).length*3-(anchor&&located(p)?distanceKm(anchor,p):0);return score(b)-score(a)||a.id.localeCompare(b.id);})
    .slice(0,hasTaste?200:Infinity)
    .map(place => {
      const keywords = scoreTags(place.tags);
      const matches = keywords.filter(tag => wanted.has(tag));
      const affinity = keywords.reduce((sum, tag) => sum + (wanted.has(tag) ? 3 : courseTags.has(tag) ? 1 : 0), 0);
      const nextStops=[...remaining.slice(0,index),place,...remaining.slice(index)];
      const assessment=hasTaste?evaluateCourseTraits({...courseContext,stopIds:nextStops.map(p=>p.id)},traitIndex,traitContext):null;
      const fit=assessment?courseTraitAffinity(assessment,taste):0;
      const distance = anchor && located(place) ? distanceKm(anchor, place) : null;
      const delta = replacing && located(replacing) && located(place) && [before, after].filter(Boolean).every(located) && (before || after)
        ? (before ? distanceKm(before, place) - distanceKm(before, replacing) : 0) + (after ? distanceKm(place, after) - distanceKm(replacing, after) : 0) : null;
      const detour = replacing ? delta : distance === null ? null : located(before) && located(after)
        ? Math.max(0, distanceKm(before, place) + distanceKm(place, after) - distanceKm(before, after)) : distance;
      const missingCafe = place.category === '카페' && !remaining.some(p => p.category === '카페');
      const missingMeal = place.category === '음식점' && remaining.filter(p => p.category === '음식점').length < 2;
      const balance = stops.length ? (missingCafe ? 2 : missingMeal ? 3 : 0) : 0;
      const reasons = [];
      if (distance !== null) reasons.push(`${replacing ? '기존 장소' : before === anchor ? '앞 일정' : '다음 일정'}에서 직선 ${distance.toFixed(1)}km`);
      if (replacing && delta !== null) reasons.push(Math.abs(delta) < 0.05 ? '교체 시 직선 동선 거의 동일' : `교체 시 직선 동선 약 ${Math.abs(delta).toFixed(1)}km ${delta < 0 ? '감소' : '증가'}`);
      if (!replacing && located(before) && located(after) && detour !== null) reasons.push(`직선 동선 약 ${detour.toFixed(1)}km 추가`);
      if (matches.length) reasons.push(`${place.tags.filter(t => scoreTags([t]).some(k => wanted.has(k))).slice(0, 2).join('·')} 취향과 일치`);
      if (fit > 0) reasons.push('이 장소를 넣은 코스 전체의 4축 성향을 비교했어요');
      if (balance && !replacing) reasons.push(missingCafe ? '일정에 쉬어갈 카페를 더해요' : '일정에 식사 장소를 더해요');
      if (!reasons.length) reasons.push(replacing ? '같은 지역의 교체 후보' : '현재 지역에서 추가할 수 있는 장소');
      return { place, distance, detour, reasons, courseAssessment:assessment, score: affinity + fit * 2 + balance - (detour ?? 0) * 2 };
    }).sort((a, b) => (anchor && a.distance === null ? 1 : 0) - (anchor && b.distance === null ? 1 : 0) || b.score - a.score || (a.distance ?? 0) - (b.distance ?? 0) || a.place.id.localeCompare(b.place.id));
  let radius = null;
  let nearby = ranked;
  if (anchor) {
    for (const limit of [3, 5, 10, 20, Infinity]) {
      radius = limit;
      nearby = ranked.filter(item => item.distance !== null && item.distance <= limit);
      if (nearby.length >= 3) break;
    }
  }
  return { ranked, recommendations: nearby.slice(0, 3), radius, widened: anchor !== null && radius > 3, hasAnchor: Boolean(anchor) };
}

export function recommendReplacements(options) {
  const target = options.stops.find(p => p.id === options.replaceId);
  if (!target) return { ranked: [], recommendations: [] };
  const role = replacementRole(target, options.scheduleEntry);
  return recommendAdditions({ ...options, candidates: options.candidates.filter(p => matchesReplacementRole(p, role)) });
}
export function replaceDraftPlace(draft, oldId, place) {
  if (!draft.stopIds.includes(oldId) || draft.stopIds.includes(place.id) || draft.accommodationId === place.id || place.category === '숙소') return draft;
  return { ...draft, stopIds: draft.stopIds.map(id => id === oldId ? place.id : id), straightLineKm: undefined };
}

// Schedule roles take precedence over the current place category. Tags alone do
// not turn a restaurant into a cafe or a sightseeing stop into a meal stop.
export function replacementRole(place, scheduleEntry) {
  const label = scheduleEntry?.label || '';
  if (/점심|저녁|식사/.test(label)) return '음식점';
  if (/카페|디저트|빵집|휴식|쉬어/.test(label)) return '카페';
  if (/오전|오후|관광|체험|액티비티/.test(label)) return '관광지';
  return place.category;
}
export function matchesReplacementRole(place, role) {
  return place.category === role;
}
