const option=(text,image)=>({text,image:`/images/taste-stickers/${image}.svg`});
export const travelTasteQuestions=[
 {axis:'planning',scores:[100,0],question:'Q1. 여행 전날, 일정을 정한다면?',options:[option('방문 순서와 시간까지','1F4C5'),option('가고 싶은 곳 몇 군데만','1F5FA')]},
 {axis:'planning',scores:[100,0],question:'Q2. 예정에 없던 곳을 발견한다면?',options:[option('정해둔 코스 먼저 즐기기','1F4CB'),option('끌리는 곳으로 코스 바꾸기','1F9ED')]},
 {axis:'planning',scores:[100,0],question:'Q3. 원하는 체험에 예약이 필요하다면?',options:[option('미리 예약해서 일정을 확정하기','1F4C5'),option('당일에 할 수 있는 체험 고르기','1F392')]},
 {axis:'experience',scores:[0,100],question:'Q4. 자유로운 반나절을 보낸다면?',options:[option('특별한 활동 없이 쉬기','1F3D6'),option('놀이와 체험 찾아 즐기기','1F3A1')]},
 {axis:'experience',scores:[0,100],question:'Q5. 여행지의 전통 음식을 경험한다면?',options:[option('요리 시연과 이야기 즐기기','1F4D6'),option('직접 재료를 다루며 만들기','1F373')]},
 {axis:'experience',scores:[0,100],question:'Q6. 여행 중 몸을 움직인다면?',options:[option('산책처럼 가볍게','1F6B6'),option('운동처럼 힘을 쓰며','1F3C3')]},
 {axis:'experience',scores:[0,100],question:'Q7. 같은 활동을,\n다른 방식으로 즐길 수 있다면?',options:[option('익숙한 방식으로 편하게 즐기기','1F501'),option('새로운 방식에 도전하기','1F9ED')]},
 {axis:'experience',scores:[0,100],question:'Q8. 여행에서 경험을 선택한다면?',options:[option('좋았던 경험 다시 하기','1F501'),option('궁금했던 경험 처음 하기','2728')]},
 {axis:'exploration',scores:[0,100],question:'Q9. 처음 가는 지역에서,\n장소를 고른다면?',options:[option('많은 사람이 찾는 대표 명소','1F5FD'),option('덜 알려진 숨은 명소','26F0')]},
 {axis:'exploration',scores:[0,100],question:'Q10. 같은 음식을 파는\n두 장소 중에 고른다면?',options:[option('분위기보다 합리적인 가격의 장소','1F416'),option('조금 비싸더라도 원하는 분위기의 장소','1F375')]},
 {axis:'spending',scores:[0,100],question:'Q11. 여행에서 돈을 쓴다면?',options:[option('합리적인 가격을 찾아 가성비 여행','1F416'),option('여행인 만큼 돈을 사용하는 Flex 여행','1F4B8')]}
].map((question,questionIndex)=>({...question,options:question.options.map((answer,answerIndex)=>({...answer,
 illustrations:[1,2].map(iconIndex=>`/images/taste-test/q${questionIndex+1}-${answerIndex*2+iconIndex}.${questionIndex===7&&answerIndex===1&&iconIndex===2?'svg':'png'}`)
}))}));
// Stored scores retain the existing 0–100 format; 50 is the neutral midpoint.
// Opposite answers cancel before each axis is clamped to +/-50.
export function travelTasteTestResult(answers){
 if(!Array.isArray(answers)||answers.length!==travelTasteQuestions.length||!Array.from(answers).every(v=>v===0||v===1))return null;
 const points={planning:17,experience:13,exploration:25,spending:50};
 return Object.fromEntries(Object.entries(points).map(([axis,weight])=>{
  const total=travelTasteQuestions.reduce((sum,question,index)=>question.axis===axis?sum+(question.scores[answers[index]]>=50?weight:-weight):sum,0);
  return [axis,50+Math.max(-50,Math.min(50,total))];
 }));
}
