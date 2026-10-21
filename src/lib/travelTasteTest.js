const option=(text,image)=>({text,image:`/images/taste-stickers/${image}.svg`});
export const travelTasteQuestions=[
 {question:'Q1. 여행 전날, 어디까지 정해두면 마음이 편한가요?',options:[option('방문 순서와 시간까지','1F4C5'),option('가고 싶은 곳 몇 군데만','1F5FA')]},
 {question:'Q2. 예정에 없던 곳이 눈에 들어온다면?',options:[option('정해둔 코스 먼저 즐기기','1F4CB'),option('끌리는 곳으로 코스 바꾸기','1F9ED')]},
 {question:'Q3. 하루 코스, 어떻게 즐기고 싶나요?',options:[option('몇 곳에서 여유롭게','2615'),option('여러 곳을 다양하게','1F392')]},
 {question:'Q4. 자유로운 반나절이 생긴다면?',options:[option('특별한 활동 없이 쉬기','1F3D6'),option('놀이와 체험 찾아 즐기기','1F3A1')]},
 {question:'Q5. 여행지의 전통 음식을 알아본다면?',options:[option('요리 시연과 이야기 즐기기','1F4D6'),option('직접 재료를 다루며 만들기','1F373')]},
 {question:'Q6. 몸을 움직인다면 어느 정도가 좋나요?',options:[option('산책처럼 가볍게','1F6B6'),option('운동처럼 힘을 쓰며','1F3C3')]},
 {question:'Q7. 같은 활동이라면 어디에서 즐길까요?',options:[option('실내에 자리 잡고','1F3E0'),option('야외에서 바깥 공기를 느끼며','1F333')]},
 {question:'Q8. 같은 음식이라면 어떤 분위기가 좋나요?',options:[option('조용하고 차분한 곳','1F375'),option('대화와 음악으로 활기찬 곳','1F3B5')]},
 {question:'Q9. 어떤 경험이 더 끌리나요?',options:[option('좋았던 경험 다시 하기','1F501'),option('궁금했던 경험 처음 하기','2728')]},
 {question:'Q10. 처음 가는 지역에서 더 끌리는 곳은?',options:[option('많은 사람이 찾는 대표 명소','1F5FD'),option('덜 알려진 숨은 명소','26F0')]},
 {question:'Q11. 여행에서 돈을 쓸 때, 내 생각에 더 가까운 쪽은?',options:[option('합리적인 가격을 찾아 가성비 여행','1F416'),option('여행인 만큼 돈을 사용하는 Flex 여행','1F4B8')]}
];
export function travelTasteTestResult(answers){
 if(!Array.isArray(answers)||answers.length!==11||!answers.every(v=>v===0||v===1))return null;
 return {planning:Math.round(((1-answers[0])+(1-answers[1]))*50),experience:(answers[3]+answers[4])*50,exploration:(answers[8]+answers[9])*50,spending:answers[10]?90:10,
  testPreferences:{dailyPace:answers[2]?'many':'few',exertion:answers[5]?'vigorous':'light',setting:answers[6]?'outdoor':'indoor',atmosphere:answers[7]?'lively':'quiet'}};
}
