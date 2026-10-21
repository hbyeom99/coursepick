import React from 'react';
import CourseVisualCard from './CourseVisualCard.jsx';
import CourseCardMeta from './CourseCardMeta.jsx';
import CourseRepresentativePhoto from './CourseRepresentativePhoto.jsx';
export default function EditorialCourses({Icon,courses=[],onOpen,error}){
 return <>{error&&<p className="muted">{error}</p>}{courses.map(course=><CourseVisualCard key={course.id} name={course.name} tags={course.tags} photo={<CourseRepresentativePhoto src={course.editorialVisits.find(v=>v.cover_image&&v.image_url)?.image_url} alt={course.editorialVisits.find(v=>v.cover_image&&v.image_url)?.name||'코스 대표 사진 준비 중'}/>} meta={<CourseCardMeta course={course} Icon={Icon}/>} ariaLabel={`${course.name} 코스 상세보기`} onOpen={()=>onOpen(course)}/>)}</>;
}
