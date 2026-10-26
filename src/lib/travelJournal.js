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
export const demoOffers=[
 {id:'cafe',location:'광주 · 율량라 카페',name:'카페·디저트 3천원 할인',cost:1000,kind:'카페',image:'reward-cafe.jpg'},
 {id:'stay',location:'청주 · 우암산의 달',name:'숙소 5천원 쿠폰',cost:1000,kind:'숙박',image:'reward-stay.jpg'},
 {id:'view',location:'광주 · 무등산 케이블카',name:'관광지 입장권 20% 할인',cost:1000,kind:'관광지',image:'reward-cablecar.jpg'},
 {id:'car',location:'쏘카, G car',name:'렌터카 예약 1만원 할인',cost:1000,kind:'렌터카',image:'reward-car.jpg'},
];
export const newDemoRewards=()=>({balance:3250,coupons:[],applications:[],completed:[],ledger:[{id:'welcome',label:'시연 시작 포인트',amount:3250,date:new Date().toISOString()}]});
export function redeemDemo(state,offer){if(!offer||state.balance<offer.cost)throw Error('보유 포인트가 부족해요.');const id=crypto.randomUUID(),date=new Date().toISOString();return {...state,balance:state.balance-offer.cost,coupons:[{id,name:offer.name,code:'DEMO-'+id.slice(0,8).toUpperCase(),used:false,date},...state.coupons],ledger:[{id,label:offer.name,amount:-offer.cost,date},...state.ledger]};}
export function completeDemo(state,id,points=300){if(!Number.isInteger(points)||points<=0)throw Error('미션 포인트 오류');if(state.completed.includes(id))return state;return {...state,balance:state.balance+points,completed:[...state.completed,id],ledger:[{id:'mission-'+id,label:'키워드 미션 완료',amount:points,date:new Date().toISOString()},...state.ledger]};}

// The visit map uses only places explicitly selected in written travel journals.
// Count each catalog place once, even if it appears in multiple journal records.
export function archiveStats(journals,catalog){
 const byId=new Map(catalog.map(p=>[p.id,p]));
 const placeIds=new Set(journals.flatMap(record=>Array.isArray(record.placeIds)?record.placeIds:[]));
 const visits=[...placeIds].map(id=>byId.get(id)).filter(Boolean);
 const provinceCounts={},districtCounts={};let unmatched=placeIds.size-visits.length;
 for(const place of visits){const area=placeDistrict(place);if(!area){unmatched++;continue;}provinceCounts[area.province]=(provinceCounts[area.province]||0)+1;if(area.district)districtCounts[area.district]=(districtCounts[area.district]||0)+1;}
 return {provinces:Object.keys(provinceCounts),districts:Object.keys(districtCounts),provinceCounts,districtCounts,unmatched};
}
