import {keywordTextMatches,isStrictKeyword,relatedKeywordBonus} from './semanticKeywords.js';
import { accessibilityKeywordMatch } from './accessibility.js';
import { parseSearchIntent, placesSatisfyIntent, placeMatchesGroup } from './searchIntent.js';
import { normalizeTag } from './exploreTags.js';

// A fixed relevance tier prevents repeated words/tags from inflating the rank.
function singleSearchMatch(course, places, keyword) {
  if (!keyword) return { matched: true, rank: 0, label: '' };
  if(accessibilityKeywordMatch(null,keyword)!==null){
    const matched=places.some(place=>accessibilityKeywordMatch(place,keyword)===true);
    return {matched,rank:matched?1:3,label:matched?'시설 원문에서 확인된 접근성 조건':''};
  }
  if(isStrictKeyword(keyword)){const matched=places.some(p=>placeMatchesGroup(p,[keyword]));return {matched,rank:matched?1:3,label:matched?'확인된 장소 조건':''};}
  const includes = value => typeof value === 'string' && keywordTextMatches(normalizeTag(value),keyword);
  const descriptionIncludes = value => includes(keyword === '자연' ? (value || '').replace(/자연산/g, '') : value);
  const tag = course.tags.find(includes);
  if (tag) return { matched: true, rank: 0, label: `일치하는 코스 태그: #${tag}` };
  if (includes(course.name)) return { matched: true, rank: 0, label: `‘${keyword}’이 코스 제목에 포함되어 있습니다.` };
  const direct = [...new Map(places.filter(p => includes(p.name) || p.tags.some(includes)).map(p => [p.id, p])).values()];
  const described = [...new Map(places.filter(p => descriptionIncludes(p.description)).map(p => [p.id, p])).values()];
  const names = list => `${list[0].name}${list.length > 1 ? ` 외 ${list.length - 1}곳` : ''}`;
  if (direct.length) return { matched: true, rank: 1, label: `${keyword} 관련 장소: ${names(direct)}` };
  if (described.length) return { matched: true, rank: 2, label: `‘${keyword}’이 설명에 포함된 장소: ${names(described)}` };
  if (descriptionIncludes(course.description)) return { matched: true, rank: 2, label: `‘${keyword}’이 코스 설명에 포함되어 있습니다.` };
  if (includes(course.author)) return { matched: true, rank: 2, label: `일치하는 작성자: ${course.author}` };
  if (includes(course.region)) return { matched: true, rank: 2, label: `일치하는 지역: ${course.region}` };
  const located = places.filter(p => includes(p.region) || includes(p.location));
  if (located.length) return { matched: true, rank: 2, label: `‘${keyword}’이 지역·주소에 포함된 장소: ${names(located)}` };
  return { matched: false, rank: 3, label: '' };
}

function matchCourse(course,places,keyword) {
 const intent=parseSearchIntent(keyword);
 if(!keyword)return singleSearchMatch(course,places,keyword);
 if(intent.groups.length>1||intent.regions.length) {
  if(!placesSatisfyIntent(places,intent))return {matched:false,rank:3,label:''};
  const ranks=intent.groups.map(g=>Math.min(...g.map(term=>singleSearchMatch(course,places,term).rank)));
  return {matched:true,rank:ranks.length?Math.max(...ranks):0,label:'조건 일치: '+[...intent.regions,...intent.conditions].join(' + ')};
 }
  const matches=intent.groups[0]?.map(term=>singleSearchMatch(course,places,term))||[];
 return matches.filter(x=>x.matched).sort((a,b)=>a.rank-b.rank)[0]||singleSearchMatch(course,places,keyword);
}


export function courseSearchMatch(course,places,keyword){
 const result=matchCourse(course,places,keyword);
 return {...result,related:result.matched?relatedKeywordBonus(places,parseSearchIntent(keyword).conditions):0};
}
