import React,{useEffect,useRef,useState} from 'react';
import MapPanel from './MapPanel.jsx';
import CourseRepresentativePhoto from './CourseRepresentativePhoto.jsx';
import {straightDistance,distanceLabel} from '../lib/pickerMap.js';
const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
export default function KakaoPickerSearch({query,onQuery,category='전체',categoryRequest,children,onAddKakao,kakaoPlaceRefs=[],anchor,onOpenKakao}){
 const [result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState(null);
 const controller=useRef(null);
 useEffect(()=>{controller.current?.abort();setResult(null);setError('');setBusy(false);setSelected(null);return()=>controller.current?.abort();},[query]);
 useEffect(()=>{if(categoryRequest)search();},[categoryRequest]);
 async function search(event,next=false){
  event?.preventDefault();const text=query.trim();if(!text)return;
  controller.current?.abort();const request=new AbortController();controller.current=request;
  setBusy(true);setError('');
  try{const page=next?(result?.page||1)+1:1;const response=await fetch(base+'/api/kakao/places/search',{method:'POST',cache:'no-store',signal:request.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({query:text,category,page})});const data=await response.json();if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:'검색하지 못했습니다.');if(!request.signal.aborted){setResult({...data,query:text,category,places:(data.places||[]).map(p=>({...p,lookup:{query:text,category,page}}))});setSelected(null);}}
  catch(e){if(!request.signal.aborted)setError(e.message||'검색하지 못했습니다.');}
  finally{if(!request.signal.aborted)setBusy(false);}
 }
 const rows=result?.places||[];
 // Sort within a returned page; retain the original page in every lookup reference.
 const ordered=anchor?[...rows].sort((a,b)=>(straightDistance(anchor,a)??Infinity)-(straightDistance(anchor,b)??Infinity)):rows;
 function open(id){setSelected(id);const place=rows.find(p=>p.id===id);if(place)onOpenKakao?.(place);}
 return <section className="google-picker-search" aria-label="카카오 장소 검색"><form className="place-picker-search" onSubmit={search}><span aria-hidden="true">⌕</span><input aria-label="장소 검색" placeholder="장소명이나 지역을 검색해 보세요" maxLength={80} value={query} onChange={e=>onQuery(e.target.value)}/>{query&&<button type="button" aria-label="검색 지우기" onClick={()=>onQuery('')}>×</button>}<button type="submit" disabled={busy||!query.trim()}>검색</button></form>{children}
 {query.trim()&&<div className="google-picker-results">{rows.length>0&&<div className="place-picker-map"><MapPanel place={rows[0]} places={rows} selectedId={selected} onSelectPlace={open}/></div>}{result&&<div className="google-picker-recommendations"><button type="button" className="text-link" disabled={busy||!result.hasMore} onClick={event=>search(event,true)}>다른 장소 추천 ↻</button></div>}{busy&&<p role="status">장소를 찾고 있어요…</p>}{error&&<p role="alert">{error}</p>}{result&&!rows.length&&!busy&&<p role="status">검색 결과가 없습니다. 지역이나 장소명을 바꿔 보세요.</p>}
 {ordered.map(place=>{const added=kakaoPlaceRefs.some(ref=>ref.placeId===place.id),distance=straightDistance(anchor,place);return <article className="place-result google-place-card" key={place.id}><div className="google-place-thumb"><button type="button" className="google-place-photo-button" aria-label={`${place.name} 장소 상세보기`} onClick={()=>open(place.id)}><CourseRepresentativePhoto alt={place.name} placeholderAlt={`${place.name} · 사진 준비 중`}/></button></div><div className="google-place-copy"><div className="picker-place-heading"><p className="overline">{[place.region,place.category].filter(Boolean).join(' · ')}</p><button type="button" className="pill secondary picker-add-place" disabled={busy||added||kakaoPlaceRefs.length>=20} aria-label={`${place.name} ${added?'추가됨':'추가'}`} onClick={()=>onAddKakao?.(place)}>{added?'추가됨':'+ 장소 추가'}</button></div><button type="button" className="google-place-title" onClick={()=>open(place.id)}><h3>{place.name}</h3></button><div className="tags google-place-tags">{(place.tags||[]).map(tag=><span key={tag} title="장소 분류에 따른 자동 키워드">#{tag}</span>)}</div>{anchor?<p className="picker-place-distance">{anchor.name}에서 {distance==null?'거리 확인 불가':`${distanceLabel(distance)} · 직선거리`}</p>:<p className="google-place-address">{place.roadAddress||place.address}</p>}</div></article>;})}
 {result&&rows.length>0&&!result.hasMore&&<p className="muted">현재 검색의 마지막 결과입니다.</p>}{kakaoPlaceRefs.length>=20&&<p role="status">카카오 장소는 코스당 20곳까지 추가할 수 있습니다.</p>}</div>}</section>;
}
