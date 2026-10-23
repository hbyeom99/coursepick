import useEditorialPlaces from '../lib/useEditorialPlaces.js';
import React from 'react';
import MapPanel from './MapPanel.jsx';
export default function EditorialCourseMap({course,catalog,day,onOpenVisit}){
 const resolved=useEditorialPlaces(course.editorialVisits);
 const visits=course.editorialVisits.filter(v=>v.day===day),byId=new Map(catalog.map(p=>[p.id,p]));
 const points=[...new Map(visits.map(v=>v.kakaoRef?resolved[v.kakaoRef.placeId]:byId.get(v.place_id)).filter(p=>p&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&!/^p\d+$/.test(p.id)).map(p=>[p.id,p])).values()];
 return <div className="editorial-course-map">{points.length?<MapPanel place={points[0]} places={points} onSelectPlace={id=>{const visit=visits.find(v=>v.place_id===id||v.kakaoRef?.placeId===id);if(visit)onOpenVisit(visit);}}/>:<p className="muted">좌표가 확인된 장소가 없어 지도를 표시할 수 없습니다.</p>}</div>;
}
