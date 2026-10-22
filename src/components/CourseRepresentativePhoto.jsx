import React, { useEffect, useRef, useState } from 'react';

// Keep the same image element and dimensions in every course-card layout.
export const COURSE_IMAGE_PLACEHOLDER = '/images/course-image-placeholder.svg';

export default function CourseRepresentativePhoto({ src, alt = '', title, onError, onLoad, preservePrevious = false, placeholderAlt = '코스 대표이미지 준비 중' }) {
  const [readySource, setReadySource] = useState('');
  const [readyAlt,setReadyAlt] = useState('');
  const callbacks = useRef({ onError, onLoad });
  callbacks.current = { onError, onLoad };
  useEffect(() => {
    if (!src) return;
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      setReadySource(src);
      setReadyAlt(alt);
      callbacks.current.onLoad?.();
    };
    image.onerror = () => {
      if (!active) return;
      if(!preservePrevious)setReadySource('');
      callbacks.current.onError?.();
    };
    image.src = src;
    return () => { active = false; image.onload = null; image.onerror = null; };
  }, [src]);
  const ready = Boolean(src && readySource === src);
  const visibleSource=ready?src:preservePrevious?readySource:'';
  return <img className={`course-representative-image${visibleSource ? '' : ' course-image-placeholder'}`} src={visibleSource || COURSE_IMAGE_PLACEHOLDER} alt={visibleSource ? ready?alt:readyAlt : placeholderAlt} title={ready ? title : undefined} decoding="async" onError={visibleSource ? () => { setReadySource(''); callbacks.current.onError?.(); } : undefined}/>;
}
