// Compare the recommendation set, not only the score of each individual route.
export function spreadAnchors(anchors,regionOf,limit=50){
 const groups=new Map();
 for(const place of anchors){const key=regionOf(place);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(place);}
 const result=[];
 for(let index=0;result.length<limit;index++){
  let added=false;for(const group of groups.values())if(group[index]){result.push(group[index]);added=true;if(result.length===limit)break;}
  if(!added)break;
 }
 return result;
}
export function selectDiverseCourses(candidates,{limit=5,avoidPlaceIds=[]}={}){
 const signatures=new Set(),remaining=[];
 for(const item of [...candidates].sort((a,b)=>b.score-a.score||a.course.id.localeCompare(b.course.id))){
  const key=[...item.ids].sort().join('|');if(signatures.has(key))continue;signatures.add(key);remaining.push(item);
 }
 const chosen=[],anchors=new Set(),used=new Set(),regions=new Map(),kinds=new Map(),avoid=new Set(avoidPlaceIds);
 // Prefer disjoint routes; relax only peripheral overlap, never reuse a center.
 for(const disjoint of [true,false])while(chosen.length<limit){
  let best=null,bestValue=-Infinity;
  for(const item of remaining){
   if(anchors.has(item.anchor)||chosen.includes(item))continue;
   if(chosen.some(other=>item.ids.filter(id=>other.ids.includes(id)).length>(disjoint?0:Math.max(1,Math.floor(Math.min(item.ids.length,other.ids.length)/2)))))continue;
   const fresh=item.ids.filter(id=>!used.has(id)&&!avoid.has(id)).length;
   const repeated=item.ids.filter(id=>avoid.has(id)).length;
   const value=fresh*8-repeated*8-(regions.get(item.region)||0)*5-(kinds.get(item.kind)||0)*2+Math.max(-3,Math.min(3,item.score));
   if(value>bestValue){best=item;bestValue=value;}
  }
  if(!best)break;
  chosen.push(best);anchors.add(best.anchor);best.ids.forEach(id=>used.add(id));
  regions.set(best.region,(regions.get(best.region)||0)+1);kinds.set(best.kind,(kinds.get(best.kind)||0)+1);
 }
 return chosen.map(item=>item.course);
}
