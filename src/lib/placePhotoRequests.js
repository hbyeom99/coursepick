const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
const cache=new Map(),pending=new Map();
export function hasPlacePhoto(src){
 return typeof src==='string'&&Boolean(src.trim())&&!/^(?:data:image\/svg\+xml)|(?:course-image-placeholder|place-placeholder|no-image)\.(?:svg|png)(?:[?#]|$)/i.test(src);
}
export function kakaoPhotoId(url){return typeof url==='string'?/^https:\/\/place\.map\.kakao\.com\/(\d{1,20})(?:[?#].*)?$/.exec(url)?.[1]||null:null;}
export function requestPlacePhoto(id){
 const old=cache.get(id);
 if(old?.expires>Date.now())return Promise.resolve(old.value);
 if(pending.has(id))return pending.get(id);
 const request=fetch(`${base}/api/kakao/places/${id}/photo`,{cache:'no-store',signal:AbortSignal.timeout(12000)})
  .then(async response=>{if(!response.ok)throw Error();return response.json();})
  .catch(()=>({imageUrl:null,retryAfterSeconds:60}))
  .then(value=>{
   const seconds=Math.min(3600,Math.max(1,Number(value.retryAfterSeconds)||60));
   cache.delete(id);cache.set(id,{value,expires:Date.now()+seconds*1000});
   while(cache.size>512)cache.delete(cache.keys().next().value);
   return value;
  }).finally(()=>pending.delete(id));
 pending.set(id,request);return request;
}
