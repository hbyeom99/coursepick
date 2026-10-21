import {searchKey,interpretHomeSearch,allowedHomeQuery} from './homeSearchIntent.js';
export function searchRequestKey(query,filters={}){return JSON.stringify([searchKey(query),...['region','city','category','transport','period','hours','theme','people','infant','pet','startTime'].map(k=>filters[k]??null)]);}
export function prepareKeywordSearch(value){const rule=interpretHomeSearch(value);return rule.allowed?rule.query:String(value||'').trim();}
export function createSearchSubmissionGate({cooldownMs=5000,now=()=>Date.now()}={}){
 let pending=null,sequence=0;const recent=new Map();
 return {accept(key){const time=now();for(const [k,t] of recent)if(time-t>=cooldownMs)recent.delete(k);if(pending?.key===key)return {accepted:false,reason:'pending'};const last=recent.get(key);if(last!==undefined&&time-last<cooldownMs)return {accepted:false,reason:'cooldown'};const token=++sequence;pending={key,token};recent.set(key,time);while(recent.size>100)recent.delete(recent.keys().next().value);return {accepted:true,token};},finish(key,token){if(pending?.key===key&&(token===undefined||pending.token===token))pending=null;}};
}
export function groupSearchContext(room,stats,common,keyword){return {region:room.region||'전체',taste:Object.fromEntries(['planning','experience','exploration','spending'].map(axis=>[axis,stats.submitted?stats.totals[axis]/stats.submitted:null])),interests:[...new Set([...common,keyword].filter(allowedHomeQuery))]};}
