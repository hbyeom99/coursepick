import React from 'react';
import ScheduleTiming from './ScheduleTiming.jsx';
import {selectPlaceTags} from '../lib/placeTagSelection.js';
export default function CourseTimeline({entries,selectedId,onOpen,renderPhoto,query='',before,after,renderAfter}){
 return <div className="timeline">{before}{entries.map((entry,index)=><React.Fragment key={entry.id}><button type="button" className={`timeline-stop ${selectedId===entry.id?'active':''}`} aria-pressed={selectedId===entry.id} onClick={()=>onOpen(entry)}><span className="step-number">{index+1}</span>{renderPhoto(entry)}<span className="timeline-copy"><strong>{entry.name}</strong><span className="detail-stop-tags">{selectPlaceTags(entry.tags||[],query).map(tag=><span key={tag}>#{tag}</span>)}</span><small>{entry.timing?<ScheduleTiming entry={entry.timing} showLabel/>:[entry.category,entry.region].filter(Boolean).join(' · ')}</small>{entry.note&&<small className="saved-stop-note">메모: {entry.note}</small>}{entry.travel&&<small className="detail-stop-travel">{entry.travel}</small>}{entry.notice&&<small>{entry.notice}</small>}</span></button>{renderAfter?.(entry)}</React.Fragment>)}{after}</div>;
}
