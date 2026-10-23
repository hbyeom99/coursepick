import {validKakaoRefs} from '../lib/kakaoPlaceRefs.js';
interface Visit { day?: number; placeId: string; label: string; time: string; minutes: number; duration: string }
export interface CommunityCourse {
  id: string; name: string; authorId: string; author: string; region: string;
  stopIds: string[]; tags: string[]; imagePlaceId: string | null;
  kakaoPlaceRefs?: {placeId:string;day:number;query:string;category:string;page:number}[]; itineraryOrder?:string[]; stopDetails?:Record<string,{time:string;minutes:number}>; transport: string;
  schedule: Visit[]; description: string; hours: number; isSample: boolean;
  isDemo: boolean; source: string; maxPeople: number; theme: string;
  durationDays?: number;
}
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('코스 데이터 형식 오류');
  return value as Record<string, unknown>;
};
const text = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) throw new Error('코스 문자열 형식 오류');
  return value;
};
const strings = (value: unknown): string[] => {
  if (!Array.isArray(value)) throw new Error('코스 배열 형식 오류');
  return value.map(text);
};
export async function getCommunityCourses(signal?: AbortSignal): Promise<{source: string; courses: CommunityCourse[]}> {
  const base = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/+$/, '');
  const response = await fetch(`${base}/api/courses`, {signal});
  if (!response.ok) throw new Error('다른 여행자의 코스를 불러오지 못했습니다.');
  const data = object(await response.json());
  if (!Array.isArray(data.profiles) || !Array.isArray(data.courses)) throw new Error('코스 목록 형식 오류');
  const authors = new Map(data.profiles.map((value: unknown) => {const profile = object(value); return [text(profile.id), text(profile.nickname)] as const;}));
  const courses = data.courses.map((value: unknown): CommunityCourse => {
    const row = object(value), authorId = text(row.author_id), author = authors.get(authorId);
    const stopIds = strings(row.place_ids), tags = strings(row.tags);
    if (!author || new Set(stopIds).size !== stopIds.length || !Array.isArray(row.schedule) || row.schedule.length < 2 || row.schedule.length > 7 || row.is_demo !== true) throw new Error('작성자·일정 형식 오류');
    const kakaoPlaceRefs: NonNullable<CommunityCourse['kakaoPlaceRefs']> = [];
    const itineraryOrder:string[]=[];
    const stopDetails:NonNullable<CommunityCourse['stopDetails']>={};
    let nativeIndex=0;
    const allSchedule = row.schedule.map((value: unknown, index: number): Visit => {
      const item = object(value), external = item.kakao_ref ? object(item.kakao_ref) : null;
      const placeId = external ? text(external.placeId) : text(item.place_id), time = text(item.start_time);
      if ((!external && placeId !== stopIds[nativeIndex++]) || !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time) || typeof item.duration_minutes !== 'number' || !Number.isInteger(item.duration_minutes) || item.duration_minutes <= 0) throw new Error('방문 일정 형식 오류');
      const day = item.day === undefined ? 1 : item.day;
      if (typeof day !== 'number' || !Number.isInteger(day) || day < 1 || day > 3) throw new Error('방문 일차 오류');
      if(external){const ref={placeId,day,query:text(external.query),category:text(external.category),page:Number(external.page)};if(external.day!==day||!validKakaoRefs([ref]))throw new Error('카카오 참조 오류');kakaoPlaceRefs.push(ref);}
      const key=(external?'k:':'n:')+placeId;itineraryOrder.push(key);stopDetails[key]={time,minutes:item.duration_minutes as number};
      return {placeId, day, label: `${day > 1 || (row.schedule as unknown[]).some(v => (v as Record<string,unknown>).day !== undefined) ? day+'일차 · ' : ''}${text(item.label)}`, time, minutes:item.duration_minutes, duration:`${item.duration_minutes}분`};
    });
    if(nativeIndex!==stopIds.length||!validKakaoRefs(kakaoPlaceRefs))throw new Error('방문 순서 오류');
    const schedule=allSchedule.filter((_,i)=>!(row.schedule as Record<string,unknown>[])[i].kakao_ref);
    if (typeof row.hours !== 'number' || !Number.isFinite(row.hours) || row.hours <= 0) throw new Error('코스 시간 형식 오류');
    const imagePlaceId = row.cover_place_id==null?null:text(row.cover_place_id);
    if (imagePlaceId===null?!kakaoPlaceRefs.length:!stopIds.includes(imagePlaceId)) throw new Error('대표 이미지 장소 오류');
    const durationDays = typeof row.duration_days === 'number' && Number.isInteger(row.duration_days) && row.duration_days > 0 ? row.duration_days : Math.max(1,...allSchedule.map(item=>item.day || 1));
    return {id:text(row.id), name:text(row.title), authorId, author: text(row.id).startsWith('ai-theme-') ? 'coursepick' : author, region:text(row.region), stopIds, tags, imagePlaceId, kakaoPlaceRefs, itineraryOrder, stopDetails, transport:text(row.transport), schedule, description:text(row.description), hours:row.hours, durationDays, isSample:true, isDemo:!text(row.id).startsWith('ai-theme-'), source:'community', maxPeople:6, theme:text(row.id).startsWith('ai-theme-') ? 'AI 추천 코스' : `${author}의 여행 기록 · 가상 코스`};
  });
  if (new Set(courses.map(course=>course.id)).size !== courses.length) throw new Error('중복 코스 ID');
  return {source:text(data.source), courses};
}
