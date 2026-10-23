const numericId=value=>/^\d{1,20}$/.test(String(value||''))?String(value):null;
// Imported Kakao rows retain the provider ID inside their own DB namespace.
// Never interpret a TourAPI/other provider's numeric suffix as a Kakao ID.
const importedKakaoId=value=>/^(?:kakao_|[a-z][a-z0-9_]*_kakao_)(\d{1,20})$/.exec(String(value||''))?.[1]||null;
export function kakaoPlaceDetailUrl(place={},preferredUrl){
 for(const value of [preferredUrl,place.url,place.kakaoUrl]){
  if(typeof value!=='string')continue;
  try{
   const url=new URL(value);
   if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.port)continue;
   let id;
   if(url.hostname==='place.map.kakao.com')id=numericId(url.pathname.replace(/^\//,''));
   if(['map.kakao.com','place.map.kakao.com'].includes(url.hostname)){
    id=id||numericId(url.searchParams.get('itemId'))||numericId(/^\/link\/map\/(\d+)\/?$/.exec(url.pathname)?.[1]);
   }
   if(id)return 'https://place.map.kakao.com/'+id;
  }catch{}
 }
 const id=[place.kakaoPhotoPlaceId,place.lodging_info?.kakaoPhotoPlaceId,place.kakaoRef?.placeId,place.sourcePlaceId,place.lookup?place.originalId||place.id:null,place.id].map(numericId).find(Boolean)||importedKakaoId(place.id)||importedKakaoId(place.sourcePlaceId)||importedKakaoId(place.place_id);
 return id?'https://place.map.kakao.com/'+id:null;
}
