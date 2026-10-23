import {useEffect,useState} from 'react';
const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
export default function useEditorialPlaces(visits){
 const [rows,setRows]=useState({});
 const key=JSON.stringify([...new Map(visits.filter(v=>v.kakaoRef).map(v=>[v.kakaoRef.placeId,{...v.kakaoRef,day:1}])).values()]);
 useEffect(()=>{const refs=JSON.parse(key);if(!refs.length){setRows({});return;}const controller=new AbortController();setRows({});
 fetch(base+'/api/kakao/places/references',{method:'POST',cache:'no-store',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({refs})}).then(async r=>{if(!r.ok)throw Error();const data=await r.json();if(!controller.signal.aborted)setRows(Object.fromEntries((data.places||[]).map(p=>[p.id,p])));}).catch(()=>{});
 return()=>controller.abort();},[key]);return rows;
}
