import {keywordConditions,keywordAlternatives,placeKeywordCondition} from './semanticKeywords.js';
import {placeTagMatches} from './placeTagSelection.js';
import { accessibilityKeywordMatch, accessibilitySuggestionKeywords } from './accessibility.js';
import { placeArea } from './travelFilters.js';
export const relatedGroups=[...accessibilitySuggestionKeywords.map(word=>[word]),['맥주','수제맥주','비어','beer'],['양조장','브루어리','brewery'],['펍','맥주펍','크래프트비어'],['카페','커피'],['산책','공원','숲길'],['야경','야간','밤풍경'],['바다','해변','해수욕장'],['미식','맛집','먹방','페어링','안주'],['문화','박물관','전시','역사'],['사진','포토','포토스팟'],['자연','숲','녹지'],['휴식','힐링','여유'],['캠핑','야영','글램핑']];
const regions={서울:'서울',서울특별시:'서울',부산:'부산',부산광역시:'부산',대구:'대구',인천:'인천',광주:'광주',광주광역시:'광주',대전:'대전',울산:'울산',세종:'세종',경기:'경기',경기도:'경기',강원:'강원',강원도:'강원',충북:'충북',충남:'충남',전북:'전북',전남:'전남',경북:'경북',경남:'경남',제주:'제주',제주도:'제주'};
const clean=v=>String(v||'').toLowerCase().trim().replace(/^#+/,'');
export function parseSearchIntent(query) {
 let text=clean(query).replace(/(휠체어\s*접근(?:\s*경로)?|휠체어\s*대여|장애인\s*(?:전용\s*)?화장실|장애인\s*주차(?:\s*구역)?|점자\s*블록|점자\s*안내(?:물)?|음성\s*안내|수어\s*안내|보조견\s*동반|큰글자\s*안내)/g,match=>match.replace(/\s/g,'')).replace(/음식\s*페어링/g,'페어링').replace(/(맥주|수제맥주|양조장|브루어리|펍|카페|커피|산책|야경|바다|문화|미식|힐링|사진|캠핑)(?:와|과)(?=\s|$)/g,'$1 ').replace(/\s+(?:그리고|및)\s+/g,' ').replace(/[,+&]/g,' ');
 const tokens=keywordConditions(text),selectedRegions=[];
 const conditions=tokens.filter(token=>{if(regions[token]){selectedRegions.push(regions[token]);return false;}return true;});
 return {query:clean(query),regions:[...new Set(selectedRegions)],conditions,groups:conditions.map(keywordAlternatives)};
}
export function placeMatchesGroup(place,group) {
 if(!place)return false;
 return group.some(term=>{const access=accessibilityKeywordMatch(place,term);return access===null?placeKeywordCondition(place,term):access;});
}
export function placesSatisfyIntent(places,intent) {
 return intent.regions.every(region=>places.some(p=>placeArea(p).region===region))&&intent.groups.every(g=>places.some(p=>placeMatchesGroup(p,g)));
}
const phrases={맥주:['수제맥주','양조장','맥주 펍','맥주와 야경','맥주와 음식 페어링'],카페:['커피','카페와 바다','카페와 산책','카페와 힐링'],양조장:['수제맥주','양조장과 산책','양조장과 미식'],산책:['공원','산책과 카페','산책과 야경'],힐링:['휴식','힐링과 자연','힐링과 카페'],바다:['해변','카페와 바다','바다와 산책']};
export function relatedSuggestions(input,keywords=[]) {
 const text=clean(input);if(!text)return [];
 const key=Object.keys(phrases).find(k=>k.includes(text)||text.includes(k))||relatedGroups.find(g=>g.some(t=>t.includes(text)))?.[0];
 const direct=[...new Set([...keywords,...accessibilitySuggestionKeywords])].filter(k=>clean(k).includes(text)&&clean(k)!==text).sort((a,b)=>a.length-b.length);
 return [...new Set([input.trim(),...(phrases[key]||[]),...direct])].slice(0,6);
}
