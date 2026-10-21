import { stayDuration } from '../lib/stayDuration.js';
import React from 'react';
import { coursePeriod } from '../lib/homeFeed.js';
export default function CourseSaved({ course, placeOf, Photo, Icon, onView, onHome }) {
  return <section className="course-saved" aria-labelledby="saved-success-title">
    <header className="saved-success-header"><button type="button" className="icon-button" aria-label="홈으로 돌아가기" onClick={onHome}><Icon name="back"/></button><strong>저장 완료</strong></header>
    <div className="saved-success-message"><span className="saved-success-check" aria-hidden="true"><span className="asset-icon asset-check"/></span><h1 id="saved-success-title">나만의 코스가 저장됐어요!</h1><p>나만의 여행 코스가 준비됐어요.<br/>저장한 코스를 확인해 보세요.</p></div>
    <article className="saved-success-card"><small className="saved-success-label"><span className="asset-icon asset-check" aria-hidden="true"/>저장 완료</small><h2>{course.name}</h2><p className="saved-success-meta">{course.region} · {coursePeriod(course)} · {course.transport}</p><ol>{course.stopIds.slice(0,3).map((id,index) => {const place=placeOf(id); const entry=course.schedule?.[index];return <li key={id}><span className="saved-success-number">{index+1}</span><Photo place={place}/><div><strong>{place?.name || '장소 정보 확인 중'}</strong><small>{entry ? stayDuration(entry) : `${place?.region || course.region} · ${place?.category || '여행 장소'}`}</small></div></li>;})}</ol>{Boolean(course.kakaoPlaceRefs?.length)&&<p>카카오 장소 {course.kakaoPlaceRefs.length}곳도 함께 저장했어요.</p>}{Boolean(course.googlePlaceRefs?.length)&&<p>Google 장소 {course.googlePlaceRefs.length}곳도 함께 저장했어요.</p>}{course.stopIds.length>3 && <p className="saved-success-more">외 {course.stopIds.length-3}곳 · 전체 {course.stopIds.length}곳</p>}</article>
    <div className="saved-success-actions"><button type="button" onClick={onView}>저장한 코스 보기</button><button type="button" onClick={onHome}>홈으로</button></div>
  </section>;
}
