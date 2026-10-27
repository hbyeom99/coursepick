import React,{useLayoutEffect,useRef,useState} from 'react';
import CourseCardMeta from './CourseCardMeta.jsx';
import DesignIcon from './DesignIcon.jsx';
function CardIcon({name,size}){return name==='car'?<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 9 2-5h12l2 5M3 10h18v9H3ZM6 19v2M18 19v2M3 13h18M6 16h2M16 16h2"/></svg>:<DesignIcon name={name} size={size}/>;}
export default function CourseCardOverlay({name,tags=[],course,meta,note}){
 const titleRef=useRef(null);
 const tagsRef=useRef(null);
 const [splitTags,setSplitTags]=useState(false);
 const [titleOverflow,setTitleOverflow]=useState(false);
 useLayoutEffect(()=>{
  const element=titleRef.current;if(!element)return;
  const measure=()=>setTitleOverflow(element.scrollHeight>element.clientHeight+1);
  measure();const observer=new ResizeObserver(measure);observer.observe(element);
  let active=true;document.fonts?.ready.then(()=>{if(active)measure();});
  return()=>{active=false;observer.disconnect();};
 },[name]);
 const labels=[...new Set(tags.filter(t=>typeof t==='string').map(t=>t.replace(/^#+/,'').trim()).filter(Boolean))].slice(0,3);
 useLayoutEffect(()=>{
  const element=tagsRef.current;if(!element)return;
  const measure=()=>{
   const items=[...element.children];
   const gap=parseFloat(getComputedStyle(element).columnGap)||0;
   const required=items.reduce((sum,item)=>sum+item.offsetWidth,0)+Math.max(0,items.length-1)*gap;
   setSplitTags(items.length>1&&required>element.clientWidth+0.5);
  };
  measure();const observer=new ResizeObserver(measure);observer.observe(element);
  let active=true;document.fonts?.ready.then(()=>{if(active)measure();});
  return()=>{active=false;observer.disconnect();};
 },[labels.join('\u0000')]);
 return <span className="u-course-overlay"><span className="u-course-heading"><strong ref={titleRef}>{name}</strong>{titleOverflow&&<span className="u-course-title-ellipsis" aria-hidden="true">...</span>}</span><span ref={tagsRef} className={`u-course-tags${splitTags?' is-split':''}`}>{labels.map(tag=><span key={tag}>#{tag}</span>)}</span><span className="u-course-meta">{course?<CourseCardMeta course={course} Icon={CardIcon}/>:meta}</span>{note&&<small className="u-course-note">{note}</small>}</span>;
}
