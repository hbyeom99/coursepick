import React, { useEffect, useRef, useState } from 'react';

// Keep the same image element and dimensions in every course-card layout.
export const COURSE_IMAGE_PLACEHOLDER = '/images/course-image-placeholder.svg';

export default function CourseRepresentativePhoto({ src, alt = '', title, onError, onLoad, placeholderAlt = '코스 대표이미지 준비 중' }) {
  const [readySource, setReadySource] = useState('');
  const callbacks = useRef({ onError, onLoad });
  callbacks.current = { onError, onLoad };
  useEffect(() => {
    if (!src) return;
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      setReadySource(src);
      callbacks.current.onLoad?.();
    };
    image.onerror = () => {
      if (!active) return;
      setReadySource('');
      callbacks.current.onError?.();
    };
    image.src = src;
    return () => { active = false; image.onload = null; image.onerror = null; };
  }, [src]);
  const ready = Boolean(src && readySource === src);
  return <img className={`course-representative-image${ready ? '' : ' course-image-placeholder'}`} src={ready ? src : COURSE_IMAGE_PLACEHOLDER} alt={ready ? alt : placeholderAlt} title={ready ? title : undefined} decoding="async" onError={ready ? () => { setReadySource(''); callbacks.current.onError?.(); } : undefined}/>;
}
