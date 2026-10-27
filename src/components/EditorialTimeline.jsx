import useEditorialPlaces from '../lib/useEditorialPlaces.js';
import React from 'react';
import CourseRepresentativePhoto from './CourseRepresentativePhoto.jsx';
import CourseTimeline from './CourseTimeline.jsx';
import {kakaoPlaceDetailUrl} from '../lib/kakaoPlaceLink.js';
import {hasPlacePhoto} from '../lib/placePhotoRequests.js';
export default function EditorialTimeline({course,day,onOpenVisit,catalog=[]}){
 const resolved=useEditorialPlaces(course.editorialVisits);
 const byId=new Map(catalog.map(p=>[p.id,p]));
 const entries=course.editorialVisits.filter(v=>v.day===day).map(v=>({id:v.visit_id,openingHours:resolved[v.kakaoRef?.placeId]?.openingHours||byId.get(v.place_id)?.openingHours||v.openingHours||v.opening_hours,name:resolved[v.kakaoRef?.placeId]?.name||v.name,tags:resolved[v.kakaoRef?.placeId]?.tags||byId.get(v.place_id)?.tags||v.tags||[],imageUrl:hasPlacePhoto(v.image_url)?v.image_url:byId.get(v.place_id)?.imageUrl,kakaoUrl:kakaoPlaceDetailUrl({...byId.get(v.place_id),...v}),timing:{time:v.time,label:v.activity,...course.stopDetails?.['v:'+v.visit_id]},note:course.stopDetails?.['v:'+v.visit_id]?.note,notice:v.match_status==='itinerary_only'?'방문 장소 선정 필요':null,visit:v}));
 return <><CourseTimeline inlineTime entries={entries} onOpen={entry=>onOpenVisit(entry.visit)} renderPhoto={p=><CourseRepresentativePhoto src={p.imageUrl} kakaoMapUrl={kakaoPlaceDetailUrl(p)} alt={p.name}/>}/></>;
}
