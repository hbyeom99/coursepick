import {useEffect,useState} from 'react';
const EMPTY=[];
export default function useCourseGeneration(mode,payload,enabled){
 const [state,setState]=useState({payload:null,courses:EMPTY,error:''});
 useEffect(()=>{
  if(!enabled)return;
  let worker,active=true;
  const fail=()=>{worker?.terminate();if(active)setState({payload,courses:EMPTY,error:'코스 계산을 시작하지 못했습니다. 다시 검색해 주세요.'});};
  try{
   worker=new Worker(new URL('./courseGeneration.worker.js',import.meta.url),{type:'module'});
   worker.onmessage=({data})=>{if(active)setState({payload,courses:data.courses||EMPTY,error:data.error||''});worker.terminate();};
   worker.onerror=fail;worker.postMessage({mode,payload});
  }catch{fail();}
  // A new query terminates old calculations, not just their response handler.
  return()=>{active=false;worker?.terminate();};
 },[mode,payload,enabled]);
 const current=enabled&&state.payload===payload;
 return {courses:current?state.courses:EMPTY,busy:enabled&&!current,error:current?state.error:''};
}
