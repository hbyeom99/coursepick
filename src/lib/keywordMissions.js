export const keywordMissions=[
 {id:'keyword-island-v1',tag:'무인도',title:'아무나 쉽게 갈 수 없는 특별한 섬 여행!'},
 {id:'keyword-sea-v1',tag:'바다',title:'파도 소리를 따라 나만의 코스'},
 {id:'keyword-cafe-v1',tag:'카페',title:'잠시 쉬어 가고 싶은 카페 여행'},
];
export function keywordMissionEligible(course,mission){
 return course.isPublic===true&&!course.isVirtual&&!course.editorialVisits&&[...(course.representativeTags||[]),...(course.tags||[])].some(tag=>tag===mission.tag);
}
