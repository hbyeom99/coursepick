import {useMemberContext} from './memberSession.jsx';
import {generateAICourses} from './aiCourseGeneration.js';
import {useEffect,useState} from 'react';
const EMPTY=[];
export default function useCourseGeneration(mode,payload,enabled){
 const member=useMemberContext(),token=member?.account?.isGuest?null:member?.account?.access_token;
 const [state,setState]=useState({payload:null,courses:EMPTY,error:''});
 useEffect(()=>{
  if(!enabled)return;
  let worker,active=true;const controller=new AbortController();
  const fail=()=>{worker?.terminate();if(active)setState({payload,courses:EMPTY,error:'코스 계산을 시작하지 못했습니다. 다시 검색해 주세요.'});};
  try{
   worker=new Worker(new URL('./courseGeneration.worker.js',import.meta.url),{type:'module'});
   worker.onmessage=async({data})=>{worker.terminate();try{if(data.error)throw Error(data.error);const courses=mode==='ai'?await generateAICourses(data.courses||EMPTY,payload,controller.signal,token):data.courses||EMPTY;if(active)setState({payload,courses,error:''});}catch(error){if(active)setState({payload,courses:EMPTY,error:error.name==='TimeoutError'?'AI 코스 생성 시간이 초과됐어요. 다시 시도해 주세요.':error.message});}};
   worker.onerror=fail;worker.postMessage({mode,payload});
  }catch{fail();}
  // A new query terminates old calculations, not just their response handler.
  return()=>{active=false;controller.abort();worker?.terminate();};
 },[mode,payload,enabled,token]);
 const current=enabled&&state.payload===payload;
 return {courses:current?state.courses:EMPTY,busy:enabled&&!current,error:current?state.error:''};
}
