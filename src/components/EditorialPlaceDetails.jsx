import PlaceDetails from './PlaceDetails.jsx';
import React,{useEffect,useState} from 'react';
import KakaoPlaceDetails from './KakaoPlaceDetails.jsx';
import CourseRepresentativePhoto from './CourseRepresentativePhoto.jsx';
import {kakaoPlaceDetailUrl} from '../lib/kakaoPlaceLink.js';
const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
const normalized=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'');
export default function EditorialPlaceDetails({place}){
 const [rows,setRows]=useState([]),[selected,setSelected]=useState(null),[busy,setBusy]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();setSelected(null);setRows([]);setBusy(true);setError('');
  const region=String(place.region||'').split(/[·,]/)[0].trim();
  const query=(/[·,]/.test(place.region||'')?[place.name]:[region,place.name]).filter(Boolean).join(' ').slice(0,80);
  (async()=>{try{
   const response=await fetch(base+(place.kakaoRef?'/api/kakao/places/references':'/api/kakao/places/search'),{method:'POST',cache:'no-store',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify(place.kakaoRef?{refs:[{...place.kakaoRef,day:place.day||1}]}:{query,category:'전체',page:1})});
   const data=await response.json();
   if(!response.ok)throw Error(response.status===429?'조회가 많습니다. 잠시 후 다시 시도해 주세요.':'카카오 장소를 불러오지 못했습니다.');
   if(controller.signal.aborted)return;
   const candidates=(data.places||[]).filter(p=>/^\d{1,40}$/.test(String(p.id)));setRows(candidates);
   const regionWords=region.split(/\s+/).filter(Boolean);
   const exact=candidates.filter(p=>normalized(p.name)===normalized(place.name)&&regionWords.length>0&&regionWords.every(word=>normalized(p.roadAddress||p.address||'').includes(normalized(word))));
   if(place.kakaoRef){const referenced=candidates.find(p=>p.id===place.kakaoRef.placeId);if(referenced)setSelected(referenced);}else if(exact.length===1)setSelected(exact[0]);
  }catch(e){if(!controller.signal.aborted)setError(e.message||'장소를 확인하지 못했습니다.');}
  finally{if(!controller.signal.aborted)setBusy(false);}})();
  return()=>controller.abort();
 },[place.name,place.region,JSON.stringify(place.kakaoRef),retry]);
 if(selected)return <><KakaoPlaceDetails place={selected} editorial={place}/><button type="button" className="text-link" onClick={()=>setSelected(null)}>다른 검색 결과 확인</button></>;
 return <><PlaceDetails p={{...place,location:place.address||place.location,imageUrl:place.image_url||place.imageUrl,description:place.description||place.activity}} Photo={({place:p})=><CourseRepresentativePhoto src={p.imageUrl} kakaoMapUrl={kakaoPlaceDetailUrl(p)} alt={p.name}/>} basicExtra={place.time&&<><dt>계획한 방문 시각</dt><dd>{place.day}일차 · {place.time}</dd></>} externalInfo={place.image_note&&<p className="muted">{place.image_note}</p>}/>
{busy&&<p role="status">카카오 장소 정보를 확인하고 있어요…</p>}{error&&<p role="alert">{error}</p>}{!busy&&<><button type="button" className="pill secondary wide" onClick={()=>setRetry(v=>v+1)}>카카오 장소 다시 확인</button><div className="schedule-kakao-results"><p>{rows.length?'장소명과 주소가 맞는 장소를 선택해 주세요.':'확인 가능한 장소를 찾지 못했습니다.'}</p>{rows.map(p=><button className="editorial-kakao-candidate" type="button" key={p.id} onClick={()=>setSelected(p)}><strong>{p.name}</strong><span>{p.roadAddress||p.address}</span><small>장소 상세보기 ›</small></button>)}</div></>}</>;
}
