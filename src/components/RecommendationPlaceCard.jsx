import {selectPlaceTags} from '../lib/placeTagSelection.js';
import React,{useEffect,useRef,useState} from 'react';
import CourseCardMeta from './CourseCardMeta.jsx';

export default function RecommendationPlaceCard({place,course,Icon,renderPhoto,onReplace,originalName,query=''}) {
 const [expanded,setExpanded]=useState(false),[overflow,setOverflow]=useState(false);
 const card=useRef(null);
 const tags=selectPlaceTags(place.tags,query);
 useEffect(()=>{
  if(expanded)return;
  const check=()=>setOverflow([...card.current.querySelectorAll('strong,.recommendation-card-tags,.recommendation-card-tags>span')].some(el=>el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1));
  const observer=new ResizeObserver(check);observer.observe(card.current);check();return()=>observer.disconnect();
 },[place.name,tags.join('|'),expanded]);
 return <div ref={card} className={`recommendation-place-card${expanded?' is-expanded':''}`}>
  <button type="button" className="recommendation-replace" aria-label={`${originalName}을 ${place.name}으로 교체`} onClick={onReplace}>
   <span className="recommendation-photo-wrap">{renderPhoto(place)}<span className="recommendation-region">{place.region}</span></span>
   <strong>{place.name}</strong>
   <span className="recommendation-card-tags">{tags.map(tag=><span key={tag}>#{tag}</span>)}</span>
   <CourseCardMeta course={{...course,region:place.region}} Icon={Icon} hideRegion/>
  </button>
  {(overflow||expanded)&&<button type="button" className="recommendation-text-more" aria-label={`${place.name} ${expanded?'접기':'더보기'}`} aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'접기':'더보기'}</button>}
 </div>;
}
