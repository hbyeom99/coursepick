import GooglePlaceCard from './GooglePlaceCard.jsx';
import {straightDistance} from '../lib/pickerMap.js';
import React,{useEffect,useRef,useState} from 'react';
const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
export default function GooglePickerSearch({query,onQuery,category='전체',categoryRequest,children,onAddGoogle,googlePlaceRefs=[],anchor,onOpenGoogle}){
 const [rows,setRows]=useState([]),[origin,setOrigin]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[searched,setSearched]=useState(false),[pageToken,setPageToken]=useState(null),[anchorError,setAnchorError]=useState('');
 const controller=useRef(null);
 useEffect(()=>{controller.current?.abort();setRows([]);setOrigin(null);setPageToken(null);setError('');setAnchorError('');setSearched(false);setBusy(false);return()=>controller.current?.abort();},[query]);
 useEffect(()=>{if(categoryRequest)search();},[categoryRequest]);
 async function search(event,next=false){
  event?.preventDefault();const text=query.trim();if(text.length<2)return;
  controller.current?.abort();const request=new AbortController();controller.current=request;
  setBusy(true);setError('');setAnchorError('');
  try{const response=await fetch(base+'/api/google/search',{method:'POST',cache:'no-store',signal:request.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({query:text,category,anchor:anchor||null,pageToken:next?pageToken:null})});const data=await response.json();if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:'검색하지 못했습니다.');if(!request.signal.aborted){setRows(data.places||[]);setOrigin(data.anchor||null);setAnchorError(data.anchorError||'');setPageToken(data.nextPageToken||null);setSearched(true);}}
  catch(e){if(!request.signal.aborted)setError(e.message||'검색하지 못했습니다.');}
  finally{if(!request.signal.aborted)setBusy(false);}
 }
 const ordered=origin?[...rows].sort((a,b)=>(straightDistance(origin,a)??Infinity)-(straightDistance(origin,b)??Infinity)):rows;
 return <section className="google-picker-search" aria-label="Google 장소 검색">
  <form className="place-picker-search" onSubmit={search}><span aria-hidden="true">⌕</span><input aria-label="장소 검색" placeholder="장소명이나 지역을 검색해 보세요" maxLength={200} value={query} onChange={e=>onQuery(e.target.value)}/>{query&&<button type="button" aria-label="검색 지우기" onClick={()=>onQuery('')}>×</button>}<button type="submit" disabled={busy||query.trim().length<2}>검색</button></form>{children}
  {query.trim()&&<div className="google-picker-results">{searched&&<div className="google-picker-recommendations"><button type="button" className="text-link" disabled={busy||!pageToken} onClick={event=>search(event,true)}>다른 장소 추천 <span aria-hidden="true">↻</span></button></div>}{busy&&<p role="status">장소를 찾고 있어요…</p>}{error&&<p role="alert">{error}</p>}{anchorError&&<p className="muted" role="status">기준 장소를 확인하지 못해 거리 없이 표시합니다.</p>}{searched&&!rows.length&&!busy&&<p role="status">검색 결과가 없습니다. 지역이나 장소명을 바꿔 보세요.</p>}{ordered.map(p=><GooglePlaceCard key={p.id} place={p} onOpen={onOpenGoogle} origin={origin} onAdd={onAddGoogle} added={googlePlaceRefs.some(ref=>ref.placeId===p.id)} disabled={busy||googlePlaceRefs.length>=20}/>)}{searched&&rows.length>0&&!pageToken&&<p className="muted google-search-limit">현재 검색의 마지막 결과입니다.</p>}{googlePlaceRefs.length>=20&&<p role="status">Google 장소는 코스당 20곳까지 추가할 수 있습니다.</p>}<footer className="google-attribution"><strong>Google Maps</strong></footer></div>}
 </section>;
}
