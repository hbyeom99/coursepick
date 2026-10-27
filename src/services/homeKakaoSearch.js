import { validateSearchQuery } from '../lib/searchQueryValidation.js';
const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
export async function homeKakaoSearch(rule,signal){
 if(!rule.allowed||rule.empty||!validateSearchQuery(rule.query).valid||rule.requests.some(r=>!validateSearchQuery(r.query).valid))return {places:[],failures:0};
 const responses=await Promise.allSettled(rule.requests.slice(0,3).map(async lookup=>{
  const page=1,response=await fetch(base+'/api/kakao/places/search',{method:'POST',cache:'no-store',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({...lookup,page})});
  const data=await response.json();if(!response.ok){const error=Error();error.retryAfterSeconds=response.status===429?Number(data.detail?.retryAfterSeconds)||60:0;throw error;}
  return (data.places||[]).slice(0,15).map(place=>({...place,lookup:{...lookup,page}}));
 }));
 if(signal?.aborted)throw new DOMException('Aborted','AbortError');
 return {places:[...new Map(responses.flatMap(v=>v.status==='fulfilled'?v.value:[]).map(p=>[p.id,p])).values()].slice(0,45),failures:responses.filter(v=>v.status==='rejected').length,retryAfterSeconds:Math.max(0,...responses.filter(v=>v.status==='rejected').map(v=>v.reason?.retryAfterSeconds||0))};
}
