import {generateHomeKeywordCourses} from './homeKeywordCourses.js';
import {userCourseSearchMatch,literalCourseKey} from './userCourseSearch.js';
export const searchPersonas=[
 {id:'p01',name:'서윤',taste:{planning:80,experience:25,exploration:70,spending:35}},
 {id:'p02',name:'도현',taste:{planning:35,experience:85,exploration:80,spending:50}},
 {id:'p03',name:'하린',taste:{planning:65,experience:35,exploration:60,spending:70}},
 {id:'p04',name:'민재',taste:{planning:45,experience:65,exploration:90,spending:25}},
 {id:'p05',name:'지우',taste:{planning:75,experience:50,exploration:35,spending:45}},
 {id:'p06',name:'유나',taste:{planning:25,experience:30,exploration:75,spending:60}},
 {id:'p07',name:'준서',taste:{planning:85,experience:80,exploration:55,spending:40}},
 {id:'p08',name:'소민',taste:{planning:50,experience:20,exploration:45,spending:30}},
 {id:'p09',name:'태오',taste:{planning:30,experience:75,exploration:65,spending:80}},
 {id:'p10',name:'다은',taste:{planning:60,experience:45,exploration:85,spending:55}}
];
const signatures=c=>[...(c.stopIds||[]).map(id=>'n:'+id),...(c.kakaoPlaceRefs||[]).map(r=>'k:'+r.placeId),...(c.googlePlaceRefs||[]).map(r=>'g:'+r.placeId)].sort().join('|');
const titles=[q=>`${q}, 이번엔 조금 다르게`,q=>`${q} 따라 발길 닿는 대로`,q=>`${q} 하나로 채운 하루`,q=>`${q} 좋아하면 이쪽으로`,q=>`${q}, 어디부터 가볼까?`,q=>`${q} 곁에 쉬어갈 자리`,q=>`${q} 찾아 한 바퀴`,q=>`${q}, 서두를 이유 없지`,q=>`${q} 담아둔 주말 한 조각`,q=>`${q} 두고 나눈 다음 약속`,q=>`${q} 주변을 천천히 걷는 코스`,q=>`${q}와 함께하는 여유로운 하루`,q=>`${q} 즐기는 색다른 순서`,q=>`${q} 중심으로 고른 장소들`,q=>`${q}에서 이어지는 여행`,q=>`${q}를 더 즐기는 코스`,q=>`${q} 가까이 둘러보는 일정`,q=>`${q} 취향을 담은 하루 코스`,q=>`${q}와 어울리는 장소 산책`,q=>`${q} 테마로 채운 여행 일정`];
export function supplementPersonaCourses(catalog,filters,existing,ai=[],live=[]){
 const need=Math.max(0,20-existing.length);if(!need||!filters.query.trim())return [];
 const used=new Set([...existing,...ai].map(signatures)),authors=new Set(existing.map(c=>c.personaId||c.author));
 const seed=[...literalCourseKey(filters.query)].reduce((n,c)=>n+c.codePointAt(0),0);
 const personas=searchPersonas.map((_,i)=>searchPersonas[(i+seed)%10]).sort((a,b)=>Number(authors.has(a.id)||authors.has(a.name))-Number(authors.has(b.id)||authors.has(b.name)));
 const added=[],names=new Set(existing.map(c=>c.name)),pools=[];
 for(const persona of personas){
  const candidates=generateHomeKeywordCourses(catalog,live,filters,persona.taste,[],{anchorLimit:12,resultLimit:20,avoidPlaceIds:[...existing,...ai,...added].flatMap(c=>[...(c.stopIds||[]),...(c.kakaoPlaceRefs||[]).map(ref=>'kakao-candidate:'+ref.placeId)])});
  pools.push({persona,candidates:candidates.filter(candidate=>(candidate.stopIds||[]).length+(candidate.kakaoPlaceRefs?.length||0)>=2)});
 }
 const addCandidate=({persona,candidate})=>{
  if(added.length>=need||used.has(signatures(candidate)))return false;
  let name;for(let j=0;j<titles.length;j++){const proposal=titles[(seed+added.length+j)%titles.length](filters.query.trim());if(!names.has(proposal)){name=proposal;break;}}if(!name)return false;
  const course={...candidate,id:'persona-search-'+persona.id+'-'+candidate.id,name,author:persona.name,personaId:persona.id,isVirtual:true,isSample:true,isPublic:false,source:'persona-search',theme:'가상 사용자 코스',generationMethod:'persona-search',description:'가상 사용자 페르소나의 성향으로 구성한 예시 코스입니다. 실제 방문 후기가 아닙니다. '+candidate.description};
  if(!userCourseSearchMatch(course,filters.query,filters.searchTags||[]).matched)return false;
  added.push(course);used.add(signatures(course));names.add(name);return true;
 };
 // Spread the first results across personas, then use any remaining distinct candidates.
 for(let round=0;round<2&&added.length<need;round++)for(const pool of pools){
  const candidate=pool.candidates.find(item=>!used.has(signatures(item))&&userCourseSearchMatch(item,filters.query,filters.searchTags||[]).matched);
  if(candidate)addCandidate({persona:pool.persona,candidate});
  if(added.length>=need)break;
 }
 if(added.length<need)for(const pool of pools)for(const candidate of pool.candidates){if(added.length>=need)break;addCandidate({persona:pool.persona,candidate});}
 return added;
}
