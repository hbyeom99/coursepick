import StopVisitDetails from './StopVisitDetails.jsx';
import {selectPlaceTags} from '../lib/placeTagSelection.js';
import RecommendationPlaceCard from './RecommendationPlaceCard.jsx';
import ScheduleTiming from './ScheduleTiming.jsx';
import { detailTravelInfo } from '../lib/detailTravelInfo.js';
import React, { useEffect, useId, useRef, useState } from 'react';

export default function EditorStops({ ids, places, schedule, course, Icon, drivingRoute, drivingStatus, transitRoute, transitStatus, transport, recommendations, renderPhoto, onReorder, onReplace, onRemove, onOpenPlace, query = '', numberOffset = 0, showRecommendations = true, editable = true, onUpdateDetails, renderExtra, showOpeningHours = false }) {
  const helpId = useId();
  const drag = useRef(null), list = useRef(null), scrollFrame = useRef(null);
  const [dragPreview, setDragPreview] = useState(null);
  useEffect(() => () => cancelAnimationFrame(scrollFrame.current), []);
  function clearDrag() { cancelAnimationFrame(scrollFrame.current); drag.current = null; setTargetId(null); setDragPreview(null); }
  function updatePreview() {
    const current = drag.current;
    if (!current || !list.current) return;
    const bounds = list.current.getBoundingClientRect();
    setDragPreview({id:current.id,left:current.x-current.offsetX-bounds.left,top:current.y-current.offsetY-bounds.top,width:current.width});
    const row = document.elementFromPoint(current.x,current.y)?.closest('[data-editor-stop-id]');
    if (row && list.current.contains(row)) current.target = row.dataset.editorStopId;
    setTargetId(current.target);
  }
  function autoScroll() {
    const current = drag.current;
    if (!current) return;
    const scroller = list.current.closest('.main-content');
    const innerScroll = scroller && getComputedStyle(scroller).overflowY === 'auto';
    const bounds = innerScroll ? scroller.getBoundingClientRect() : {top:0,bottom:window.innerHeight};
    const amount = current.y < bounds.top+65 ? -8 : current.y > bounds.bottom-85 ? 8 : 0;
    if (amount) { if(innerScroll) scroller.scrollBy(0,amount); else window.scrollBy(0,amount); updatePreview(); }
    scrollFrame.current = requestAnimationFrame(autoScroll);
  }
  function begin(event,id) {
    if (event.button !== 0 || drag.current) return;
    event.preventDefault();
    const bounds=event.currentTarget.closest('.editor-stop').getBoundingClientRect();
    drag.current={id,target:id,pointerId:event.pointerId,x:event.clientX,y:event.clientY,offsetX:event.clientX-bounds.left,offsetY:event.clientY-bounds.top,width:bounds.width};
    event.currentTarget.setPointerCapture(event.pointerId); setOpenRecommendationId(null); updatePreview();
    scrollFrame.current=requestAnimationFrame(autoScroll);
  }
  const [targetId, setTargetId] = useState(null);
  const [openRecommendationId, setOpenRecommendationId] = useState(null);
  function move(event) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    drag.current.x=event.clientX; drag.current.y=event.clientY; updatePreview();
  }
  function finish(event, cancelled = false) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    clearDrag();
    if (!cancelled) onReorder(ids.indexOf(current.id), ids.indexOf(current.target));
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <div className="editor-stops" ref={list}><p id={helpId} className="sr-only">손잡이를 드래그하거나 위·아래 방향키로 순서를 변경합니다.</p>{ids.map((id, index) => {
    const place = places.find(p => p.id === id);
    if (!place) return <p key={id}>장소 조회 대기 중 <button type="button" onClick={() => onRemove(id)}>목록에서 제거</button></p>;
    const candidates = recommendations.get(id) || [];
    return <section className={`editor-stop-group ${dragPreview?.id === id ? 'drag-source' : targetId === id ? (ids.indexOf(dragPreview?.id) < index ? 'drop-after' : 'drop-before') : ''}`} key={id} data-editor-stop-id={id}>
      <div className="editor-stop"><span className="step-number">{numberOffset + index + 1}</span><div className="stop-detail-button"><button type="button" className="stop-photo-button" aria-label={`${place.name} 상세보기`} onClick={()=>onOpenPlace?.(id)}>{renderPhoto(place)}</button><div className="stop-copy"><button type="button" className="stop-name-button" onClick={()=>onOpenPlace?.(id)}><strong>{place.name}</strong></button>{showOpeningHours&&<span className="timeline-opening-hours">{place.openingHours?.trim()&&!/미확인|확인 필요|정보 없음/.test(place.openingHours)?`open ${place.openingHours.trim()}`:'운영시간 확인 필요'}</span>}<span className="editor-place-tags">{selectPlaceTags(place.tags,query).map(tag=><span key={tag}>#{tag}</span>)}</span><StopVisitDetails extra={renderExtra?.(place,index)} name={place.name} entry={schedule?.[index]} details={course?.stopDetails?.[/^[ngkv]:/.test(id)?id:'n:'+id]||{}} onChange={onUpdateDetails?patch=>onUpdateDetails(/^[ngkv]:/.test(id)?id:'n:'+id,patch):undefined} distance={index>0&&!course?.googlePlaceRefs?.length&&!course?.kakaoPlaceRefs?.length?detailTravelInfo({previous:places.find(p=>p.id===ids[index-1]),place,transport,route:transport==='자동차'?drivingRoute:transport==='대중교통'?transitRoute:null,status:transport==='자동차'?drivingStatus:transitStatus}):null}/></div></div>{editable&&<div className="stop-controls">
      {(typeof showRecommendations==='function'?showRecommendations(place):showRecommendations)&&<button type="button" className="stop-recommend-button" aria-label={`${place.name} 추천 장소`} aria-expanded={openRecommendationId === id} aria-controls={`recommendations-${id}`} onClick={() => setOpenRecommendationId(current => current === id ? null : id)}>추천</button>}
      <button type="button" className="icon-button drag-handle" aria-label={`${place.name} 순서 변경`} aria-describedby={helpId} onPointerDown={event => begin(event,id)} onPointerMove={move} onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)} onLostPointerCapture={() => { clearDrag(); }} onKeyDown={event => { if (event.key === 'Escape' && drag.current) { finish(event,true); return; } if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); onReorder(index, index + (event.key === 'ArrowUp' ? -1 : 1)); } }}>≡</button>
      <button type="button" className="icon-button remove-stop" aria-label={`${place.name} 삭제`} onClick={() => { setOpenRecommendationId(null); onRemove(id); }}>×</button></div>}</div>
      {openRecommendationId === id && <section id={`recommendations-${id}`} className="stop-recommendations" aria-label={`${place.name} 교체 추천 장소`}><div className="stop-recommendations-heading"><h3>추천 장소</h3><button type="button" className="stop-recommendations-close" aria-label="추천 장소 창 닫기" onClick={() => { setOpenRecommendationId(null); list.current?.querySelector(`[data-editor-stop-id="${id}"] .stop-recommend-button`)?.focus(); }}><Icon name="close" size={16}/></button></div>{candidates.length ? <div className="stop-recommendation-grid">{candidates.map(item => <RecommendationPlaceCard query={query} key={item.place.id} place={item.place} originalName={place.name} course={course} Icon={Icon} renderPhoto={renderPhoto} onReplace={()=>{if(onReplace(item.place,id)!==false)setOpenRecommendationId(item.place.id);}}/>)}</div> : <p className="muted">같은 지역에서 이 일정의 역할에 맞는 교체 후보가 없습니다.</p>}</section>}
    </section>;
  })}{dragPreview && (() => {const index=ids.indexOf(dragPreview.id);const place=places.find(p=>p.id===dragPreview.id);return place && <div className="editor-drag-preview editor-stop" aria-hidden="true" style={{left:dragPreview.left,top:dragPreview.top,width:dragPreview.width}}><span className="step-number">{numberOffset+index+1}</span>{renderPhoto(place)}<span className="stop-copy"><strong>{place.name}</strong><small>{schedule?.[index] ? <ScheduleTiming entry={schedule[index]}/> : [place.region,place.category].filter(Boolean).join(' · ')}</small></span><span className="drag-preview-handle">≡</span></div>;})()}</div>;
}
