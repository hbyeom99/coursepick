import React, { useEffect, useRef, useState } from 'react';
import useKakaoPlacePhoto from '../lib/useKakaoPlacePhoto.js';
import {hasPlacePhoto} from '../lib/placePhotoRequests.js';

// Keep the same image element and dimensions in every course-card layout.
export const COURSE_IMAGE_PLACEHOLDER = '/images/course-image-placeholder.svg';

export default function CourseRepresentativePhoto({ src, kakaoMapUrl, alt = '', title, onError, onLoad, preservePrevious = false, placeholderAlt = '코스 대표이미지 준비 중' }) {
  // Treat inline previews and the shared missing-image tile as absent photos.
  // They remain the visible fallback while a verified Kakao reference resolves.
  if(!hasPlacePhoto(src))src=undefined;
  const photoRef=useRef(null);
  const external=useKakaoPlacePhoto(kakaoMapUrl,!hasPlacePhoto(src),photoRef);
  if(!hasPlacePhoto(src)&&external.photo)src=external.photo.imageUrl;
  const [readySource, setReadySource] = useState('');
  const [loadedUrl,setLoadedUrl]=useState('');
  const [readyAlt,setReadyAlt] = useState('');
  const [failedSource,setFailedSource]=useState('');
  const callbacks = useRef({ onError, onLoad });
  callbacks.current = { onError, onLoad };
  const reportedMissing=useRef(null);
  useEffect(()=>{
    if(external.unavailable&&!hasPlacePhoto(src)&&reportedMissing.current!==kakaoMapUrl){reportedMissing.current=kakaoMapUrl;callbacks.current.onError?.();}
  },[external.unavailable,src,kakaoMapUrl]);
  useEffect(() => {
    if (!src) return;
    let active = true;
    let retryTimer,retried=false,attemptUrl=src;
    const image = new Image();
    const timeout=setTimeout(()=>{if(active){clearTimeout(retryTimer);setFailedSource(src);image.onload=null;image.onerror=null;callbacks.current.onError?.();}},30000);
    image.onload = () => {
      if (!active) return;
      clearTimeout(timeout);
      setReadySource(src);
      setLoadedUrl(attemptUrl);
      setReadyAlt(alt);
      callbacks.current.onLoad?.();
    };
    image.onerror = () => {
      if (!active) return;
      // A failed first CDN thumbnail must not leave a good place photo stuck
      // on the placeholder. Retry once; reuse the photo URL lookup result.
      if(!retried){
        retried=true;
        try{
          const url=new URL(src);
          if(/^img[1-4]\.kakaocdn\.net$/.test(url.hostname)&&url.pathname.startsWith('/cthumb/local/C')){
            url.pathname='/cthumb/local/R800x0.q90/';attemptUrl=url.href;
          }
        }catch{}
        retryTimer=setTimeout(()=>{if(active){image.referrerPolicy='no-referrer';image.src=attemptUrl;}},700);
        return;
      }
      clearTimeout(timeout);setFailedSource(src);
      if(!preservePrevious)setReadySource('');
      callbacks.current.onError?.();
    };
    image.src = src;
    return () => { active = false;clearTimeout(timeout);clearTimeout(retryTimer); image.onload = null; image.onerror = null; };
  }, [src]);
  const ready = Boolean(src && readySource === src);
  const visibleSource=ready?loadedUrl||src:preservePrevious?loadedUrl||readySource:'';
  return <img ref={photoRef} data-photo-resolving={external.loading} data-image-loading={Boolean(src&&!ready&&failedSource!==src)} className={`course-representative-image${visibleSource ? '' : ' course-image-placeholder'}`} src={visibleSource || COURSE_IMAGE_PLACEHOLDER} alt={visibleSource ? ready?alt:readyAlt : placeholderAlt} title={ready ? title||(external.photo?external.photo.imageOrigin==='네이버 이미지 서버'?'네이버 이미지 서버 사진 · 카카오맵 경유':'사진 출처 · 카카오맵':undefined) : undefined} decoding="async" onError={visibleSource ? () => { setReadySource(''); callbacks.current.onError?.(); } : undefined}/>;
}
