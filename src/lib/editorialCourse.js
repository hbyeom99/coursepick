export function toEditorialCourse(row,places=[]){
 const byId=new Map(places.map(p=>[p.id,p]));
 const visits=(Array.isArray(row.days)?row.days:[]).map(visit=>{const p=byId.get(visit.place_id);return {...visit,image_url:visit.image_url||p?.image_url,location:p?.location||'',region:p?.region||row.region,category:p?.category||'여행 장소'};});
 return {id:row.id,name:row.title,description:row.description,region:row.region,transport:row.transport,tags:row.tags||[],representativeTags:row.tags||[],durationDays:Math.max(1,...visits.map(v=>v.day||1)),stopIds:[...new Set(visits.map(v=>v.place_id).filter(Boolean))],imagePlaceId:row.cover_place_id||null,editorialVisits:visits,editorialNotices:row.notices||[],author:'coursepick',theme:'코스픽 추천 코스',source:'editorial',isSample:true,isDemo:false,isPublic:true};
}
