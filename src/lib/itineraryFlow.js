const labels = {morning:'오전 일정',lunch:'점심',lunchCafe:'점심 후 카페·디저트',afternoon:'오후 일정',dinner:'저녁',dinnerCafe:'저녁 후 카페·디저트',done:'코스 구성 마치기'};
export function itineraryFlow(stops, override) {
 const meals=stops.filter(p=>p.category==='음식점').length;
 const lastMeal=stops.map(p=>p.category).lastIndexOf('음식점');
 const tail=stops.slice(lastMeal+1);
 const count=tail.filter(p=>p.category==='관광지').length;
 const last=stops.at(-1);
 let stage=meals>=2 ? last?.category==='음식점' ? 'dinnerCafe' : 'done' : meals===1 ? last?.category==='음식점' ? 'lunchCafe' : count>=2 ? 'dinner' : 'afternoon' : count>=2 ? 'lunch' : 'morning';
 if(override && labels[override])stage=override;
 const actions=stage==='morning'&&count>=1?[{label:'오전 장소 더 추가',stage:'morning'},{label:'점심 장소 선택',stage:'lunch'}]:stage==='afternoon'&&count>=1?[{label:'오후 장소 더 추가',stage:'afternoon'},{label:'저녁 장소 선택',stage:'dinner'}]:stage==='lunchCafe'?[{label:'카페·디저트 선택',stage:'lunchCafe'},{label:'오후 일정으로',stage:'afternoon'}]:stage==='dinnerCafe'?[{label:'카페·디저트 선택',stage:'dinnerCafe'},{label:'코스 구성 마치기',stage:'done'}]:[];
 return {stage,label:labels[stage],actions,category:['lunch','dinner'].includes(stage)?'음식점':['lunchCafe','dinnerCafe'].includes(stage)?'카페':stage==='done'?null:'관광지'};
}
