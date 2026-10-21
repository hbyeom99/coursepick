export const explorationTags = ['체험', '액티비티', 'SNS핫플레이스', '유명관광지', '쇼핑', '포토', '먹방', '캠핑', '글램핑'];
export const normalizeTag = tag => tag === '엑티비티' ? '액티비티' : tag === '야영' ? '캠핑' : tag;
const groups = {
  미식: '음식탐방', 맛집: '음식탐방', 먹방: '음식탐방',
  등산: '활동', 레저: '활동', 액티비티: '활동', 엑티비티: '활동',
  체험: '참여체험', 공방: '참여체험', 양조체험: '참여체험',
  사진: '사진촬영', 포토: '사진촬영',
  캠핑: '캠핑', 야영: '캠핑', 글램핑: '캠핑',
};
export const scoreTags = tags => [...new Set((Array.isArray(tags) ? tags.filter(tag=>typeof tag==='string') : []).map(tag => groups[normalizeTag(tag)] || normalizeTag(tag)))];

export function classifyCourse(course, catalog, index) {
  course = course && typeof course === 'object' ? course : {};
  const ids = Array.isArray(course.stopIds) ? course.stopIds : [];
  const tags = Array.isArray(course.tags) ? course.tags.filter(tag=>typeof tag==='string') : [];
  const stops = ids.map(id => index ? index.get(id) : catalog.find(place => place.id === id)).filter(Boolean);
  const found = explorationTags.filter(tag => stops.some(place => Array.isArray(place.tags) && place.tags.includes(tag)));
  // Two meal stops constitute food exploration; a single ordinary restaurant does not.
  if (stops.filter(place => place.category === '음식점').length >= 2) found.push('먹방');
  return { ...course, tags: [...new Set([...tags.map(normalizeTag), ...found])] };
}
