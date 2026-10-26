import {userCourseSearchMatch,courseSearchFocus} from './userCourseSearch.js';
// Calculate expensive trait affinity once per course, never inside Array.sort.
export function rankUserCourses(courses,query,affinity,placesOf=()=>[],relatedQueries=[]){
 return courses.map(course=>({course,match:userCourseSearchMatch(course,query,relatedQueries)})).filter(item=>item.match.matched)
  .map(({course,match})=>({course,rank:match.rank,focus:courseSearchFocus(course,query,placesOf(course),relatedQueries)==='central'?0:1,fit:affinity(course)}))
  .sort((a,b)=>a.rank-b.rank||a.focus-b.focus||b.fit-a.fit||a.course.id.localeCompare(b.course.id))
  .map(item=>item.course);
}

export function appendUserExamples(existing,examples){
 const ids=new Set(existing.map(c=>c.id));
 const additions=examples.filter(c=>{if(ids.has(c.id))return false;ids.add(c.id);return true;}).slice(0,Math.max(0,6-existing.length));
 return [...existing,...additions];
}
