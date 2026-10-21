import {placeMatchesKeywords} from '../lib/semanticKeywords.js';
import KakaoPlaceSearch from './KakaoPlaceSearch.jsx';
import {rankTasteFirst,recommendationBatch,advanceTasteBatch,scorePickerTaste} from '../lib/tasteRecommendationBatches.js';
import { straightDistance, insertionNeighbors, distanceLabel, rankByInsertionDistance } from '../lib/pickerMap.js';
import React,{useState,useEffect,useRef} from 'react';
import { getLodgingPage } from '../services/placeService.ts';
export default function PlacePicker({freeMode,stops,afterId,onAfter,flow,flowRanked,onFlow,onFinish,query,onQuery,ranked,recommendationContext,interests=[],taste={},savedIds,renderRow,renderMap,lodgingPlaces=[],lodgingRegion,onLoadedLodgings,onOpenPlace,catalog=[]}) {
 const [category,setCategory]=useState('전체'),[tab,setTab]=useState('추천'),[count,setCount]=useState(3),[selected,setSelected]=useState(null);
 const [wideMap,setWideMap]=useState(false);
 const [batchState,setBatchState]=useState(null);
 const [lodgingPage,setLodgingPage]=useState(0),[lodgingRows,setLodgingRows]=useState([]),[lodgingMore,setLodgingMore]=useState(false),[lodgingLoading,setLodgingLoading]=useState(false),[lodgingError,setLodgingError]=useState(''),[lodgingRetry,setLodgingRetry]=useState(0);
 const loaded=useRef(onLoadedLodgings);loaded.current=onLoadedLodgings;
 const lodgingKey=JSON.stringify([lodgingRegion,query]);
 const [activeLodgingKey,setActiveLodgingKey]=useState(lodgingKey);
 useEffect(()=>{setLodgingPage(0);setLodgingRows([]);setLodgingMore(false);setActiveLodgingKey(lodgingKey);},[lodgingKey]);
 useEffect(()=>{
  if(category!=='숙소'||activeLodgingKey!==lodgingKey)return;
  const controller=new AbortController();let active=true;setLodgingLoading(true);setLodgingError('');
  getLodgingPage({region:lodgingRegion,query,page:lodgingPage},controller.signal).then(result=>{
   if(!active)return;
   setLodgingRows(current=>lodgingPage?[...new Map([...current,...result.places].map(p=>[p.id,p])).values()]:result.places);
   loaded.current?.(result.places);setLodgingMore(result.more);
  }).catch(()=>{if(active)setLodgingError('숙소를 불러오지 못했습니다.');}).finally(()=>{if(active)setLodgingLoading(false);});
  return()=>{active=false;controller.abort();};
 },[category,activeLodgingKey,lodgingKey,lodgingPage,lodgingRetry]);

 const [recent,setRecent]=useState(()=>{try{const a=JSON.parse(localStorage.getItem('coursepick.recentPlaces.v1'));return Array.isArray(a)?a.filter(x=>typeof x==='string'):[];}catch{return [];}});
 function choose(id){setSelected(id);const next=[id,...recent.filter(x=>x!==id)].slice(0,30);setRecent(next);try{localStorage.setItem('coursepick.recentPlaces.v1',JSON.stringify(next));}catch{} }
 const match=item=>category==='전체'||category==='숙소'&&item.place.category==='숙소'||category==='맛집'&&item.place.category==='음식점'||category==='카페'&&item.place.category==='카페'||category==='관광'&&item.place.category==='관광지'||category==='체험'&&item.place.tags.some(t=>['체험','액티비티','공방'].includes(t));
 const guided = tab==='추천' && category==='전체' && !query.trim();
 const lodgingPool=[...new Map([...lodgingPlaces.filter(p=>!p.id.startsWith('lodgingcsv_')), ...lodgingRows].map(p=>[p.id,p])).values()].filter(p=>!stops.some(stop=>stop.id===p.id)&&(!lodgingRegion||p.region===lodgingRegion)&&(!query.trim()||placeMatchesKeywords(p,query))).map(place=>({place}));
 const pool=rankByInsertionDistance((category==='숙소'?lodgingPool:guided?flowRanked:ranked).filter(match),stops,afterId);
 const nearby = pool.filter(item=>stops.some(stop=>{const d=straightDistance(stop,item.place);return d!==null&&d<=5000;}));
 const mapPool = wideMap || !stops.length ? pool : nearby;
 const selectedPlace=pool.find(item=>item.place.id===selected)?.place;
 const neighbors=insertionNeighbors(stops,afterId);
 const mapPlaces=mapPool.slice(0,30).map(item=>item.place);
 if(selectedPlace&&!mapPlaces.some(p=>p.id===selectedPlace.id))mapPlaces.push(selectedPlace);
 const items=tab==='내 장소'?pool.filter(x=>savedIds.includes(x.place.id)):tab==='최근'?pool.filter(x=>recent.includes(x.place.id)).sort((a,b)=>recent.indexOf(a.place.id)-recent.indexOf(b.place.id)):tab==='지도'?pool.filter(x=>x.place.id===selected):pool;
 const tastePool=rankTasteFirst(mapPool.map(item=>({...item,tasteScore:scorePickerTaste(item.place,interests,taste,item.courseAssessment)})));
 const batchContext=JSON.stringify([recommendationContext,category,query,wideMap,afterId,stops.map(p=>p.id)]);
 const batch=recommendationBatch(tastePool,batchState,batchContext);
 const shown=tab==='추천'?batch.selected.map(id=>tastePool.find(item=>item.place.id===id)).filter(Boolean):items.slice(0,count);
 return <div className="place-picker-page"><div className="place-picker-search"><span aria-hidden="true">⌕</span><input aria-label="장소 검색" placeholder="관광지/맛집/숙소 검색" value={query} onChange={e=>{onQuery(e.target.value);setCount(3);}}/></div>
 <KakaoPlaceSearch key={JSON.stringify([query,lodgingRegion,stops[0]?.id])} query={query} region={lodgingRegion} anchor={stops[0]} catalog={catalog} onOpenExisting={onOpenPlace}/>
 <div className="place-picker-categories" role="group" aria-label="장소 카테고리">{[['전체','▦'],['맛집','🍴'],['카페','☕'],['관광','⚑'],['체험','⚐'],['숙소','▤']].map(([c,i])=><button type="button" key={c} className={category===c?'active':''} aria-pressed={category===c} onClick={()=>{setCategory(c);setCount(3);}}><span aria-hidden="true">{i}</span>{c}</button>)}</div>
 <div className="place-picker-map">{renderMap(mapPlaces,selectedPlace?.id,id=>{choose(id);onOpenPlace(id);})}</div>
 {stops.length>0&&<div className="picker-map-context"><button type="button" className="text-link" onClick={()=>setWideMap(v=>!v)}>{wideMap?'코스 주변 5km만 보기':'더 넓은 범위 보기'}</button>{!wideMap&&!nearby.length&&<p>코스 주변 5km에 해당 장소가 없습니다.</p>}{selectedPlace&&<p><strong>{selectedPlace.name}</strong><br/>{neighbors.before&&`${neighbors.before.name}에서 ${distanceLabel(straightDistance(neighbors.before,selectedPlace))}`}{neighbors.after&&` · ${neighbors.after.name}까지 ${distanceLabel(straightDistance(selectedPlace,neighbors.after))}`} · 직선거리</p>}</div>}
 <section className="place-picker-sheet"><span className="sheet-grip" aria-hidden="true"/><div className="place-picker-tabs" role="group" aria-label="장소 목록 종류">{[['추천','추천 장소'],['최근','최근 장소'],['내 장소','내 장소'],['지도','지도에서 선택']].map(([id,label])=><button type="button" key={id} className={tab===id?'active':''} aria-pressed={tab===id} onClick={()=>{setTab(id);setCount(3);}}>{label}</button>)}</div>
 {freeMode && <div className="picker-free-options"><strong>어떤 장소를 추가할까요?</strong><div className="picker-flow-actions">{[['전체','전체'],['관광','일정 장소'],['맛집','음식점'],['카페','카페·디저트'],['숙소','숙소']].map(([value,label])=><button type="button" key={value} aria-pressed={category===value} onClick={()=>{setCategory(value);setCount(3);}}>{label}</button>)}</div><label htmlFor="picker-insert-position">추가 위치</label><select id="picker-insert-position" value={afterId==='end'||stops.some(p=>p.id===afterId)?afterId:'end'} onChange={e=>{onAfter(e.target.value);setCount(3);}}><option value="end">마지막에 추가</option>{stops.map((p,index)=><option key={p.id} value={p.id}>{index+1}. {p.name} 뒤에 추가</option>)}</select></div>}
 {<>{category==='숙소'&&<>{lodgingLoading&&<p role="status" className="muted">숙소를 불러오는 중입니다.</p>}{lodgingError&&<p role="alert">{lodgingError}<button type="button" className="text-link" onClick={()=>setLodgingRetry(v=>v+1)}>다시 시도</button></p>}</>}{guided && <div className="picker-flow"><strong>다음 추천: {flow.label}</strong><div className="picker-flow-actions">{flow.actions.map(action=><button type="button" key={action.label} onClick={()=>{onFlow(action.stage);setCount(3);}}>{action.label}</button>)}</div>{flow.stage==='done' && <><button type="button" className="pill secondary" onClick={()=>onFlow('free')}>장소 더 추가</button><button type="button" className="pill primary" onClick={onFinish}>코스 구성 마치기</button></>}</div>}{tab==='추천'&&<><button type="button" className="picker-refresh" disabled={batch.exhausted||!tastePool.length} onClick={()=>setBatchState(advanceTasteBatch(tastePool,batch,batchContext))}>다른 장소 추천 <span className="asset-icon asset-refresh" aria-hidden="true"/></button>{batch.exhausted&&tastePool.length>0&&<p className="muted" role="status">현재 조건의 추천 장소를 모두 확인했어요. <button type="button" className="text-link" onClick={()=>setBatchState(recommendationBatch(tastePool,null,batchContext))}>처음부터 다시 보기</button></p>}</>}<div className="picker-list">{shown.map(item=>renderRow(item.place,item,id=>choose(id)))}</div>{!shown.length&&!lodgingLoading&&!lodgingError&&<p className="picker-empty">{tab==='지도'?'지도에서 장소 마커를 선택해 주세요.':guided ? '현재 단계에서 추천할 장소가 없어요. 검색이나 카테고리에서 직접 선택해 주세요.' : '조건에 맞는 장소가 없어요.'}</p>}{tab!=='추천'&&items.length>count&&<button type="button" className="picker-more-button" onClick={()=>setCount(c=>c+3)}>더 보기</button>}</>}
 {category==='숙소'&&lodgingMore&&<button type="button" className="picker-more-button" disabled={lodgingLoading} onClick={()=>{setLodgingPage(v=>v+1);setCount(v=>v+40);}}>숙소 더 불러오기</button>}
 </section></div>;
}
