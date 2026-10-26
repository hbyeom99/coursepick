import {dedupeRecommendationPlaces,placeTieKey} from './recommendationPlaceIdentity.js';
import {spreadAnchors,selectDiverseCourses} from './courseDiversity.js';
import {interpretHomeSearch,homeRegionMatch,homePlaceEligible,homeAnchorMatch,searchKey} from './homeSearchIntent.js';
import {keywordTasteProfile,personalizedRoles,placeTasteScore,preferenceBuffer,personalizationSummary,seasonEligibility} from './keywordTaste.js';
import {makeSchedule} from './flexibleItinerary.js';
import {straightDistance} from './pickerMap.js';
import {companionsMatch,courseConditionsMatch,placeArea} from './travelFilters.js';
import {confirmedPlaceCost} from './keywordTaste.js';
const prefix='kakao-candidate:';
export function kakaoCandidate(place){return {...place,id:prefix+place.id,sourcePlaceId:place.id,location:place.roadAddress||place.address||'',_kakaoLookup:place.lookup};}
export function generateHomeKeywordCourses(native,live,filters,taste={},interests=[],context={},today=new Date()){
 const rule=interpretHomeSearch(filters.query,filters);if(!rule.allowed||rule.empty)return [];
 if(rule.transport&&filters.transport&&filters.transport!=='전체'&&rule.transport!==filters.transport)return [];
 if(filters.period&&filters.period!=='전체'&&filters.period!==(rule.days===2?'1박 2일':'당일치기'))return [];
 const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(today);
 const nativeIds=new Set(native.map(p=>p.id));
 // Keep provider records separate; eligibility and scoring do not use source priority.
 const eligible=[...native,...live.map(kakaoCandidate)].filter(p=>(p.category!=='숙소'||['호캉스','주캉스','카라반','리조트'].includes(rule.key))&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&homeRegionMatch(p,rule,filters)&&homePlaceEligible(p,rule)&&(!rule.priceSensitive||/무료전시|무료체험/.test(rule.key)||confirmedPlaceCost(p)!==null)&&companionsMatch(p,filters)&&seasonEligibility(p,date).eligible);
 const profile=keywordTasteProfile(taste,context,eligible),scores=new Map(eligible.map(p=>[p.id,placeTasteScore(p,profile)*4+(p.tags||[]).filter(t=>interests.includes(t)).length*.25])),score=p=>scores.get(p.id)||0;
 const pool=dedupeRecommendationPlaces(eligible,score);
 const costs=pool.map(confirmedPlaceCost).filter(v=>v!==null).sort((a,b)=>a-b),cheap=costs[Math.floor(Math.max(0,costs.length-1)*.35)]??0;
 const matched=new Set(pool.filter(p=>homeAnchorMatch(p,rule)).map(p=>p.id));
 const areas=new Map(),areaById=new Map();for(const p of pool){const area=placeArea({...p,location:p.location||p.address}).region;areaById.set(p.id,area);if(!areas.has(area))areas.set(area,[]);areas.get(area).push(p);}
 const sortedAnchors=pool.filter(p=>matched.has(p.id)&&(!rule.priceSensitive||confirmedPlaceCost(p)<=cheap)&&(!filters.category||filters.category==='전체'||p.category===filters.category)).sort((a,b)=>score(b)-score(a)||placeTieKey(a).localeCompare(placeTieKey(b)));
 const anchors=spreadAnchors(sortedAnchors,p=>{const area=placeArea({...p,location:p.location||p.address});return area.region+':'+(area.city||'');}).slice(0,context.anchorLimit||50);
 let roles=rule.gentle?rule.roles:personalizedRoles(rule.roles,profile,rule.query,rule.startMinutes);roles=roles.slice(0,4);
 if(!roles.includes('main'))roles=['main','lunch'];
 const buffer=Math.max(rule.buffer,preferenceBuffer(profile)),results=[];
 for(const anchor of anchors){
  const anchorSlot=anchor.category==='음식점'?roles.findIndex(r=>r==='lunch'||r==='dinner'):roles.indexOf('main');if(anchorSlot<0)continue;
  const area=areaById.get(anchor.id);
  const local=(areas.get(area)||[]).map(p=>({p,d:straightDistance(anchor,p)??Infinity})).filter(v=>v.d<=rule.maxLeg*2).sort((a,b)=>a.d-b.d).slice(0,250).map(v=>v.p);
  let beams=[{stops:[],distance:0,preference:0}];
  const count=roles.length*rule.days;
  for(let i=0;i<count;i++){
   const slot=i%roles.length,role=roles[slot],next=[];
   for(const beam of beams){
    const before=beam.stops.at(-1),firstOfDay=slot===0;
    const options=(i===anchorSlot?[anchor]:local).filter(p=>!beam.stops.some(v=>v.id===p.id)&&(i===anchorSlot||p.id!==anchor.id)&&(role==='main'?p.category!=='음식점':p.category==='음식점')&&(role!=='main'||!rule.gentle||matched.has(p.id))&&(!rule.anchorCategory||role!=='main'||rule.anchorCategory!=='카페'||p.category==='카페'));
    const ranked=options.map(p=>({p,d:straightDistance(firstOfDay?anchor:before||anchor,p)??Infinity})).filter(v=>v.d<=rule.maxLeg).sort((a,b)=>(a.d/1000-score(a.p))-(b.d/1000-score(b.p))||placeTieKey(a.p).localeCompare(placeTieKey(b.p))).slice(0,8);
    for(const {p,d} of ranked)next.push({stops:[...beam.stops,p],distance:beam.distance+(firstOfDay?0:d),preference:beam.preference+score(p)});
   }
   beams=next.sort((a,b)=>(a.distance/1000-a.preference)-(b.distance/1000-b.preference)).slice(0,16);if(!beams.length)break;
  }
  for(const beam of beams){
   if(beam.stops.length!==count)continue;
   if(filters.theme&&filters.theme!=='전체'&&!beam.stops.some(p=>p.tags?.includes(filters.theme)))continue;
   const transport=rule.transport||(beam.stops.slice(1).every((p,i)=>straightDistance(beam.stops[i],p)<=2000)?'도보':'대중교통');
   const plans=[];let hours=0;for(let day=1;day<=rule.days;day++){const stops=beam.stops.slice((day-1)*roles.length,day*roles.length),plan=makeSchedule(stops,roles,{...filters,transport},{bufferMinutes:buffer,startMinutes:rule.startMinutes});if(!plan){hours=0;break;}hours+=plan.hours;plans.push(...plan.schedule.map(s=>({...s,day})));}if(!hours)continue;
   if(filters.hours&&filters.hours!=='전체'&&hours>Number(filters.hours))continue;
   const stops=beam.stops,external=stops.filter(p=>p._kakaoLookup),ids=stops.filter(p=>nativeIds.has(p.id)).map(p=>p.id);
   const personal=personalizationSummary(stops,profile,buffer);
   const tags=[...new Set([rule.query,...(rule.mappedTags||[]),...stops.filter(p=>nativeIds.has(p.id)).flatMap(p=>p.tags||[])])].slice(0,3),notes=[...rule.notes,...personal.notes,'체류·이동시간은 예상값이며 운영시간·예약 여부는 방문 전에 확인해 주세요.'];
   if(rule.key==='은하수'&&stops.some(p=>/은하수길|조명|LED|불빛/i.test([p.name,p.description].join(' '))))notes.push('은하수 조명 연출 장소가 포함됩니다. 실제 밤하늘 은하수 관측을 의미하지 않습니다.');
   if(external.length)notes.push('외부 장소의 가격·시설·접근성은 제공된 정보만으로 확인할 수 없습니다.');
   const course={id:'keyword-purpose-'+encodeURIComponent(rule.key)+'-'+stops.map(p=>p.id).join('--'),name:(nativeIds.has(anchor.id)?anchor.name+' · ':'')+rule.query+(nativeIds.has(anchor.id)?' 코스':' 새로운 장소 코스'),description:notes.join(' '),region:rule.region?.label||(filters.region&&filters.region!=='전체'?filters.region:external.length===stops.length?'지역 미정':stops.find(p=>nativeIds.has(p.id))?.region||'지역 미정'),author:'coursepick',stopIds:ids,imagePlaceId:nativeIds.has(anchor.id)?anchor.id:ids[0]||null,tags,representativeTags:tags,durationDays:rule.days,stopDays:Object.fromEntries(ids.map(id=>[id,Math.floor(stops.findIndex(p=>p.id===id)/roles.length)+1])),schedule:plans.filter(p=>nativeIds.has(p.placeId)),kakaoPlaceRefs:external.map(p=>({placeId:p.sourcePlaceId,day:Math.floor(stops.findIndex(v=>v.id===p.id)/roles.length)+1,...p._kakaoLookup})),itineraryOrder:stops.map(p=>p._kakaoLookup?'k:'+p.sourcePlaceId:'n:'+p.id),hours:Math.round(hours*10)/10,transport,maxPeople:null,isPublic:false,source:'keyword',generationMethod:'keyword-purpose-four-traits',theme:'AI 추천 코스',capacityConfirmed:false,personalization:{axes:Object.keys(profile.targets).filter(k=>profile.targets[k]!==null),notes:personal.notes}};
   if(!courseConditionsMatch(course,stops.filter(p=>nativeIds.has(p.id)),filters)&&!(filters.infant||filters.pet))continue;
   const anchorBody=[anchor.name,anchor.categoryPath,...(anchor.tags||[])].join(' ');
   const kind=/양조장|브루어리|제조과정/.test(anchorBody)?'brewery':/펍|바틀샵|주점/.test(anchorBody)?'pub':anchor.category;
   results.push({course,anchor:anchor.id,region:area,kind,score:beam.preference-beam.distance/1000,ids:stops.map(p=>p.id)});
  }
 }
 return selectDiverseCourses(results,{avoidPlaceIds:context.avoidPlaceIds,limit:context.resultLimit||5}).map((course,index)=>({...course,name:course.name+' '+(index+1)}));
}
