import React from 'react';
import LoadingPage from './components/LoadingPage.jsx';
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

const root=createRoot(document.getElementById('root'));
root.render(<LoadingPage/>);
const bootTimeout=setTimeout(()=>root.render(<div role="alert" style={{padding:32}}>페이지를 불러오지 못했어요.<button onClick={()=>location.reload()}>다시 시도</button></div>),30000);
const page=new URLSearchParams(location.search).has('googlePlace')
 ? import('./components/GooglePlaceInfo.jsx')
 : import('./components/MemberGate.jsx');
page.then(({default:App})=>{clearTimeout(bootTimeout);root.render(<React.StrictMode><App /></React.StrictMode>);}).catch(()=>{clearTimeout(bootTimeout);root.render(<div role="alert">페이지를 불러오지 못했어요. <button onClick={()=>location.reload()}>다시 시도</button></div>);});
