import {courseDay,explicitStopDays} from './courseDays.js';
export function courseEntries(course,day){
 const entries=[...(course.stopIds||[]).map(id=>({key:'n:'+id,id,source:'native',day:courseDay(course,id)})),...(course.googlePlaceRefs||[]).map(ref=>({key:'g:'+ref.placeId,id:ref.placeId,source:'google',day:ref.day})),...(course.kakaoPlaceRefs||[]).map(ref=>({key:'k:'+ref.placeId,id:ref.placeId,source:'kakao',day:ref.day}))];
 const byKey=new Map(entries.map(e=>[e.key,e]));
 const keys=[...new Set([...(course.itineraryOrder||[]),...entries.map(e=>e.key)])];
 return keys.map(key=>byKey.get(key)).filter(e=>e&&(day===undefined||e.day===day));
}
export function reorderCourseEntries(course,day,from,to){
 const visible=courseEntries(course,day);if(from<0||to<0||from>=visible.length||to>=visible.length||from===to)return course;
 const moved=[...visible];moved.splice(to,0,...moved.splice(from,1));
 let index=0;const order=courseEntries(course).map(e=>e.day===day?moved[index++]:e);
 const ids=order.filter(e=>e.source==='native').map(e=>e.id);
 const kakao=new Map((course.kakaoPlaceRefs||[]).map(ref=>[ref.placeId,ref]));
 const refs=new Map((course.googlePlaceRefs||[]).map(ref=>[ref.placeId,ref]));
 return {...course,itineraryOrder:order.map(e=>e.key),stopDays:explicitStopDays(course),stopIds:ids,googlePlaceRefs:order.filter(e=>e.source==='google').map(e=>refs.get(e.id)),kakaoPlaceRefs:order.filter(e=>e.source==='kakao').map(e=>kakao.get(e.id)),schedule:undefined};
}
export function validItineraryOrder(course){
 if(course.itineraryOrder===undefined)return true;
 return Array.isArray(course.itineraryOrder)&&course.itineraryOrder.length<=140&&new Set(course.itineraryOrder).size===course.itineraryOrder.length&&course.itineraryOrder.every(key=>typeof key==='string'&&/^[ngk]:.{1,255}$/.test(key));
}
