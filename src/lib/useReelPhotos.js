import {useEffect,useMemo,useRef,useState} from 'react';

// Only existing editorial images are used; scrolling never selects a new cover.
export default function useReelPhotos(courses,position,dragging){
 const signature=JSON.stringify(courses.map(c=>[c.id,c.name,...(c.editorialVisits||[]).map(v=>[v.image_url,v.cover_image,v.name])]));
 const entries=useMemo(()=>courses.map(course=>{
  const visits=(course.editorialVisits||[]).filter(v=>v.image_url&&!/^data:image\/svg\+xml/i.test(v.image_url));
  const cover=visits.find(v=>v.cover_image)||visits[0];
  return {id:course.id,photos:[...new Map(visits.map(v=>[v.image_url,{src:v.image_url,alt:v.name||course.name}])).values()],initial:cover?{src:cover.image_url,alt:cover.name||course.name}:null};
 }),[signature]);
 const [shown,setShown]=useState({}),[paused,setPaused]=useState(false),current=useRef({});
 useEffect(()=>{const initial=Object.fromEntries(entries.map(e=>[e.id,e.initial]));current.current=initial;setShown(initial);},[entries]);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setPaused(document.hidden||media.matches);
  update();document.addEventListener('visibilitychange',update);media.addEventListener('change',update);
  return()=>{document.removeEventListener('visibilitychange',update);media.removeEventListener('change',update);};
 },[]);
 useEffect(()=>{
  if(paused||document.hidden||dragging||!entries.length||Math.abs(position-Math.round(position))>.04)return;
  const index=((Math.round(position)%entries.length)+entries.length)%entries.length,entry=entries[index];
  if(entry.photos.length<2)return;
  let active=true,timer,image;
  function advance(){
   const old=current.current[entry.id]||entry.initial;
   const nextIndex=(entry.photos.findIndex(p=>p.src===old?.src)+1)%entry.photos.length;
   const photo=entry.photos[nextIndex];
   image=new Image();
   image.onload=()=>{
    if(!active||document.hidden)return;
    const next={...photo,previous:old?.src};current.current={...current.current,[entry.id]:next};
    setShown(current.current);timer=setTimeout(advance,3000);
   };
   image.onerror=()=>{if(active)timer=setTimeout(advance,3000);};
   image.src=photo.src;
  }
  timer=setTimeout(advance,3000);
  return()=>{active=false;clearTimeout(timer);if(image){image.onload=null;image.onerror=null;}};
 },[position,dragging,entries,paused]);
 return shown;
}
