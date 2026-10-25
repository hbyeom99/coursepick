import {createServer} from 'vite';
import assert from 'node:assert/strict';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {userCourseSearchMatch:match}=await server.ssrLoadModule('/src/lib/userCourseSearch.js');
 const {allowedHomeQuery,interpretHomeSearch,homeAnchorMatch,loadHomeSearchKeywords}=await server.ssrLoadModule('/src/lib/homeSearchIntent.js');await loadHomeSearchKeywords();
 assert.equal(allowedHomeQuery('맥주'),true);assert.equal(allowedHomeQuery('부산 맥주 추천해줘'),false);
 assert.equal(match({tags:['맥주']},'맥주').rank,0);assert.equal(match({tags:['수제맥주']},'맥주').rank,1);assert.equal(match({name:'맥주 한잔'},'맥주').rank,2);assert.equal(match({name:'밥집',tags:['먹방']},'맥주').matched,false);
 const {isFictionalPlace}=await server.ssrLoadModule('/src/lib/placeAuthenticity.js');assert.equal(isFictionalPlace({id:'p1'}),true);assert.equal(isFictionalPlace({id:'tourapi_1'}),false);
 const {rankUserCourses,appendUserExamples}=await server.ssrLoadModule('/src/lib/userCourseRanking.js');let calls=0;
 assert.deepEqual(rankUserCourses([{id:'b',tags:['수제맥주'],fit:1},{id:'a',tags:['맥주'],fit:0}],'맥주',c=>{calls++;return c.fit}).map(c=>c.id),['a','b']);assert.equal(calls,2);
 assert.deepEqual(appendUserExamples([{id:'real'}],[{id:'virtual'},{id:'real'}]).map(c=>c.id),['real','virtual']);assert.equal(appendUserExamples(Array.from({length:5},(_,i)=>({id:String(i)})),[{id:'virtual'}]).length,6);
 const e=await server.ssrLoadModule('/src/lib/recommendationEvidence.js');
 assert.equal(e.travelRecommendationEligible({lookup:{},categoryPath:'서비스,산업 > 보관,저장'}),false);
 assert.equal(e.travelRecommendationEligible({lookup:{},categoryPath:'가정,생활 > 패션 > 의류판매'},'빈티지숍'),true);
 assert.equal(e.travelRecommendationEligible({lookup:{},categoryPath:'가정,생활 > 패션 > 의류판매'},'오로라'),false);
 assert.equal(e.gentleTravelEligible({name:'12호어린이공원 농구장',category:'관광지'}),false);
 const beerRule=interpretHomeSearch('맥주');assert.equal(homeAnchorMatch({name:'맥주 스크린골프',category:'관광지',tags:['맥주']},beerRule),false);
 assert.equal(match({tags:['온천']},'스파').rank,1);
 assert.equal(e.natureIntentEvidence({name:'오로라카페',description:'오로라는 볼 수 없습니다.'},'오로라'),false);
 assert.equal(e.natureIntentEvidence({tags:['일출']},'일출'),true);
 assert.equal(e.travelRecommendationEligible({id:'p1',category:'카페'}),false);
 const spa=interpretHomeSearch('스파');
 for(const name of ['스파이더스 클라이밍센터','공존테니스파크 양주점','대성인터스파 골프장']){assert.equal(homeAnchorMatch({name,category:'관광지',tags:[]},spa),false);}
 assert.equal(homeAnchorMatch({name:'유성온천',category:'관광지',tags:['온천']},spa),true);
 assert.equal(homeAnchorMatch({name:'스파 이름만 있는 상점',category:'관광지',tags:[]},spa),false);

 assert.equal(e.confirmedConditionMatch({name:'무료주차 카페'},'무료주차'),false);
 assert.equal(e.confirmedConditionMatch({verifiedConditions:{freeParking:true}},'무료주차'),true);
 assert.equal(e.activityEvidenceMatch({name:'맥주축제'},'지역축제'),false);
 const {seasonEligibility}=await server.ssrLoadModule('/src/lib/keywordTaste.js');assert.equal(seasonEligibility({eventStartDate:'20250101',eventEndDate:'20250102'},'2026-10-22').eligible,false);
 const gentle=interpretHomeSearch('효도 여행');assert.equal(homeAnchorMatch({name:'패러글라이딩',category:'관광지',tags:['활동']},gentle),false);
 const {supplementPersonaCourses,searchPersonas}=await server.ssrLoadModule('/src/lib/personaSearchCourses.js');assert.equal(searchPersonas.length,10);assert.deepEqual(supplementPersonaCourses([],{query:'오로라'},[]),[]);assert.deepEqual(supplementPersonaCourses([],{query:'맥주'},Array.from({length:5},()=>({}))),[]);
 const {dedupeRecommendationPlaces}=await server.ssrLoadModule('/src/lib/recommendationPlaceIdentity.js');const p=[{id:'db',name:'장소',latitude:37,longitude:127,fit:0},{id:'kakao',name:'장소',latitude:37,longitude:127,fit:1}];assert.equal(dedupeRecommendationPlaces(p,v=>v.fit)[0].id,'kakao');
 console.log('Search regression: passed');
}finally{await server.close();}
