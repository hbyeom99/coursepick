import React,{useState} from 'react';
export default function PlaceDescription({ text = '' }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 100;
  return <div className="short-place-description"><p>{expanded || !long ? text : `${text.slice(0, 100).trim()}…`}</p>{long && <button type="button" className="text-link" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? '접기' : '더 보기'}</button>}</div>;
}
