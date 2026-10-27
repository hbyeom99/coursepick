import administrativeRegions from '../data/visitRegions.json';
import { coursePeriod } from './homeFeed.js';

const provinces = {
  서울: ['서울', '서울특별시'], 부산: ['부산', '부산광역시'], 대구: ['대구', '대구광역시'],
  인천: ['인천', '인천광역시'], 광주: ['광주', '광주광역시'], 대전: ['대전', '대전광역시'],
  울산: ['울산', '울산광역시'], 세종: ['세종', '세종특별자치시'], 경기: ['경기', '경기도'],
  강원: ['강원', '강원도', '강원특별자치도'], 충북: ['충북', '충청북도'], 충남: ['충남', '충청남도'],
  전북: ['전북', '전라북도', '전북특별자치도'], 전남: ['전남', '전라남도'],
  경북: ['경북', '경상북도'], 경남: ['경남', '경상남도'], 제주: ['제주', '제주도', '제주특별자치도'],
};
export const travelRegions = Object.keys(provinces);
const aliases = new Map(Object.entries(provinces).flatMap(([region, names]) => names.map(name => [name, region])));
const knownCities = { 용인: ['경기', '용인시'], 천안: ['충남', '천안시'], 전주: ['전북', '전주시'], 강릉: ['강원', '강릉시'] };
export function placeArea(place) {
  if (!place) return { region: '', city: '' };
  const parts = (place.location || '').trim().split(/\s+/);
  const addressRegion = aliases.get(parts[0]);
  const legacy = knownCities[place.region];
  const region = addressRegion || aliases.get(place.region) || legacy?.[0] || place.region;
  const tokens = addressRegion ? parts.slice(1) : aliases.has(region) ? parts : [];
  const city = tokens.find(value => value !== '전남광주통합특별시' && /^[가-힣]+(?:시|군|구)$/.test(value)) || (region === '세종' ? '세종시' : legacy?.[1]) || '';
  return { region, city };
}
export function areaMatches(place, filters) {
  const area = placeArea(place);
  const wanted = aliases.get(filters.region) || knownCities[filters.region]?.[0] || filters.region;
  const city = filters.city && filters.city !== '전체' ? filters.city : knownCities[filters.region]?.[1];
  return (wanted === '전체' || area.region === wanted) && (!city || area.city === city);
}
export function citiesFor(places, region) {
  const canonical=aliases.get(region)||region;
  const province=administrativeRegions.provinces.find(item=>aliases.get(item.name)===canonical);
  const districts=administrativeRegions.districts.filter(item=>item.province===province?.id).map(item=>item.name.split(' ')[0]);
  const existing=places.map(placeArea).filter(area=>area.region===canonical&&area.city).map(area=>area.city);
  return [...new Set([...districts,...existing,...(canonical==='세종'?['세종시']:[])])].sort((a,b)=>a.localeCompare(b,'ko'));
}
export function companionsMatch(place, filters) {
  return (!filters.infant || place?.companionInfo?.infantAllowed === true) && (!filters.pet || place?.companionInfo?.petAllowed === true);
}
export function courseConditionsMatch(course, stops, filters) {
  if (filters.period && filters.period !== '전체' && coursePeriod(course) !== filters.period) return false;
  if (filters.transport && filters.transport !== '전체' && course.transport !== filters.transport) return false;
  if ((filters.infant || filters.pet) && (stops.length !== course.stopIds.length || stops.filter(p => companionsMatch(p, filters)).length <= course.stopIds.length / 2)) return false;
  return true;
}
export function needsCourseForPlace(filters) {
  return (filters.period && filters.period !== '전체') || (filters.transport && filters.transport !== '전체');
}

export const travelFilterTitles = { region: '지역 선택', period: '여행 기간', traveler: '동반 여행자', transport: '이동수단', all: '검색 필터' };
const filterKeys = { region: ['region', 'city'], period: ['period'], traveler: ['infant', 'pet'], transport: ['transport'], all: ['region', 'city', 'period', 'infant', 'pet', 'transport'] };
export function applyFilterSection(current, draft, section) {
  const next = { ...current };
  for (const key of filterKeys[section] || []) next[key] = draft[key];
  return next;
}
export function resetFilterSection(draft, defaults, section) {
  return applyFilterSection(draft, defaults, section);
}
