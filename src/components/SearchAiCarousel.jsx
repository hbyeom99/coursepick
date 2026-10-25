import CourseVisualCard from './CourseVisualCard.jsx';
import CourseCardMeta from './CourseCardMeta.jsx';
import {courseSearchCardTags} from '../lib/userCourseSearch.js';

export default function SearchAiCarousel({courses,catalog,images,query,Photo,Icon,onOpen,onImageSelected}) {
 return <section className="search-ai-panel" aria-label="AI 추천 코스"><div className="course-grid search-design-grid">{courses.map(course=><CourseVisualCard key={course.id} name={course.name} tags={courseSearchCardTags(course,query)} photo={<Photo course={course} catalog={catalog} preferredId={images.get(course.id)} query={query} onImageSelected={onImageSelected}/>} meta={<CourseCardMeta course={course} Icon={Icon}/>} onOpen={()=>onOpen(course)}/>)}</div></section>;
}
