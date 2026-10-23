import React from 'react';
import CourseRepresentativePhoto from './CourseRepresentativePhoto.jsx';
import PlaceDetails from './PlaceDetails.jsx';
import {kakaoPlaceDetailUrl} from '../lib/kakaoPlaceLink.js';
function Photo({place}){return <CourseRepresentativePhoto src={place.imageUrl} alt={place.name} placeholderAlt={`${place.name} · 사진 준비 중`}/>;}
export default function KakaoPlaceDetails({place,onAdd,added,disabled,editorial}){
 const p={...place,location:place.roadAddress||place.address,imageUrl:editorial?.image_url||editorial?.imageUrl||place.imageUrl,description:editorial?.description||editorial?.activity||place.description};
 return <PlaceDetails p={p} Photo={Photo} mapUrl={kakaoPlaceDetailUrl(place)} headingAction={onAdd&&<button type="button" className="pill secondary picker-add-place" disabled={added||disabled} onClick={()=>onAdd(place)}>{added?'추가됨':'+ 장소 추가'}</button>} basicExtra={editorial?.time&&<><dt>계획한 방문 시각</dt><dd>{editorial.day?`${editorial.day}일차 · `:''}{editorial.time}</dd></>} externalInfo={editorial?.image_note&&<p className="muted">{editorial.image_note}</p>}/>;
}
