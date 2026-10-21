import {travelAxes} from './travelAxes.js';
export const validTravelTaste=v=>v===null||travelAxes.every(a=>Number.isInteger(v?.[a.id])&&v[a.id]>=0&&v[a.id]<=100);
export const validJournals=v=>Array.isArray(v)&&v.length<=500&&v.every(j=>j&&typeof j.courseId==='string'&&typeof j.title==='string'&&typeof j.body==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(j.visitedAt)&&Array.isArray(j.placeIds)&&j.placeIds.every(id=>typeof id==='string'));
