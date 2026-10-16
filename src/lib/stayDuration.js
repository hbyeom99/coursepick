export function stayDuration(entry) {
 if (!entry) return '';
 let minutes=entry.minutes ?? entry.duration_minutes;
 if (!Number.isFinite(minutes)) {
  const text=String(entry.duration || '');
  const hours=text.match(/(\d+(?:\.\d+)?)\s*시간/);
  const mins=text.match(/(\d+)\s*분/);
  if (!hours && !mins) return text;
  minutes=Number(hours?.[1] || 0)*60+Number(mins?.[1] || 0);
 }
 if (minutes<0) return '';
 const hours=Math.floor(minutes/60), remainder=Math.round(minutes%60);
 return [hours ? `${hours}시간` : '',remainder ? `${remainder}분` : ''].filter(Boolean).join(' ') || '0분';
}
