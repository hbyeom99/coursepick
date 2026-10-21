import {activityEvidence} from './courseTraitsV2.js';
const axes=['planning','experience','exploration','spending'];
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const facts=p=>p?.traitFacts||p?.trait_facts||{};
export const confirmedPlaceCost=p=>finite(facts(p).costPerPerson)&&facts(p).costPerPerson>=0?facts(p).costPerPerson:null;
export function keywordTasteProfile(taste={},context={},catalog=[]){
 const targets=Object.fromEntries(axes.map(axis=>[axis,finite(taste[axis])&&taste[axis]>=0&&taste[axis]<=100?taste[axis]/100:null]));
 const knownIds=new Set(context.knownPlaceIds||[]),categories=new Set(context.knownCategories||[]),tags=new Set(context.knownTags||[]);
 for(const p of catalog)if(knownIds.has(p.id)){if(p.category)categories.add(p.category);for(const tag of p.tags||[])tags.add(tag);}
 const costs=new Map();for(const p of catalog){const cost=confirmedPlaceCost(p);if(cost===null)continue;const range=costs.get(p.category)||[cost,cost];costs.set(p.category,[Math.min(range[0],cost),Math.max(range[1],cost)]);}
 return {targets,knownIds,categories,tags,costs,hasHistory:knownIds.size>0||categories.size>0,active:axes.some(axis=>targets[axis]!==null)};
}
export function personalizedRoles(base,profile,query,start){
 const roles=[...base],target=profile.targets.planning;
 // Explicit short/late plans and long-duration activities take precedence.
 if(target===null||roles.length<=2||start>=660||/반나절|[234]시간|등산|트레킹|테마파크|놀이공원|워터파크/.test(query))return roles;
 if(target<=.35){while(roles.length>3){const slot=roles.lastIndexOf('main');if(slot===roles.indexOf('main'))break;roles.splice(slot,1);}}
 else if(target>=.65&&roles.length<5){const dinner=roles.indexOf('dinner');roles.splice(dinner<0?roles.length:dinner,0,'main');}
 return roles;
}
export function placeTasteScore(place,profile){
 const {targets}=profile,parts=[];
 const fit=(target,value)=>1-2*Math.abs(target-value);
 if(targets.planning!==null&&typeof facts(place).reservationRequired==='boolean')parts.push(fit(targets.planning,Number(facts(place).reservationRequired)));
 const activity=activityEvidence(place);if(targets.experience!==null&&activity)parts.push(fit(targets.experience,activity.intensity));
 if(targets.exploration!==null&&profile.hasHistory){
  let novelty=0;
  if(!profile.knownIds.has(place.id)){
   let sum=.5,weight=.5;
   if(profile.categories.size){sum+=Number(!profile.categories.has(place.category))*.35;weight+=.35;}
   if(profile.tags.size&&place.tags?.length){sum+=place.tags.filter(t=>!profile.tags.has(t)).length/place.tags.length*.15;weight+=.15;}
   novelty=sum/weight;
  }
  parts.push(fit(targets.exploration,novelty));
 }
 const cost=confirmedPlaceCost(place),range=profile.costs.get(place.category);
 if(targets.spending!==null&&cost!==null&&range&&range[1]>range[0])parts.push(fit(targets.spending,(cost-range[0])/(range[1]-range[0])));
 // Missing facts are neutral; unknown price is never treated as free.
 return parts.reduce((sum,value)=>sum+value,0)/Math.max(1,axes.filter(axis=>targets[axis]!==null).length);
}
export function preferenceBuffer(profile){return (profile.targets.planning!==null&&profile.targets.planning<=.35?15:0)+(profile.targets.experience!==null&&profile.targets.experience<=.35?15:0);}
export function personalizationSummary(stops,profile,buffer){
 if(!profile.active)return {notes:[],confirmedSubtotal:null,knownCostCount:0};
 const notes=[],t=profile.targets;
 if(t.planning!==null)notes.push(`계획성에 맞춰 ${stops.length}곳을 배치${buffer?`하고 장소 사이 ${buffer}분의 여유시간을 더했어요`:'했어요'}.`);
 if(t.experience!==null)notes.push(stops.some(p=>activityEvidence(p))?`장소의 활동 정보·유형을 바탕으로 ${t.experience<.5?'휴식':'활동'} 취향을 고려했어요.`:'활동 정보가 부족해 경험 취향 반영이 제한됐어요.');
 if(t.exploration!==null)notes.push(profile.hasHistory?`이전 선택·방문 기록을 기준으로 ${t.exploration<.5?'익숙한 장소':'새로운 장소'}를 우선했어요.`:'방문·선택 이력이 부족해 탐색 성향은 반영하지 못했어요.');
 const comparable=stops.some(p=>{const range=profile.costs.get(p.category);return confirmedPlaceCost(p)!==null&&range&&range[1]>range[0];});
 const costs=stops.map(confirmedPlaceCost),known=costs.filter(v=>v!==null),reservations=stops.filter(p=>typeof facts(p).reservationRequired==='boolean').length;
 if(t.spending!==null)notes.push(known.length?`${comparable?'지출 취향은 확인된 가격을 비교해 고려했어요.':'비교할 가격 자료가 부족해 지출 성향 반영은 제한됐어요.'} 비용이 확인된 장소는 ${known.length}/${stops.length}곳이에요. 확인된 비용 합계 ${known.reduce((a,b)=>a+b,0).toLocaleString('ko-KR')}원이며, 이동비·미확인 비용은 포함하지 않아요.`:'확인된 가격 정보가 없어 지출 성향은 반영하지 못했어요.');
 if(reservations<stops.length)notes.push(`예약 여부 확인이 필요한 장소 ${stops.length-reservations}곳이 있어요.`);
 return {notes,knownCostCount:known.length,confirmedSubtotal:known.length?known.reduce((a,b)=>a+b,0):null};
}
function dateValue(value){const raw=String(value||'').replace(/-/g,'');if(!/^\d{8}$/.test(raw))return null;const formatted=raw.slice(0,4)+'-'+raw.slice(4,6)+'-'+raw.slice(6);const d=new Date(formatted+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===formatted?formatted:null;}
export function seasonEligibility(place,day){
 const start=dateValue(place.eventStartDate||place.eventstartdate||place.season?.startDate),end=dateValue(place.eventEndDate||place.eventenddate||place.season?.endDate);
 const seasonal=/축제|페스티벌|챌린지|할로윈/.test([place.name,...(place.tags||[])].join(' '));
 if(start&&day<start||end&&day>end)return {eligible:false,unconfirmed:false};
 if(start&&end)return {eligible:true,unconfirmed:false};
 if(/축제|페스티벌|챌린지/.test(place.name))return {eligible:false,unconfirmed:true};
 return {eligible:true,unconfirmed:seasonal};
}
