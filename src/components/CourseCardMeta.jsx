import { coursePeriod } from '../lib/homeFeed.js';
export default function CourseCardMeta({ course, Icon, className = '', hideRegion = false }) {
  const transport = ['자동차', '대중교통', '도보'].includes(course.transport) ? course.transport : '이동수단 미정';
  return <span className={`course-card-meta ${className}`}>{!hideRegion && <span><Icon name="pin" size={13}/>{course.region || '지역 미정'}</span>}<span><Icon name="calendar" size={13}/>{coursePeriod(course)}</span><span><Icon name={transport === '자동차' ? 'car' : transport === '대중교통' ? 'bus' : transport === '도보' ? 'walk' : 'map'} size={13}/>{transport}</span></span>;
}
