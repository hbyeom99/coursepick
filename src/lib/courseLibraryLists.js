export function courseLibraryLists(authored, savedIds, courses) {
 const publicCourses=authored.filter(c=>c.isPublic!==false);
 const byId=new Map(courses.map(c=>[c.id,c])); authored.forEach(c=>byId.set(c.id,c));
 const privateIds=[...new Set([...authored.filter(c=>c.isPublic===false).map(c=>c.id),...savedIds])];
 return {publicCourses,privateCourses:privateIds.map(id=>byId.get(id)||{id,name:'현재 볼 수 없는 코스',unavailable:true})};
}
