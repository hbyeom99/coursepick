import React from 'react';
export default function CourseSaveTags({candidates,selected,onChange,onConfirm,busy=false}){
 function toggle(tag){onChange(selected.includes(tag)?selected.filter(t=>t!==tag):[...selected,tag].slice(0,3));}
 return <div className="course-save-tags"><p>현재 일정에 포함된 장소의 태그입니다. 대표 태그를 최대 3개 선택해 주세요.</p><div className="course-save-tag-options">{candidates.map(tag=><button type="button" key={tag} className={`pill ${selected.includes(tag)?'primary':'secondary'}`} aria-pressed={selected.includes(tag)} disabled={busy||!selected.includes(tag)&&selected.length>=3} onClick={()=>toggle(tag)}>#{tag}</button>)}</div>{!candidates.length&&<p>현재 장소에서 확인된 태그가 없습니다. 태그 없이 저장할 수 있어요.</p>}<button type="button" className="pill primary" disabled={busy||candidates.length>0&&!selected.length} onClick={onConfirm}>{busy?'저장 중…':'선택 완료'}</button></div>;
}
