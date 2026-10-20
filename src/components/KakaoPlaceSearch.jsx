import React,{useEffect,useRef,useState} from 'react';
import MapPanel from './MapPanel.jsx';
import CourseRepresentativePhoto from './CourseRepresentativePhoto.jsx';
import {matchExistingPlace} from '../lib/kakaoPlaceMatch.js';

export default function KakaoPlaceSearch({query,region,anchor,catalog,onOpenExisting}) {
 const [state,setState]=useState({status:'idle',places:[],page:1,hasMore:false,error:''});
 const [selected,setSelected]=useState(null);
 const request=useRef(null),sequence=useRef(0),detail=useRef(null);
 useEffect(()=>{if(!selected)return;const previous=document.activeElement;detail.current?.querySelector('button')?.focus();return()=>previous?.focus();},[selected]);
 useEffect(()=>()=>{sequence.current++;request.current?.abort();},[]);
 async function search(page=1) {
  if(!query.trim())return;
  request.current?.abort();const controller=new AbortController();request.current=controller;
  const seq=++sequence.current;
  setSelected(null);setState(current=>({...current,status:'loading',error:'',places:[]}));
  const timer=setTimeout(()=>controller.abort(),18000);
  try {
   const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
   const body={query:query.trim(),region:region||'',page};
   if(Number.isFinite(anchor?.latitude)&&Number.isFinite(anchor?.longitude)){body.latitude=anchor.latitude;body.longitude=anchor.longitude;}
   const response=await fetch(base+'/api/kakao/places/search',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify(body),signal:controller.signal});
   const data=await response.json();
   if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:'검색에 실패했습니다.');
   if(!Array.isArray(data.places))throw Error('검색 결과를 확인할 수 없습니다.');
   if(seq===sequence.current)setState({status:'success',places:data.places,page,hasMore:data.hasMore===true,error:''});
  } catch(error) {
   if(seq===sequence.current)setState({status:'error',places:[],page,hasMore:false,error:controller.signal.aborted?'검색 시간이 초과되었습니다. 다시 시도해 주세요.':error.message});
  } finally {clearTimeout(timer);}
 }
 const points=state.places.map(place=>({...place,id:`kakao-live-${place.id}`,imageUrl:'',tags:[]}));
 const active=state.places.find(place=>place.id===selected);
 const matched=active&&matchExistingPlace(active,catalog);
 return <section className="kakao-live-search" aria-label="카카오에서 장소 찾기">
  <button type="button" className="pill secondary kakao-search-trigger" disabled={!query.trim()||state.status==='loading'} onClick={()=>search()}>카카오에서 더 찾기</button>
  {!query.trim()&&<p className="muted">검색어를 입력하면 카카오에서도 장소를 찾을 수 있어요.</p>}
  {state.status!=='idle'&&<><h3>카카오 검색 결과</h3><p className="muted">{anchor?'코스 기준 장소 주변 20km에서 검색합니다.':'현재 지역을 검색어에 반영합니다.'} 결과는 현재 화면에서만 사용합니다.</p>
  {state.status==='loading'&&<p role="status">장소를 찾는 중입니다.</p>}
  {state.status==='error'&&<p role="alert">{state.error}<button type="button" className="text-link" onClick={()=>search(state.page)}>다시 시도</button></p>}
  {points.length>0&&<div className="place-picker-map"><MapPanel showRoute routePlaces={[]} place={points[0]} places={points} selectedId={selected?`kakao-live-${selected}`:null} onSelectPlace={id=>setSelected(id.replace('kakao-live-',''))}/></div>}
  <div className="picker-list">{state.places.map(place=>{const existing=matchExistingPlace(place,catalog);return <article className="place-result kakao-result" key={place.id}><button type="button" className="picker-photo-button" aria-label={`${place.name} 카카오 검색 상세보기`} onClick={()=>setSelected(place.id)}><CourseRepresentativePhoto placeholderAlt="장소 사진 준비 중"/></button><div><p className="overline">카카오 검색 결과 · {place.category}</p><button type="button" className="title-button" onClick={()=>setSelected(place.id)}><h3>{place.name}</h3></button><p>{place.roadAddress||place.address}</p>{existing&&<button type="button" className="text-link" onClick={()=>onOpenExisting(existing.id)}>기존 DB 장소 확인</button>}</div></article>;})}</div>
  {state.status==='success'&&!points.length&&<p role="status">검색 결과가 없습니다. 다른 검색어로 찾아보세요.</p>}
  {state.status==='success'&&state.hasMore&&<button type="button" className="picker-more-button" onClick={()=>search(state.page+1)}>다음 검색 결과</button>}
  </>}
  {active&&<div className="kakao-detail-backdrop" onClick={event=>{if(event.target===event.currentTarget)setSelected(null);}}><section ref={detail} className="kakao-detail" role="dialog" aria-modal="true" aria-label={`${active.name} 검색 상세`} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();setSelected(null);}if(event.key==='Tab'){event.stopPropagation();const controls=[...detail.current.querySelectorAll('button:not(:disabled),a[href]')];const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}}}><button type="button" className="text-link" onClick={()=>setSelected(null)}>검색 상세 닫기</button><CourseRepresentativePhoto placeholderAlt="장소 사진 준비 중"/><h3>{active.name}</h3><p>{active.category}</p><p>{active.roadAddress||active.address}</p>{active.phone&&<p>{active.phone}</p>}<a className="pill secondary" href={active.url} target="_blank" rel="noopener noreferrer">카카오맵에서 보기</a>{matched?<button type="button" className="pill primary" onClick={()=>{setSelected(null);onOpenExisting(matched.id);}}>기존 DB 장소로 연결</button>:<p className="muted">기존 DB에 연결된 장소가 없어 위치 확인만 가능합니다. 외부 검색 정보는 코스에 저장하지 않습니다.</p>}</section></div>}
 </section>;
}
