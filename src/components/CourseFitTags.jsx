import { useLayoutEffect, useRef } from 'react';

export default function CourseFitTags({ tags }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const row = ref.current;
    const fit = () => {
      // Measure the complete, unshrunk tags at each size within the existing row.
      let low = 1, high = 14;
      for (let i = 0; i < 12; i++) {
        const size = (low + high) / 2;
        row.style.fontSize = `${size}px`;
        if (row.scrollWidth <= row.clientWidth) low = size;
        else high = size;
      }
      const fittedSize = Math.floor(low * 10) / 10;
      const displaySize = fittedSize === 11.1 || fittedSize === 10.1 ? 10 : fittedSize;
      row.style.fontSize = `${displaySize}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    document.fonts?.ready.then(() => { if (row.isConnected) fit(); });
    return () => observer.disconnect();
  }, [tags.join('|')]);
  return <div ref={ref} className="card-tags course-fit-tags">{tags.map(tag => <span key={tag}>#{tag}</span>)}</div>;
}
