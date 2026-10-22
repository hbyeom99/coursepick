import React from 'react';
import {courseDayCount} from '../lib/courseDays.js';
import DayTabStrip from './DayTabStrip.jsx';
export default function CourseDayTabs({course,day,onChange,onAdd,onRemove}){const count=courseDayCount(course);return <DayTabStrip className="personal-day-tabs" activeDay={day} dayCount={count} onAdd={onAdd?()=>onAdd(count+1):undefined} onRemove={onRemove?()=>onRemove(day):undefined} addDisabled={count>=31} removeDisabled={count<=1}>{Array.from({length:count},(_,i)=><button type="button" role="tab" aria-selected={day===i+1} className={day===i+1?'active':''} key={i} onClick={()=>onChange(i+1)}><strong>{i+1}일차</strong></button>)}</DayTabStrip>}
