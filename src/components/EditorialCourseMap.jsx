import useEditorialPlaces from '../lib/useEditorialPlaces.js';
import React from 'react';
import MapPanel from './MapPanel.jsx';
export default function EditorialCourseMap({course,catalog,day,onOpenVisit}){
 const visits=course.editorialVisits.filter(v=>Number(v.day||1)===Number(day)),byId=new Map((catalog||[]).map(p=>[p.id,p]));
 const resolved=useEditorialPlaces(visits);
 const markerNumbers=new Map();
 visits.forEach((visit,index)=>{const id=visit.kakaoRef?.placeId||visit.place_id;if(id&&!markerNumbers.has(id))markerNumbers.set(id,index+1);});
 const points=[...new Map(visits.map(v=>{
  const refId=v.kakaoRef?.placeId;
  const place=(refId&&resolved[refId])||byId.get(v.place_id);
  const id=place?.id||refId||v.place_id;
  const latitude=Number(place?.latitude??v.latitude),longitude=Number(place?.longitude??v.longitude);
  if(!id||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180||/^p\d+$/.test(String(id)))return null;
  return [id,{...place,id,name:place?.name||v.name||'여행 장소',category:place?.category||v.category,latitude,longitude}];
 }).filter(Boolean)).values()];
 return <div className="editorial-course-map">{points.length?<MapPanel showRoute markerNumbers={markerNumbers} place={points[0]} places={points} onSelectPlace={id=>{const visit=visits.find(v=>v.place_id===id||v.kakaoRef?.placeId===id);if(visit)onOpenVisit(visit);}}/>:<p className="muted">좌표가 확인된 장소가 없어 지도를 표시할 수 없습니다.</p>}</div>;
}
