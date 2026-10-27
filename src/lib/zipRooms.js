import {validTravelTaste} from './travelJournalValidation.js';
export const zipAxes = [
  {id:'planning',name:'계획성',left:'즉흥',right:'계획',leftCode:'P',rightCode:'J'},
  {id:'experience',name:'경험 취향',left:'휴식',right:'활동',leftCode:'R',rightCode:'A'},
  {id:'exploration',name:'탐색 성향',left:'익숙함',right:'발견',leftCode:'F',rightCode:'D'},
  {id:'spending',name:'지출 성향',left:'절약',right:'소비',leftCode:'S',rightCode:'M'},
];

export function roomMembersWithPersonalTaste(members,memberId,personalTaste){return members.map(m=>m.id===memberId?{...m,taste:personalTaste!=null&&validTravelTaste(personalTaste)?personalTaste:null}:m);}

export function roomTasteTotals(members) {
  const submitted = members.filter(member => member.taste!=null&&validTravelTaste(member.taste));
  const totals = Object.fromEntries(zipAxes.map(axis => [axis.id, submitted.reduce((total,member) => total + member.taste[axis.id],0)]));
  const maximum = submitted.length * 100;
  const code=maximum ? zipAxes.map(a=>{const high=totals[a.id]>=maximum/2;return a.reverse?(high?a.leftCode:a.rightCode):(high?a.rightCode:a.leftCode);}).join('') : '—';
  return {totals,maximum,code,submitted:submitted.length,pending:members.length-submitted.length};
}

export function roomCommonKeywords(members) {
  if (!members.length) return [];
  const sets = members.map(m => new Set(m.keywords || []));
  return [...sets[0]].filter(word => sets.every(set => set.has(word)));
}

export function calendarDays(start,end) {
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return [];
  const first = new Date(start+'T12:00:00'), last = new Date(end+'T12:00:00');
  if (!Number.isFinite(+first) || !Number.isFinite(+last) || last < first) return [];
  const values=[];
  for (let d = first; d <= last && values.length < 31; d.setDate(d.getDate()+1)) values.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
  return values;
}

export function makeRoomDraft({name,description,region,startDate,endDate,image},owner) {
  if (!name.trim() || name.trim().length > 20 || description.length > 100 || !region || !calendarDays(startDate,endDate).length) throw Error('방 이름, 여행 지역과 기간을 확인해 주세요.');
  return {id:crypto.randomUUID(),name:name.trim(),description:description.trim(),region,startDate,endDate,image,ownerId:owner.id,members:[owner],scheduleTitle:'',days:calendarDays(startDate,endDate).map(date=>({date,stopIds:[]}))};
}

// Compare each member-axis total against a course on the same summed scale.
export function roomCourseTraitAffinity(assessment,members){const stats=roomTasteTotals(members);if(!stats.maximum)return 0;return zipAxes.reduce((sum,a)=>{const value=assessment.axes[a.id];return sum+(value.score===null?0:(1-Math.abs(value.score*stats.submitted-stats.totals[a.id])/stats.maximum)*value.coverage);},0)/4;}
