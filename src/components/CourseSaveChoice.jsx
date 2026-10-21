export default function CourseSaveChoice({ course, onSave, error, saving = false }) {
  const hours = Number(course.hours) || 0;
  const minutes = Math.round(hours * 60);
  const duration = `${Math.floor(minutes / 60)}시간${minutes % 60 ? ` ${minutes % 60}분` : ''}`;
  return <div className="course-save-choice">
    <p className="save-choice-description">추가한 장소와 방문 순서가 함께 저장돼요.<br/>저장한 코스는 마이에서 언제든 수정할 수 있어요.</p>
    <div className="save-choice-preview"><strong>{course.name}</strong><small>{course.region} · 여행 장소 {course.stopIds.length+(course.googlePlaceRefs?.length||0)+(course.kakaoPlaceRefs?.length||0)}개 · {(course.googlePlaceRefs?.length||course.kakaoPlaceRefs?.length) ? '소요시간 미계산' : `총 ${duration}`}</small></div>
    {error && <p className="save-choice-error" role="alert">{error}</p>}
    <div className="save-choice-actions"><button type="button" disabled={saving} onClick={() => onSave(true)}>{saving ? '저장 중…' : '모두 공개하기'}</button><button type="button" disabled={saving} onClick={() => onSave(false)}>나만보기</button></div>
    <p className="save-choice-note">내 코스에서 언제든 확인할 수 있습니다.</p>
  </div>;
}
