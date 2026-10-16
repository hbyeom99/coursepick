export function straightDistance(a,b) {
 if (![a?.latitude,a?.longitude,b?.latitude,b?.longitude].every(Number.isFinite)) return null;
 const rad=x=>x*Math.PI/180, lat=rad(b.latitude-a.latitude), lon=rad(b.longitude-a.longitude);
 const h=Math.sin(lat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(lon/2)**2;
 return 6371000*2*Math.asin(Math.sqrt(Math.min(1,h)));
}
export function insertionNeighbors(stops,afterId) {
 const index=afterId==='end'?stops.length-1:stops.findIndex(p=>p.id===afterId);
 return {before:stops[index],after:stops[index+1]};
}
export function distanceLabel(meters) {return meters==null?'거리 확인 불가':meters<1000?`약 ${Math.round(meters/10)*10}m`:`약 ${(meters/1000).toFixed(1)}km`;}

export function rankByInsertionDistance(items,stops,afterId) {
 const {before,after}=insertionNeighbors(stops,afterId);
 if(!before)return items;
 return items.map(item=>({...item,insertionDistance:straightDistance(before,item.place),insertionFromName:before.name,nextDistance:after?straightDistance(item.place,after):null,nextName:after?.name})).sort((a,b)=>(a.insertionDistance??Infinity)-(b.insertionDistance??Infinity));
}
