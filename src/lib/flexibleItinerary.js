import {straightDistance} from './pickerMap.js';
export const legDistanceLimit=transport=>transport==='도보'?2000:10000;
export function itineraryStart(value){const m=/^(\d{2}):(\d{2})$/.exec(value||'');return m&&+m[1]<24&&+m[2]<60?Math.max(540,+m[1]*60 + +m[2]):540;}
export function itineraryRoles(query,start=540){
 if(start>=780||/반나절|2시간|3시간|4시간/.test(query))return ['main','dinner'];
 if(start>=660)return ['lunch','main','dinner'];
 if(/등산|트레킹|테마파크|놀이공원|워터파크|힐링|휴식|휴양/.test(query))return ['main','lunch','dinner'];
 if(/카페\s*투어|맛집\s*투어|빵지순례|푸드투어/.test(query))return ['main','lunch','main','main','dinner'];
 return ['main','lunch','main','dinner'];
}
export function expectedStay(place,role){
 const n=Number(place.recommendedStayMinutes??place.visitDurationMinutes);
 if(Number.isFinite(n)&&n>0)return {minutes:n,estimated:false};
 return {minutes:role==='main'?(/등산|트레킹/.test((place.tags||[]).join(' '))?240:120):60,estimated:true};
}
export function makeSchedule(stops,roles,filters){
 let clock=itineraryStart(filters.startTime),travel=0;const beginning=clock,schedule=[];
 for(let i=0;i<stops.length;i++){
  if(i){const d=straightDistance(stops[i-1],stops[i]);const minutes=Math.ceil(d/(filters.transport==='도보'?70:250));clock+=minutes;travel+=minutes;}
  if(roles[i]==='lunch')clock=Math.max(clock,690);
  if(roles[i]==='dinner')clock=Math.max(clock,1020);
  const stay=expectedStay(stops[i],roles[i]);if(clock+stay.minutes>24*60)return null;
  schedule.push({placeId:stops[i].id,label:roles[i]==='lunch'?'점심 식사':roles[i]==='dinner'?'저녁 식사':clock<720?'오전 일정':'오후 일정',time:`${String(Math.floor(clock/60)).padStart(2,'0')}:${String(clock%60).padStart(2,'0')}`,minutes:stay.minutes,duration:`${stay.minutes}분${stay.estimated?' 예상':''}`,durationEstimated:stay.estimated,timeFlexible:true});clock+=stay.minutes;
 }
 return {schedule,hours:Math.round((clock-beginning)/6)/10,estimatedTravelMinutes:travel};
}
