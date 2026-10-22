import relations from '../data/approvedSearchRelations.json' with {type:'json'};
// Explicit one-way child tags; no place-field or recursive semantic expansion.
export const literalCourseKey=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/^#+/,'').replace(/\s+/g,'');
export const courseSearchChildTags=relations.children;
const equivalent=key=>relations.aliases.find(group=>group.some(word=>literalCourseKey(word)===key))?.map(literalCourseKey)||[key];
export function userCourseSearchMatch(course,query){
 const key=literalCourseKey(query);
 if(!key)return {matched:true,rank:0,related:0};
 const tags=[...(course.tags||[]),...(course.representativeTags||[])].map(literalCourseKey);
 if(tags.some(tag=>equivalent(key).includes(tag)))return {matched:true,rank:0,related:0};
 const children=(courseSearchChildTags[key]||[]).flatMap(word=>equivalent(literalCourseKey(word)));
 if(tags.some(tag=>children.includes(tag)))return {matched:true,rank:1,related:0};
 if(literalCourseKey(course.name).includes(key))return {matched:true,rank:2,related:0};
 return {matched:false,rank:3,related:0};
}
