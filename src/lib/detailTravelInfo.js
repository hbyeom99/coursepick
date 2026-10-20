import { straightDistance, distanceLabel } from './pickerMap.js';

export function detailTravelInfo({previous,place,transport,route,status}) {
  if (!previous || !place) return '';
  const from=route?.stopIds?.findIndex((id,index)=>id===previous.id&&route.stopIds[index+1]===place.id) ?? -1;
  const segment=from>=0?route?.segments?.[from]:null;
  const valid=segment&&segment.fromId===previous.id&&segment.toId===place.id&&Number.isFinite(segment.durationSeconds)&&segment.durationSeconds>=0;
  if (['자동차','대중교통'].includes(transport)&&valid) {
    const minutes=Math.ceil(segment.durationSeconds/60);
    const time=minutes>=60?`${Math.floor(minutes/60)}시간${minutes%60?` ${minutes%60}분`:''}`:`${minutes}분`;
    const distance=Number.isFinite(segment.distanceMeters)&&segment.distanceMeters>=0?distanceLabel(segment.distanceMeters):'거리 확인 불가';
    const estimated=transport==='대중교통'&&segment.method==='distance-model';
    return `${previous.name}에서 ${transport} 약 ${time} · ${distance}${estimated?' · 거리 기반 추정':''}${transport==='대중교통'&&segment.waitingIncluded!==true?' · 대기시간 제외':''}`;
  }
  const meters=straightDistance(previous,place);
  const distance=meters===null?'거리 확인 불가':`${distanceLabel(meters)} · 직선거리`;
  const time=transport==='도보'?'도보 이동시간 확인 필요':status==='loading'?'이동정보 조회 중':'이동시간 확인 불가';
  return `${previous.name}에서 ${distance} · ${time}`;
}
