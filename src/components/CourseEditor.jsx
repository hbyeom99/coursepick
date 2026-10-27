import React,{useRef} from 'react';
// One editor page for ordinary courses and editorial visit adapters.
export default function CourseEditor({draft,onChange,onSubmit,onBack,backLabel='이전 페이지로 돌아가기',Icon,map,headerAction,itineraryActions,children,tagCandidates=[],selectedTags=[],onToggleTag,error,busy=false,description,managementActions}){
 const limit=useRef(Math.max(30,draft.name.length)).current;
 return <form id="course-editor-form" className={`editor${draft.isExistingCourse?' is-existing-course':''}`} onSubmit={onSubmit}>
 <header className="editor-top"><button type="button" className="icon-button" aria-label={backLabel} disabled={busy} onClick={onBack}><Icon name="back"/></button><h1>{draft.isExistingCourse?'코스 수정하기':'코스 만들기'}</h1>{headerAction}<button type="submit" className="pill primary" disabled={busy}>{busy?'저장 중…':'저장'}</button></header>
 {map}
 <div className="editor-title-field"><label className="field-label" htmlFor="course-title"><Icon name="flag" size={14}/>코스 제목</label><div className="course-title-input-wrap"><input id="course-title" className="field" maxLength={limit} aria-invalid={Boolean(error)} aria-describedby={error?'course-title-count course-title-error':'course-title-count'} placeholder="코스 제목을 입력해주세요" value={draft.name} onChange={e=>onChange(v=>({...v,name:e.target.value}))}/><span id="course-title-count" className="char-count">{draft.name.length}/{limit}</span></div>{error&&<p id="course-title-error" className="form-error" role="alert">{error}</p>}</div>
 {description}
 <section className="editor-itinerary"><div className="section-title"><h2>여행 장소 <span>({draft.editorialVisits?.length??((draft.stopIds?.length||0)+(draft.kakaoPlaceRefs?.length||0)+(draft.googlePlaceRefs?.length||0))})</span></h2>{itineraryActions}</div>{children}</section>
 <section className="editor-course-tags" aria-label="대표 키워드 선택"><div className="section-title"><h2>코스 키워드</h2><span>{selectedTags.length}/3</span></div><p>대표 키워드를 최대 3개 선택해 주세요.</p><div className="editor-course-tag-options" role="group" aria-label="코스 해시태그">{tagCandidates.map(tag=><button type="button" key={tag} aria-pressed={selectedTags.includes(tag)} className={selectedTags.includes(tag)?'selected':''} onClick={()=>onToggleTag(tag)}>#{tag}</button>)}</div>{!tagCandidates.length&&<p>장소를 추가하면 키워드가 표시됩니다.</p>}</section>
 {managementActions}
 </form>;
}
