export const ACCESSIBILITY_FIELDS = [
 ['wheelchairRoute','휠체어 접근 경로','휠체어접근'],['disabledParking','장애인 주차구역','장애인주차'],
 ['accessibleToilet','장애인 화장실','장애인화장실'],['wheelchairRental','휠체어 대여','휠체어대여'],
 ['entrance','단차 없는 출입구','단차없는출입구'],['elevator','승강기','승강기'],
 ['brailleBlock','점자블록','점자블록'],['brailleMaterials','점자 안내물','점자안내물'],
 ['audioGuide','음성 안내','음성안내'],['signLanguage','수어 안내','수어안내'],
 ['assistanceDog','보조견 동반','보조견동반'],['largePrint','큰글자 안내','큰글자안내'],
 ['publicTransport','대중교통 접근 정보','접근가능대중교통'],['ticketOffice','매표소 접근 정보','접근가능매표소'],
 ['accessiblePromotion','접근성 안내물','접근성안내물'],['accessibleSeating','관람석 접근 정보','접근가능관람석'],
 ['accessibleRoom','장애인 객실','장애인객실'],['humanGuide','안내인','안내인'],
 ['guidanceSystem','유도·안내 설비','유도안내설비'],['videoGuide','영상 안내','영상안내'],
 ['hearingRoom','객실 시각 경보','객실시각경보'],['mobilityOther','지체장애 기타 정보','지체장애편의정보'],
 ['visualOther','시각장애 기타 정보','시각장애편의정보'],['hearingOther','청각장애 기타 정보','청각장애편의정보'],
];
export const ACCESSIBILITY_FILTERS = ACCESSIBILITY_FIELDS.slice(0,12);
export const ACCESSIBILITY_STATUS = {available:'있음·가능 근거 있음',not_available:'없음·불가',conditional:'조건부 · 조건 확인',unknown:'미확인',review_pending:'검토 대기'};
const object=value=>value && typeof value==='object' && !Array.isArray(value);
const text=value=>typeof value==='string'?value:'';
const clean=value=>text(value).replace(/[\s#·_-]/g,'').toLowerCase();
const aliases = {wheelchairRoute:['휠체어접근','휠체어접근경로'],disabledParking:['장애인주차','장애인주차구역'],
 accessibleToilet:['장애인화장실','장애인전용화장실'],wheelchairRental:['휠체어대여'],
 entrance:['단차없는출입구'],elevator:['승강기','엘리베이터'],brailleBlock:['점자블록'],
 brailleMaterials:['점자안내물','점자안내'],audioGuide:['음성안내','오디오가이드'],signLanguage:['수어안내','수화안내'],
 assistanceDog:['보조견동반','안내견동반'],largePrint:['큰글자안내']};
export function accessibilityKeysForKeyword(keyword){
 const term=clean(keyword);
 if(term==='휠체어')return ['wheelchairRoute','wheelchairRental'];
 return ACCESSIBILITY_FIELDS.filter(([key,,tag])=>clean(tag)===term||(aliases[key]||[]).includes(term)).map(([key])=>key);
}
export function normalizeAccessibilityInfo(value){
 if(!object(value)||value.schemaVersion!==1||!object(value.features))return undefined;
 const features=Object.fromEntries(ACCESSIBILITY_FIELDS.map(([key])=>{
  const item=object(value.features[key])?value.features[key]:{};
  const status=Object.hasOwn(ACCESSIBILITY_STATUS,item.status)?item.status:'unknown';
  const evidence=Array.isArray(item.evidence)?item.evidence.filter(object).map(row=>({raw:text(row.raw),contentId:text(row.contentId),retrievedAt:text(row.retrievedAt)})):[];
  // A positive flag without source evidence is not eligible for filters.
  return [key,{status:status==='available'&&!evidence.some(row=>row.raw.trim())?'review_pending':status,evidence}];
 }));
 return {schemaVersion:1,features,source:text(value.source),checkedAt:text(value.checkedAt),reviewStatus:text(value.reviewStatus)};
}
export function accessibilityTags(info){
 return ACCESSIBILITY_FIELDS.filter(([key])=>info?.features?.[key]?.status==='available'&&info.features[key].evidence?.some(row=>row.raw?.trim())).map(([,,tag])=>tag);
}
export function accessibilityKeywordMatch(place,keyword){
 const keys=accessibilityKeysForKeyword(keyword);
 if(!keys.length)return null;
 return keys.some(key=>place?.accessibilityInfo?.features?.[key]?.status==='available'&&place.accessibilityInfo.features[key].evidence?.some(row=>row.raw?.trim()));
}
export function accessibilityMatch(place,filters){
 const selected=Array.isArray(filters.accessibility)?filters.accessibility:[];
 return selected.every(key=>ACCESSIBILITY_FIELDS.some(([known])=>known===key)&&place?.accessibilityInfo?.features?.[key]?.status==='available'&&place.accessibilityInfo.features[key].evidence?.some(row=>row.raw?.trim()));
}
export function hasAccessibilityFilter(filters){return Array.isArray(filters.accessibility)&&filters.accessibility.length>0;}
export const accessibilitySuggestionKeywords=Object.values(aliases).map(values=>values[0]);
