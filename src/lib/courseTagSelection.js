export function courseTagCandidates(stops) {
 const counts=new Map();
 stops.forEach(place=>[...new Set(place.tags||[])].forEach(tag=>counts.set(tag,(counts.get(tag)||0)+1)));
 return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([tag])=>tag);
}
export function selectedCourseTags(selected,candidates) {
 return [...new Set(Array.isArray(selected)?selected:[])].filter(tag=>candidates.includes(tag)).slice(0,3);
}
