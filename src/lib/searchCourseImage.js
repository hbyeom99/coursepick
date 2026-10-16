import { normalizeTag, scoreTags } from './exploreTags.js';
import { searchCandidates } from './searchKeyboard.js';
const synonymGroups = [['빵집','빵','베이커리','브레드'],['카페','커피','카페거리'],['와인','와인바'],['맥주','수제맥주','브루어리','브루잉','양조장','펍','비어','beer','brewery'],['전통주','양조장','막걸리','주캉스'],['사진','포토','포토존'],['캠핑','야영','글램핑']];
const clean = value => normalizeTag(String(value || '')).toLowerCase();
export function courseImageCandidates(course, catalog, query) {
 const fallback=course.imagePlaceId || course.stopIds?.[0];
 const keywords=searchCandidates(query || '').filter(Boolean);

 const terms=[...new Set(keywords.flatMap(word=>[word,...(synonymGroups.find(group=>group.includes(word))||[])]))];
 const groups=new Set(scoreTags(terms));
 const matches=value=>terms.some(term=>clean(value).includes(term));
 const usable=place=>typeof place.imageUrl==='string' && (/^https?:\/\//.test(place.imageUrl)||/^\/(?!\/)/.test(place.imageUrl)||/^data:image\/(png|jpe?g|webp|gif);/i.test(place.imageUrl));
 const byId=new Map(catalog.map(p=>[p.id,p]));
 const candidates=(course.stopIds || []).map((id,index)=>{const p=byId.get(id);if(!p||!usable(p))return null;
  // Direct keyword evidence outranks synonyms and broad theme groups.
  const direct=value=>keywords.some(term=>clean(value).includes(clean(term)));
  const exactName=keywords.some(term=>clean(p.name)===clean(term));
  const exactTag=(p.tags||[]).some(tag=>keywords.some(term=>clean(tag)===clean(term)));
  const score=exactName?1000:direct(p.name)?900:exactTag?800:(p.tags||[]).some(direct)?700:direct(p.category)?600:matches(p.name)?500:(p.tags||[]).some(matches)?400:matches(p.category)?300:direct(p.description)?200:matches(p.description)?100:scoreTags(p.tags||[]).some(t=>groups.has(t))?10:0;
  return {id,score,rank:score>0?0:3,index};
 }).filter(Boolean).sort((a,b)=>b.score-a.score||Number(b.id===fallback)-Number(a.id===fallback)||a.index-b.index);
 const ranked = candidates.filter(p=>p.rank<3);
 const remaining = candidates.filter(p=>p.rank===3).sort((a,b)=>Number(b.id===fallback)-Number(a.id===fallback)||a.index-b.index);
 const ids = [...ranked,...remaining].map(p=>p.id);
 if (!keywords.length && course.id === 'ai-theme-beer-6e4bc520c2caf5' && byId.get(fallback)?.imageUrl) return [fallback, ...ids.filter(id=>id!==fallback)];
 return ids;
}

export function searchCourseImageId(course,catalog,query) {
 return courseImageCandidates(course,catalog,query)[0] || course.imagePlaceId || course.stopIds?.[0];
}
export function courseListImages(courses,catalog,query='') {
 const byId=new Map(catalog.map(p=>[p.id,p])); const used=new Set(); const selected=new Map();
 const imageKey=url=>String(url||'').replace(/^http:/i,'https:').split('#')[0];
 for(const course of courses) {
  const candidates=courseImageCandidates(course,catalog,query);
  const savedCover=!query.trim() && course.id?.startsWith('custom-') && candidates.includes(course.imagePlaceId) ? course.imagePlaceId : null;
  const id=savedCover || (query.trim() ? candidates[0] : candidates.find(id=>!used.has(imageKey(byId.get(id)?.imageUrl)))) || candidates[0] || course.imagePlaceId || course.stopIds?.[0];
  selected.set(course.id,id);
  const url=byId.get(id)?.imageUrl;if(url)used.add(imageKey(url));
 }
 return selected;
}

export function shuffledCoursePhotos(course,catalog,random=Math.random) {
 const allowed=new Set(course.stopIds||[]);
 const ids=catalog.filter(p=>allowed.has(p.id)&&typeof p.imageUrl==='string'&&(/^https?:\/\//i.test(p.imageUrl)||/^\/(?!\/)/.test(p.imageUrl)||/^data:image\/(png|jpe?g|webp|gif);/i.test(p.imageUrl))).map(p=>p.id);
 for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
 return ids;
}
