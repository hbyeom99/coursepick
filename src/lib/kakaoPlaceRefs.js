export const KAKAO_REF_LIMIT=20;
export const KAKAO_CATEGORIES=['전체','맛집','카페','관광','체험','숙소'];
export const validKakaoRefs=value=>value===undefined||(Array.isArray(value)&&value.length<=KAKAO_REF_LIMIT&&new Set(value.map(v=>v?.placeId)).size===value.length&&value.every(v=>v&&Object.keys(v).length===5&&Object.keys(v).every(k=>['placeId','day','query','category','page'].includes(k))&&typeof v.placeId==='string'&&/^[0-9]{1,40}$/.test(v.placeId)&&Number.isInteger(v.day)&&v.day>=1&&v.day<=31&&typeof v.query==='string'&&v.query.trim().length>0&&v.query.length<=80&&KAKAO_CATEGORIES.includes(v.category)&&Number.isInteger(v.page)&&v.page>=1&&v.page<=45));
// Persist identity and the user's lookup conditions, never the API result body.
export function addKakaoRef(refs,place,day){const ref={placeId:place.id,day,query:place.lookup?.query,category:place.lookup?.category,page:place.lookup?.page};if(refs.length>=KAKAO_REF_LIMIT||refs.some(v=>v.placeId===ref.placeId)||!validKakaoRefs([ref]))return refs;return [...refs,ref];}
export const hasExternalPlaces=c=>Boolean(c?.googlePlaceRefs?.length||c?.kakaoPlaceRefs?.length);
