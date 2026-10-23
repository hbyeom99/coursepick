import React,{useState} from 'react';
import CourseRepresentativePhoto from './CourseRepresentativePhoto.jsx';
export default function CourseCoverPhoto({candidates,courseId,onImageSelected}){
 const signature=JSON.stringify(candidates.map(c=>[c.key,c.src,c.kakaoMapUrl]));
 const [state,setState]=useState({signature:'',index:0});
 const index=state.signature===signature?state.index:0;
 const candidate=candidates[index];
 const advance=()=>setState(current=>{
  const currentIndex=current.signature===signature?current.index:0;
  return currentIndex===index?{signature,index:index+1}:current;
 });
 return <CourseRepresentativePhoto key={signature+'|'+index} src={candidate?.src} kakaoMapUrl={candidate?.kakaoMapUrl} alt={candidate?.alt||'코스 대표 사진 준비 중'} title={candidate?.title} onLoad={()=>{if(candidate?.placeId)onImageSelected?.(courseId,candidate.placeId);}} onError={candidate?advance:undefined}/>;
}
