import DesignIcon from './DesignIcon.jsx';
import React,{useEffect,useRef,useState} from 'react';
const loaders=import.meta.glob('../data/visitDistricts/*.json');
const shortName=n=>n.replace('특별자치도','').replace('특별자치시','').replace('특별시','').replace('광역시','').replace('경상','경').replace('충청','충').replace('전라','전').replace('기도','기').replace(/도$/,'');
export function VisitMap({stats}){
 const searchButton=useRef(null);
 const zoom=useRef(1),pinch=useRef(null);
 const [zoomLevel,setZoomLevel]=useState(1);
 const [searching,setSearching]=useState(false),[query,setQuery]=useState('');
 const [selected,setSelected]=useState(null),[district,setDistrict]=useState(null);
 const [loaded,setLoaded]=useState({}),[error,setError]=useState('');
 const [boundaries,setBoundaries]=useState(null);
 useEffect(()=>{let active=true;import('../data/visitProvinces.json',{with:{type:'json'}}).then(module=>{if(active){setBoundaries(module.default);setError('');}}).catch(()=>{if(active)setError('전국 지도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');});return()=>{active=false;};},[]);
 useEffect(()=>{if(!selected||loaded[selected])return;let active=true;setError('');const load=loaders[`../data/visitDistricts/${selected}.json`];if(!load){setError('지도 자료가 없습니다.');return;}load().then(module=>{if(active)setLoaded(v=>({...v,[selected]:module.default}));}).catch(()=>{if(active)setError('지역 지도를 불러오지 못했습니다. 전국 지도로 돌아가 다시 선택해 주세요.');});return()=>{active=false;};},[selected,loaded]);
 if(!boundaries)return <section className="visit-archive visit-svg-layout" aria-label="나의 여행 지도"><h2 className="visit-map-title">나의 여행 지도</h2><p role={error?'alert':'status'} className="visit-map-load-status">{error||'전국 지도를 불러오는 중…'}</p></section>;
 const shapes=selected?(loaded[selected]||[]):boundaries.provinces;
 const boxes=shapes.map(s=>s.box),x=boxes.length?Math.min(...boxes.map(b=>b[0])):0,y=boxes.length?Math.min(...boxes.map(b=>b[1])):0,right=boxes.length?Math.max(...boxes.map(b=>b[0]+b[2])):100,bottom=boxes.length?Math.max(...boxes.map(b=>b[1]+b[3])):100;
 const width=right-x+12,height=bottom-y+12;
 const count=shape=>selected?(stats.districtCounts?.[shape.id]||Number(stats.districts.includes(shape.id))):(stats.provinceCounts?.[shape.id]||Number(stats.provinces.includes(shape.id)));
 const fill=shape=>count(shape)?`rgba(139,81,255,${Math.min(.95,.28+.67*(1-Math.exp(-count(shape)/4)))})`:'#eeedf4';
 function choose(shape){if(selected)setDistrict(shape.id);else{setSelected(shape.id);setDistrict(null);}}
 function zoomIntoShape(event,nextZoom){const path=event.target.closest?.('path[role="button"]');zoom.current=nextZoom;setZoomLevel(nextZoom);if(nextZoom>=1.65&&path){const shape=shapes.find(item=>item.id===path.dataset.regionId);if(shape){choose(shape);zoom.current=1;setZoomLevel(1);pinch.current=null;}}}
 function handleMapWheel(event){if(!event.deltaY)return;const next=Math.max(1,Math.min(2.2,zoom.current+(event.deltaY<0?.16:-.12)));zoomIntoShape(event,next);}
 function handlePinchStart(event){if(event.touches.length===2){const [a,b]=event.touches;pinch.current={distance:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),zoom:zoom.current};}}
 function handlePinchMove(event){if(event.touches.length!==2||!pinch.current)return;const [a,b]=event.touches,distance=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);zoomIntoShape(event,pinch.current.zoom*distance/pinch.current.distance);}
 const focused=shapes.find(s=>s.id===district);
 function closeSearch(){setSearching(false);setQuery('');requestAnimationFrame(()=>searchButton.current?.focus());}
 const normalized=value=>value.replace(/\s/g,'');
 const searchResults=query.trim()?shapes.filter(shape=>count(shape)>0&&normalized(shape.name).includes(normalized(query.trim()))):[];
 function selectSearchResult(shape){choose(shape);closeSearch();}
 return <section className="visit-archive visit-svg-layout" aria-label="나의 여행 지도">
  <h2 className="visit-map-title">나의 여행 지도</h2>
  <p className="visit-map-summary" role="status">{shapes.filter(s=>count(s)>0).length} / {shapes.length} {selected?'방문 지역':'방문 시도'}</p>
  {selected&&<button type="button" className="journal-map-back" onClick={()=>{setSelected(null);setDistrict(null);}}>‹ 전국 지도 · {boundaries.provinces.find(p=>p.id===selected)?.name}</button>}
  {error&&<p role="alert" className="visit-map-load-status">{error}</p>}
  {selected&&!loaded[selected]&&!error&&<p role="status" className="visit-map-load-status">지역 지도를 불러오는 중…</p>}
  <div className="visit-map-frame">
  <div className="visit-map-controls">
   <div className={`visit-search-control${searching?' is-expanded':''}`}>
    {!searching?<button ref={searchButton} type="button" className="visit-search-toggle" aria-label="방문 지역 검색" aria-expanded="false" onClick={()=>setSearching(true)}><DesignIcon name="search" size={18}/></button>:
    <form role="search" className="visit-search-form" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();closeSearch();}}} onSubmit={e=>{e.preventDefault();if(searchResults[0])selectSearchResult(searchResults[0]);}}>
     <button type="submit" className="visit-search-submit" aria-label="방문 지역 찾기"><DesignIcon name="search" size={18}/></button>
     <input autoFocus aria-label="방문 지역 이름" placeholder="내가 다녀온 지역을 지도에서 확인해보세요." value={query} onChange={e=>setQuery(e.target.value)}/>
     <button type="button" className="visit-search-close" aria-label="지역 검색 닫기" onClick={closeSearch}>×</button>
    </form>}
   </div>
   <button type="button" className="visit-reset" aria-label="전국 지도 초기화" onClick={()=>{setSelected(null);setDistrict(null);setQuery('');setSearching(false);zoom.current=1;setZoomLevel(1);pinch.current=null;}}><DesignIcon name="reset" size={18}/></button>
   {searching&&query.trim()&&<div className="visit-search-results">{searchResults.map(shape=><button type="button" key={shape.id} onClick={()=>selectSearchResult(shape)}>{shape.name} · {count(shape)}곳</button>)}{!searchResults.length&&<p role="status">방문 기록에 일치하는 지역이 없습니다.</p>}</div>}
  </div>
  {!selected&&<small className="visit-map-zoom-hint">지역을 확대하면 하위 지역 지도로 이동해요.</small>}
  <svg className="visit-map" style={{transform:`scale(${zoomLevel})`,transformOrigin:'center center',transition:'transform 120ms ease-out'}} role="group" aria-label={selected?'시군구 방문 지도':'시도 방문 지도'} viewBox={`${x-6} ${y-6} ${width} ${height}`} onWheel={handleMapWheel} onTouchStart={handlePinchStart} onTouchMove={handlePinchMove} onTouchEnd={()=>{pinch.current=null;}}>
   <g>{shapes.map(shape=><path key={shape.id} data-region-id={shape.id} d={shape.path} fill={fill(shape)} stroke={district===shape.id?'#6436cc':'#b9b4c7'} strokeWidth={width/(district===shape.id?250:1000)} tabIndex={0} role="button" aria-label={`${shape.name} · ${count(shape)}개 방문 장소${selected?'':' · 확대해 하위 지역 보기'}`} onClick={()=>choose(shape)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(shape);}}}><title>{`${shape.name} · ${count(shape)}개 장소`}</title></path>)}</g>
   <g className="visit-map-names">{shapes.map(shape=><text key={shape.id} x={shape.label?.[0]??shape.box[0]+shape.box[2]/2} y={shape.label?.[1]??shape.box[1]+shape.box[3]/2} fontSize={width/38} strokeWidth={width/250} textAnchor="middle" dominantBaseline="central" onClick={()=>choose(shape)}>{shortName(shape.name)}</text>)}</g>
  </svg>
  {focused&&<p className="visit-map-summary" role="status">{focused.name} · 내 여행기에 반영된 장소 {count(focused)}곳</p>}
  <div className="map-legend"><span><i/>다녀온 지역</span><span><i/>못가본 지역</span></div>
  </div>
  <small className="map-credits">경계: <a href={boundaries.url} target="_blank" rel="noreferrer">SGIS · vuski</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>{stats.unmatched>0&&` · 주소 확인 필요 ${stats.unmatched}곳`}</small>
 </section>;
}
