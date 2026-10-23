import React,{useRef} from 'react';
import PlaceDescription from './PlaceDescription.jsx';
import AccessibilityDetails from './AccessibilityDetails.jsx';
import MapPanel from './MapPanel.jsx';
import {selectPlaceTags} from '../lib/placeTagSelection.js';
import useKakaoPlacePhoto from '../lib/useKakaoPlacePhoto.js';
import CourseRepresentativePhoto from './CourseRepresentativePhoto.jsx';
import {hasPlacePhoto} from '../lib/placePhotoRequests.js';
import {kakaoPlaceDetailUrl} from '../lib/kakaoPlaceLink.js';
export default function PlaceDetails({p,Photo,headingAction,saveAction,query='',onSelectPlace,basicExtra,externalInfo,mapUrl}){
 mapUrl=kakaoPlaceDetailUrl(p,mapUrl)||mapUrl;
 const hasCoordinates=Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&(p.latitude!==0||p.longitude!==0);
 const ownImage=p.imageUrl||p.image_url;
 const missingImage=!hasPlacePhoto(ownImage);
 const photoRef=useRef(null);
 const {photo:externalPhoto,loading:photoResolving}=useKakaoPlacePhoto(mapUrl,missingImage,photoRef);
 return <>        <div ref={photoRef} className="place-detail-photo" data-photo-resolving={photoResolving}>{externalPhoto?<CourseRepresentativePhoto key={p.id} src={externalPhoto.imageUrl} alt={p.name}/>:<Photo place={p}/>}</div>
        {externalPhoto&&<p className="muted"><a href={externalPhoto.sourceUrl} target="_blank" rel="noopener noreferrer">{externalPhoto.imageOrigin==='네이버 이미지 서버'?'네이버 이미지 서버 사진 · 카카오맵 경유':'사진 출처 · 카카오맵'}</a></p>}
        <div className="place-detail-heading"><div><div className="picker-place-heading"><p className="overline">{p.region} · {p.category}</p>{headingAction}</div><h3>{p.name}</h3></div>{saveAction}</div>
        <div className="tags">{selectPlaceTags(p.tags,query).map(tag => <span key={tag}>#{tag}</span>)}</div>
        <section className="place-detail-section"><h3>장소 소개</h3><PlaceDescription key={p.id} text={p.description?.trim() || '장소 설명 준비 중입니다.'}/></section>
        <AccessibilityDetails info={p.accessibilityInfo}/><section className="place-detail-section"><h3>기본 정보</h3><dl><dt>주소</dt><dd>{p.location?.trim() || '주소 확인 필요'}</dd>{p.phone&&<><dt>전화번호</dt><dd><a href={'tel:'+p.phone}>{p.phone}</a></dd></>}{p.categoryPath&&<><dt>장소 분류</dt><dd>{p.categoryPath}</dd></>}{basicExtra}<dt>운영시간</dt><dd>{p.openingHours?.trim() || '운영시간 확인 필요'}</dd>{p.companionInfo?.infantStatus&&<><dt>영유아 정보</dt><dd>{p.companionInfo.infantStatus==='allowed'?'동반 가능':p.companionInfo.infantStatus==='not_allowed'?'동반 제한':p.companionInfo.infantStatus==='facilities_confirmed'?'영유아 편의시설 보유 (이용 조건 확인)':'정보 미확인'}</dd>{Object.entries(p.companionInfo.infantFacilities||{}).filter(([,value])=>value).map(([key,value])=><React.Fragment key={key}><dt>{({stroller:'유모차',lactationroom:'수유실',babysparechair:'유아 의자',infantsfamilyetc:'영유아 안내'})[key]||key}</dt><dd>{value}</dd></React.Fragment>)}</>}{typeof p.companionInfo?.petAllowed==='boolean'&&<><dt>반려동물</dt><dd>{p.companionInfo.petStatus==='conditional'?'조건부 동반 가능':p.companionInfo.petStatus==='unknown'?'동반 정보 확인 필요':p.companionInfo.petAllowed?'동반 가능 (아래 조건 확인)':'동반 불가'}</dd>{p.companionInfo.petSize&&<><dt>동물 크기</dt><dd>{p.companionInfo.petSize}</dd></>}{p.companionInfo.petRestrictions&&<><dt>동반 조건</dt><dd>{p.companionInfo.petRestrictions}</dd></>}{p.companionInfo.petDedicated&&<><dt>전용 시설</dt><dd>{p.companionInfo.petDedicated}</dd></>}{p.companionInfo.petExtraFee&&<><dt>추가 요금</dt><dd>{p.companionInfo.petExtraFee}</dd></>}{p.companionInfo.sourceUpdatedAt&&<><dt>정보 기준일</dt><dd>{p.companionInfo.sourceUpdatedAt} · 제공 자료 기준</dd></>}</>}</dl></section>
        {externalInfo}<section className="place-detail-section"><h3>위치</h3>{hasCoordinates ? <><MapPanel place={p} places={[p]} selectedId={p.id} onSelectPlace={onSelectPlace}/><a className="pill secondary wide" href={mapUrl||`https://map.kakao.com/link/map/${encodeURIComponent(p.name)},${p.latitude},${p.longitude}`} target="_blank" rel="noopener noreferrer">카카오맵에서 보기</a></> : <>{mapUrl?<a className="pill secondary wide" href={mapUrl} target="_blank" rel="noopener noreferrer">카카오맵에서 보기</a>:<p className="muted">위치 정보 확인 필요</p>}</>}</section></>;
}
