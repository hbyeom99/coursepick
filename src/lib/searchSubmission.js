import {searchKey,interpretHomeSearch,allowedHomeQuery} from './homeSearchIntent.js';
export function searchRequestKey(query,filters={}){return JSON.stringify([searchKey(query),...['region','city','category','transport','period','hours','theme','people','infant','pet','startTime'].map(k=>filters[k]??null)]);}
export function prepareKeywordSearch(value){const rule=interpretHomeSearch(value);return rule.allowed?rule.query:String(value||'').trim();}
export function createSearchSubmissionGate(){
 let pending=null,sequence=0;
 return {accept(key){if(pending?.key===key)return {accepted:false,reason:'pending'};const token=++sequence;pending={key,token};return {accepted:true,token};},finish(key,token){if(pending?.key===key&&(token===undefined||pending.token===token))pending=null;}};
}
export function groupSearchContext(room,stats,common,keyword){return {region:room.region||'전체',taste:Object.fromEntries(['planning','experience','exploration','spending'].map(axis=>[axis,stats.submitted?stats.totals[axis]/stats.submitted:null])),interests:[...new Set([...common,keyword].filter(allowedHomeQuery))]};}
