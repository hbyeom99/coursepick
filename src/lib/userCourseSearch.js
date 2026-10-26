import relations from '../data/approvedSearchRelations.json' with {type:'json'};
// Explicit one-way child tags; no place-field or recursive semantic expansion.
export const literalCourseKey=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/^#+/,'').replace(/\s+/g,'');
export const courseSearchChildTags=relations.children;
const equivalent=key=>relations.aliases.find(group=>group.some(word=>literalCourseKey(word)===key))?.map(literalCourseKey)||[key];
export function userCourseSearchMatch(course,query,relatedQueries=[]){
 const key=literalCourseKey(query);
 if(!key)return {matched:true,rank:0,related:0};
 const tags=[...(course.tags||[]),...(course.representativeTags||[])].map(literalCourseKey);
 if(tags.some(tag=>equivalent(key).includes(tag)))return {matched:true,rank:0,related:0};
 const children=(courseSearchChildTags[key]||[]).flatMap(word=>equivalent(literalCourseKey(word)));
 if(tags.some(tag=>children.includes(tag)))return {matched:true,rank:1,related:0};
 if(literalCourseKey(course.name).includes(key))return {matched:true,rank:2,related:0};
 for(const related of relatedQueries){const mapped=literalCourseKey(related);if(!mapped||mapped===key)continue;const match=userCourseSearchMatch(course,mapped);if(match.matched)return {...match,rank:Math.max(1,match.rank+1),related:1};}
 return {matched:false,rank:3,related:0};
}

// Display only tags the course actually owns; approved child tags remain one-way.
export function courseSearchCardTags(course,query,relatedQueries=[]){
 const tags=[...new Map([...(course.representativeTags||[]),...(course.tags||[])].filter(t=>typeof t==='string').map(t=>[literalCourseKey(t),t])).values()];
 return tags.map((tag,index)=>({tag,index,match:userCourseSearchMatch({tags:[tag]},query,relatedQueries)}))
  .sort((a,b)=>(a.match.matched?a.match.rank:3)-(b.match.matched?b.match.rank:3)||a.index-b.index).slice(0,3).map(v=>v.tag);
}

// A named/declared theme or a strict majority of known activity stops indicates focus.
// Meal, cafe and lodging stops do not dilute the purpose of a travel activity course.
export function courseSearchFocus(course,query,places=[],relatedQueries=[]){
 const key=literalCourseKey(query);if(!key)return 'included';
 if(literalCourseKey(course.name).includes(key))return 'central';
 const declared=(course.representativeTags||[]).some(tag=>userCourseSearchMatch({tags:[tag]},query,relatedQueries).matched);
 if(declared)return 'central';
 const activity=places.filter(p=>!['음식점','카페','숙소','숙박'].includes(p.category));
 const matching=activity.filter(p=>userCourseSearchMatch({name:p.name,tags:p.tags||[]},query,relatedQueries).matched);
 const total=activity.length+(course.googlePlaceRefs?.length||0)+(course.kakaoPlaceRefs?.length||0)+(course.editorialVisits?.filter(v=>!v.place_id).length||0);
 return matching.length>total/2?'central':'included';
}
