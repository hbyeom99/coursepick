export function prioritizeBeerRecommendations(courses, keyword) {
 if (!/맥주|브루어리|양조장|바틀샵|주캉스|시음|펍/.test(keyword || '')) return courses;
 const reviewed = courses.filter(course => course.id.startsWith('ai-theme-beer-'));
 if (!reviewed.length) return courses;
 const festival = reviewed.find(course => course.tags.includes('축제'));
 return [...(festival ? [festival] : []), ...reviewed.filter(course => course !== festival), ...courses.filter(course => !course.id.startsWith('ai-theme-beer-'))];
}
