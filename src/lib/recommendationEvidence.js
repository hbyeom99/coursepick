import {isFictionalPlace} from './placeAuthenticity.js';
// Automatic recommendations require travel-category and intent evidence.
const key=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'');
const rejected=/보관|저장|물류|창고|운송|택배|공장|제조업|부동산|중개업|법률|세무|보험|대출|병원|의원|약국|장례/;
const travelPath=/관광|여행|음식점|카페|숙박|호텔|리조트|펜션|박물관|미술관|전시관|과학관|천문대|공원|수목원|식물원|동물원|아쿠아리움|해수욕장|해변|유원지|테마파크|놀이공원|문화시설|공연장|영화관|공방|체험|캠핑|야영|온천|스파|사찰|문화유적|서점|도서관|전통시장|쇼핑몰|백화점|아울렛|스포츠시설|레저/;
export function travelRecommendationEligible(place,query=''){
 if(isFictionalPlace(place))return false;
 const path=String(place.categoryPath||'');
 if(rejected.test(path))return false;
 // External lookup metadata is also present when saved references are resolved.
 const external=Boolean(place._kakaoLookup||place.lookup||place.sourcePlaceId||String(place.id||'').startsWith('kakao-candidate:'));
 if(external){
  const shopping=['쇼핑','쇼핑몰','아울렛','빈티지숍','빈티지샵','편집숍','소품샵','소품샾','소품','잡화','잡화점','기념품샵','문구점'].includes(key(query));
  if(shopping&&/패션|의류판매|잡화|소품|편집숍|기념품|문구|팬시|인테리어|셀렉트숍|라이프스타일/.test(`${path} ${place.name||''}`))return true;
  return Boolean(path&&travelPath.test(path));
 }
 return ['관광지','음식점','카페','숙소','체험'].includes(place.category)||travelPath.test(path);
}
export const natureEvidenceTerms={오로라:['오로라'],은하수:['은하수'],별:['별관측','별관찰','별구경','별보기','천체관측','천문대'],별빛:['별빛','천체관측','천문대'],별구경:['별구경','별관측','별관찰','천체관측','천문대'],일출:['일출','해돋이'],일출코스:['일출','해돋이'],일몰:['일몰','해넘이','노을'],일몰코스:['일몰','해넘이','노을'],노을:['노을','일몰','해넘이']};
export function natureIntentEvidence(place,query){
 const terms=natureEvidenceTerms[key(query)];if(!terms)return null;
 // A business name or a query-derived tag is never observation evidence.
 const tags=place._kakaoLookup||place.lookup?[]:(place.tags||[]);
 const sentences=String(place.description||'').split(/[.!?。\n]/).filter(sentence=>!/없|불가|불가능|미지원|못|아니|않|제외|금지/.test(sentence));
 const evidence=[...sentences,...tags].filter(Boolean).map(key);
 return terms.some(term=>evidence.some(value=>value.includes(key(term))));
}

export function activityEvidenceMatch(place,query){
 const q=key(query);
 // Event title matches do not prove that an event is currently operating.
 if(/축제|페스티벌|팝업/.test(q))return Boolean(place.eventStartDate||place.eventstartdate||place.season?.startDate)&&Boolean(place.eventEndDate||place.eventenddate||place.season?.endDate);
 return true;
}
export function confirmedConditionMatch(place,query){
 const q=key(query),facts=place.verifiedConditions||{};
 const conditions={'무료주차':'freeParking','주차가능':'parking','예약없이':'walkIn','당일예약':'sameDayBooking','24시간':'open24Hours','연중무휴':'openAllYear','수유실':'nursingRoom','엘리베이터':'elevator','유아의자':'highChair','실내좌석':'indoorSeating','야외좌석':'outdoorSeating','키즈존':'kidsZone'};
 const field=conditions[q];
 if(!field)return null;
 // Existing explicit tags are accepted as curated evidence; never inspect names.
 const explicit=(place.tags||[]).some(tag=>key(tag)===q);
 return facts[field]===true||explicit;
}

export function gentleTravelEligible(place){
 const category=[place.name,place.category,place.categoryPath,...(place.tags||[])].join(' ');
 if(/박물관|미술관|기념관|전시관/.test(category))return true;
 if(/농구|배드민턴|골프|탁구|스크린|클라이밍|수상스키|서핑|패러글라이딩|짚라인|승마|번지|테니스|볼링|당구|축구|야구|체육시설|생활체육|스포츠/.test(category))return false;
 if(/고양이카페|애견카페|동물카페|키즈카페/.test(key(category)))return false;
 if(/동물.*카페|고양이.*카페|카페.*고양이/.test(place.description||''))return false;
 return true;
}

const spaSports=/클라이밍|테니스|골프|농구|배드민턴|탁구|스크린|볼링|야구|축구|헬스|피트니스/;
export function spaTravelEligible(place){return !spaSports.test([place.name,place.categoryPath,...(place.tags||[])].join(' '));}
export function spaAnchorEvidence(place){
 if(!spaTravelEligible(place))return false;
 const terms=new Set(['스파','온천','사우나']);
 if((place.tags||[]).some(tag=>terms.has(key(tag))))return true;
 const segments=String(place.categoryPath||'').split(/[>,/]/).map(key);
 if(segments.some(part=>terms.has(part)))return true;
 // No business-name substring evidence (e.g. 스파이더스 / 테니스파크).
 return false;
}
