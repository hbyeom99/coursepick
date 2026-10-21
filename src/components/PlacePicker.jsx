import {placeMatchesKeywords} from '../lib/semanticKeywords.js';
import KakaoPickerSearch from './KakaoPickerSearch.jsx';
import {rankTasteFirst,recommendationBatch,advanceTasteBatch,scorePickerTaste} from '../lib/tasteRecommendationBatches.js';
import { straightDistance, insertionNeighbors, distanceLabel, rankByInsertionDistance } from '../lib/pickerMap.js';
import React,{useState,useEffect,useRef} from 'react';
import { getLodgingPage } from '../services/placeService.ts';
export default function PlacePicker({freeMode,stops,afterId,onAfter,flow,flowRanked,onFlow,onFinish,query,onQuery,ranked,recommendationContext,interests=[],taste={},savedIds,renderRow,renderMap,lodgingPlaces=[],lodgingRegion,onLoadedLodgings,onOpenPlace,catalog=[],onAddGoogle,googlePlaceRefs=[],googleDay=1,distanceStops=stops,onOpenGoogle,onAddKakao,kakaoPlaceRefs=[],onOpenKakao,kakaoAnchor}) {
 const [category,setCategory]=useState('전체'),[tab,setTab]=useState('추천'),[count,setCount]=useState(3),[selected,setSelected]=useState(null);
 const [wideMap,setWideMap]=useState(false);
 const [categoryRequest,setCategoryRequest]=useState(null);
 function searchKakaoCategory(value){
  setCategory(value);setCount(3);
  if(value==='전체'){setCategoryRequest(null);onQuery('');return;}
  const context=query.trim().replace(/(?:맛집|카페|관광지|체험 공방|숙소)$/, '').trim()||lodgingRegion||stops[0]?.region||'대한민국';
  const keyword={맛집:'맛집',카페:'카페',관광:'관광지',체험:'체험 공방',숙소:'숙소'}[value];
  onQuery(`${context} ${keyword}`.slice(0,80));setCategoryRequest({});
 }

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
 return <div className="place-picker-page"><KakaoPickerSearch onOpenKakao={onOpenKakao} anchor={afterId!=='end'&&distanceStops.some(p=>p.id===afterId)?distanceStops.find(p=>p.id===afterId):kakaoAnchor||distanceStops.at(-1)} onAddKakao={onAddKakao} kakaoPlaceRefs={kakaoPlaceRefs} query={query} category={category} categoryRequest={categoryRequest} onQuery={value=>{setCategoryRequest(null);setCategory('전체');onQuery(value);setCount(3);}}>
 <div className="place-picker-categories" role="group" aria-label="장소 카테고리">{[['전체','▦'],['맛집','🍴'],['카페','☕'],['관광','⚑'],['체험','⚐'],['숙소','▤']].map(([c,i])=><button type="button" key={c} className={category===c?'active':''} aria-pressed={category===c} onClick={()=>searchKakaoCategory(c)}><span aria-hidden="true">{i}</span>{c}</button>)}</div></KakaoPickerSearch>
 {!query.trim()&&<>
 <div className="place-picker-map">{renderMap(mapPlaces,selectedPlace?.id,id=>{choose(id);onOpenPlace(id);})}</div>
 {stops.length>0&&<div className="picker-map-context"><button type="button" className="text-link" onClick={()=>setWideMap(v=>!v)}>{wideMap?'코스 주변 5km만 보기':'더 넓은 범위 보기'}</button>{!wideMap&&!nearby.length&&<p>코스 주변 5km에 해당 장소가 없습니다.</p>}{selectedPlace&&<p><strong>{selectedPlace.name}</strong><br/>{neighbors.before&&`${neighbors.before.name}에서 ${distanceLabel(straightDistance(neighbors.before,selectedPlace))}`}{neighbors.after&&` · ${neighbors.after.name}까지 ${distanceLabel(straightDistance(selectedPlace,neighbors.after))}`} · 직선거리</p>}</div>}
 <section className="place-picker-sheet"><span className="sheet-grip" aria-hidden="true"/><div className="place-picker-tabs" role="group" aria-label="장소 목록 종류">{[['추천','추천 장소'],['최근','최근 장소'],['내 장소','내 장소'],['지도','지도에서 선택']].map(([id,label])=><button type="button" key={id} className={tab===id?'active':''} aria-pressed={tab===id} onClick={()=>{setTab(id);setCount(3);}}>{label}</button>)}</div>
 {<>{category==='숙소'&&<>{lodgingLoading&&<p role="status" className="muted">숙소를 불러오는 중입니다.</p>}{lodgingError&&<p role="alert">{lodgingError}<button type="button" className="text-link" onClick={()=>setLodgingRetry(v=>v+1)}>다시 시도</button></p>}</>}{tab==='추천'&&<><button type="button" className="picker-refresh" disabled={batch.exhausted||!tastePool.length} onClick={()=>setBatchState(advanceTasteBatch(tastePool,batch,batchContext))}>다른 장소 추천 <span className="asset-icon asset-refresh" aria-hidden="true"/></button>{batch.exhausted&&tastePool.length>0&&<p className="muted" role="status">현재 조건의 추천 장소를 모두 확인했어요. <button type="button" className="text-link" onClick={()=>setBatchState(recommendationBatch(tastePool,null,batchContext))}>처음부터 다시 보기</button></p>}</>}<div className="picker-list">{shown.map(item=>renderRow(item.place,item,id=>choose(id)))}</div>{!shown.length&&!lodgingLoading&&!lodgingError&&<p className="picker-empty">{tab==='지도'?'지도에서 장소 마커를 선택해 주세요.':guided ? '현재 단계에서 추천할 장소가 없어요. 검색이나 카테고리에서 직접 선택해 주세요.' : '조건에 맞는 장소가 없어요.'}</p>}{tab!=='추천'&&items.length>count&&<button type="button" className="picker-more-button" onClick={()=>setCount(c=>c+3)}>더 보기</button>}</>}
 {category==='숙소'&&lodgingMore&&<button type="button" className="picker-more-button" disabled={lodgingLoading} onClick={()=>{setLodgingPage(v=>v+1);setCount(v=>v+40);}}>숙소 더 불러오기</button>}
 </section></>}</div>;
}
