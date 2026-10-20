import {equivalentKeyword,semanticTagRelevance} from './semanticKeywords.js';
import dictionary from '../data/travelKeywordDictionary.json' with {type:'json'};
export const normalizeKeyword=value=>String(value||'').normalize('NFKC').trim().replace(/^#+/,'').replace(/\s+/g,' ').toLowerCase();
const compact=value=>normalizeKeyword(value).replace(/\s/g,'');
const aliasMap=new Map(Object.entries(dictionary.aliases).map(([from,to])=>[compact(from),to]));
export function canonicalPlaceTag(value){const clean=String(value||'').normalize('NFKC').trim().replace(/^#+/,'').replace(/\s+/g,' ');return aliasMap.get(compact(clean))||clean;}
const related=[['맥주','수제맥주','양조장','펍','비어','beer'],['카페','커피','디저트','베이커리'],['오션뷰','바다','해변','해안','해수욕장'],['산책','산책로','공원','둘레길','숲길'],['박물관','미술관','전시','관람','역사문화'],['사진','포토','포토존','인생샷'],['휴식','힐링','여유'],['방탈출','체험','실내'],['보드게임','실내','체험']].map(group=>group.map(compact));
function relevance(tag,query){
 const t=compact(tag),q=compact(query),tokens=normalizeKeyword(query).split(/[\s,+&]+/).map(compact);
 if(!t||!q)return 0;
 if(t===q||tokens.includes(t))return 1000;
 if(t.length>1&&q.includes(t))return 900;
 if(q.length>1&&t.includes(q))return 800;
 const alias=compact(canonicalPlaceTag(query));if(t===alias)return 950;
 return related.some(group=>group.some(term=>tokens.includes(term)||(term.length>1&&q.includes(term)))&&group.some(term=>t===term||(term.length>1&&t.includes(term))))?400:0;
}
export function selectPlaceTags(tags,query=''){
 const unique=[];const seen=new Set();
 for(const raw of tags||[]){if(typeof raw!=='string')continue;const tag=canonicalPlaceTag(raw),key=compact(tag);if(!key||seen.has(key))continue;seen.add(key);unique.push(tag);}
 return unique.map((tag,index)=>({tag,index,score:Math.max(relevance(tag,query),semanticTagRelevance(tag,query))})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,3).map(item=>item.tag);
}
export function placeTagMatches(tags,term){const target=compact(canonicalPlaceTag(term));if(!target)return false;return (tags||[]).some(tag=>{const value=compact(canonicalPlaceTag(tag));return equivalentKeyword(tag,term)||value===target||(target.length>1&&value.includes(target));});}
