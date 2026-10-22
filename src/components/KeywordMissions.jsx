import React from 'react';
import {keywordMissionEligible,keywordMissions} from '../lib/keywordMissions.js';
export default function KeywordMissions({courses,completed,onCreate,onComplete}){
 return <div className="keyword-mission-list">{keywordMissions.map(mission=>{
 const done=completed.includes(mission.id),eligible=courses.some(course=>keywordMissionEligible(course,mission));
 return <article className="keyword-mission-card" key={mission.id}>
 <img src="/images/design-20261022/mission-0.webp" alt=""/>
 <span className="keyword-mission-points">+ 300P</span><div><h2># {mission.tag}</h2><strong>{mission.title}</strong><p>#{mission.tag} 태그를 넣어 나만의 코스를 공개해 보세요.</p><div className="keyword-mission-actions"><button type="button" onClick={()=>onCreate(mission.tag)}>코스 작성</button><button type="button" disabled={done||!eligible} onClick={()=>onComplete(mission)}>{done?'미션 완료!':'미션 완료'}</button></div><small>{done?'300P 적립 완료':eligible?'공개 코스 확인 완료 · 미션을 완료해 주세요':'해당 태그를 포함한 공개 코스를 저장하면 완료할 수 있어요.'}</small></div>
 </article>;
 })}</div>;
}
