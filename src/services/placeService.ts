import {keywordConditions,keywordAlternatives} from '../lib/semanticKeywords.js';
import { normalizeAccessibilityInfo, accessibilityTags } from '../lib/accessibility.js';
import accessibilityPreview from '../data/accessibilityPreview.json';
import { readCompanionMetadata } from '../lib/companionMetadata.js';
import { getSupabaseClient } from '../lib/supabase';
import type { Place } from '../types/place';

function toPlace(value: unknown): Place {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('장소 데이터 형식이 올바르지 않습니다.');
  const row = value as Record<string, unknown>;
  function text(field: string): string {
    const value = row[field];
    if (typeof value !== 'string') throw new Error('장소 데이터의 ' + field + ' 값을 확인해 주세요.');
    return value;
  }
  function number(field: string, min: number, max: number): number {
    const value = row[field];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error('장소 데이터의 ' + field + ' 값을 확인해 주세요.');
    return value;
  }
  const tags = row.tags;
  if (!Array.isArray(tags) || !tags.every((tag: unknown) => typeof tag === 'string')) throw new Error('장소 tags는 문자열 배열이어야 합니다.');
  const id = text('id');
  if (!id.trim()) throw new Error('장소 id가 비어 있습니다.');
  let lodgingInfo: Place['lodgingInfo'];
  if (row.lodging_info && typeof row.lodging_info === 'object' && !Array.isArray(row.lodging_info)) {
    const info = row.lodging_info as Record<string, unknown>;
    const safeText = (key: string): string => typeof info[key] === 'string' ? info[key] as string : '';
    lodgingInfo = { checkIn: safeText('checkIn'), checkOut: safeText('checkOut'), contact: safeText('contact'), source: safeText('source'), imageLicense: safeText('imageLicense'), businessType: safeText('businessType'), sourceUpdatedAt: safeText('sourceUpdatedAt') };
  }
  const companion = readCompanionMetadata(row.description, row.companion_info);
  let companionInfo: Place['companionInfo'];
  if (companion.info && typeof companion.info === 'object' && !Array.isArray(companion.info)) {
    const info = companion.info as Record<string, unknown>;
    const infantFacilities = info.infantFacilities && typeof info.infantFacilities === 'object' && !Array.isArray(info.infantFacilities) ? Object.fromEntries(Object.entries(info.infantFacilities).filter(([,value])=>typeof value==='string')) as Record<string,string> : undefined;
    companionInfo = { infantFacilities, infantAllowed: typeof info.infantAllowed === 'boolean' ? info.infantAllowed : undefined, petAllowed: typeof info.petAllowed === 'boolean' ? info.petAllowed : undefined, ...Object.fromEntries(['infantStatus','infantSource','infantSourceUpdatedAt','petStatus','petDedicated','petSize','petRestrictions','petExtraFee','source','sourceUpdatedAt'].filter(key=>typeof info[key]==='string').map(key=>[key,info[key]])) };
  }
  const preview = import.meta.env.DEV ? (accessibilityPreview as Record<string,unknown>)[id] : undefined;
  const accessibilityInfo = normalizeAccessibilityInfo(row.accessibility_info ?? preview);
  const rawFacts=row.trait_facts&&typeof row.trait_facts==='object'&&!Array.isArray(row.trait_facts)?row.trait_facts as Record<string,unknown>:{};
  const traitFacts:Place['traitFacts']={};
  if(typeof rawFacts.activityIntensity==='number'&&Number.isFinite(rawFacts.activityIntensity)&&rawFacts.activityIntensity>=0&&rawFacts.activityIntensity<=1)traitFacts.activityIntensity=rawFacts.activityIntensity;
  if(typeof rawFacts.costPerPerson==='number'&&Number.isFinite(rawFacts.costPerPerson)&&rawFacts.costPerPerson>=0)traitFacts.costPerPerson=rawFacts.costPerPerson;
  if(typeof rawFacts.reservationRequired==='boolean')traitFacts.reservationRequired=rawFacts.reservationRequired;
  if(typeof rawFacts.participatory==='boolean')traitFacts.participatory=rawFacts.participatory;
  if(typeof rawFacts.source==='string')traitFacts.source=rawFacts.source;
  const combinedTags = [...new Set([...(tags as string[]), ...accessibilityTags(accessibilityInfo)])];
  const photoId = (row.lodging_info as Record<string,unknown> | null)?.kakaoPhotoPlaceId;
  const kakaoPhotoPlaceId = typeof photoId === 'string' && /^\d{1,20}$/.test(photoId) ? photoId : undefined;
  return { id, name: text('name'), category: text('category'), region: text('region'), location: text('location'), description: companion.description, tags: combinedTags, imageUrl: text('image_url'), latitude: number('latitude', -90, 90), longitude: number('longitude', -180, 180), openingHours: text('opening_hours'), rating: number('rating', 0, 5), lodgingInfo, companionInfo, accessibilityInfo,traitFacts,kakaoPhotoPlaceId };
}

