// Keyword-grounded titles: vary the hook without inventing venues or facts.
const themes=[
 {match:/낚시|민물|바다낚시|루어/,titles:[q=>`${q}, 월척은 핑계고 여행이 본업`,q=>`빈손이어도 ${q}는 못 참지`,q=>`${q}에 진심인 사람들의 하루`,q=>`입질 없어도 ${q} 텐션은 만점`,q=>`${q}하러 갔다가 하루 순삭`,q=>`오늘 일정? 일단 ${q}부터`]},
 {match:/맥주|와인|전통주|양조장|브루어리/,titles:[q=>`${q} 한 잔에 여행 버튼 ON`,q=>`${q} 때문에 여기까지 왔다`,q=>`오늘의 주인공은 ${q}`,q=>`${q} 앞에선 일정도 유연하게`,q=>`${q} 찾아 떠난 어른의 소풍`,q=>`${q}, 이 분위기는 반칙이지`]},
 {match:/맛집|먹방|음식|미식|한식/,titles:[q=>`${q}, 배부르면 그게 성공이지`,q=>`다이어트는 내일, 오늘은 ${q}`,q=>`${q} 찾아 삼만 보까지 가능`,q=>`${q} 앞에선 계획도 맛있게`,q=>`오늘 ${q} 제대로 털어보자`,q=>`${q}, 한 입 먹고 일정 연장`]},
 {match:/카페|커피|디저트|빵|베이커리/,titles:[q=>`${q}, 당 충전하러 출발`,q=>`오늘의 연료는 ${q}`,q=>`${q} 핑계로 하루 쉬어가기`,q=>`${q} 찾아 기분까지 리필`,q=>`사진보다 먼저 ${q} 한 입`,q=>`${q}, 이건 지나칠 수 없지`]},
 {match:/소품|쇼핑|편집숍|빈티지|문구|기념품/,titles:[q=>`${q}, 구경만 한다고는 안 했다`,q=>`${q} 앞에서 지갑 잠금 해제`,q=>`${q} 보러 갔다가 취향 발견`,q=>`오늘 ${q}에 제대로 꽂혔다`,q=>`${q}, 작은 행복 크게 담기`,q=>`${q} 때문에 가방 한 칸 비움`]},
 {match:/체험|공방|클래스|액티비티/,titles:[q=>`${q}, 구경 말고 직접 해보자`,q=>`${q} 하다가 재능 발견할지도`,q=>`오늘은 ${q}로 경험치 획득`,q=>`${q}, 서툴러도 재미는 만점`,q=>`${q}에 도전장을 내밀었다`,q=>`${q} 찍고 뿌듯함까지 챙기기`]},
];
const general=[q=>`${q}, 이건 못 참지`,q=>`${q} 때문에 일정 변경`,q=>`${q}만 보고 따라와`,q=>`계획은 없고 ${q}는 있음`,q=>`${q} 찍고 기분까지 만점`,q=>`오늘 ${q} 제대로 한다`,q=>`${q}, 이번엔 조금 다르게`,q=>`${q} 찾아 나서는 하루`];
const shorten=(v,n=30)=>Array.from(v).slice(0,n).join('');
export function searchCourseTitles(courses,query){
 const topic=shorten(String(query||'여행').replace(/^#+/,'').replace(/[12]\s*박\s*[23]\s*일|당일치기/g,'').trim()||'여행',14);
 const templates=themes.find(t=>t.match.test(topic))?.titles||general,used=new Set();
 return courses.map((course,index)=>{
  const seed=Array.from(String(course.id||index)).reduce((n,c)=>(n*31+c.codePointAt(0))>>>0,0);let name;
  for(let i=0;i<templates.length;i++){const candidate=shorten(templates[(seed+i)%templates.length](topic));if(!used.has(candidate)){name=candidate;break;}}
  if(!name){const stem=shorten(`${topic}, 취향 따라 고른 코스`,24);let n=index+1;while(used.has(`${stem} ${n}`))n++;name=`${stem} ${n}`;}
  used.add(name);return {...course,name};
 });
}
