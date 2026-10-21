import groups from '../data/homeSearchKeywords.json' with {type:'json'};
import {placeKeywordCondition,keywordAlternatives} from './semanticKeywords.js';
import {placeArea} from './travelFilters.js';
export const searchKey=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'');
export const HOME_SEARCH_KEYWORDS=[...new Set(Object.values(groups).flat())];
const allowed=new Map(HOME_SEARCH_KEYWORDS.map(label=>[searchKey(label),label]));
const groupByKey=new Map(Object.entries(groups).flatMap(([group,words])=>words.map(word=>[searchKey(word),group])));
export const allowedHomeQuery=value=>allowed.has(searchKey(value));
export function homeSearchSuggestions(input){const key=searchKey(input);return HOME_SEARCH_KEYWORDS.filter(word=>!key||searchKey(word).includes(key)).slice(0,8);}
const cities={강릉:'강원',속초:'강원',양양:'강원',원주:'강원',평창:'강원',동해:'강원',해운대:'부산',광안리:'부산',기장:'부산',경주:'경북',포항:'경북',담양:'전남',나주:'전남',화순:'전남',순천:'전남',여수:'전남',광양:'전남',해남:'전남',보성:'전남',전주:'전북',군산:'전북',익산:'전북',공주:'충남',부여:'충남',천안:'충남',아산:'충남',충주:'충북',단양:'충북',서산:'충남',애월:'제주',성산:'제주',우도:'제주',울릉도:'경북',계룡산:'충남'};
const provinces=['서울','경기','인천','강원','부산','대구','울산','광주','대전','세종','제주','충북','충남','전북','전남','경북','경남'];
const regionOf=value=>{let key=searchKey(value).replace(/여행$/,'');if(key==='제주도')key='제주';if(key==='강원도')key='강원';if(provinces.includes(key))return {province:key,label:key};if(cities[key])return {province:cities[key],city:key,label:key};if(['수도권','서울근교'].includes(key))return {provinces:['서울','경기','인천'],label:key};return null;};
const termAliases={
 '맛집투어':['음식점'],'푸드투어':['음식점'],'빵지순례':['베이커리','제과','빵'],'커피':['카페','커피'],'카페투어':['카페'],
 '걷기':['산책','공원','산책로'],'역사탐방':['박물관','문화유산','역사문화','유적지','고궁'],'역사여행':['박물관','문화유산','역사문화','유적지'],'역사유적지':['유적지','문화유산'],
 '건축여행':['건축','근대건축'],'건축탐방':['건축'],'독서여행':['서점','책방','도서관'],'서점투어':['서점','책방'],'성지순례':['성당','사찰','순례길'],
 '시장구경':['시장'],'전시관람':['전시','박물관','미술관'],'공연관람':['공연','공연장','아트센터'],'온천여행':['온천'],'촬영지투어':['촬영지'],'드라마촬영지':['드라마촬영지'],'영화촬영지':['영화촬영지'],
 '사진여행':['전망','포토','사진','정원','해변'],'사진명소':['포토','사진'],'출사명소':['포토','전망'],'풍경사진':['전망','해변','정원'],'골목사진':['골목'],'건축사진':['건축'],'야경사진':['야경'],
 '바닷가':['바다','해변','해수욕장'],'바다뷰':['바다뷰','오션뷰'],'오션뷰카페':['오션뷰카페','바다뷰','오션뷰'],'리버뷰카페':['리버뷰','강변뷰'],'레이크뷰카페':['레이크뷰','호수뷰'],
 '뷰맛집카페':['전망카페','오션뷰','리버뷰','레이크뷰','바다뷰'],'베이커리카페':['베이커리카페','제과','빵'],'빵집':['제과','베이커리','빵'],'북카페':['북카페','북카페·서점'],'독립서점카페':['독립서점카페','북카페'],
 '로스터리카페':['로스터리','로스팅'],'스페셜티커피':['스페셜티'],'브런치카페':['브런치'],'디저트카페':['디저트'],'한옥카페':['한옥'],'숲속카페':['숲속카페','숲뷰'],'식물카페':['식물카페'],'루프탑카페':['루프탑'],
 '도자기체험':['도자기','도예'],'도예공방':['도예','도자기'],'향수공방':['향수'],'향수만들기':['향수'],'반지만들기':['반지공방','반지만들기'],'캔들만들기':['캔들'],'목공체험':['목공'],'베이킹클래스':['베이킹'],'쿠킹클래스':['요리교실','쿠킹'],
 '농장체험':['농장체험','농촌체험'],'과일따기':['과일따기','수확체험'],'어촌체험':['어촌체험','갯벌체험'],'갯벌체험':['갯벌체험'],'원데이클래스':['클래스','공방'],'이색체험':['체험','공방','방탈출'],'그림그리기':['드로잉','미술'],'스케치':['드로잉','미술'],
 '예카':['감성카페','예쁜카페'],'예쁜카페':['예쁜카페','감성카페'],'느좋카페':['감성카페'],'분위기좋은카페':['감성카페','분위기좋은카페'],'감성카페':['감성카페','감성'],
 '숲길':['숲길','산책로'],'해안산책로':['해안산책로','해안산책'],'은하수':['은하수','천문대'],'별많은':['별','천문대'],'별구경':['별','천문대'],'별빛':['별빛','천문대'],
 '현지인맛집':['현지인맛집'],'숨은맛집':['숨은맛집'],'숨은명소':['숨은명소'],'저렴한곳':['가성비'],'가성비여행':['가성비'],'저예산여행':['가성비'],
 '국립공원':['국립공원'],'자전거여행':['자전거','자전거대여'],'라이딩':['자전거','자전거대여'],'기차여행':['철도역','기차역'],'KTX여행':['철도역','KTX'],'지하철여행':['지하철역'],'역근처':['철도역','지하철역'],'터미널근처':['버스터미널'],
 '겨울바다':['해변','바다'],'꽃놀이':['꽃','벚꽃','정원'],'봄꽃여행':['꽃','벚꽃'],'벚꽃여행':['벚꽃'],'가을단풍':['단풍'],'단풍명소':['단풍'],'억새명소':['억새'],'눈구경':['설경','눈꽃'],'설경명소':['설경','눈꽃'],
 '산길드라이브':['산길','산','전망'],'드라이브':['해안도로','전망대','정원'],'드라이브코스':['해안도로','전망대','정원'],'호캉스':['호텔','리조트'],'주캉스':['호텔','리조트'],'카라반':['카라반'],
 '야간여행':['야경','야간활동'],'야경코스':['야경','야간활동'],'일출코스':['일출'],'일몰코스':['일몰','노을'],'심야':['야간활동','심야'],'농촌풍경':['농촌','농장'],
 '산업관광':['산업관광','제조과정견학'],'양조장투어':['양조장','브루어리'],'브루어리':['브루어리','양조장'],'로컬맥주':['수제맥주'],'술집':['술집','주점','펍'],'고깃집':['고기','고기구이'],'횟집':['회','횟집'],'레져스포츠':['레저스포츠','액티비티'],'익스트림스포츠':['액티비티','번지','패러글라이딩'],'스포츠경기':['경기장'],'좀비':['좀비','공포체험'],'흉가체험':['공포체험','흉가체험'],
};
const normalizedAliases=new Map(Object.entries(termAliases).map(([key,value])=>[searchKey(key),value]));
const calm=['카페','정원','공원','박물관','미술관','온천','수목원','전시'];
const social=['카페','정원','공원','전망','전시','미술관','체험','공방','해변'];
const active=['체험','공방','놀이공원','테마파크','레저','스포츠','방탈출','보드게임'];
export function interpretHomeSearch(value,filters={}){
 const key=searchKey(value),label=allowed.get(key);if(!label)return {allowed:false,empty:!key,key,query:String(value||''),terms:[],notes:[],requests:[]};
 const group=groupByKey.get(key),region=regionOf(label),regional=Boolean(region);
 const rule={allowed:true,key,query:label,group,region,terms:normalizedAliases.get(key)||keywordAlternatives(label),days:key==='1박2일'?2:1,roles:['main','lunch','main'],maxLeg:filters.transport==='도보'?2000:10000,buffer:15,notes:[],startMinutes:540,transport:filters.transport&&filters.transport!=='전체'?filters.transport:null,anchorCategory:null};
 if(regional||['여행','투어','자유여행','나들이','휴가','방학','1박2일'].includes(key)){rule.terms=['관광지','정원','공원','박물관','전망','체험'];rule.broad=true;}
 if(/효도|부모님/.test(key)){rule.terms=calm;rule.maxLeg=rule.transport==='도보'?1000:5000;rule.buffer=30;rule.gentle=true;rule.notes.push('장소 수를 줄이고 짧은 이동과 휴식 위주로 구성했습니다. 계단·경사·보행 편의는 확인이 필요합니다.');}
 else if(/힐링|휴식|휴양|여유|여행\(혼자\)|명상/.test(key)){rule.terms=calm;rule.gentle=true;rule.buffer=30;rule.notes.push('관광·식사·휴식을 여유 있게 연결했습니다.');}
 else if(/데이트|커플|신혼|기념일|소개팅|특별한날/.test(key)){rule.terms=key.includes('이색')?active:social;rule.notes.push('함께 둘러볼 장소와 식사·카페를 연결했습니다.');}
 else if(/우정|친구|졸업|단체|^mt$|가족/.test(key)){rule.terms=/우정사진/.test(key)?['포토','사진','전망']:social;rule.notes.push('함께 즐길 장소를 연결했습니다. 단체 수용 인원은 개별 확인이 필요합니다.');}
 if(['유아동반','반려동물동반'].includes(key)){rule.terms=calm;rule.companion=key==='유아동반'?'infantAllowed':'petAllowed';rule.gentle=true;rule.notes.push('동반 가능 여부가 확인된 장소만 연결합니다.');}
 if(group==='카페'||/카페투어|빵지순례/.test(key)){rule.anchorCategory='카페';if(key==='카페'||key==='카페투어')rule.terms=['카페'];}
 if(group==='음식'||['맛집투어','푸드투어','미식','먹방'].includes(key)){rule.anchorCategory='음식점';if(['맛집투어','푸드투어','미식','맛집'].includes(key))rule.terms=['음식점'];rule.roles=['lunch','main','dinner'];}
 if(/드라이브/.test(key)){rule.transport='자동차';rule.maxLeg=20000;rule.notes.push('자동차로 연결하는 코스이며 실제 도로 이동시간은 별도 확인이 필요합니다.');}
 if(/맥주|브루어리|양조|막걸리|전통주|와인|위스키|칵테일|펍|바틀샵|술|테이스팅|시음|^ipa$|사워에일/.test(key)){rule.transport='대중교통';rule.notes.push('음주 가능성을 고려해 대중교통으로 제안합니다.');}
 if(/도보10분|가까운/.test(key)){rule.terms=key==='가까운식당'?['음식점']:['관광지','공원','카페','정원'];rule.anchorCategory=key==='가까운식당'?'음식점':rule.anchorCategory;rule.maxLeg=700;rule.notes.push('장소 간 직선거리 700m 이내로 연결합니다. 실제 도보 10분을 보장하지 않습니다.');}
 if(/야간|야경|심야|일몰|노을|별|은하수/.test(key)){rule.startMinutes=/일몰|노을/.test(key)?960:1080;rule.roles=['main','dinner','main'];rule.notes.push('저녁 방문을 제안합니다. 운영시간·일몰 시각·관측 조건은 확인이 필요합니다.');}
 if(/일출/.test(key)){rule.startMinutes=330;rule.roles=['main','lunch','main'];rule.notes.push('이른 아침 방문을 제안합니다. 실제 일출 시각과 출입 가능 시간은 확인이 필요합니다.');}
 if(/비오는날|추운날|쾌적한실내/.test(key)){rule.terms=['실내','박물관','미술관','전시','서점','카페'];rule.indoor=true;rule.notes.push('실내 유형의 장소를 우선합니다. 당일 날씨는 별도로 확인해 주세요.');}
 if(/^(봄|여름|가을|겨울)(여행|휴가)?$|^\d+월$|연말여행|크리스마스/.test(key)){const month=Number(key.replace('월',''));rule.terms=month?[month>=3&&month<=5?'꽃':month>=6&&month<=8?'해변':month>=9&&month<=11?'단풍':'실내']:key.includes('봄')?['꽃','정원']:key.includes('여름')?['해변','물놀이']:key.includes('가을')?['단풍','숲']:key.includes('크리스마스')?['크리스마스']:key.includes('겨울')?['실내','온천']:['야경'];rule.notes.push('계절 분위기에 맞춘 후보이며 개화·적설·행사 운영을 보장하지 않습니다.');}
 if(['경치좋은','아름다운','탁트인','경치좋은','풍경사진'].includes(key))rule.terms=['전망','해변','정원'];
 if(['느낌좋은','분위기좋은','감성적인','힙한','sns핫플','인스타감성'].includes(key))rule.terms=['감성','포토','예쁜'];
 if(key==='k팝여행')rule.terms=['케이팝','K팝'];
 if(['감성사진','우정사진'].includes(key))rule.terms=['사진','포토','전망'];
 if(key==='레트로감성')rule.terms=['레트로','빈티지'];
 if(key==='관광')rule.terms=['관광지','박물관','공원','전망'];
 if(key==='쇼핑')rule.terms=['쇼핑몰','아울렛','편집숍','백화점','상점'];
 if(key==='실내')rule.indoor=true;
 rule.priceSensitive=/무료전시|무료체험|가성비|저예산|저렴한/.test(key);
 if(/무료전시|무료체험/.test(key))rule.notes.push('무료 여부는 해당 전시·체험 비용 기준이며 식음료·교통비는 별도입니다.');
 rule.strict=/주차|수유실|엘리베이터|유아의자|동반|예약|웨이팅|24시간|연중무휴|실내좌석|야외좌석/.test(key);
 if(rule.priceSensitive)rule.notes.push('가격 근거가 확인된 장소를 기준으로 판단합니다.');
 if(/축제|페스티벌|팝업/.test(key))rule.notes.push('운영기간이 확인된 행사만 후보로 사용합니다.');
 const prefix=[region?.label||((filters.region&&filters.region!=='전체')?filters.region:''),filters.city&&filters.city!=='전체'?filters.city:''].filter(Boolean).join(' ');
 const anchor=rule.broad?'관광지':rule.gentle?'정원':rule.terms[0]||label;
 if(/일출/.test(key))rule.maxLeg=Math.min(rule.maxLeg,5000);
 rule.requests=[{query:[prefix,anchor].filter(Boolean).join(' '),category:rule.anchorCategory==='음식점'?'맛집':rule.anchorCategory==='카페'?'카페':'전체'},{query:[prefix,'한식'].filter(Boolean).join(' '),category:'맛집'},{query:[prefix,'카페'].filter(Boolean).join(' '),category:'카페'}].filter((r,i,a)=>a.findIndex(v=>v.query===r.query&&v.category===r.category)===i).slice(0,3);
 return rule;
}
const body=p=>searchKey([p.name,p.category,p.categoryPath,p.region,p.location,p.address,p.roadAddress,...(p.tags||[])].filter(Boolean).join(' '));
export function homeRegionMatch(p,rule,filters={}){
 const area=placeArea({...p,location:p.location||p.roadAddress||p.address}),r=rule.region;
 if(r?.provinces&&!r.provinces.includes(area.region))return false;
 if(r?.province&&area.region!==r.province)return false;
 if(r?.city&&!body(p).includes(searchKey(r.city)))return false;
 if(filters.region&&filters.region!=='전체'){
  const chosen=regionOf(filters.region);if(chosen?.province&&area.region!==chosen.province)return false;if(chosen?.city&&!body(p).includes(searchKey(chosen.city)))return false;
 }
 if(filters.city&&filters.city!=='전체'&&!body(p).includes(searchKey(filters.city)))return false;
 return true;
}
export function homePlaceEligible(p,rule){
 if(rule.companion&&p.companionInfo?.[rule.companion]!==true)return false;
 if(rule.indoor&&!['음식점','카페'].includes(p.category)&&!['실내','박물관','미술관','전시','서점','도서관'].some(v=>body(p).includes(searchKey(v))))return false;
 if(rule.gentle&&/등산|트레킹|짚라인|패러글라이딩|클라이밍|번지점프/.test(body(p)))return false;
 return true;
}
export function homeAnchorMatch(p,rule){
 if(!homePlaceEligible(p,rule))return false;
 if(rule.anchorCategory&&p.category!==rule.anchorCategory)return false;
 if(rule.strict&&!rule.companion)return placeKeywordCondition(p,rule.query);
 const cost=p.traitFacts?.costPerPerson;
 if(rule.priceSensitive){if(typeof cost!=='number'||!Number.isFinite(cost)||cost<0)return false;if(/무료/.test(rule.key)&&cost!==0)return false;}
 if(rule.key==='무료전시'&&!/전시|박물관|미술관/.test(body(p)))return false;
 if(rule.key==='무료체험'&&!/체험|공방|클래스/.test(body(p)))return false;
 if(rule.broad)return p.category!=='음식점'&&p.category!=='숙소';
 if(rule.companion||rule.priceSensitive)return true;
 const evidence={...p,region:'',location:p.categoryPath||''};
 if(rule.group==='분위기'&&!rule.gentle)return rule.terms.some(term=>(p.tags||[]).some(tag=>searchKey(tag).includes(searchKey(term))));
 return rule.terms.some(term=>{const key=searchKey(term);if(key.length===1){if((p.tags||[]).some(tag=>searchKey(tag)===key))return true;if(key==='산')return /산$/.test(p.name||'')||/등산/.test(p.categoryPath||'');if(key==='강')return /강$/.test(p.name||'');if(key==='절')return /사찰/.test(p.categoryPath||'');return (p.categoryPath||'').split('>').some(part=>searchKey(part)===key);}return placeKeywordCondition(evidence,term);});
}
export function homeCourseMatch(course,places,rule){
 if(!rule.allowed)return false;if(rule.empty)return true;
 if(rule.gentle&&(places.length>3||places.some(p=>!homePlaceEligible(p,rule))))return false;
 if(rule.region&&places.some(p=>!homeRegionMatch(p,rule)))return false;
 if(rule.companion&&places.some(p=>p.companionInfo?.[rule.companion]!==true))return false;
 if(places.length)return places.some(p=>homeRegionMatch(p,rule)&&homeAnchorMatch(p,rule));
 // A title alone cannot certify accessibility, opening hours, prices or purpose suitability.
 if(rule.strict||rule.priceSensitive||rule.gentle||rule.companion)return false;
 return [course.name,...(course.tags||[]),...(course.representativeTags||[])].some(value=>searchKey(value).includes(rule.key));
}
