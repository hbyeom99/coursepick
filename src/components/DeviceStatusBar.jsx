import { useEffect, useState } from 'react';

export default function DeviceStatusBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return <div className="device-status-bar" aria-label={`현재 시간 ${now.getHours()}시 ${now.getMinutes()}분`}>
    <time>{now.getHours()}:{String(now.getMinutes()).padStart(2, '0')}</time>
    <div className="device-status-icons" aria-hidden="true">
      <svg width="16" height="14" viewBox="0 0 16 14" fill="currentColor"><rect x="1" y="10" width="2.5" height="4" rx=".7"/><rect x="5" y="7" width="2.5" height="7" rx=".7"/><rect x="9" y="4" width="2.5" height="10" rx=".7"/><rect x="13" y="1" width="2.5" height="13" rx=".7"/></svg>
      <svg width="17" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 4a12 12 0 0 1 16 0M4 7a8 8 0 0 1 10 0M7 10a3 3 0 0 1 4 0"/><circle cx="9" cy="12.5" r=".8" fill="currentColor" stroke="none"/></svg>
      <svg width="25" height="14" viewBox="0 0 26 14" fill="currentColor"><rect x="1" y="2" width="21" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5"/><rect x="3" y="4" width="17" height="6" rx="1"/><rect x="23" y="5" width="2" height="4" rx="1" opacity=".6"/></svg>
    </div>
  </div>;
}