export async function getPlaces(signal?: AbortSignal): Promise<Place[]> {
  // Keep each response below the hosting provider's payload limit.
  const base = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/+$/, '');
  try {
    const pageSize = 500;
    const places: Place[] = [];
    let offset = 0;
    while (true) {
      const pages = await Promise.all([0, 1, 2].map(async index => {
        const response = await fetch(`${base}/api/places?offset=${offset + index * pageSize}&limit=${pageSize}`, {signal});
        if (!response.ok) throw new Error('장소 조회 실패');
        const data: unknown = await response.json();
        if (!Array.isArray(data) || data.length > pageSize) throw new Error('장소 페이지 형식 오류');
        return data.map(toPlace);
      }));
      places.push(...pages.flat());
      if (pages.some(page => page.length < pageSize)) break;
      offset += pageSize * pages.length;
    }
    if (new Set(places.map(place => place.id)).size !== places.length) throw new Error('중복된 장소 id가 있습니다.');
    return places;
  } catch(error) {
    if(signal?.aborted) throw error;
  }
  const places: Place[] = [];
  const pageSize = 1000;
  const client = getSupabaseClient();
  while (true) {
    let request = client.from('places').select('*').not('id', 'like', 'lodgingcsv_%').order('id').range(places.length, places.length + pageSize - 1);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw new Error('장소 조회에 실패했습니다. ' + error.message);
    if (!Array.isArray(data)) throw new Error('장소 목록 형식이 올바르지 않습니다.');
    places.push(...data.map((row: unknown) => toPlace(row)));
    if (data.length < pageSize) break;
  }
  if (new Set(places.map(place => place.id)).size !== places.length) throw new Error('중복된 장소 id가 있습니다.');
  return places;
}

export async function getRecommendations(
  filters: { region?: string; category?: string; theme?: string },
  signal?: AbortSignal,
): Promise<Place[]> {
  const params = new URLSearchParams();
  for (const [key, value] of [['region', filters.region], ['category', filters.category], ['tag', filters.theme]]) {
    if (value?.trim() && value.trim() !== '전체') params.set(key as string, value.trim());
  }
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/+$/, '');
  const response = await fetch(`${apiBaseUrl}/api/recommendations${params.size ? '?' + params.toString() : ''}`, { signal });
  if (!response.ok) throw new Error('추천 장소를 불러오지 못했습니다.');
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error('추천 장소 목록 형식이 올바르지 않습니다.');
  const places = data.map((row: unknown) => toPlace(row));
  if (new Set(places.map(place => place.id)).size !== places.length) throw new Error('중복된 장소 id가 있습니다.');
  return places;
}

// Imported lodging is fetched on demand rather than included in the full place catalogue.
export async function getLodgingPage(options: {region?: string; query?: string; page: number; first?: Place; last?: Place}, signal?: AbortSignal): Promise<{places: Place[]; more: boolean}> {
  const size = 40;
  let request = getSupabaseClient().from('places').select('*').eq('category', '숙소');
  const aliases: Record<string, string> = {'서울':'서울', '부산':'부산', '대구':'대구', '인천':'인천', '광주광역시':'광주', '대전':'대전', '울산':'울산', '세종':'세종', '경기':'경기', '강원':'강원', '충북':'충북', '충남':'충남', '전북':'전북', '전남':'전남', '경북':'경북', '경남':'경남', '제주':'제주'};
  if (options.region && options.region !== '전체' && options.region !== '여러 지역') {
    if (aliases[options.region]) request = request.eq('region', options.region);
    else request = request.ilike('location', `%${options.region.replace(/[%,_]/g, '')}시%`);
  }
  const anchors = [options.first, options.last].filter((p): p is Place => !!p);
  if (anchors.length) {
    const latLow = Math.max(...anchors.map(p => p.latitude - 15 / 111));
    const latHigh = Math.min(...anchors.map(p => p.latitude + 15 / 111));
    const lonLow = Math.max(...anchors.map(p => p.longitude - 15 / (111 * Math.cos(p.latitude * Math.PI / 180))));
    const lonHigh = Math.min(...anchors.map(p => p.longitude + 15 / (111 * Math.cos(p.latitude * Math.PI / 180))));
    if (latLow > latHigh || lonLow > lonHigh) return {places: [], more: false};
    request = request.gte('latitude', latLow).lte('latitude', latHigh).gte('longitude', lonLow).lte('longitude', lonHigh);
  }
  const query = options.query?.trim().replace(/[%,_]/g, '');
  if (query) {
    for (const term of keywordConditions(query)) {
      const alternatives = keywordAlternatives(term).map((word: string) => word.replace(/[^가-힣a-zA-Z0-9\s]/g, '').trim()).filter(Boolean);
      const sensitive = /무료|주차|예약|동반|유모차|휠체어|무장애|수유실|기저귀|엘리베이터|계단|24시간/.test(term);
      const clauses = alternatives.flatMap((word: string) => sensitive
        ? [`tags.cs.{"${word}"}`]
        : [`name.ilike.%${word}%`, `location.ilike.%${word}%`, `category.ilike.%${word}%`, `tags.cs.{"${word}"}`]);
      if (clauses.length) request = request.or(clauses.join(','));
    }
  }
  request = request.order('name').order('id').range(options.page * size, (options.page + 1) * size - 1);
  if (signal) request = request.abortSignal(signal);
  const {data, error} = await request;
  if (error) throw new Error('숙소 목록을 불러오지 못했습니다.');
  return {places: (data || []).map(toPlace), more: (data || []).length === size};
}
export async function getPlacesByIds(ids: string[], signal?: AbortSignal): Promise<Place[]> {
  if (!ids.length) return [];
  let request = getSupabaseClient().from('places').select('*').in('id', [...new Set(ids)]);
  if (signal) request = request.abortSignal(signal);
  const {data,error} = await request;
  if (error) throw new Error('연결된 숙소 정보를 불러오지 못했습니다.');
  return (data || []).map(toPlace);
}
