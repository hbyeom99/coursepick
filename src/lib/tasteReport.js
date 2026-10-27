const AXES=['planning','experience','exploration','spending'];
export function tasteType(taste){return taste&&AXES.every(axis=>Number.isFinite(taste[axis])&&taste[axis]>=0&&taste[axis]<=100)?AXES.map(axis=>taste[axis]>=50?'1':'0').join(''):null;}
const yearOf=value=>{if(typeof value!=='string')return null;if(/^\d{4}-\d{2}-\d{2}$/.test(value))return Number(value.slice(0,4));const date=new Date(value);return Number.isFinite(date.getTime())?Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Seoul',year:'numeric'}).format(date)):null;};
export function buildTasteReport({year,savedCourses=[],courseCatalog=[],journals=[],zipRooms=[],catalog=[],userId}){
 const places=new Map(catalog.map(p=>[p.id,p]));const courses=new Map([...courseCatalog,...savedCourses].map(c=>[c.id,c]));
 const selected=new Map();let undatedSaved=0;
 for(const course of savedCourses){const date=course.savedAt||((course.reportOwned||(userId&&course.authorId===userId))?course.createdAt:null);if(!yearOf(date)){undatedSaved++;continue;}if(yearOf(date)===year)selected.set(course.id,course);}
 for(const journal of journals){if(yearOf(journal.visitedAt)!==year)continue;const course=courses.get(journal.courseId);selected.set(journal.courseId,course||{id:journal.courseId,stopIds:journal.placeIds,tags:[...new Set((journal.placeIds||[]).flatMap(id=>places.get(id)?.tags||[]))]});}
 const keywords=new Map();for(const course of selected.values()){
  const tags=[...new Set([...(course.tags||[]),...(course.representativeTags||[])].map(tag=>String(tag).replace(/^#/,'').trim()).filter(Boolean))];
  for(const tag of tags){const item=keywords.get(tag)||{tag,count:0,image:null};item.count++;const photo=(course.stopIds||[]).map(id=>places.get(id)).find(p=>p?.tags?.includes(tag)&&p.imageUrl)||places.get(course.imagePlaceId);item.image ||= photo?.imageUrl||course.imageUrl||null;keywords.set(tag,item);}
 }
 const topTags=[...keywords.values()].sort((a,b)=>b.count-a.count||a.tag.localeCompare(b.tag,'ko')).slice(0,3);
 const companions=new Map(),seen=new Set();for(const room of zipRooms){if(seen.has(room.id)||yearOf(room.startDate)!==year||!room.members?.some(m=>m.id===userId))continue;seen.add(room.id);for(const person of room.members){if(person.id===userId)continue;const item=companions.get(person.id)||{id:person.id,name:person.name||'여행 멤버',photo:person.photo||null,count:0};item.count++;companions.set(person.id,item);}}
 const companion=[...companions.values()].sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id))[0]||null;
 return {year,topTags,companion,undatedSaved,courseCount:selected.size};
}
