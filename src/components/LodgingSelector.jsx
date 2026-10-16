import React, { useEffect, useRef, useState } from 'react';
import { getLodgingPage } from '../services/placeService.ts';
import { distanceKm } from '../lib/courseRoute.js';

export default function LodgingSelector({ id, candidates, selected, onChange, region, stops = [], onLoaded, onAdd }) {
  const [query, setQuery] = useState(''), [page, setPage] = useState(0), [more, setMore] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const loaded = useRef(onLoaded); loaded.current = onLoaded;
  const first = stops[0], last = stops.at(-1);
  const key = `${region || ''}|${first?.id || ''}|${last?.id || ''}|${query}`;
  const [activeKey, setActiveKey] = useState(key);
  const [retry, setRetry] = useState(0);
  const [remote, setRemote] = useState([]);
  useEffect(() => { setPage(0); setRemote([]); setMore(false); setActiveKey(key); }, [key]);
  useEffect(() => {
    if (activeKey !== key) return;
    const controller = new AbortController(); let active = true;
    setLoading(true); setError('');
    getLodgingPage({region, query, page, first, last}, controller.signal).then(result => {
      if (!active) return;
      const rows = result.places.filter(p => (!first || distanceKm(p, first) <= 15) && (!last || distanceKm(p, last) <= 15));
      setRemote(current => page ? [...new Map([...current,...rows].map(p => [p.id,p])).values()] : rows);
      loaded.current?.(rows); setMore(result.more);
    }).catch(() => { if (active) setError('숙소 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [key, activeKey, page, retry]);
  const options = [...new Map([...candidates.filter(item => !item.place.id.startsWith('lodgingcsv_') && (!query || item.place.name.includes(query))), ...remote.map(place => ({place, distance:first ? distanceKm(first,place) : null}))].map(item => [item.place.id, item])).values()].sort((a,b) => (a.distance ?? 0) - (b.distance ?? 0) || a.place.name.localeCompare(b.place.name,'ko'));

  return <section className="info-box" aria-label="숙소 출발·복귀 연결">
    <h3>숙소 출발·복귀 연결</h3>
    <label className="field-label" htmlFor={`${id}-query`}>숙소 이름 검색</label><input id={`${id}-query`} className="field" type="search" placeholder="숙소 이름을 입력하세요" value={query} onChange={e => setQuery(e.target.value)}/><label className="field-label" htmlFor={id}>숙소 선택</label>
    <select id={id} className="field" value={selected?.id || ''} onChange={event => onChange(event.target.value || null)}>
      <option value="">숙소 없이 여행</option>
      {selected && !options.some(item => item.place.id === selected.id) && <option value={selected.id}>{selected.name} · 연결된 숙소</option>}
      {options.map(({ place, distance }) => <option key={place.id} value={place.id}>{place.name}{Number.isFinite(distance) ? ` · 출발 장소에서 직선 ${distance.toFixed(1)}km` : ''}</option>)}
    </select>
    {loading && <p role="status" className="muted">숙소를 불러오는 중입니다.</p>}{error && <p role="alert">{error}<button type="button" className="text-link" onClick={() => setRetry(v => v + 1)}>다시 시도</button></p>}{more && <button type="button" className="text-link" disabled={loading} onClick={() => setPage(value => value + 1)}>숙소 더 보기</button>}
    {onAdd && <button type="button" className="pill primary wide lodging-add-button" disabled={!selected || stops.some(p=>p.id===selected.id)} onClick={()=>onAdd(selected)}>{selected && stops.some(p=>p.id===selected.id) ? '이미 추가한 숙소' : '+ 숙소 추가'}</button>}
    {selected ? <>
      <p><strong>{selected.name}</strong><br/>{selected.location}</p>
      {selected.lodgingInfo?.businessType && <p>숙소 유형: {selected.lodgingInfo.businessType}</p>}
      <p>체크인 {selected.lodgingInfo?.checkIn || '숙소에 확인'} · 체크아웃 {selected.lodgingInfo?.checkOut || '숙소에 확인'}</p>
      <p className="muted">숙소에서 출발하고 저녁 일정 이후 돌아오는 하루 일정입니다. 첫날은 체크인 전 객실 이용을 가정하지 않습니다. 요금·예약 가능 여부와 최신 시간을 숙소에 확인하세요.</p>
      <button type="button" className="text-link" onClick={() => onChange(null)}>숙소 연결 해제</button>
    </> : <p className="muted">숙소는 선택 사항입니다. 가까운 숙소가 없다면 다른 지역이나 코스를 선택해 주세요.</p>}
  </section>;
}
