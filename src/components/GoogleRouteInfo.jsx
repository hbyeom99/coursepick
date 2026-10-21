import React,{useEffect,useRef,useState} from 'react';
const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
const modes={'도보':'WALK','자동차':'DRIVE','대중교통':'TRANSIT'};
export default function GoogleRouteInfo({origin,destination,transport='도보'}){
 const [state,setState]=useState({}),controller=useRef(null);
 const mode=modes[transport]||'WALK',key=JSON.stringify([origin?.endpoint,destination?.endpoint,mode]);
 useEffect(()=>{controller.current?.abort();setState({});return()=>controller.current?.abort();},[key]);
 if(!origin||!destination)return null;
 const unsupported=mode!=='TRANSIT'&&(origin.countryCode==='KR'||destination.countryCode==='KR');
 async function load(){controller.current?.abort();const request=new AbortController();controller.current=request;setState({busy:true});try{const response=await fetch(base+'/api/google/route',{method:'POST',signal:request.signal,cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin:origin.endpoint,destination:destination.endpoint,travelMode:mode})});const data=await response.json();if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:'이동정보를 불러오지 못했습니다.');if(!request.signal.aborted)setState(data);}catch(e){if(!request.signal.aborted)setState({error:e.message});}}
 return <div className="google-route-info">{unsupported?<small>국내 {transport} 경로는 Google API 미지원 · 직선거리 기준</small>:<>{state.status==='ok'?<p role="status">{transport} 약 {Math.ceil(state.durationSeconds/60)}분 · {state.distanceMeters<1000?`${Math.round(state.distanceMeters)}m`:`${(state.distanceMeters/1000).toFixed(1)}km`} · <span translate="no" className="google-text-attribution">Google Maps</span> 조회 기준</p>:<button type="button" className="text-link" disabled={state.busy} onClick={load}>{state.busy?'이동정보 조회 중…':`${transport} 실제 이동정보 조회`}</button>}{state.message&&<small role="status">{state.message}</small>}{state.error&&<small role="alert">{state.error}</small>}</>}</div>;
}
