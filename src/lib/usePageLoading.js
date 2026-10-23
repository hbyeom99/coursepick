import {useEffect,useRef,useState} from 'react';
// One bounded loading session per navigation. Later photo slides never reopen it.
export default function usePageLoading(key,dataBusy){
 const [state,setState]=useState({key:null,loading:true});
 const busy=useRef(dataBusy);busy.current=dataBusy;
 useEffect(()=>{
  let active=true,settled=false,quiet;
  const started=performance.now();
  setState({key,loading:true});
  const finish=()=>{if(!active||settled)return;settled=true;clearTimeout(quiet);setState({key,loading:false});};
  const check=()=>{
   if(settled)return;
   const pending=Array.from(document.querySelectorAll('.app-shell img')).some(img=>{
    const r=img.getBoundingClientRect();
    if(!r.width||!r.height||r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth||getComputedStyle(img).visibility==='hidden')return false;
    return img.dataset.imageLoading==='true'||(!img.complete&&Boolean(img.getAttribute('src')));
   })||Boolean(document.querySelector('[data-photo-resolving="true"]'));
   clearTimeout(quiet);
   if(!busy.current&&!pending)quiet=setTimeout(finish,200);
  };
  const observer=new MutationObserver(check);
  observer.observe(document.getElementById('root'),{subtree:true,childList:true,attributes:true,attributeFilter:['src','data-image-loading','data-photo-resolving','data-page-busy']});
  document.addEventListener('load',check,true);document.addEventListener('error',check,true);
  const timer=setTimeout(finish,Math.max(0,30000-(performance.now()-started)));
  check();
  return()=>{active=false;observer.disconnect();clearTimeout(timer);clearTimeout(quiet);document.removeEventListener('load',check,true);document.removeEventListener('error',check,true);};
 },[key]);
 // Busy state is observed without restarting the 30-second navigation deadline.
 useEffect(()=>{document.getElementById('root')?.setAttribute('data-page-busy',dataBusy?'true':'false');},[dataBusy]);
 return state.key!==key||state.loading;
}
