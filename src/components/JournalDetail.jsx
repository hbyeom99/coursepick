import MapPanel from './MapPanel.jsx';
import React,{useEffect,useState} from 'react';
import {getJournalPhoto} from '../lib/journalPhotoStore.js';
import {journalPlaces} from '../lib/journalComposer.js';
import useEditorialPlaces from '../lib/useEditorialPlaces.js';
function Photos({ids=[]}){
 const [urls,setUrls]=useState([]);
 useEffect(()=>{let active=true;const made=[];
 Promise.all(ids.map(async id=>{try{const row=await getJournalPhoto(id);if(!row?.blob)return null;const url=URL.createObjectURL(row.blob);made.push(url);return url;}catch{return null;}})).then(values=>{if(active)setUrls(values.filter(Boolean));});
 return()=>{active=false;made.forEach(url=>URL.revokeObjectURL(url));};
 },[JSON.stringify(ids)]);
 return urls.length?<div className="journal-detail-photos">{urls.map((url,i)=><img key={url} src={url} alt={`등록한 여행 사진 ${i+1}`}/>)}</div>:null;
}
export default function JournalDetail({course,record,catalog,onClose,onEdit}){
 const resolved=useEditorialPlaces(course.editorialVisits||course.kakaoPlaceRefs?.map(kakaoRef=>({kakaoRef}))||[]);
 const places=journalPlaces(course,[...catalog,...Object.values(resolved)]);
 const mapIds=new Set(record.placeIds||[]);
 const mapPlaces=[...new Map([...catalog,...Object.values(resolved)].filter(place=>mapIds.has(place.id)).map(place=>[place.id,place])).values()];
 return <section className="journal-detail" role="dialog" aria-modal="true" aria-label="나의 여행기"><header><button type="button" aria-label="뒤로가기" onClick={onClose}>〈</button><h1>나의 여행기</h1><button type="button" onClick={onEdit}>수정</button></header><div className="journal-detail-body"><Photos ids={record.photoIds}/><div className="journal-detail-map"><MapPanel showRoute places={mapPlaces} place={mapPlaces[0]} /></div><h2>{record.title}</h2><p className="journal-detail-date">{record.visitedAt}</p><p className="journal-detail-review">{record.body}</p><h2 className="journal-place-review-title">장소별 리뷰</h2>{places.map((place,i)=>{const review=record.reviews?.[place.id];return <article key={place.key}><h3><span>{i+1}</span>{place.name}</h3>{review?<><p className="journal-detail-stars" aria-label={`별점 ${review.rating}점`}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</p><p className="journal-detail-review">{review.body||'작성한 리뷰 내용이 없어요.'}</p><Photos ids={review.photoIds}/></>:<p className="journal-detail-empty">아직 작성한 장소 리뷰가 없어요.</p>}</article>;})}</div></section>;
}
