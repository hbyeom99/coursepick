import React from 'react';
export default function CourseVisualCard({name,tags=[],photo,meta,onOpen,action,ariaLabel}){
 return <article className="course-visual-card"><div className="course-visual-photo">{photo}</div><button type="button" className="course-visual-open" aria-label={ariaLabel||`${name} 코스 상세보기`} onClick={onOpen}><h2 className="course-visual-title">{name}</h2><span className="course-visual-tags">{tags.slice(0,3).map(tag=><span key={tag}>#{tag}</span>)}</span><span className="course-visual-meta">{meta}</span></button>{action&&<div className="course-visual-action">{action}</div>}</article>;
}
