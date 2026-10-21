import {evaluateCourseTraits,courseTraitAffinity} from './courseTraitsV2.js';
import {parseSearchIntent,placeMatchesGroup,placesSatisfyIntent} from './searchIntent.js';
import {areaMatches,courseConditionsMatch,placeArea,companionsMatch} from './travelFilters.js';
import {keywordAlternatives,placeConditionScore,relatedKeywordBonus,equivalentKeyword} from './semanticKeywords.js';
import {straightDistance} from './pickerMap.js';
import {legDistanceLimit,itineraryRoles,itineraryStart,makeSchedule} from './flexibleItinerary.js';
export function generateKeywordCourses(catalog,filters,taste={},interests=[],today=new Date(),traitContext={}){
 const traitIndex=new Map(catalog.map(p=>[p.id,p]));
 const intent=parseSearchIntent((filters.query||'').replace(/카페\s*투어/g,'카페').replace(/맛집\s*투어|푸드투어/g,'미식').replace(/빵지순례/g,'빵'));if(!intent.query)return [];
 const beer=intent.conditions.some(t=>equivalentKeyword(t,'맥주')||equivalentKeyword(t,'수제맥주'));
 const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(today);
 const valid=catalog.filter(p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&p.category!=='숙소'&&areaMatches(p,filters)&&intent.regions.every(region=>placeArea(p).region===region)&&(!/축제|페스티벌|챌린지/.test(p.name)||p.id==='beeractivity_69477f4dcc29c0685b8c0bb9'&&day>='2026-10-16'&&day<='2026-10-18'));
 const areaById=new Map(valid.map(p=>[p.id,placeArea(p).region]));
 const preferredById=new Map(valid.map(p=>[p.id,(p.tags||[]).filter(t=>interests.includes(t)).length*.2+((filters.infant||filters.pet)&&companionsMatch(p,filters)?2:0)]));
 const pools=new Map();
 for(const p of valid){const region=areaById.get(p.id);if(!pools.has(region))pools.set(region,{main:[],meal:[]});pools.get(region)[p.category==='음식점'?'meal':'main'].push(p);}
 const scorePlace=p=>intent.conditions.length?Math.max(0,...intent.conditions.map(t=>placeMatchesGroup(p,keywordAlternatives(t))?Math.max(1,placeConditionScore(p,t)):0)):1;
 const anchors=valid.map(p=>({p,score:scorePlace(p)})).filter(x=>x.score>0&&(filters.category==='전체'||!filters.category||x.p.category===filters.category)).sort((a,b)=>b.score-a.score||a.p.id.localeCompare(b.p.id)).slice(0,40);
 const roles=itineraryRoles(filters.query||'',itineraryStart(filters.startTime)),limit=legDistanceLimit(filters.transport),candidates=[];
 for(const {p:anchor,score} of anchors){
  const anchorSlot=anchor.category==='음식점'?roles.findIndex(r=>r==='lunch'||r==='dinner'):roles.indexOf('main');if(anchorSlot<0)continue;
  let beams=[{stops:[],distance:0}];
  for(let i=0;i<roles.length;i++){
   const next=[];
   for(const beam of beams){
    const previous=beam.stops.at(-1);
    const options=(i===anchorSlot?[anchor]:pools.get(areaById.get(anchor.id))[roles[i]==='main'?'main':'meal']).filter(p=>!beam.stops.some(s=>s.id===p.id)&&(i===anchorSlot||p.id!==anchor.id)).map(p=>({p,d:previous?straightDistance(previous,p):straightDistance(anchor,p)})).filter(x=>x.d!==null&&(!previous||x.d<=limit)).sort((a,b)=>{
     const preferred=p=>preferredById.get(p.id);
     return a.d/1000-preferred(a.p)-(b.d/1000-preferred(b.p))||a.p.id.localeCompare(b.p.id);
    }).slice(0,3);
    for(const {p,d} of options)next.push({stops:[...beam.stops,p],distance:beam.distance+(previous?d:0)});
   }
   beams=next.sort((a,b)=>a.distance-b.distance).slice(0,8);if(!beams.length)break;
  }
  for(const beam of beams){
   const stops=beam.stops;if(stops.length!==roles.length||!placesSatisfyIntent(stops,intent))continue;
   const planned=makeSchedule(stops,roles,filters);if(!planned)continue;
   if(filters.hours&&filters.hours!=='전체'&&planned.hours>Number(filters.hours))continue;
   const tags=[...new Set(stops.flatMap(p=>p.tags||[]))];if(filters.theme&&filters.theme!=='전체'&&!tags.includes(filters.theme))continue;
   const transport=filters.transport&&filters.transport!=='전체'?filters.transport:beer?'대중교통':stops.slice(1).every((p,i)=>straightDistance(stops[i],p)<=2000)?'도보':'대중교통';
   const count=stops.filter(p=>companionsMatch(p,filters)).length;
   const notes=(filters.infant||filters.pet)?` 동반 조건 확인 ${count}/${stops.length}곳이며 나머지 장소는 개별 확인이 필요합니다.`:'';
   const course={id:'keyword-ai-'+encodeURIComponent(intent.query)+'-'+stops.map(p=>p.id).join('--'),name:anchor.name+'에서 시작하는 '+intent.conditions.join(' · ')+' 여행',description:'테마에 맞춰 관광·휴식과 식사를 연결한 일정입니다. 시간은 변경 가능한 제안이며, 체류·이동시간은 예상값입니다. 운영시간·예약·단체 이용 가능 여부는 방문 전 확인해 주세요.'+notes,author:'coursepick',region:anchor.region,stopIds:stops.map(p=>p.id),imagePlaceId:anchor.id,tags,representativeTags:tags.slice(0,3),...planned,transport,maxPeople:null,capacityConfirmed:false,durationDays:1,startTimeFlexible:true,companionCoverage:{confirmed:count,total:stops.length},isSample:true,isDemo:false,source:'keyword',theme:'AI 추천 코스',generationMethod:'keyword-theme-distance',straightLineKm:Math.round(beam.distance/10)/100};
   if(!courseConditionsMatch(course,stops,filters))continue;
   candidates.push({course,anchor:anchor.id,score:score*10-beam.distance/1000+courseTraitAffinity(evaluateCourseTraits(course,traitIndex,traitContext),taste)*3,related:relatedKeywordBonus(stops,intent.conditions)});
  }
 }
 candidates.sort((a,b)=>b.score-a.score||b.related-a.related||a.course.stopIds.join('|').localeCompare(b.course.stopIds.join('|')));
 const chosen=[],used=new Set(),sets=new Set();for(const item of candidates){const key=[...item.course.stopIds].sort().join('|');if(used.has(item.anchor)||sets.has(key))continue;chosen.push(item.course);used.add(item.anchor);sets.add(key);if(chosen.length===5)break;}
 return chosen;
}

