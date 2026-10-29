import {validateSearchQuery} from './searchQueryValidation.js';
const cache=new Map();
const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
export async function generateAICourses(courses,payload,signal,token){
 const validation=validateSearchQuery(payload.filters.query);if(!validation.valid)throw Error(validation.message);
 if(!courses.length)return [];
 let sessionId=sessionStorage.getItem('coursepick.aiCourseSession.v1');if(!sessionId){sessionId=crypto.randomUUID();sessionStorage.setItem('coursepick.aiCourseSession.v1',sessionId);}
 const index=new Map(payload.catalog.map(p=>[p.id,p])),live=new Map((payload.live||[]).map(p=>[p.id,p]));
 const candidates=courses.slice(0,10).map((c,i)=>({id:String(i),places:[...(c.stopIds||[]).map(id=>({id:'n:'+id,name:index.get(id)?.name||id,tags:index.get(id)?.tags||[],day:c.stopDays?.[id]||1,latitude:index.get(id)?.latitude,longitude:index.get(id)?.longitude})),...(c.kakaoPlaceRefs||[]).map(r=>({id:'k:'+r.placeId,name:live.get(r.placeId)?.name||r.query||'검색된 장소',day:r.day||1,tags:live.get(r.placeId)?.tags||[]}))]}));
 const cacheKey=JSON.stringify([candidates,payload.filters,payload.interests,payload.taste,token||'guest']),cached=cache.get(cacheKey);if(cached&&Date.now()-cached.time<300000)return cached.courses;
 const response=await fetch(base+'/api/search/generate-courses',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({query:payload.filters.query,sessionId,candidates,interests:payload.interests||[],taste:payload.taste||{},filters:payload.filters}),signal:AbortSignal.any([signal,AbortSignal.timeout(26000)])});
 const data=await response.json();if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:'AI 코스 생성에 실패했어요. 다시 시도해 주세요.');
 if(!Array.isArray(data.courses))throw Error('AI 코스 응답이 올바르지 않습니다.');
 const generated=data.courses.map(row=>{const c=courses[Number(row.candidateId)],allowed=new Set(candidates[Number(row.candidateId)]?.places.map(p=>p.id));if(!c||!row.placeIds?.length||row.placeIds.some(id=>!allowed.has(id)))throw Error('AI 장소 선택을 확인하지 못했어요.');const selected=new Set(row.placeIds),stopIds=c.stopIds.filter(id=>selected.has('n:'+id)),refs=(c.kakaoPlaceRefs||[]).filter(r=>selected.has('k:'+r.placeId));return {...c,id:'gemini-'+c.id+'-'+row.placeIds.join('_'),name:row.title,description:row.description,stopIds,stopDays:Object.fromEntries(stopIds.map(id=>[id,c.stopDays?.[id]||1])),schedule:(c.schedule||[]).filter(s=>stopIds.includes(s.placeId)),kakaoPlaceRefs:refs,itineraryOrder:(c.itineraryOrder||[]).filter(id=>selected.has(id)),imagePlaceId:stopIds.includes(c.imagePlaceId)?c.imagePlaceId:stopIds[0]||null,...(c.searchImageRef&&!refs.some(r=>r.placeId===c.searchImageRef.placeId)?{searchImageRef:undefined}:{}),generationMethod:'gemini-grounded-course',aiModel:data.model};});
 if(cache.size>=20)cache.delete(cache.keys().next().value);cache.set(cacheKey,{time:Date.now(),courses:generated});return generated;
}
