import {useEffect,useMemo,useRef,useState} from 'react';

// Only editorial photo URLs already attached to the course are used here.
export default function useReelPhotos(courses,position,dragging){
 const signature=JSON.stringify(courses.map(course=>[course.id,...(course.editorialVisits||[]).map(v=>[v.image_url,v.cover_image,v.name])]));
 const entries=useMemo(()=>courses.map(course=>{
  const visits=(course.editorialVisits||[]).filter(v=>v.image_url);
  const cover=visits.find(v=>v.cover_image)||visits[0];
  const photos=[...new Map(visits.map(v=>[v.image_url,{src:v.image_url,alt:v.name||course.name}])).values()];
  return {id:course.id,photos,initial:cover?{src:cover.image_url,alt:cover.name||course.name}:null};
 }),[signature]);
 const [shown,setShown]=useState({});
 const model=useRef(null),mounted=useRef(false),loads=useRef(new Map());
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{
  model.current={seen:new Set(),last:null,round:0,choices:new Map(),applied:new Set(),shown:new Map(entries.map(e=>[e.id,e.initial]))};
  setShown(Object.fromEntries(entries.map(e=>[e.id,e.initial])));
 },[entries]);
 function preload(photo){
  if(!photo)return Promise.resolve(false);
  if(loads.current.has(photo.src))return loads.current.get(photo.src);
  const pending=new Promise(resolve=>{
   const image=new Image();image.onload=()=>resolve(true);image.onerror=()=>{loads.current.delete(photo.src);resolve(false);};image.src=photo.src;
  });
  loads.current.set(photo.src,pending);return pending;
 }
 useEffect(()=>{
  if(dragging||!entries.length||Math.abs(position-Math.round(position))>.04)return;
  const index=((Math.round(position)%entries.length)+entries.length)%entries.length;
  const timer=setTimeout(()=>{
   const current=model.current,entry=entries[index];if(!current||current.last===entry.id)return;
   // Returning early or changing direction does not complete a round.
   if(current.seen.size===entries.length){
    current.round++;current.seen.clear();current.applied.clear();current.choices.clear();
    for(const item of entries){
     const previous=current.shown.get(item.id)?.src;
     const alternatives=item.photos.filter(photo=>photo.src!==previous);
     const options=alternatives.length?alternatives:item.photos;
     current.choices.set(item.id,options[Math.floor(Math.random()*options.length)]||item.initial);
    }
   }
   current.last=entry.id;current.seen.add(entry.id);
   if(current.round>0&&!current.applied.has(entry.id)){
    current.applied.add(entry.id);const photo=current.choices.get(entry.id),round=current.round;
    if(photo&&photo.src!==current.shown.get(entry.id)?.src)preload(photo).then(ready=>{
     if(!ready||!mounted.current||model.current!==current||current.round!==round)return;
     current.shown.set(entry.id,photo);setShown(previous=>({...previous,[entry.id]:photo}));
    });
   }
   // Prepare at most the neighboring two courses, not every image on scroll.
   for(const offset of [-1,1]){
    const neighbor=entries[(index+offset+entries.length)%entries.length];
    preload(current.choices.get(neighbor.id)||current.shown.get(neighbor.id));
   }
  },180);
  return()=>clearTimeout(timer);
 },[position,dragging,entries]);
 return shown;
}
