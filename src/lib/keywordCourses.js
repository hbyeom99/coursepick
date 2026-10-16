import { parseSearchIntent, placeMatchesGroup, placesSatisfyIntent } from './searchIntent.js';
import { areaMatches, companionsMatch, courseConditionsMatch, placeArea } from './travelFilters.js';
import { searchCandidates } from './searchKeyboard.js';
import { straightDistance } from './pickerMap.js';
const groups=[['맥주','수제맥주','브루어리','양조장','펍','비어'],['커피','카페'],['산책','공원','숲'],['미식','맛집','먹방'],['문화','박물관','전시','역사'],['사진','포토'],['바다','해변'],['캠핑','야영','글램핑']];
const clean=v=>String(v||'').toLowerCase().replace(/\s+/g,'');
function relevance(p,words,terms) {
 const name=clean(p.name),tags=(p.tags||[]).map(clean);
 if(words.some(w=>name===w))return 12;
 if(words.some(w=>name.includes(w)))return 10;
 if(tags.some(t=>words.includes(t)))return 8;
 if(tags.some(t=>words.some(w=>t.includes(w))))return 7;
 if(terms.some(t=>name.includes(t)||tags.includes(t)))return 5;
 if(words.some(w=>clean(p.category).includes(w)))return 4;
 if(words.some(w=>clean(p.description).includes(w)))return 1;
 return 0;
}
function role(p) {
 if(p.category==='카페')return '카페에서 쉬기';
 if(p.category==='음식점')return '맛있는 한 끼';
 if((p.tags||[]).some(t=>['공원','산책','숲','해변','바다'].includes(t)))return '가까운 곳 산책';
 return '주변 명소 둘러보기';
}
export function generateKeywordCourses(catalog,filters,taste={},interests=[],today=new Date()) {
 const intent=parseSearchIntent(filters.query||'');
 if(!intent.query)return [];
 const words=intent.groups[0]||['여행'];
 const terms=[...new Set(words.flatMap(w=>[w,...(groups.find(g=>g.includes(w))||[])]))];
 const beer=terms.includes('맥주');
 const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(today);
 const festival=p=>p.id==='beeractivity_69477f4dcc29c0685b8c0bb9';
 const valid=catalog.filter(p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&p.category!=='숙소'&&areaMatches(p,filters)&&intent.regions.every(region=>placeArea(p).region===region)&&companionsMatch(p,filters)&&(!/축제|페스티벌|챌린지/.test(p.name)||festival(p)&&day>='2026-10-16'&&day<='2026-10-18'));
 const anchors=valid.map(p=>({p,score:intent.groups.length?relevance(p,words,terms):1})).filter(x=>x.score>0 && (filters.category==='전체'||!filters.category||x.p.category===filters.category)).sort((a,b)=>b.score-a.score||a.p.id.localeCompare(b.p.id)).slice(0,100);
 const candidates=[];
 for(const {p:a,score} of anchors) {
  const partners=valid.filter(b=>b.id!==a.id&&placeArea(b).region===placeArea(a).region&&placesSatisfyIntent([a,b],intent)).map(b=>({b,d:straightDistance(a,b)})).filter(x=>x.d!==null&&x.d>=100&&x.d<=(filters.transport==='도보'?1500:5000));
  partners.sort((x,y)=>{
   const affinity=p=>(p.tags||[]).filter(t=>interests.includes(t)).length+((taste.space??50)>50&&(p.tags||[]).includes('야외')?1:0);
   return (x.d/1000-affinity(x.b)*0.2)-(y.d/1000-affinity(y.b)*0.2);
  });
  for(const {b,d} of partners.slice(0,8)) {
   const transport=filters.transport&&filters.transport!=='전체'?filters.transport:beer?'대중교통':d<=1200?'도보':'대중교통';
   let stops=[a,b],labels=['오후 일정 · '+a.name,role(b)],times=['14:00','16:30'],minutes=[90,90];
   if(festival(a)) {if(b.category!=='음식점')continue;stops=[b,a];labels=['점심 식사','맥주 축제 즐기기'];times=['12:30','16:00'];minutes=[60,180];}
   const hours=festival(a)?6.5:4;
   const tags=[...new Set([filters.query,...stops.flatMap(p=>p.tags||[])])];
   if(filters.theme&&filters.theme!=='전체'&&!tags.includes(filters.theme))continue;
   if(filters.hours&&filters.hours!=='전체'&&hours>Number(filters.hours))continue;
   if(filters.people&&filters.people!=='전체'&&Number(filters.people)>6)continue;
   const keyword=intent.conditions.join(' · ')||filters.query.replace(/^#+/,'');
   const course={id:'keyword-ai-'+encodeURIComponent(intent.query)+'-'+stops.map(p=>p.id).join('--'),name:festival(a)?'맥주 축제 즐기는 날, 점심도 함께':a.name+'에서 '+keyword+' 즐기기, '+role(b),description:'검색 키워드와 가까운 장소를 연결해 만든 코스입니다. 영업시간과 메뉴·프로그램 운영 여부는 방문 전 확인해 주세요.',author:'coursepick',region:a.region,stopIds:stops.map(p=>p.id),imagePlaceId:a.id,tags,representativeTags:[keyword,...(a.tags||[]).filter(t=>t!==keyword)].slice(0,3),schedule:stops.map((p,i)=>({placeId:p.id,label:labels[i],time:times[i],minutes:minutes[i],duration:minutes[i]+'분'})),hours,transport,maxPeople:6,isSample:true,isDemo:false,source:'keyword',theme:'AI 추천 코스',generationMethod:'keyword-distance',straightLineKm:Math.round(d/10)/100};
   if(!courseConditionsMatch(course,stops,filters))continue;
   candidates.push({course,anchor:a.id,partner:b.id,score:score*10-d/1000});
  }
 }
 candidates.sort((a,b)=>b.score-a.score||a.course.id.localeCompare(b.course.id));
 const chosen=[],anchorsUsed=new Set(),pairs=new Set(),partnerUses=new Map();
 for(const item of candidates) {
  const pair=[...item.course.stopIds].sort().join('|');
  if(anchorsUsed.has(item.anchor)||pairs.has(pair)||(partnerUses.get(item.partner)||0)>=2)continue;
  chosen.push(item.course);anchorsUsed.add(item.anchor);pairs.add(pair);partnerUses.set(item.partner,(partnerUses.get(item.partner)||0)+1);
  if(chosen.length===5)break;
 }
 return chosen;
}
