import { demoLocation } from '../lib/demoLocation.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';

let sdkPromise;
function loadMaps(key) {
  if (sdkPromise) return sdkPromise;
  const pending = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      script.onload = null; script.onerror = null;
      if (error) { script.remove(); reject(error); }
      else resolve(window.kakao.maps);
    };
    const timer = setTimeout(() => finish(new Error('지도 로딩 시간이 초과되었습니다. 키와 등록 도메인을 확인해 주세요.')), 15000);
    script.async = true;
    script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=' + encodeURIComponent(key);
    script.onerror = () => finish(new Error('Kakao 지도를 불러오지 못했습니다. 키, 도메인, 카카오맵 사용 설정을 확인해 주세요.'));
    script.onload = () => {
      if (!window.kakao?.maps?.load) { finish(new Error('Kakao Maps SDK를 확인해 주세요.')); return; }
      window.kakao.maps.load(() => finish());
    };
    document.head.appendChild(script);
  });
  sdkPromise = pending;
  pending.catch(() => { if (sdkPromise === pending) sdkPromise = undefined; });
  return pending;
}

export default function MapPanel({ place, places: suppliedPlaces, routePlaces, selectedId, onSelectPlace, roadPaths, accommodationId, showRoute = false, children }) {
  const places = useMemo(() => routePlaces ? [...new Map([...routePlaces,...suppliedPlaces].map(p=>[p.id,p])).values()] : suppliedPlaces, [routePlaces,suppliedPlaces]);
  const route = routePlaces || places;
  const container = useRef(null), mapRef = useRef(null), markersRef = useRef(new Map());
  const locationMarkerRef = useRef(null);
  const onSelectRef = useRef(onSelectPlace);
  onSelectRef.current = onSelectPlace;
  const [status, setStatus] = useState('loading'), [message, setMessage] = useState('');
  const [markerCount, setMarkerCount] = useState(0);
  const [mapRevision, setMapRevision] = useState(0);
  const key = import.meta.env.VITE_KAKAO_MAP_KEY?.trim();
  const latitude = place?.latitude, longitude = place?.longitude;
  useEffect(() => {
    if (!key) { setStatus('unconfigured'); return; }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) { setStatus('error'); setMessage('장소 좌표를 확인해 주세요.'); return; }
    setStatus('loading');
    let active = true, observer;
    const element = container.current;
    setStatus('loading'); setMessage('');
    loadMaps(key).then(maps => {
      if (!active) return;
      const center = new maps.LatLng(latitude, longitude);
      const map = new maps.Map(element, { center, level: 3 });
      mapRef.current = map;
      observer = new ResizeObserver(() => { const center = map.getCenter(); map.relayout(); map.setCenter(center); });
      observer.observe(element);
      setStatus('success'); setMapRevision(value => value + 1);
    }).catch(error => { if (active) { setStatus('error'); setMessage(error instanceof Error ? error.message : '지도를 표시하지 못했습니다.'); } });
    return () => {
      active = false; observer?.disconnect();
      for (const { marker, click } of markersRef.current.values()) { window.kakao.maps.event.removeListener(marker, 'click', click); marker.setMap(null); }
      markersRef.current.clear(); locationMarkerRef.current?.setMap(null); locationMarkerRef.current = null; mapRef.current = null; element?.replaceChildren();
    };
  }, [key, latitude, longitude]);
  useEffect(() => {
    if (status !== 'success' || !mapRef.current) return;
    const maps = window.kakao.maps, entries = markersRef.current, map = mapRef.current;
    const next = new Map(places.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180).map(p => [p.id, p]));
    for (const [id, entry] of entries) {
      if (!next.has(id)) { maps.event.removeListener(entry.marker, 'click', entry.click); entry.marker.setMap(null); entries.delete(id); }
    }
    const bounds = new maps.LatLngBounds();
    for (const [id, p] of next) {
      const position = new maps.LatLng(p.latitude, p.longitude);
      if (!routePlaces || routePlaces.some(stop=>stop.id===id) || id===selectedId) bounds.extend(position);
      const existing = entries.get(id);
      if (existing) { existing.marker.setPosition(position); existing.marker.setTitle(p.name); continue; }
      const marker = new maps.Marker({ map, position, title: p.name });
      const click = () => onSelectRef.current(id);
      maps.event.addListener(marker, 'click', click);
      entries.set(id, { marker, click });
    }
    setMarkerCount(entries.size);
    if ((routePlaces ? routePlaces.length : next.size) > 1) map.setBounds(bounds);
    else if (next.size === 1) map.setCenter(entries.values().next().value.marker.getPosition());
  }, [places, status, mapRevision]);
  useEffect(() => {
    if (status !== 'success' || !mapRef.current) return;
    const maps = window.kakao.maps;
    for (const [id, { marker }] of markersRef.current) {
      const selected = id === selectedId;
      const routeIndex = route.filter(p=>p.id!==accommodationId).findIndex(p=>p.id===id);
      const candidate = Boolean(routePlaces) && routeIndex < 0;
      const number = id === accommodationId ? '숙' : showRoute && routeIndex >= 0 ? routeIndex + 1 : null;
      const isLodging = id === accommodationId || places.find(place=>place.id===id)?.category === '숙소';
      const fill = candidate ? (selected ? '#075EAA' : '#258BE8') : isLodging ? '#4285F4' : selected ? '#5736C4' : '#7554F7';
      const center = isLodging ? '<path d="M9 17L18 9L27 17M11 16V27H25V16M16 27V20H20V27" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' : candidate && places.find(p=>p.id===id)?.category==='카페' ? '<text x="18" y="24" text-anchor="middle" font-size="19">☕</text>' : number === null ? '<circle cx="18" cy="18" r="7" fill="white"/>' : '<text x="18" y="24" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="700" fill="white">' + number + '</text>';
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46"><path fill="' + fill + '" stroke="white" stroke-width="2" d="M18 45C14 36 1 27 1 18a17 17 0 1 1 34 0c0 9-13 18-17 27Z"/>' + center + '</svg>';
      const image = new maps.MarkerImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), new maps.Size(36, 46), { offset: new maps.Point(18, 46) });
      marker.setImage(showRoute || selected || isLodging ? image : null); marker.setZIndex(selected ? 1 : 0);
    }
    const selected = places.find(place => place.id === selectedId);
    if (selected && Number.isFinite(selected.latitude) && Number.isFinite(selected.longitude) && Math.abs(selected.latitude) <= 90 && Math.abs(selected.longitude) <= 180) {
      if (routePlaces?.length) {
        const bounds = new maps.LatLngBounds();
        for (const p of [...routePlaces,selected]) if(Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)) bounds.extend(new maps.LatLng(p.latitude,p.longitude));
        mapRef.current.setBounds(bounds);
      } else mapRef.current.panTo(new maps.LatLng(selected.latitude, selected.longitude));
    }
  }, [selectedId, places, status, mapRevision, showRoute, accommodationId, routePlaces]);
  useEffect(() => {
    if (!showRoute || status !== 'success' || !mapRef.current || route.length < 2) return;
    const maps = window.kakao.maps;
    if (route.some(place => !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude) || Math.abs(place.latitude) > 90 || Math.abs(place.longitude) > 180)) return;
    const paths = roadPaths?.length ? roadPaths : [route];
    const lines = paths.map(points => new maps.Polyline({ map: mapRef.current, path: points.map(place => new maps.LatLng(place.latitude, place.longitude)), strokeWeight: 4, strokeColor: '#7554F7', strokeOpacity: 0.85, strokeStyle: 'solid' }));
    return () => lines.forEach(line => line.setMap(null));
  }, [route, status, mapRevision, showRoute, roadPaths]);
  function moveToCurrentLocation() {
    const map = mapRef.current, maps = window.kakao?.maps;
    if (!map || !maps || status !== 'success') return;
    const position = new maps.LatLng(demoLocation.latitude,demoLocation.longitude);
    if (!locationMarkerRef.current) {
      locationMarkerRef.current = new maps.CustomOverlay({
        map,position,zIndex:5,yAnchor:0.5,
        content:'<span class="map-demo-location-dot" role="img" aria-label="현재 위치: 광주 동구 제봉로82번길 16"></span>',
      });
    } else locationMarkerRef.current.setPosition(position);
    map.setLevel(3);
    map.panTo(position);
  }
  const selectedPlace = places.find(p => p.id === selectedId);
  return <section className="route-map" aria-label={status === 'success' ? 'Kakao 장소 지도' : '안내용 코스 지도'}>
    <div ref={container} style={{ position: 'absolute', inset: 0, visibility: status === 'success' ? 'visible' : 'hidden' }} />
    <button type="button" className="map-current-location" aria-label="현재 위치로 이동" title={`현재 위치로 이동 · ${demoLocation.address}`} disabled={status !== 'success'} onClick={moveToCurrentLocation}/>
    {status !== 'success' && children}
    {key && status !== 'success' && <span className="map-note" role={status === 'error' ? 'alert' : 'status'} style={{ zIndex: 2, top: 10, bottom: 'auto' }}>{status === 'success' ? (selectedPlace ? selectedPlace.name + (showRoute ? (roadPaths?.length ? ' · 자동차 도로 경로' : ' · 일정 순서 · 직선 연결') : ' · 선택한 장소') : '장소 ' + markerCount + '곳 · Marker를 선택해 주세요.') : status === 'error' ? message : 'Kakao 지도를 불러오는 중입니다.'}</span>}
  </section>;
}
