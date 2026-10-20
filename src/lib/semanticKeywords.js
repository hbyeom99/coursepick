import dictionary from '../data/searchKeywordDictionary.json' with {type:'json'};
export const compactKeyword=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/^#+/,'').replace(/\s+/g,'').trim();
const groups=dictionary.synonyms;
const byWord=new Map(groups.flatMap(group=>group.map(word=>[compactKeyword(word),group])));
export function keywordAlternatives(term){return byWord.get(compactKeyword(term))||[String(term||'').trim()];}
export function equivalentKeyword(a,b){return keywordAlternatives(a).some(word=>compactKeyword(word)===compactKeyword(b));}
const phrases=[...new Set([...groups.flat(),...dictionary.placeTerms,...dictionary.regions])].sort((a,b)=>compactKeyword(b).length-compactKeyword(a).length);
const conditionCache=new Map();
export function keywordConditions(query){
 const cacheKey=compactKeyword(query);if(conditionCache.has(cacheKey))return conditionCache.get(cacheKey);
 let remaining=compactKeyword(query);if(!remaining)return [];
 const found=[];
 for(const phrase of phrases){const key=compactKeyword(phrase);if(key.length<2||!remaining.includes(key))continue;
  found.push(...(dictionary.compounds?.[phrase]||[phrase]));remaining=remaining.split(key).join('\u0000');
 }
 // Neutral request words are removed only after at least one recognised condition.
 if(found.length)remaining=remaining.replace(/여행지추천|여행코스추천|여행|추천|가볼만한곳|코스/g,'');
 const unknown=remaining.split('\u0000').map(s=>s.trim()).filter(Boolean);
 const result=[...new Map([...found,...unknown].map(term=>[compactKeyword(keywordAlternatives(term)[0]),term])).values()];if(conditionCache.size>128)conditionCache.clear();conditionCache.set(cacheKey,result);return result;
}
const sensitive=/무료|주차|예약|동반|유모차|휠체어|무장애|수유실|기저귀|엘리베이터|계단|24시간|비건|채식|웨이팅|혼잡/;
export function placeKeywordCondition(place,term){
 const tags=place.tags||[],q=compactKeyword(term);
 if(sensitive.test(q))return tags.some(tag=>equivalentKeyword(tag,term));
 const fields=[place.name,place.category,place.region,place.location,...tags].filter(Boolean).map(compactKeyword);
 return keywordAlternatives(term).some(word=>{const key=compactKeyword(word);return fields.some(value=>value.includes(key));});
}
export function placeMatchesKeywords(place,query){return keywordConditions(query).every(term=>placeKeywordCondition(place,term));}
export function semanticTagRelevance(tag,query){
 const conditions=keywordConditions(query),t=compactKeyword(tag);
 if(conditions.some(term=>t===compactKeyword(term)))return 1100;
 if(conditions.some(term=>equivalentKeyword(tag,term)))return 1100;
 if(dictionary.related.some(group=>group.some(word=>conditions.some(term=>equivalentKeyword(word,term)))&&group.some(word=>equivalentKeyword(word,tag))))return 350;
 return 0;
}



// Shared eligibility/ranking vocabulary. Related words never establish eligibility.
export const isStrictKeyword=term=>sensitive.test(compactKeyword(term));
export function keywordTextMatches(value,term){
 const text=compactKeyword(value);return keywordAlternatives(term).some(word=>{const key=compactKeyword(word);return key&&text.includes(key);});
}
export function relatedKeywordBonus(places,conditions){
 const matched=new Set();
 for(const group of dictionary.related){
  if(!group.some(word=>conditions.some(term=>equivalentKeyword(word,term))))continue;
  for(const word of group){
   if(conditions.some(term=>equivalentKeyword(word,term)))continue;
   if(places.some(place=>(place.tags||[]).some(tag=>equivalentKeyword(tag,word))))matched.add(compactKeyword(keywordAlternatives(word)[0]));
  }
 }
 return Math.min(matched.size,3);
}
export function placeConditionScore(place,term){
 if(!placeKeywordCondition(place,term))return 0;
 if(isStrictKeyword(term))return 8;
 if(keywordAlternatives(term).some(word=>compactKeyword(place.name)===compactKeyword(word)))return 12;
 if(keywordTextMatches(place.name,term))return 10;
 if((place.tags||[]).some(tag=>equivalentKeyword(tag,term)))return 8;
 if((place.tags||[]).some(tag=>keywordTextMatches(tag,term)))return 7;
 if(keywordTextMatches(place.category,term))return 4;
 return 2;
}
