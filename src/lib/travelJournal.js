import {placeArea} from './travelFilters.js';
import boundaries from '../data/visitRegions.json';
import {travelAxes} from './travelAxes.js';
export {travelAxes} from './travelAxes.js';
export {validJournals,validTravelTaste} from './travelJournalValidation.js';
const aliases={'11':['서울','서울특별시'],'26':['부산','부산광역시'],'27':['대구','대구광역시'],'28':['인천','인천광역시'],'29':['광주','광주광역시'],'30':['대전','대전광역시'],'31':['울산','울산광역시'],'36':['세종','세종특별자치시'],'41':['경기','경기도'],'51':['강원','강원도','강원특별자치도'],'43':['충북','충청북도'],'44':['충남','충청남도'],'46':['전남','전라남도'],'47':['경북','경상북도'],'48':['경남','경상남도'],'50':['제주','제주도','제주특별자치도'],'52':['전북','전라북도','전북특별자치도']};
export function placeDistrict(place){
 const words=[place?.location||place?.roadAddress||place?.address||'',place?.region||''].join(' ').trim().split(/\s+/);const region=String(placeArea({...place,location:place?.location||place?.roadAddress||place?.address||''}).region||place?.region||'');
 const city=boundaries.districts.find(d=>d.name.split(' ').some(part=>part.replace(/[시군]$/,'')===String(place?.region||'').trim()));
 const province=boundaries.provinces.find(p=>aliases[p.id]?.some(a=>words[0]===a||region===a))||boundaries.provinces.find(p=>p.id===city?.province);
 if(!province)return null;
 const district=boundaries.districts.filter(d=>d.province===province.id).find(d=>{const parts=d.name.split(' ');return parts.every(p=>words.some(word=>word===p||word===p.replace(/[시군]$/,'')));});
 return {province:province.id,district:district?.id||null};
}
export function journalStats(journals,catalog,year=null){
 const byId=new Map(catalog.map(p=>[p.id,p]));const records=journals.filter(j=>!year||j.visitedAt.startsWith(String(year)));
 const visits=records.flatMap(j=>j.placeIds.map(id=>byId.get(id)).filter(Boolean));const regions=visits.map(placeDistrict).filter(Boolean);
 const provinces=[...new Set(regions.map(r=>r.province))],districts=[...new Set(regions.map(r=>r.district).filter(Boolean))];
 const counts={};visits.forEach(p=>counts[p.id]=(counts[p.id]||0)+1);const favorite=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
 const categories={};visits.forEach(p=>{if(p.category)categories[p.category]=(categories[p.category]||0)+1;});
 return {records,visits,provinces,districts,places:new Set(visits.map(p=>p.id)).size,favorite:byId.get(favorite)?.name||'기록 없음',category:Object.keys(categories).sort((a,b)=>categories[b]-categories[a])[0]||'기록 없음',unmatched:visits.filter(p=>!placeDistrict(p)).length};
}
export const demoOffers=[{id:'food',name:'제휴 체험 10% 할인',cost:1000,kind:'음식점'},{id:'stay',name:'숙소 5천원 쿠폰',cost:2000,kind:'숙박'},{id:'cafe',name:'카페·맛집 쿠폰',cost:1500,kind:'카페'},{id:'view',name:'관광지 입장권 할인',cost:2500,kind:'관광지'},{id:'car',name:'렌터카 할인',cost:3000,kind:'체험'},{id:'film',name:'AI 여행 영상 템플릿',cost:2000,kind:'관광지'}];
export const newDemoRewards=()=>({balance:3250,coupons:[],applications:[],completed:[],ledger:[{id:'welcome',label:'시연 시작 포인트',amount:3250,date:new Date().toISOString()}]});
export function redeemDemo(state,offer){if(!offer||state.balance<offer.cost)throw Error('보유 포인트가 부족해요.');const id=crypto.randomUUID(),date=new Date().toISOString();return {...state,balance:state.balance-offer.cost,coupons:[{id,name:offer.name,code:'DEMO-'+id.slice(0,8).toUpperCase(),used:false,date},...state.coupons],ledger:[{id,label:offer.name,amount:-offer.cost,date},...state.ledger]};}
export function completeDemo(state,id){if(state.completed.includes(id))return state;return {...state,balance:state.balance+300,completed:[...state.completed,id],ledger:[{id:'mission-'+id,label:'리뷰미션 시연 완료',amount:300,date:new Date().toISOString()},...state.ledger]};}

// Archive coverage follows the courses in My Journals as requested, without
// changing written-visit records used by the recap or storing provider content.
export function archiveStats(courses,journals,catalog){
 const byId=new Map(catalog.map(p=>[p.id,p])),visits=[];
 const seenCourses=new Set();
 for(const course of courses){
  if(seenCourses.has(course.id))continue;seenCourses.add(course.id);
  const record=journals.find(j=>j.courseId===course.id),ids=[...new Set([...(course.stopIds||[]),...(record?.placeIds||[])])];
  const found=ids.map(id=>byId.get(id)).filter(Boolean);visits.push(...found);
  if(course.editorialVisits?.length)visits.push(...course.editorialVisits.filter(v=>!v.place_id||!ids.includes(v.place_id)).map(v=>({region:v.region||course.region,location:v.location||'',id:v.visit_id})));
  if(!found.length&&!course.editorialVisits?.length&&course.region&&course.region!=='지역 미정'&&course.region!=='여러 지역')visits.push({region:course.region,id:course.id});
 }
 for(const record of journals)if(!seenCourses.has(record.courseId))visits.push(...record.placeIds.map(id=>byId.get(id)).filter(Boolean));
 const provinceCounts={},districtCounts={};let unmatched=0;
 for(const place of visits){const area=placeDistrict(place);if(!area){unmatched++;continue;}provinceCounts[area.province]=(provinceCounts[area.province]||0)+1;if(area.district)districtCounts[area.district]=(districtCounts[area.district]||0)+1;}
 return {provinces:Object.keys(provinceCounts),districts:Object.keys(districtCounts),provinceCounts,districtCounts,unmatched};
}
