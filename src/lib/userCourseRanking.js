import {userCourseSearchMatch} from './userCourseSearch.js';
// Calculate expensive trait affinity once per course, never inside Array.sort.
export function rankUserCourses(courses,query,affinity){
 return courses.map(course=>({course,rank:userCourseSearchMatch(course,query).rank,fit:affinity(course)}))
  .sort((a,b)=>a.rank-b.rank||b.fit-a.fit||a.course.id.localeCompare(b.course.id))
  .map(item=>item.course);
}

export function appendUserExamples(existing,examples){
 const ids=new Set(existing.map(c=>c.id));
 const additions=examples.filter(c=>{if(ids.has(c.id))return false;ids.add(c.id);return true;}).slice(0,Math.max(0,5-existing.length));
 return [...existing,...additions];
}
