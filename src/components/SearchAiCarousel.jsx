import {useEffect,useRef,useState} from 'react';
import CourseVisualCard from './CourseVisualCard.jsx';
import CourseCardMeta from './CourseCardMeta.jsx';
export default function SearchAiCarousel({courses,catalog,images,query,Photo,Icon,onOpen,onImageSelected}) {
 const [collapsed,setCollapsed]=useState(false),[index,setIndex]=useState(0);const track=useRef(null);
 const key=JSON.stringify([query,courses.map(c=>c.id)]);
 useEffect(()=>{setIndex(0);track.current?.scrollTo({left:0});},[key]);
 function cardStep(){return (track.current?.firstElementChild?.getBoundingClientRect().width||0)+8;}
 function previous(){const maximum=Math.max(0,courses.length-2),target=Math.max(0,index-1);setIndex(target);track.current?.scrollTo({left:target*cardStep(),behavior:'smooth'});}
 function next(){const maximum=Math.max(0,courses.length-2),target=index>=maximum?0:index+1;setIndex(target);track.current?.scrollTo({left:target*cardStep(),behavior:'smooth'});}
 return <section className="search-ai-panel" aria-label="AI 추천 코스"><div className="search-ai-heading"><h2>✨ AI 추천 코스 <span>({courses.length}개)</span></h2><button type="button" aria-label={collapsed?'AI 추천 코스 펼치기':'AI 추천 코스 접기'} aria-expanded={!collapsed} aria-controls="search-ai-slides" onClick={()=>setCollapsed(v=>!v)}><Icon name={collapsed?'down':'up'} size={19}/></button></div>{!collapsed&&<div id="search-ai-slides" className="search-ai-slides" ref={track} onScroll={e=>{const width=cardStep();if(width)setIndex(Math.min(Math.max(0,courses.length-2),Math.round(e.currentTarget.scrollLeft/width)));}}>{courses.map((course,slideIndex)=><article className="search-ai-slide" key={course.id}><CourseVisualCard name={course.name} tags={course.representativeTags?.length?course.representativeTags:course.tags} photo={<Photo course={course} catalog={catalog} preferredId={images.get(course.id)} query={query} onImageSelected={onImageSelected}/>} meta={<CourseCardMeta course={course} Icon={Icon}/>} onOpen={()=>onOpen(course)} action={courses.length>2?<>{slideIndex>0&&<button type="button" className="search-ai-previous" aria-label="이전 추천 코스" onClick={previous}><Icon name="arrow" size={17}/></button>}<button type="button" className="search-ai-next" aria-label="다음 추천 코스" onClick={next}><Icon name="arrow" size={17}/></button></>:null}/></article>)}</div>}</section>;
}
