import React,{useLayoutEffect,useRef,useState} from 'react';
import CourseVisualCard from './CourseVisualCard.jsx';
import CourseCardMeta from './CourseCardMeta.jsx';
import CourseRepresentativePhoto from './CourseRepresentativePhoto.jsx';
import useReelPhotos from '../lib/useReelPhotos.js';

const STEP=120;
export default function HomeEditorialReel({courses=[],onOpen,Icon,error,onRetry}){
 const list=courses.slice(0,10),scroll=useRef(null),frame=useRef(0);
 const circular=list.length>1,items=circular?[...list,...list,...list]:list;
 const [height,setHeight]=useState(560),[position,setPosition]=useState(0);
 const drag=useRef(null),suppressClickUntil=useRef(0);
 const [dragging,setDragging]=useState(false);
 const photos=useReelPhotos(list,position,dragging);
 const initialId=useRef(null);
 useLayoutEffect(()=>{
  const element=scroll.current;if(!element)return;
  const observer=new ResizeObserver(()=>setHeight(element.clientHeight));observer.observe(element);
  return()=>{observer.disconnect();cancelAnimationFrame(frame.current);};
 },[]);
 useLayoutEffect(()=>{
  if(!list.length||initialId.current===list[0].id)return;
  initialId.current=list[0].id;
  const initial=(circular?list.length:0)+Math.min(2,list.length-1);scroll.current.scrollTop=initial*STEP;setPosition(initial);
 },[list[0]?.id]);
 function moved(){
  cancelAnimationFrame(frame.current);frame.current=requestAnimationFrame(()=>{
   const element=scroll.current;if(!element)return;
   const cycle=list.length*STEP;let top=element.scrollTop;
   if(circular&&(top<cycle*.5||top>cycle*2.5)){
    const shift=top<cycle*.5?cycle:-cycle;top+=shift;
    if(drag.current)drag.current.top+=shift;
    element.scrollTop=top;
   }
   setPosition(top/STEP);
  });
 }
 function startDrag(event){
  if(event.pointerType==='mouse'&&event.button!==0)return;
  if(drag.current)return;
  const card=event.target.closest('.home-reel-card.is-centered');if(!card)return;
  event.preventDefault();event.stopPropagation();
  drag.current={pointerId:event.pointerId,y:event.clientY,top:scroll.current.scrollTop,course:list[Number(card.dataset.courseIndex)],moved:false};
  event.currentTarget.setPointerCapture(event.pointerId);setDragging(true);
 }
 function moveDrag(event){
  const current=drag.current;if(!current||current.pointerId!==event.pointerId)return;
  event.preventDefault();
  if(Math.abs(current.y-event.clientY)>6)current.moved=true;
  if(!current.moved)return;
  scroll.current.scrollTop=Math.max(0,Math.min((items.length-1)*STEP,current.top+current.y-event.clientY));
 }
 function finishDrag(event){
  const current=drag.current;if(!current||current.pointerId!==event.pointerId)return;
  drag.current=null;setDragging(false);suppressClickUntil.current=performance.now()+500;
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  const element=scroll.current;element.scrollTo({top:Math.round(element.scrollTop/STEP)*STEP,behavior:'smooth'});
  if(!current.moved&&event.type==='pointerup'&&current.course)onOpen(current.course);
 }
 const large=height*448/671,first=height*260.5/671,second=height*324.5/671,center=height*335/671;
 return <section ref={scroll} tabIndex={0} className="home-editorial-reel" style={dragging?{scrollSnapType:'none'}:undefined} aria-label="기획코스 10개 세로 배너" onScroll={moved}>
  {error&&<div className="home-reel-notice" role="alert"><p>{error}</p><button type="button" onClick={onRetry}>다시 불러오기</button></div>}
  {!list.length&&!error&&<p className="home-reel-notice" role="status">기획코스를 불러오는 중입니다.</p>}
  <div className="home-reel-track" style={{height:height+Math.max(0,items.length-1)*STEP}}>
   <div className={`home-reel-stage${dragging?' is-dragging':''}`} style={{height}} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag} onClickCapture={event=>{if(event.detail>0&&performance.now()<suppressClickUntil.current){event.preventDefault();event.stopPropagation();}}} onKeyDown={event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();scroll.current.scrollTo({top:(Math.round(scroll.current.scrollTop/STEP)+(event.key==='ArrowDown'?1:-1))*STEP,behavior:'smooth'});}}}>
    {items.map((course,index)=>{
     const delta=index-position,d=Math.abs(delta);if(d>2.65)return null;
     const offset=d<=1?first*d:d<=2?first+(second-first)*(d-1):second+(d-2)*38;
     const cardHeight=d<=1?large+(height*45/671-large)*d:d<=2?height*(45-2*(d-1))/671:height*43/671;
     const width=d<=1?(345-52*d)/390*100:d<=2?(293-94*(d-1))/390*100:199/390*100;
     const cover=course.editorialVisits?.find(v=>v.cover_image&&v.image_url);
     const photo=photos[course.id]||{src:cover?.image_url,alt:cover?.name};
     const edgeStrength=Math.min(1,Math.max(0,(d-1.65)/.35));
     const distanceFade=Math.min(.7,Math.max(0,(d-.35)*.34));
     return <div key={`${course.id}-${index}`} data-course-index={index%list.length} data-reel-edge={edgeStrength>0?(delta<0?'top':'bottom'):undefined} className={`home-reel-card${d<.5?' is-centered':' is-preview'}`} onDragStart={event=>event.preventDefault()} style={{top:center+Math.sign(delta)*offset,height:cardHeight,width:`${width}%`,borderRadius:10+5*Math.min(1,d),zIndex:Math.round(100-d*10),opacity:d>2?Math.max(.3,1-(d-2)/.9):1,'--reel-distance-fade':distanceFade,'--reel-edge-strength':edgeStrength,'--reel-edge-alpha':1-edgeStrength,'--reel-edge-blur':`${3*edgeStrength}px`,'--reel-copy-opacity':Math.max(0,1-d*2)}}>
      <CourseVisualCard name={course.name} tags={(course.representativeTags||course.tags||[]).slice(0,1)} photo={<span className={`home-reel-photo${photo.previous?' is-transitioning':''}`} key={photo.src||'cover'}>{photo.previous&&<img className="home-reel-previous-photo" src={photo.previous} alt="" aria-hidden="true"/>}<CourseRepresentativePhoto preservePrevious src={photo.src} alt={photo.alt||'코스 대표 사진 준비 중'}/></span>} meta={<CourseCardMeta course={course} Icon={Icon}/>} onOpen={()=>{if(d>=.5){scroll.current?.scrollTo({top:index*STEP,behavior:'smooth'});}else onOpen(course);}}/>
      {d>=.5&&<span className="home-reel-distance-wash" aria-hidden="true"/>}
     </div>;
    })}

   </div>
   {items.map((course,index)=><span key={`${course.id}-${index}`} className="home-reel-snap" aria-hidden="true" style={{top:index*STEP}}/>)}
  </div>
 </section>;
}
