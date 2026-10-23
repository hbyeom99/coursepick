import {useEffect,useState} from 'react';
import {kakaoPhotoId,requestPlacePhoto} from './placePhotoRequests.js';
export default function useKakaoPlacePhoto(mapUrl,enabled,targetRef){
 const [state,setState]=useState(null);
 const id=kakaoPhotoId(mapUrl);
 useEffect(()=>{
  if(!id||!enabled)return;
  let active=true,started=false,observer;
  const start=()=>{
   if(started||!active||document.hidden)return;
   started=true;observer?.disconnect();setState({id,loading:true});
   requestPlacePhoto(id).then(value=>{if(active)setState({id,loading:false,...value});});
  };
  const element=targetRef?.current;
  const visible=()=>{if(!element)return false;const r=element.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;};
  if(element&&typeof IntersectionObserver!=='undefined'){
   observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))start();},{threshold:0});observer.observe(element);
  }
  const resume=()=>{if(visible())start();};
  document.addEventListener('visibilitychange',resume);
  if(!element||(typeof IntersectionObserver==='undefined'&&visible()))start();
  return()=>{active=false;observer?.disconnect();document.removeEventListener('visibilitychange',resume);};
 },[id,enabled,targetRef]);
 return {photo:enabled&&state?.id===id&&state.imageUrl?state:null,loading:Boolean(enabled&&state?.id===id&&state.loading),unavailable:Boolean(enabled&&state?.id===id&&!state.loading&&!state.imageUrl)};
}
