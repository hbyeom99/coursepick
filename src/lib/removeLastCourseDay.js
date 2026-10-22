import {courseDayCount,courseDay} from './courseDays.js';
export function removeCourseDay(course,day){
 const count=courseDayCount(course);if(count<=1||!Number.isInteger(day)||day<1||day>count)return course;
 const shift=value=>value>day?value-1:value;
 const stopIds=(course.stopIds||[]).filter(id=>courseDay(course,id)!==day);
 const refs=rows=>(rows||[]).filter(r=>r.day!==day).map(r=>({...r,day:shift(r.day)}));
 const googlePlaceRefs=refs(course.googlePlaceRefs),kakaoPlaceRefs=refs(course.kakaoPlaceRefs);
 const keys=new Set([...stopIds.map(id=>'n:'+id),...googlePlaceRefs.map(r=>'g:'+r.placeId),...kakaoPlaceRefs.map(r=>'k:'+r.placeId)]);
 return {...course,durationDays:count-1,stopIds,googlePlaceRefs,kakaoPlaceRefs,stopDays:Object.fromEntries(stopIds.map(id=>[id,shift(courseDay(course,id))])),schedule:course.schedule?.filter((_,i)=>stopIds.includes(course.stopIds[i])).map(entry=>entry?{...entry,day:shift(entry.day||1)}:entry),itineraryOrder:course.itineraryOrder?.filter(key=>keys.has(key))};
}
export function removeLastCourseDay(course){return removeCourseDay(course,courseDayCount(course));}
