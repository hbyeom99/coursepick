import { combineTestTaste } from './testTaste.js';
import { analyzeCourseHistory } from './savedCourseTaste.js';
// Only explicitly liked course IDs may contribute to the five preference axes.
export function likedCourseTaste(likedIds, authored, catalog, baseline = null) {
 const ids=new Set(likedIds);
 const selected=authored.filter(c=>ids.has(c.id));
 return combineTestTaste(analyzeCourseHistory([...ids],selected,selected,catalog),baseline);
}
