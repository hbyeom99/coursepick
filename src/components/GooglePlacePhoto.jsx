import React,{useState} from 'react';
import {COURSE_IMAGE_PLACEHOLDER} from './CourseRepresentativePhoto.jsx';
const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
export default function GooglePlacePhoto({place,large=false}){
 const [failed,setFailed]=useState('');
 const source=place.photoToken?base+'/api/google/photo?token='+encodeURIComponent(place.photoToken)+'&size='+(large?640:192):'';
 const ready=Boolean(source&&source!==failed);
 return <img className={`course-representative-image${ready?'':' course-image-placeholder'}`} loading="lazy" src={ready?source:COURSE_IMAGE_PLACEHOLDER} alt={ready?place.name:`${place.name} · 사진 준비 중`} referrerPolicy="no-referrer" onError={ready?()=>setFailed(source):undefined}/>;
}
