import useEditorialPlaces from '../lib/useEditorialPlaces.js';
import React from 'react';
import CourseRepresentativePhoto from './CourseRepresentativePhoto.jsx';
import CourseTimeline from './CourseTimeline.jsx';
import {kakaoPlaceDetailUrl} from '../lib/kakaoPlaceLink.js';
import {hasPlacePhoto} from '../lib/placePhotoRequests.js';
export default function EditorialTimeline({course,day,onOpenVisit,catalog=[]}){
 const resolved=useEditorialPlaces(course.editorialVisits);
 const byId=new Map(catalog.map(p=>[p.id,p]));
 const entries=course.editorialVisits.filter(v=>v.day===day).map(v=>({id:v.visit_id,name:resolved[v.kakaoRef?.placeId]?.name||v.name,tags:resolved[v.kakaoRef?.placeId]?.tags||byId.get(v.place_id)?.tags||v.tags||[],imageUrl:hasPlacePhoto(v.image_url)?v.image_url:byId.get(v.place_id)?.imageUrl,kakaoUrl:kakaoPlaceDetailUrl({...byId.get(v.place_id),...v}),timing:{time:v.time,label:v.activity,...course.stopDetails?.['v:'+v.visit_id]},note:course.stopDetails?.['v:'+v.visit_id]?.note,notice:v.match_status==='itinerary_only'?'방문 장소 선정 필요':null,visit:v}));
 return <><CourseTimeline entries={entries} onOpen={entry=>onOpenVisit(entry.visit)} renderPhoto={p=><CourseRepresentativePhoto src={p.imageUrl} kakaoMapUrl={kakaoPlaceDetailUrl(p)} alt={p.name}/>}/>{course.editorialNotices?.length>0&&<details className="editorial-standard-notices"><summary>방문 전 확인할 내용</summary><ul>{course.editorialNotices.map((text,index)=><li key={index}>{text}</li>)}</ul><p>표시된 시간은 계획한 방문 시각입니다. 운영일·예약·체류시간·이동시간은 방문 전에 확인해 주세요.</p></details>}</>;
}
