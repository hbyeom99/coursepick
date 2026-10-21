import {safePublicCourses} from '../lib/publicCourseValidation.js';

export function createPublicCourseLoader(request, now = Date.now) {
  let cached = null, until = 0, pending = null, revision = 0;
  return {
    invalidate() { revision++; cached = null; until = 0; pending = null; },
    load() {
      if (cached && now() < until) return Promise.resolve(cached);
      if (pending) return pending;
      const generation = revision;
      const task = (async () => {
        const courses = []; let offset = 0;
        while (true) {
          const data = await request(`public-courses?offset=${offset}&limit=100`);
          if (!Array.isArray(data.courses)) throw Error('공개 코스 응답 형식 오류');
          courses.push(...safePublicCourses(data.courses));
          if (!data.more) break;
          if (!Number.isInteger(data.nextOffset) || data.nextOffset <= offset) throw Error('공개 코스 페이지 형식 오류');
          offset = data.nextOffset;
        }
        const result = safePublicCourses(courses);
        if (generation === revision) { cached = result; until = now() + 60000; }
        return result;
      })();
      pending = task;
      task.finally(() => { if (pending === task) pending = null; }).catch(() => {});
      return task;
    },
  };
}
