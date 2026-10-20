import React, { useEffect, useRef, useState } from 'react';
import { citiesFor, travelRegions } from '../lib/travelFilters.js';

function Choices({ name, values, selected, onChange }) {
  return <div className="travel-filter-choices" role="group" aria-label={name}>{values.map(value => <button type="button" key={value} className={`pill ${selected === value ? 'primary' : 'secondary'}`} aria-pressed={selected === value} onClick={() => onChange(value)}>{value}</button>)}</div>;
}
export function TravelFilterBar({ filters, onOpen, renderIcon }) {
  const traveler = [filters.infant && '유아', filters.pet && '반려동물'].filter(Boolean).join('·');
  return <div className="home-shortcuts travel-filter-bar">
    <button type="button" className={filters.region !== '전체' || filters.city !== '전체' ? 'condition-set' : 'condition-unset'} title={[filters.region,filters.city].filter(v=>v&&v!=='전체').join(' · ')||'지역'} aria-label={`지역: ${[filters.region,filters.city].filter(v=>v&&v!=='전체').join(' · ')||'전체'}`} onClick={() => onOpen('region')}>{renderIcon('pin')}<span>{filters.city !== '전체' ? filters.city : filters.region !== '전체' ? filters.region : '지역'}</span></button>
    <button type="button" className={filters.period !== '전체' ? 'condition-set' : 'condition-unset'} onClick={() => onOpen('period')}>{renderIcon('calendar')}<span>{filters.period !== '전체' ? filters.period : '기간'}</span></button>
    <button type="button" className={filters.infant || filters.pet ? 'condition-set' : 'condition-unset'} title={traveler || '동반 없음'} aria-label={`여행자: ${traveler || '없음'}`} onClick={() => onOpen('traveler')}><span className="traveler-filter-image" aria-hidden="true"/><span>{filters.infant && filters.pet ? '동반 2종' : filters.infant ? '유아 동반' : filters.pet ? '반려동물' : '구성원'}</span></button>
    <button type="button" className={filters.transport !== '전체' ? 'condition-set' : 'condition-unset'} onClick={() => onOpen('transport')}>{renderIcon(filters.transport==='도보'?'walk':filters.transport==='대중교통'?'bus':'car')}<span>{filters.transport === '전체' ? '이동수단' : filters.transport}</span></button>

  </div>;
}
export default function TravelFilterPopup({ value, onChange, places, focusSection, onReset, onApply, onCancel }) {
  const sections = useRef({});
  useEffect(() => {
    const section = sections.current[focusSection];
    if (section) section.querySelector('button')?.focus({preventScroll:true});
  }, [focusSection]);
  const patch = (key, next) => onChange(current => ({ ...current, [key]: next }));
  const cities = citiesFor(places, value.region);
  const [cityPage,setCityPage]=useState(0);
  useEffect(()=>setCityPage(0),[value.region]);
  const cityPages=Math.max(1,Math.ceil(cities.length/12));
  const shownCities=cities.slice(cityPage*12,cityPage*12+12);
  return <div className="travel-filter-popup">
    {(focusSection === 'all' || focusSection === 'period') && <section data-filter-section="period" ref={node => { sections.current.period = node; }}><h3>기간</h3><Choices name="여행 기간" values={['전체', '당일치기', '1박 2일', '2박 3일']} selected={value.period} onChange={next => patch('period', next)}/><p className="muted">출발 날짜가 아닌 여행 기간을 선택해주세요.</p></section>}
    {(focusSection === 'all' || focusSection === 'region') && <section data-filter-section="region" ref={node => { sections.current.region = node; }}><h3>지역</h3><Choices name="시·도" values={['전체', ...travelRegions]} selected={value.region} onChange={next => onChange(current => ({ ...current, region: next, city: '전체' }))}/>{value.region !== '전체' && <><h4>시·군·구</h4><Choices name="시·군·구" values={['전체', ...shownCities]} selected={value.city} onChange={next => patch('city', next)}/>{cityPages>1&&<div className="filter-city-pages"><button type="button" disabled={cityPage===0} onClick={()=>setCityPage(p=>p-1)} aria-label="이전 지역">이전</button><span>{cityPage+1} / {cityPages}</span><button type="button" disabled={cityPage>=cityPages-1} onClick={()=>setCityPage(p=>p+1)} aria-label="다음 지역">다음</button></div>}{!cities.length && <p className="muted">세부 지역 정보가 없어 선택한 시·도 전체에서 검색합니다.</p>}</>}</section>}
    {(focusSection === 'all' || focusSection === 'traveler') && <section data-filter-section="traveler" ref={node => { sections.current.traveler = node; }}><h3>여행 구성원</h3><div className="travel-filter-choices" role="group" aria-label="동반 여부"><button type="button" className={`pill ${value.infant ? 'primary' : 'secondary'}`} aria-pressed={value.infant} onClick={() => patch('infant', !value.infant)}>유아 동반</button><button type="button" className={`pill ${value.pet ? 'primary' : 'secondary'}`} aria-pressed={value.pet} onClick={() => patch('pet', !value.pet)}>반려동물 동반</button><button type="button" className={`pill ${!value.infant && !value.pet ? 'primary' : 'secondary'}`} aria-pressed={!value.infant && !value.pet} onClick={() => onChange(current => ({...current, infant:false, pet:false}))}>없음</button></div></section>}
    {(focusSection === 'all' || focusSection === 'transport') && <section data-filter-section="transport" ref={node => { sections.current.transport = node; }}><h3>이동수단</h3><Choices name="이동수단" values={['전체', '자동차', '대중교통', '도보']} selected={value.transport} onChange={next => patch('transport', next)}/><p className="muted">코스에 설정된 이동수단을 기준으로 검색합니다.</p></section>}
    <div className="travel-filter-actions"><button type="button" className="text-link" onClick={onReset}><span className="asset-icon asset-refresh filter-reset-icon" aria-hidden="true"/>초기화</button><button type="button" className="pill secondary" onClick={onCancel}>취소</button><button type="button" className="pill primary" onClick={onApply}>적용</button></div>
  </div>;
}
