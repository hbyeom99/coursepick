import { scoreTags } from './exploreTags.js';

export const tasteAxes = [
  { id: 'activity', title: '활동성', left: '휴식', right: '활동', low: ['휴식', '여유', '힐링'], high: ['활동', '등산', '레저', '액티비티'], icon: 'up' },
  { id: 'space', title: '공간 성향', left: '실내', right: '야외', low: ['실내', '전시', '박물관'], high: ['야외', '공원', '숲'], icon: 'home' },
  { id: 'environment', title: '환경 성향', left: '도시', right: '자연', low: ['도시', '도심', '골목', '건축'], high: ['자연', '숲', '바다'], icon: 'map' },
  { id: 'content', title: '콘텐츠 성향', left: '관람', right: '체험', low: ['관람', '역사문화', '전시'], high: ['체험', '공방', '양조체험'], icon: 'plus' },
  { id: 'pace', title: '일정 성향', left: '여유', right: '활발', low: [], high: [], icon: 'tune' },
];

// Each course contributes at most one unit per axis. Three neutral prior
// observations prevent sparse history from producing extreme preferences.
export function savedCourseTaste(savedIds, courses, catalog) {
  const saved = new Set(savedIds);
  const places = new Map(catalog.map(p => [p.id, p]));
  const selected = [...new Map(courses.map(c => [c.id, c])).values()].filter(c => saved.has(c.id));
  const evidence = Object.fromEntries(tasteAxes.map(a => [a.id, { sum: 0, count: 0 }]));
  for (const course of selected) {
    const stops = [...new Set(course.stopIds)].map(id => places.get(id)).filter(Boolean);
    for (const axis of tasteAxes) {
      let value;
      if (axis.id === 'pace') {
        // Incomplete or multi-day schedules cannot be compared with day trips.
        if (stops.length !== course.stopIds.length || !stops.length || !Number.isFinite(course.hours) || course.hours <= 0 || course.hours > 12 || (course.durationDays && course.durationDays !== 1)) continue;
        const hoursPerStop = course.hours / stops.length;
        value = hoursPerStop >= 2 ? -1 : hoursPerStop <= 1.5 ? 1 : 0;
      } else {
        const low = scoreTags(axis.low), high = scoreTags(axis.high);
        const signals = stops.map(p => {
          const tags = scoreTags(p.tags || []);
          const left = low.some(t => tags.includes(t)), right = high.some(t => tags.includes(t));
          return !left && !right ? null : left === right ? 0 : right ? 1 : -1;
        }).filter(v => v !== null);
        if (!signals.length) continue;
        value = signals.reduce((a,b) => a+b,0) / signals.length;
      }
      evidence[axis.id].sum += value;
      evidence[axis.id].count += 1;
    }
  }
  return {
    taste: Object.fromEntries(tasteAxes.map(a => [a.id, Math.round(50 + 50 * evidence[a.id].sum / (evidence[a.id].count + 3))])),
    evidence,
    analyzedCount: selected.length,
    unavailableCount: saved.size - selected.length,
  };
}


export function analysisFingerprint(savedIds, authored, courses) {
  const byId = new Map(courses.map(c => [c.id,c]));
  authored.forEach(c => byId.set(c.id,c));
  const ids = [...new Set([...savedIds,...authored.map(c=>c.id)])].sort();
  return JSON.stringify(ids.map(id => {
    const c=byId.get(id);
    return c ? [id,c.stopIds,c.hours,c.durationDays ?? 1,c.schedule ?? null,c.tags ?? []] : [id,null];
  }));
}

export function analyzeCourseHistory(savedIds, authored, courses, catalog) {
  const byId = new Map(courses.map(c=>[c.id,c]));
  authored.forEach(c=>byId.set(c.id,c));
  const authoredIds = new Set(authored.map(c=>c.id));
  const ids = [...new Set([...authoredIds,...savedIds])];
  const placeIds = new Set(catalog.map(p=>p.id));
  const seen = new Set();
  const accepted=[];
  let duplicateCount=0, unavailableCount=0, authoredCount=0, savedCount=0;
  for(const id of ids) {
    const c=byId.get(id);
    if(!c || !c.stopIds.length || !c.stopIds.every(p=>placeIds.has(p))) { unavailableCount++; continue; }
    // Exact ordered itinerary copies have one vote even with different titles.
    const key=JSON.stringify(c.stopIds);
    if(seen.has(key)) { duplicateCount++; continue; }
    seen.add(key); accepted.push(c);
    if(authoredIds.has(id)) authoredCount++; else savedCount++;
  }
  const result=savedCourseTaste(accepted.map(c=>c.id),accepted,catalog);
  return {...result,authoredCount,savedCount,duplicateCount,unavailableCount};
}

export function validTasteAnalysis(value) {
  return value === null || Boolean(value && typeof value.fingerprint === 'string' && typeof value.analyzedAt === 'string' && Number.isFinite(Date.parse(value.analyzedAt)) &&
    ['analyzedCount','authoredCount','savedCount','duplicateCount','unavailableCount'].every(k=>Number.isInteger(value[k]) && value[k]>=0) &&
    tasteAxes.every(a=>Number.isFinite(value.taste?.[a.id]) && value.taste[a.id]>=0 && value.taste[a.id]<=100 && Number.isInteger(value.evidence?.[a.id]?.count) && value.evidence[a.id].count>=0));
}

