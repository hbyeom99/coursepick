import React from 'react';
import { stayDuration } from '../lib/stayDuration.js';

export default function ScheduleTiming({ entry, showLabel = false }) {
 if (!entry) return null;
 const time=typeof entry.time==='string'?entry.time.trim():'';
 const duration=stayDuration(entry);
 return <span className="itinerary-timing">
  {showLabel && entry.label && <span className="itinerary-description">{entry.label}</span>}
  {(time || duration) && <span className="itinerary-time-row">
   {time && <span className="itinerary-planned-time" aria-label={`예정시간 ${time}`}>{time}</span>}
   {time && duration && <span className="itinerary-time-separator" aria-hidden="true"> · </span>}
   {duration && <span className="itinerary-stay-time"><span className="asset-icon asset-stay-duration" aria-hidden="true"/><span className="sr-only">체류시간 </span>{duration}</span>}
  </span>}
 </span>;
}
