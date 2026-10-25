export const keywordMissions=[
 {id:'keyword-island-v1',tag:'무인도',title:'당신의 첫 번째로 소개해 주세요!',points:1000,image:'mission-image1_459_3889.webp',showPoints:true,achieved:75,limit:100},
 {id:'keyword-date-v1',tag:'이색 데이트',title:'색다른 데이트 코스를 소개해 주세요!',points:800,image:'mission-image3_459_3889.webp',showPoints:true,achieved:45,limit:100},
 {id:'keyword-pet-v1',tag:'반려동물동반',title:'반려동물과 함께하는 여행',points:300,image:'mission-image0_459_3889.webp',achieved:75,limit:100},
 {id:'keyword-architecture-v1',tag:'건축탐방',title:'기억에 남는 건축 여행',points:300,image:'mission-image2_459_3889.webp',achieved:45,limit:100},
];
export function keywordMissionEligible(course,mission){
 return course.isPublic===true&&!course.isVirtual&&!course.editorialVisits&&[...(course.representativeTags||[]),...(course.tags||[])].some(tag=>String(tag).normalize('NFKC').replace(/\s/g,'')===mission.tag.normalize('NFKC').replace(/\s/g,''));
}
