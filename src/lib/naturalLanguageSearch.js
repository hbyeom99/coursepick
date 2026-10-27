import { validateSearchQuery } from './searchQueryValidation.js';
import {citiesFor,travelRegions} from './travelFilters.js';
import {searchTagCandidates} from './homeSearchIntent.js';

const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
const SESSION_KEY='coursepick.naturalSearchSession.v1';
const parsedCache=new Map();

function makeId(){
 if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
 return [...crypto.getRandomValues(new Uint8Array(18))].map(value=>value.toString(16).padStart(2,'0')).join('');
}

function sessionId(){
 try{
  let value=sessionStorage.getItem(SESSION_KEY)||'';
  if(!/^[A-Za-z0-9_-]{20,64}$/.test(value)){value=makeId();sessionStorage.setItem(SESSION_KEY,value);}
  return value;
 }catch{return makeId();}
}

export async function interpretNaturalSearch(query,{filters,catalog,token,signal,candidateTags:providedCandidateTags}={}){
 const text=String(query||'').trim();
 const validation=validateSearchQuery(text);if(!validation.valid)throw Error(validation.message);
 const cities=[...new Set(travelRegions.flatMap(region=>citiesFor(catalog||[],region)))];
 const normalized=text.normalize('NFKC').replace(/\s+/g,'');
 const candidateTags=[...new Set((providedCandidateTags||searchTagCandidates(text)).filter(tag=>typeof tag==='string'))].slice(0,160);
 const cityOptions=cities.filter(city=>{
  const core=city.replace(/(?:시|군|구)$/,'');
  return core.length>=2&&normalized.includes(core);
 });
 if(filters?.city&&filters.city!=='전체'&&!cityOptions.includes(filters.city))cityOptions.push(filters.city);
 cityOptions.splice(30);
 const cacheKey=JSON.stringify([normalized,filters?.region||'전체',filters?.city||'전체',filters?.period||'전체',filters?.transport||'전체',Boolean(filters?.infant),Boolean(filters?.pet),cityOptions,candidateTags]);
 const cached=parsedCache.get(cacheKey);
 if(cached&&Date.now()-cached.time<10*60*1000)return {...cached.value};
 if(cached)parsedCache.delete(cacheKey);
 const timeout=AbortSignal.timeout(7000),requestSignal=signal?AbortSignal.any([signal,timeout]):timeout;
 const response=await fetch(base+'/api/search/interpret',{method:'POST',cache:'no-store',signal:requestSignal,headers:{'Content-Type':'application/json','X-Search-Session':sessionId(),'X-City-Options':cityOptions.join(','),...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({query:text,candidate_tags:candidateTags,region:filters?.region||'전체',city:filters?.city||'전체',period:filters?.period||'전체',transport:filters?.transport||'전체',infant:Boolean(filters?.infant),pet:Boolean(filters?.pet)})});
 let data={};try{data=await response.json();}catch{}
 if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:'검색어를 해석하지 못했습니다. 다시 입력해 주세요.');
 if(data.status!=='ok'||typeof data.query!=='string')throw Error('검색 의도를 확인하기 어려워요. 지역과 여행 주제를 조금 더 구체적으로 입력해 주세요.');
 if(data.tags!==undefined&&(!Array.isArray(data.tags)||data.tags.some(tag=>typeof tag!=='string'||!candidateTags.includes(tag))))throw Error('검색 태그 해석 결과를 확인할 수 없습니다. 다시 시도해 주세요.');
 if(data.region!=='전체'&&!travelRegions.includes(data.region))throw Error('해석한 지역을 검색 필터로 적용할 수 없습니다.');
 if(data.city!=='전체'&&!cityOptions.includes(data.city))throw Error('입력에 없는 세부 지역은 적용할 수 없습니다.');
 parsedCache.set(cacheKey,{time:Date.now(),value:data});
 while(parsedCache.size>100)parsedCache.delete(parsedCache.keys().next().value);
 return {...data,tags:[...new Set((data.tags||[]).filter(tag=>candidateTags.includes(tag)))]};
}
