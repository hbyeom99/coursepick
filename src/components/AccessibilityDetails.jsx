import React from 'react';
import { ACCESSIBILITY_FIELDS, ACCESSIBILITY_STATUS } from '../lib/accessibility.js';

export default function AccessibilityDetails({ info }){
 const entries=ACCESSIBILITY_FIELDS.filter(([key])=>info?.features?.[key]?.status && info.features[key].status!=='unknown');
 return <section className="place-detail-section accessibility-details"><h3>접근성 시설 정보</h3>
  <p className="muted">시설별 제공 원문을 기준으로 안내합니다. 이동 경로 전체와 교통수단의 접근성은 별도 확인이 필요합니다.</p>
  {!entries.length?<p>확인된 접근성 정보가 없습니다.</p>:<dl>{entries.map(([key,label])=>{
   const item=info.features[key];
   return <React.Fragment key={key}><dt>{label}</dt><dd><strong>{ACCESSIBILITY_STATUS[item.status]||'미확인'}</strong>{item.evidence.map((row,index)=><p key={index}>{row.raw}</p>)}</dd></React.Fragment>;
  })}</dl>}
  {info&&<><p className="muted">출처: {info.source||'미확인'} · 상세 조회일: {info.checkedAt||'미확인'}</p><p className="muted">표시하지 않은 시설은 미확인입니다. 방문 전 운영기관에 이용 조건을 확인해 주세요.</p></>}
 </section>;
}
