import React from 'react';
import { createRoot } from 'react-dom/client';

import '../style.css';
import './styles/search-cards.css';

if (import.meta.env.DEV) {
  fetch('http://localhost:8000/api/health', { signal: AbortSignal.timeout(5000) })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data?.status !== 'ok') throw new Error('예상한 health 응답이 아닙니다.');
      console.info('[coursepick] Backend health:', JSON.stringify(data));
    })
    .catch((error) => {
      console.warn('[coursepick] Backend 연결 확인 실패:', error.message);
    });
}

const page=new URLSearchParams(location.search).has('googlePlace')
 ? import('./components/GooglePlaceInfo.jsx')
 : import('./components/MemberGate.jsx');
page.then(({default:App})=>createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>));
