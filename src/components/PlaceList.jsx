import React from 'react';

export default function PlaceList({ places, selectedId, onSelectPlace, renderPhoto, renderAction }) {
  return <div className="result-list">{places.map(place => <article key={place.id} className="place-result" style={selectedId === place.id ? { borderColor: 'var(--brand-main)', background: 'var(--brand-soft)' } : undefined}>
    {renderPhoto(place)}
    <div><p className="overline">{place.region} · {place.category}</p>
      <button type="button" className="title-button" aria-label={place.name + ' 지도에서 선택'} aria-pressed={selectedId === place.id} onClick={() => onSelectPlace(place.id)}><h3>{place.name}</h3></button>
      <p>{place.description}</p><div className="tags">{place.tags.map(tag => <span key={tag}>#{tag}</span>)}</div>
    </div>{renderAction(place)}
  </article>)}</div>;
}
