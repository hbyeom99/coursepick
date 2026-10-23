import React from 'react';
export default function LoadingPage({active=true,message='페이지를 불러오고 있어요'}){
 if(!active)return null;
 return <div className="page-loading-screen" role="status" aria-live="polite" aria-label={message}><div className="page-loading-content"><span className="page-loading-spinner" aria-hidden="true"/><p>{message}</p></div></div>;
}
