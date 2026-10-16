import { stayDuration } from './lib/stayDuration.js';
import { keyboardDictionary, normalizeKeyboardQuery } from './lib/keyboardSearch.js';
import { relatedGroups } from './lib/searchIntent.js';
import CourseFitTags from './components/CourseFitTags.jsx';
import { useMemberStored, useMemberContext, memberRequest } from './lib/memberSession.jsx';
import { generateKeywordCourses } from './lib/keywordCourses.js';
import { distanceLabel } from './lib/pickerMap.js';
import SearchAiCarousel from './components/SearchAiCarousel.jsx';
import { courseTagCandidates, selectedCourseTags } from './lib/courseTagSelection.js';
import { testTasteFromAnswers, validTestTaste } from './lib/testTaste.js';
import WelcomeFlow from './components/WelcomeFlow.jsx';
import { itineraryFlow } from './lib/itineraryFlow.js';
import CourseSaveChoice from './components/CourseSaveChoice.jsx';
import CourseCardMeta from './components/CourseCardMeta.jsx';
import DeviceStatusBar from './components/DeviceStatusBar.jsx';
import CourseSearchBox from './components/CourseSearchBox.jsx';
import { courseImageCandidates, courseListImages, shuffledCoursePhotos } from './lib/searchCourseImage.js';
import { likedCourseTaste } from './lib/likedCourseTaste.js';
import { courseLibraryLists } from './lib/courseLibraryLists.js';
import PlacePicker from './components/PlacePicker.jsx';
import { nextRecommendationBatch } from './lib/recommendationRotation.js';
import CourseLibrary from './components/CourseLibrary.jsx';
import CourseSaved from './components/CourseSaved.jsx';
import { tasteAxes } from './lib/savedCourseTaste.js';
import TravelFilterPopup, { TravelFilterBar } from './components/TravelFilterPopup.jsx';
import { areaMatches, companionsMatch, courseConditionsMatch, needsCourseForPlace, placeArea, travelFilterTitles, applyFilterSection, resetFilterSection } from './lib/travelFilters.js';
import tourApiEnrichment from './data/tourApiEnrichment.json';
import EditorStops from './components/EditorStops.jsx';
import { popularCourses, coursePeriod } from './lib/homeFeed.js';
import { courseRegion, insertPlace, recommendAdditions, recommendReplacements, replaceDraftPlace } from './lib/placeAdditionRecommendations.js';
import { getCommunityCourses } from './services/courseService.ts';
import { explorationTags, normalizeTag, scoreTags, classifyCourse } from './lib/exploreTags.js';
import { courseSearchMatch } from './lib/courseSearch.js';
import { searchCandidates } from './lib/searchKeyboard.js';
import React, { useLayoutEffect, useEffect, useMemo, useRef, useState } from 'react';
import { travelCourses, tourApiCourses, themes, regions, quickCategories } from '../script.js';
import { places as samplePlaces, placeImageMetadata } from './data/places.ts';
import MapPanel from './components/MapPanel.jsx';
import LodgingSelector from './components/LodgingSelector.jsx';
import { distanceKm, lodgingCandidates, courseRoute } from './lib/courseRoute.js';
import PlaceList from './components/PlaceList.jsx';
import { getPlaces, getRecommendations, getPlacesByIds } from './services/placeService.ts';
import { projectPlacesForPreview } from './utils/mapPreview.ts';

const tags = ['커피', '산책', '미식', '바다', '자연', '골목', '여유', '역사문화', '한옥', '전망', '체험', '숲', '힐링', '건축', '등산', '야경', '디저트', '빵', '휴식', '한식', '중식', '일식', '양식', '주캉스', '양조장', '전통주', '막걸리', '시음', ...explorationTags].filter((tag, index, list) => list.indexOf(tag) === index);

function tastePoints(placeTags, taste) {
  return tasteAxes.filter(axis => axis.id !== 'pace').reduce((sum, axis) => {
    const value = taste[axis.id], difference = Math.abs(value - 50);
    if (!difference) return sum;
    const matching = (value < 50 ? axis.low : axis.high).some(tag => placeTags.includes(tag));
    return sum + (matching ? (difference >= 30 ? 2 : 1) : 0);
  }, 0);
}

const emptyDraft = { id: null, name: '', description: '', stopIds: [], hours: 2, transport: '도보', accommodationId: null };
// Unset search conditions: all regions, all periods, no companions, all transport.
const emptyFilters = { query: '', category: '전체', region: '전체', theme: '전체', people: '전체', transport: '전체', hours: '전체', city: '전체', period: '전체', infant: false, pet: false };

const validList = value => Array.isArray(value) && value.every(item => typeof item === 'string');
const validAccommodationId = value => value == null || (typeof value === 'string' && value.trim().length > 0);
const validAccommodationLinks = value => value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(validAccommodationId);
const validDraft = value => value && typeof value.name === 'string' && typeof value.description === 'string' && Array.isArray(value.stopIds) && validList(value.stopIds) && new Set(value.stopIds).size === value.stopIds.length && Number(value.hours) > 0 && ['도보', '대중교통', '자동차'].includes(value.transport) && validAccommodationId(value.accommodationId);
const useStored = useMemberStored;
const FAVORITES_KEY = 'course-favorites';
function readFavorites(storage) {
  try {
    const stored = storage.getItem(FAVORITES_KEY);
    const raw = stored === null ? storage.getItem('coursepick.savedCourses.v1') : stored;
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter(id => typeof id === 'string' && id.trim().length > 0))];
  } catch { return []; }
}
function useFavorites() { return useMemberStored(FAVORITES_KEY, [], validList); }
function Icon({ name, size = 22 }) {
  const paths = { upload: 'M12 15V3 M8 7 12 3 16 7 M7 10H4V21H20V10H17', flag: 'M5 22V3 M5 4H19L16 8 19 12H5', heartPlus: 'M12 20L4 12C-1 7 5 1 12 7C18 1 24 6 20 11 M19 12V20 M15 16H23', settings: 'M9 3H15L16 6 19 7 21 10 19 13 19 17 16 18 15 21H9L8 18 5 17 5 13 3 10 5 7 8 6Z M16 12A4 4 0 1 1 8 12A4 4 0 1 1 16 12', car: 'M5 7L7 3H17L19 7 M3 7H21V17H3Z M5 17V21 M19 17V21 M6 12H8 M16 12H18', bus: 'M5 3H19V18H5Z M5 10H19 M8 14H9 M15 14H16 M7 18V21 M17 18V21', walk: 'M14 3A2 2 0 1 1 10 3A2 2 0 1 1 14 3 M12 7L9 13 5 14 M12 7L16 12 20 12 M9 13L13 16 15 22 M9 13L7 21', calendar: 'M4 5H20V21H4Z M4 10H20 M8 3V7 M16 3V7', home: 'M3 10 12 3 21 10V21H3Z M9 21V13H15V21', search: 'M16 16 21 21 M17 10A7 7 0 1 1 3 10A7 7 0 1 1 17 10', plus: 'M3 3H21V21H3Z M12 7V17 M7 12H17', bookmark: 'M6 3H18V21L12 17 6 21Z', user: 'M16 7A4 4 0 1 1 8 7A4 4 0 1 1 16 7 M4 21V19A8 8 0 0 1 20 19V21', arrow: 'M4 12H20 M14 6 20 12 14 18', back: 'M15 5 8 12 15 19', close: 'M5 5 19 19 M19 5 5 19', map: 'M3 6 9 3 15 6 21 3V18L15 21 9 18 3 21Z M9 3V18 M15 6V21', pin: 'M19 10C19 15 12 21 12 21S5 15 5 10A7 7 0 0 1 19 10Z M14 10A2 2 0 1 1 10 10A2 2 0 1 1 14 10', edit: 'M4 16 16 4 20 8 8 20H4Z M13 7 17 11', up: 'M5 15 12 8 19 15', down: 'M5 9 12 16 19 9', tune: 'M3 6H21 M3 12H21 M3 18H21 M8 4V8 M16 10V14 M9 16V20' };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.arrow}/></svg>;
}
function Photo({ place, onError }) { const source = tourApiEnrichment[place.id]; const supplied = source?.imageUsed || place.id.startsWith('tourapi_'); return <img onError={onError} src={place.imageUrl} alt={placeImageMetadata[place.id]?.alt ?? `${place.name}${place.imageUrl?.startsWith('data:') ? ' · 사진 준비 중' : supplied ? ' (TourAPI 제공)' : ' 분위기 참고 사진'}`} title={source?.imageUsed ? '사진 출처: 한국관광공사 TourAPI · 공공누리 제1유형' : undefined} decoding="async"/>; }
function BannerPhoto({ course, catalog, preferredId, query = '', onImageSelected }) {
  const [failedUrls, setFailedUrls] = useState([]);
  const fallbackIds = useMemo(() => shuffledCoursePhotos(course,catalog), [course.id,course.stopIds,catalog]);
  const matchedId = courseImageCandidates(course,catalog,query)[0];
  const anchor = catalog.find(p=>p.id===course.imagePlaceId);
  const anchorHasPhoto = anchor && fallbackIds.includes(anchor.id);
  const primary = query && !anchorHasPhoto ? null : preferredId || matchedId;
  const candidates = [...new Set([primary, ...fallbackIds].filter(Boolean))];
  const place = candidates.map(id=>catalog.find(p=>p.id===id)).find(p=>p && !failedUrls.includes(p.imageUrl) && !p.imageUrl?.startsWith('data:image/svg'));
  useEffect(()=>{if(place && onImageSelected)onImageSelected(course.id,place.id);},[course.id,place?.id,onImageSelected]);
  if (!place) return <div className="banner-photo-placeholder">사진 준비 중</div>;
  return <Photo place={place} onError={() => setFailedUrls(urls => [...new Set([...urls, place.imageUrl])])}/>;
}

function PlaceDescription({ text = '' }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 100;
  return <div className="short-place-description"><p>{expanded || !long ? text : `${text.slice(0, 100).trim()}…`}</p>{long && <button type="button" className="text-link" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? '접기' : '더 보기'}</button>}</div>;
}
function Save({ name, saved, onClick }) { return <button type="button" className={`save-button ${saved ? 'is-saved' : ''}`} aria-label={`${name} ${saved ? '저장 해제' : '저장'}`} aria-pressed={saved} onClick={onClick}><Icon name="bookmark" size={20}/></button>; }
function Modal({ title, onClose, children, initialFocus, className = '' }) {
  const box = useRef(null), close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; (box.current.querySelector(initialFocus || 'button') || box.current.querySelector('button')).focus();
    const handler = event => {
      if (event.key === 'Escape') close.current();
      if (event.key === 'Tab') {
        const controls = [...box.current.querySelectorAll('button:not(:disabled),a[href],input,textarea,select')].filter(el => el.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><section ref={box} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title}><div className="section-title"><h2>{className === 'region-filter-modal' ? <><span className="region-title-accent">지역</span>을 선택해주세요.</> : className.includes('compact-filter-modal') ? <><span className="region-title-accent">{className.includes('period-filter') ? '여행 기간' : className.includes('traveler-filter') ? '여행 구성원' : '이동수단'}</span>을 선택해주세요.</> : title}</h2><button className="icon-button" type="button" aria-label="닫기" onClick={onClose}><Icon name="close"/></button></div>{className === 'place-detail-modal' ? <div className="place-detail-body">{children}</div> : children}</section></div>;
}
export default function App() {
  const member = useMemberContext();
  const [editorReturnTab, setEditorReturnTab] = useState(null);
  const [welcomePhase, setWelcomePhase] = useState('splash');
  const [testTaste, setTestTaste] = useStored('coursepick.testTaste.v1', null, validTestTaste);
  const [pickerFlowOverride, setPickerFlowOverride] = useState(null);
  const [pendingSaveCourse, setPendingSaveCourse] = useState(null);
  const [courseSaving,setCourseSaving]=useState(false);
  const courseSaveLock=useRef(false);
  const [jibunAddresses, setJibunAddresses] = useState({});
  useEffect(() => {
    let active = true;
    import('./data/jibunAddresses.json').then(module => { if (active) setJibunAddresses(module.default); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const [homeTab, setHomeTab] = useState('recommended');
  const [completedCourse, setCompletedCourse] = useState(null);
  const [screen, setScreen] = useState(member?.account.isGuest || member?.account.values?.['coursepick.testTaste.v1'] ? 'home' : 'welcome'), [filters, setFilters] = useState(emptyFilters), [sort, setSort] = useState('recommended');
  const [favorites, setFavorites, error1] = useFavorites();
  const [savedPlaces, setSavedPlaces, error2] = useStored('coursepick.savedPlaces.v1', [], validList);
  const [myCourses, setMyCourses, error3, commitMyCourses] = useStored('coursepick.myCourses.v1', [], value => Array.isArray(value) && value.every(c => validDraft(c) && typeof c.id === 'string' && c.name.trim() && c.stopIds.length >= 2 && validList(c.tags)));
  const [likedCourseIds, setLikedCourseIds] = useStored('coursepick.likedCourses.v1', [], validList);
  const [draft, setDraft, error4] = useStored('coursepick.draft.v1', emptyDraft, validDraft);
  const [profile, setProfile, error5] = useStored('coursepick.profile.v1', { name: member?.account.nickname || '여행자', bio: '좋은 풍경과 맛있는 한 끼를 찾아요.', interests: ['커피', '산책'] }, value => value && typeof value.name === 'string' && value.name.trim() && typeof value.bio === 'string' && validList(value.interests) && value.interests.every(word => tags.includes(word)));
  const [showMyCourses, setShowMyCourses] = useState(false);
  const [detailId, setDetail] = useState(null), [stop, setStop] = useState(0), [savedTab, setSavedTab] = useState('authored');
  const displayedCourseImages=useRef(new Map());
  const [openedCourseImage,setOpenedCourseImage]=useState(null);
  function rememberCourseImage(courseId,placeId){displayedCourseImages.current.set(courseId,placeId);}
  const [modal, setModal] = useState(null), [picker, setPicker] = useState(''), [pickerRegion, setPickerRegion] = useState('전체'), [profileForm, setProfileForm] = useState(profile);
  const [pickerAfterId, setPickerAfterId] = useState('end');
  const [pickerOnlyRecommended, setPickerOnlyRecommended] = useState(false);
  const [pickerRotation, setPickerRotation] = useState(null);
  const [pickerListPage, setPickerListPage] = useState({context:null,count:3});
  const [filterDraft, setFilterDraft] = useState(emptyFilters);
  const [selectedFilters, setSelectedFilters] = useState(emptyFilters);
  const [filterFocus, setFilterFocus] = useState('all');
  const [toast, setToast] = useState(''), [formError, setFormError] = useState(''), [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [remotePlaces, setRemotePlaces] = useState(null);
  const [recommendationPlaces, setRecommendationPlaces] = useState([]);
  const [recommendationStatus, setRecommendationStatus] = useState('loading');
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 30000);
    setRecommendationStatus('loading');
    getRecommendations({ region: filters.region, category: filters.category, theme: filters.theme }, controller.signal)
      .then(data => { if (active) { setRecommendationPlaces(current => [...new Map([...current.filter(p => p.id.startsWith('lodgingcsv_')), ...data].map(p => [p.id,p])).values()]); setRecommendationStatus('success'); } })
      .catch(() => { if (active) setRecommendationStatus('error'); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [filters.region, filters.category, filters.theme]);
  const [placeStatus, setPlaceStatus] = useState('loading'), [placeError, setPlaceError] = useState(''), [placeRetry, setPlaceRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 30000);
    setPlaceStatus('loading'); setPlaceError('');
    getPlaces(controller.signal).then(data => {
      if (!active) return;
      setRemotePlaces(data); setPlaceStatus('success');
    }).catch(error => {
      if (!active) return;
      setRemotePlaces(null); setPlaceStatus('error');
      setPlaceError(controller.signal.aborted ? '장소 조회 시간이 초과되었습니다.' : error instanceof Error ? error.message : '장소를 불러오지 못했습니다.');
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [placeRetry]);
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [generationRegion, setGenerationRegion] = useState('서울');
  const [generationStatus, setGenerationStatus] = useState('idle');
  const [generationError, setGenerationError] = useState('');
  const [generationToDraft, setGenerationToDraft] = useState(false);
  const [generationReplace, setGenerationReplace] = useState(false);
  const [generationCafe, setGenerationCafe] = useState(false);
  const [communityCourses, setCommunityCourses] = useState([]);
  const [communityStatus, setCommunityStatus] = useState('loading');
  const [communitySource, setCommunitySource] = useState('');
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    const timer = setTimeout(() => controller.abort(), 45000);
    getCommunityCourses(controller.signal).then(result => {
      if (active) { setCommunityCourses(result.courses); setCommunitySource(result.source); setCommunityStatus('success'); }
    }).catch(() => { if (active) setCommunityStatus('error'); }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, []);
  const places = remotePlaces ?? samplePlaces;
  // Keep existing sample courses and saved records usable while remote data loads.
  const catalog = useMemo(() => [...new Map([...samplePlaces, ...recommendationPlaces, ...(remotePlaces ?? [])].map(p => [p.id, p])).values()].map(p => ({...p, location: jibunAddresses[p.location] || p.location})), [remotePlaces, recommendationPlaces, jibunAddresses]);
  const catalogById = useMemo(() => new Map(catalog.map(p => [p.id,p])), [catalog]);
  const placeOf = id => catalogById.get(id);
  const filterRegions = [...new Set([...regions.map(region => region.name), ...catalog.map(place => place.region)])].sort((a, b) => a.localeCompare(b, 'ko'));
  const availableMyCourses = useMemo(() => myCourses.filter(c => c.stopIds.every(id => catalog.some(p => p.id === id))).map(c => classifyCourse(c, catalog)), [myCourses, catalog]);
  const availableTourCourses = useMemo(() => tourApiCourses.filter(c => c.stopIds.every(id => catalog.some(p => p.id === id))).map(c => classifyCourse(c, catalog)), [catalog]);
  const classifiedTravelCourses = useMemo(() => travelCourses.map(c => classifyCourse(c, catalog)), [catalog]);
  const [memberPublicCourses,setMemberPublicCourses] = useState([]);
  useEffect(()=>{let active=true;const load=()=>memberRequest('public-courses').then(data=>{if(active)setMemberPublicCourses(data.courses||[]);}).catch(()=>{});load();window.addEventListener('member-courses-saved',load);const timer=setInterval(load,30000);return()=>{active=false;clearInterval(timer);window.removeEventListener('member-courses-saved',load);};},[]);
  const availableCommunityCourses = useMemo(() => [...communityCourses,...memberPublicCourses.filter(c=>!myCourses.some(own=>own.id===c.id))].filter(c => c.stopIds.every(id => catalog.some(p => p.id === id))).map(c => classifyCourse(c, catalog)), [communityCourses, memberPublicCourses, myCourses, catalog]);
  const searchSuggestionKeywords=useMemo(()=>[...new Set(catalog.flatMap(p=>p.tags||[]))],[catalog]);
  const searchKeyboardDictionary=useMemo(()=>keyboardDictionary([...relatedGroups.flat(),...catalog.flatMap(p=>[p.name,p.category,p.region,...(p.tags||[])]),'서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']),[catalog]);
  const [originalKeyboardQuery,setOriginalKeyboardQuery]=useState('');
  const keywordGeneratedCourses = useMemo(() => generateKeywordCourses(catalog, filters, testTaste || {}, profile.interests), [catalog,filters,testTaste,profile.interests]);
  const all = useMemo(() => [...keywordGeneratedCourses,...(generatedCourse ? [classifyCourse(generatedCourse, catalog)] : []), ...availableMyCourses, ...availableTourCourses, ...availableCommunityCourses, ...classifiedTravelCourses], [keywordGeneratedCourses, generatedCourse, availableMyCourses, availableTourCourses, availableCommunityCourses, classifiedTravelCourses, catalog]);
  const likeableCourses = useMemo(() => [...new Map([...travelCourses,...tourApiCourses,...communityCourses,...all,...myCourses].map(c=>[c.id,c])).values()], [tourApiCourses,communityCourses,all,myCourses]);
  const likedCourses = likeableCourses.filter(c=>likedCourseIds.includes(c.id));
  const tasteAnalysis = useMemo(() => likedCourseTaste(likedCourseIds,likeableCourses,catalog,testTaste), [likedCourseIds,likeableCourses,catalog,testTaste]);
  const taste = tasteAnalysis.taste;
  const [tasteChange, setTasteChange] = useState(null);
  const visibleTasteChange = tasteChange && tasteAxes.every(axis => tasteChange.after[axis.id] === taste[axis.id]) ? tasteChange : null;
  const [cafeVisits, setCafeVisits] = useState({});
  const [accommodationLinks, setAccommodationLinks, accommodationStorageError] = useStored('coursepick.accommodations.v1', {}, validAccommodationLinks);
  const keepLoadedLodgings = rows => setRecommendationPlaces(current => [...new Map([...current, ...rows].map(p => [p.id,p])).values()]);
  const linkedLodgingIds = [...new Set([draft.accommodationId, ...myCourses.map(c => c.accommodationId), ...myCourses.flatMap(c => c.stopIds), ...communityCourses.flatMap(c => c.stopIds), ...Object.values(accommodationLinks)].filter(id => typeof id === 'string' && id.startsWith('lodgingcsv_')))];
  const linkedLodgingKey = linkedLodgingIds.join('|');
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    (async () => {
      const rows=[];
      for(let i=0;i<linkedLodgingIds.length;i+=100) rows.push(...await getPlacesByIds(linkedLodgingIds.slice(i,i+100),controller.signal));
      return rows;
    })().then(rows => { if(active) keepLoadedLodgings(rows); }).catch(() => { if(active) setToast('연결된 숙소 정보를 불러오지 못했습니다.'); });
    return () => { active = false; controller.abort(); };
  }, [linkedLodgingKey]);

  const [generationAccommodationId, setGenerationAccommodationId] = useState('');
  const baseDetail = all.find(c => c.id === detailId);
  const selectedCafe = catalog.find(p => p.id === cafeVisits[detailId]?.id && p.category === '카페');
  const detail = useMemo(() => {
    if (!baseDetail || !selectedCafe || baseDetail.stopIds.includes(selectedCafe.id) || baseDetail.schedule?.[1]?.label !== '점심식사') return baseDetail;
    const minutes = cafeVisits[detailId].minutes;
    const schedule = [...baseDetail.schedule];
    schedule.splice(2, 0, { label: '카페·디저트 (선택 방문)', time: '13:00', duration: `${minutes}분` });
    return { ...baseDetail, stopIds: [...baseDetail.stopIds.slice(0, 2), selectedCafe.id, ...baseDetail.stopIds.slice(2)], schedule, tags: [...new Set([...baseDetail.tags, ...selectedCafe.tags])] };
  }, [baseDetail, selectedCafe, cafeVisits, detailId]);
  const nearbyCafes = useMemo(() => {
    if (baseDetail?.schedule?.[1]?.label !== '점심식사') return [];
    const lunch = placeOf(baseDetail.stopIds[1]), afternoon = placeOf(baseDetail.stopIds[2]);
    if (!lunch || !afternoon) return [];
    return places.filter(p => p.category === '카페' && !baseDetail.stopIds.includes(p.id))
      .map(place => ({ place, distance: distanceKm(lunch, place), detour: distanceKm(lunch, place) + distanceKm(place, afternoon) - distanceKm(lunch, afternoon), affinity: place.tags.reduce((sum, tag) => sum + (profile.interests.includes(tag) ? 3 : 0), 0) }))
      .filter(item => item.distance <= 2 && distanceKm(item.place, afternoon) <= 2)
      .sort((a, b) => a.detour - b.detour || b.affinity - a.affinity || a.place.id.localeCompare(b.place.id)).slice(0, 3);
  }, [baseDetail, catalog, places, profile.interests]);
  const detailAccommodationId = Object.hasOwn(accommodationLinks, detailId) ? accommodationLinks[detailId] : detail?.accommodationId;
  const detailAccommodation = catalog.find(p => p.id === detailAccommodationId && p.category === '숙소' && !detail?.stopIds.includes(p.id));
  const detailStops = useMemo(() => detail ? detail.stopIds.map(id => catalog.find(p => p.id === id)).filter(Boolean) : [], [detail, catalog]);
  const routePlaces = useMemo(() => courseRoute(detailStops, detailAccommodation), [detailStops, detailAccommodation]);
  const routeIds = useMemo(() => routePlaces.map(p => p.id), [routePlaces]);
  const mapPlaces = useMemo(() => [...new Map(routePlaces.map(p => [p.id, p])).values()], [routePlaces]);
  const nearbyLodgings = useMemo(() => lodgingCandidates(catalog, detailStops, detail?.region), [catalog, detailStops, detail?.region]);
  const draftStops = useMemo(() => draft.stopIds.map(id => catalog.find(p => p.id === id)).filter(Boolean), [draft.stopIds, catalog]);
  const draftTagCandidates = useMemo(() => courseTagCandidates(draftStops),[draftStops]);
  const draftSelectedTags = selectedCourseTags(draft.representativeTags,draftTagCandidates);
  function toggleDraftTag(tag) {
    if(draftSelectedTags.includes(tag))setDraft(v=>({...v,representativeTags:draftSelectedTags.filter(t=>t!==tag)}));
    else if(draftSelectedTags.length<3)setDraft(v=>({...v,representativeTags:[...draftSelectedTags,tag]}));
    else setToast('대표 키워드는 최대 3개까지 선택할 수 있어요.');
  }
  const draftAccommodation = catalog.find(p => p.id === draft.accommodationId && p.category === '숙소' && !draft.stopIds.includes(p.id));
  const draftRoutePlaces = useMemo(() => courseRoute(draftStops, draftAccommodation), [draftStops, draftAccommodation]);
  const draftLodgings = useMemo(() => lodgingCandidates(catalog, draftStops, draftStops[0]?.region), [catalog, draftStops]);
  const [replacementUndo, setReplacementUndo] = useState(null);
  const draftRecommendations = useMemo(() => new Map(screen === 'create' ? draftStops.map(place => [place.id, recommendReplacements({ scheduleEntry: draft.schedule?.[draft.stopIds.indexOf(place.id)], candidates: catalog, stops: draftStops, region: place.region, replaceId: place.id, accommodation: draftAccommodation, interests: profile.interests, taste }).recommendations]) : []), [screen, catalog, draftStops, draftAccommodation, profile.interests, taste, draft.schedule, draft.stopIds]);
  const generationLodgings = catalog.filter(p => p.category === '숙소' && (p.region === generationRegion || p.location.includes(`${generationRegion}시`))).map(place => ({place, distance:null}));
  const generationAccommodation = catalog.find(p => p.id === generationAccommodationId && p.category === '숙소' && (p.region === generationRegion || p.location.includes(`${generationRegion}시`)));
  function lodgingVisit(label, returning = false) {
    if (!detailAccommodation) return null;
    const segment = returning ? drivingRoute?.segments.at(-1) : null;
    return <button type="button" className={`timeline-stop ${selectedId === detailAccommodation.id ? 'active' : ''}`} aria-label={`${label} · ${detailAccommodation.name}`} onClick={() => openPlaceDetails(detailAccommodation.id)}><span className="step-number">숙</span><Photo place={detailAccommodation}/><span><strong>{label} · {detailAccommodation.name}</strong>{segment && <small>저녁 장소에서 자동차 약 {Math.ceil(segment.durationSeconds / 60)}분</small>}<small>{returning ? '저녁 일정 이후 복귀 · 숙박시간은 코스 소요시간에서 제외' : '투숙 중인 날 기준 · 첫날 체크인은 별도 확인'}</small></span></button>;
  }
  const activeDrivingIds = useMemo(() => screen === 'create' && !detail ? draftRoutePlaces.map(p => p.id) : routeIds, [screen, detail, draftRoutePlaces, routeIds]);
  const activeDrivingTransport = screen === 'create' && !detail ? draft.transport : detail?.transport;
  const [drivingResponse, setDrivingRoute] = useState(null);
  const drivingKey = `${activeDrivingTransport}:${activeDrivingIds.join(',')}`;
  const [drivingRequestKey, setDrivingRequestKey] = useState('');
  const drivingRoute = activeDrivingTransport === '자동차' && drivingResponse?.stopIds?.join(',') === activeDrivingIds.join(',') ? drivingResponse : null;
  const [drivingStatus, setDrivingStatus] = useState('idle');
  const [drivingError, setDrivingError] = useState('');
  useEffect(() => {
    setDrivingRequestKey(drivingKey); setDrivingRoute(null); setDrivingError('');
    if (activeDrivingTransport !== '자동차' || activeDrivingIds.length < 2) { setDrivingStatus('idle'); return; }
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 40000);
    setDrivingStatus('loading');
    const base = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/+$/, '');
    fetch(`${base}/api/driving-route?ids=${encodeURIComponent(activeDrivingIds.join(','))}`, { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || '자동차 이동시간을 불러오지 못했습니다.');
      if (!Array.isArray(data.stopIds) || data.stopIds.join(',') !== activeDrivingIds.join(',') || !Number.isFinite(data.durationSeconds) || !Number.isFinite(data.distanceMeters) || !Array.isArray(data.segments) || data.segments.length !== activeDrivingIds.length - 1 || !Array.isArray(data.paths) || data.paths.length !== data.segments.length || data.paths.some(path => !Array.isArray(path) || path.length < 2 || path.some(p => !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude))) || data.segments.some(p => !Number.isFinite(p.durationSeconds) || !Number.isFinite(p.distanceMeters))) throw new Error('길찾기 응답을 확인해 주세요.');
      if (active) { setDrivingRoute(data); setDrivingStatus('success'); }
    }).catch(error => { if (active) { setDrivingStatus('error'); setDrivingError(error.message); } }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [activeDrivingTransport, activeDrivingIds, drivingKey]);
  const previewPositions = projectPlacesForPreview(mapPlaces);
  const [transitResponse, setTransitResponse] = useState(null);
  const [transitStatus, setTransitStatus] = useState('idle');
  const [transitError, setTransitError] = useState('');
  const transitKey = activeDrivingTransport === '대중교통' ? activeDrivingIds.join(',') : '';
  const transitRoute = transitResponse?.stopIds?.join(',') === transitKey ? transitResponse : null;
  useEffect(() => {
    setTransitResponse(null); setTransitError('');
    if (!transitKey || activeDrivingIds.length < 2) { setTransitStatus('idle'); return; }
    const controller = new AbortController(); let active = true;
    const timeout = setTimeout(() => controller.abort(), 40000);
    setTransitStatus('loading');
    const base = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/+$/, '');
    fetch(`${base}/api/transit-route?ids=${encodeURIComponent(transitKey)}`, {signal:controller.signal}).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || '대중교통 이동정보를 불러오지 못했습니다.');
      if (data.stopIds?.join(',') !== transitKey || !Array.isArray(data.segments) || data.segments.length !== activeDrivingIds.length-1 || !Number.isFinite(data.durationSeconds) || data.segments.some((p,i)=>p.fromId!==activeDrivingIds[i] || p.toId!==activeDrivingIds[i+1] || !Number.isFinite(p.durationSeconds) || p.durationSeconds<0)) throw new Error('대중교통 응답을 확인해 주세요.');
      if (active) { setTransitResponse(data); setTransitStatus('success'); }
    }).catch(error => { if (active) { setTransitStatus('error'); setTransitError(controller.signal.aborted ? '대중교통 조회 시간이 초과되었습니다.' : error.message); } }).finally(()=>clearTimeout(timeout));
    return () => {active=false;clearTimeout(timeout);controller.abort();};
  }, [transitKey]);
  function transitSummary() {
    if (activeDrivingTransport !== '대중교통') return null;
    return <div className="map-caption" role="status">{transitRoute ? `대중교통 이동 약 ${Math.ceil(transitRoute.durationSeconds/60)}분 · 도보·탑승 포함 · 대기시간 제외 · 버스 기준` : transitStatus === 'error' ? transitError : transitStatus === 'loading' ? '대중교통 이동시간을 확인하는 중입니다.' : null}{transitRoute && <small>노선 좌표와 보행·운행속도로 계산하며, 실제 이동시간과 다를 수 있습니다.</small>}</div>;
  }
  const previewRoute = routePlaces.map(p => previewPositions[mapPlaces.findIndex(item => item.id === p.id)]);
  const weights = useMemo(() => {
    const result = Object.fromEntries(tags.map(tag => [tag, 0]));
    const add = (keywords, points) => scoreTags(keywords).forEach(tag => { result[tag] = (result[tag] || 0) + points; });
    add(profile.interests, 3);
    all.filter(c => favorites.includes(c.id)).forEach(c => add(c.tags, 1));
    catalog.filter(p => savedPlaces.includes(p.id)).forEach(p => add(p.tags, 2));
    myCourses.forEach(c => add(c.tags, 2));
    return result;
  }, [profile.interests, favorites, savedPlaces, myCourses, all, catalog]);
  // Average across unique course keywords so longer keyword lists have no automatic advantage.
  const score = c => {
    const keywords = scoreTags(c.tags);
    const stops = c.stopIds.map(placeOf).filter(Boolean);
    const affinity = stops.reduce((sum, place) => sum + tastePoints(place.tags, taste), 0) / Math.max(1, stops.length);
    // Existing schedules are ranked, never rewritten. Missing pace information gets no bonus.
    const pace = Math.abs(taste.pace - 50) >= 30 && Number(c.hours) > 0 && stops.length ?
      (taste.pace < 50 ? (c.hours / stops.length >= 2 ? 1 : 0) : (c.hours / stops.length <= 1.5 ? 1 : 0)) : 0;
    return keywords.reduce((sum, tag) => sum + (weights[scoreTags([tag])[0]] || 0), 0) / Math.max(1, keywords.length) + affinity + pace;
  };
  const heroCourse = useMemo(() => {
    const candidates = [...availableTourCourses, ...availableCommunityCourses, ...classifiedTravelCourses];
    const unseen = candidates.filter(c => !favorites.includes(c.id) && !myCourses.some(owned => owned.id === c.id || (owned.stopIds.length === c.stopIds.length && owned.stopIds.every((id, i) => id === c.stopIds[i]))));
    return [...(unseen.length ? unseen : candidates)].sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id))[0];
  }, [availableTourCourses, availableCommunityCourses, weights, favorites, myCourses, taste, catalog]);
  const suggestedCourses = useMemo(() => {
    const candidates = [...new Map([...availableTourCourses, ...availableCommunityCourses, ...classifiedTravelCourses].map(c => [c.id, c])).values()].filter(c => c.id !== heroCourse.id);
    const selected = [];
    const owned = c => favorites.includes(c.id) || myCourses.some(course => course.id === c.id || (course.stopIds.length === c.stopIds.length && course.stopIds.every((id, i) => id === c.stopIds[i])));
    while (selected.length < 9 && candidates.length) {
      const diversityScore = c => {
        const previous = [heroCourse, ...selected];
        const overlap = previous.reduce((sum, other) => sum + c.stopIds.filter(id => other.stopIds.includes(id)).length / Math.max(1, c.stopIds.length), 0);
        return score(c) - overlap - (previous.some(other => other.region === c.region) ? 0.25 : 0) - (previous.some(other => other.theme === c.theme) ? 0.25 : 0);
      };
      candidates.sort((a, b) => Number(owned(a)) - Number(owned(b)) || diversityScore(b) - diversityScore(a) || a.id.localeCompare(b.id));
      selected.push(candidates.shift());
    }
    return selected;
  }, [availableTourCourses, availableCommunityCourses, heroCourse, weights, favorites, myCourses, taste, catalog]);
  const courseReason = course => {
    const matching = [...new Set(course.tags)].filter(tag => weights[scoreTags([tag])[0]] > 0).sort((a, b) => (weights[scoreTags([b])[0]] || 0) - (weights[scoreTags([a])[0]] || 0) || a.localeCompare(b, 'ko')).slice(0, 2);
    const supported = tasteAxes.filter(axis => axis.id !== 'pace' && taste[axis.id] !== 50 && course.stopIds.some(id => (taste[axis.id] < 50 ? axis.low : axis.high).some(tag => placeOf(id)?.tags.includes(tag)))).map(axis => taste[axis.id] < 50 ? axis.left : axis.right);
    return supported.length ? `${supported.slice(0, 2).join(' · ')} 성향을 반영한 코스` : matching.length ? `${matching.join(' · ')} 취향을 반영한 코스` : '새로운 취향을 발견해 보세요';
  };
  const heroKeywords = [...new Set(heroCourse.tags)].filter(tag => weights[scoreTags([tag])[0]] > 0).sort((a, b) => (weights[scoreTags([b])[0]] || 0) - (weights[scoreTags([a])[0]] || 0) || a.localeCompare(b, 'ko')).slice(0, 2);
  const heroReason = heroKeywords.length ? `관심 키워드와 저장·작성 기록에서 ‘${heroKeywords.join('’, ‘')}’ 취향을 반영했어요.` : '먼저 둘러보기 좋은 코스예요. 마이에서 관심 키워드를 선택하면 추천이 더 잘 맞아요.';


  const keyword = normalizeTag(filters.query.trim().replace(/^#+/, '').trim()).toLowerCase();
  const matches = (p, withQuery = true, withTheme = true) => Boolean(p) && areaMatches(p, filters) && (filters.category === '전체' || p.category === filters.category) && (!withTheme || filters.theme === '전체' || p.tags.includes(filters.theme)) && (!withQuery || [p.name, p.description, p.region, p.location, ...p.tags].some(word => word.toLowerCase().includes(keyword)));
  const recommendedSearchCourses = useMemo(() => [...new Map([...(generatedCourse ? [classifyCourse(generatedCourse, catalog)] : []), ...availableTourCourses, ...classifiedTravelCourses, ...availableCommunityCourses.filter(c => c.id.startsWith('ai-theme-'))].map(c => [c.id,c])).values()], [generatedCourse,catalog,availableTourCourses,classifiedTravelCourses,availableCommunityCourses]);
  const recommendedSearchIds = useMemo(() => new Set(recommendedSearchCourses.map(c => c.id)), [recommendedSearchCourses]);
  const searchCourses = useMemo(() => [...new Map([...recommendedSearchCourses, ...availableCommunityCourses].map(c => [c.id,c])).values()], [recommendedSearchCourses,availableCommunityCourses]);
  const searchMatches = useMemo(() => new Map(searchCourses.map(c => [c.id, courseSearchMatch(c, c.stopIds.map(placeOf).filter(p => p && matches(p, false)), keyword)])), [searchCourses,catalogById,filters,keyword]);
  const results = useMemo(() => searchCourses.filter(c => courseConditionsMatch(c, c.stopIds.map(placeOf).filter(Boolean), filters) && (filters.theme === '전체' || c.tags.includes(filters.theme) || c.stopIds.some(id => placeOf(id)?.tags.includes(filters.theme))) && c.stopIds.some(id => matches(placeOf(id), false, false)) && searchMatches.get(c.id).matched && (filters.people === '전체' || c.maxPeople >= Number(filters.people)) && (filters.transport === '전체' || c.transport === filters.transport) && (filters.hours === '전체' || c.hours <= Number(filters.hours))).sort((a, b) => (keyword ? searchMatches.get(a.id).rank - searchMatches.get(b.id).rank : 0) || (sort === 'short' ? a.hours - b.hours : sort === 'name' ? a.name.localeCompare(b.name, 'ko') : score(b) - score(a))), [searchCourses,searchMatches,catalogById,filters,keyword,sort,weights,taste]);
  const recommendedSearchResults = useMemo(() => {
    if (!keyword) return results.filter(c => recommendedSearchIds.has(c.id)).slice(0,5);
    if (keyword === '맥주') {
      const festival = availableCommunityCourses.find(c => c.id === 'ai-theme-beer-6e4bc520c2caf5');
      if (festival) return [festival, ...keywordGeneratedCourses.filter(c => !c.stopIds.includes('beeractivity_69477f4dcc29c0685b8c0bb9')).slice(0,4)];
    }
    return keywordGeneratedCourses;
  }, [keyword,keywordGeneratedCourses,results,recommendedSearchIds,availableCommunityCourses]);
  const userSearchResults = useMemo(() => results.filter(c => !recommendedSearchIds.has(c.id)), [results,recommendedSearchIds]);
  const searchCardImages = useMemo(() => courseListImages([...recommendedSearchResults.slice(0,5),...userSearchResults],catalog,filters.query),[recommendedSearchResults,userSearchResults,catalog,filters.query]);

  const [expandedUserCourses, setExpandedUserCourses] = useState(false);
  const userCourseSection = useRef(null);
  useEffect(() => { setExpandedUserCourses(false); }, [filters, sort]);
  function collapseUserCourses() {
    setExpandedUserCourses(false);
    requestAnimationFrame(() => userCourseSection.current?.scrollIntoView({ block: 'start' }));
  }

  const filteredPlaces = useMemo(() => places.filter(p => matches(p) && companionsMatch(p, filters) && ((!needsCourseForPlace(filters) && [filters.people, filters.transport, filters.hours].every(value => value === '전체')) || results.some(c => c.stopIds.includes(p.id)))), [places, filters, all]);
  useEffect(() => {
    if (screen === 'search' && !detailId && selectedId !== null && !filteredPlaces.some(p => p.id === selectedId)) setSelectedId(null);
  }, [filteredPlaces, selectedId, screen, detailId]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3000); return () => clearTimeout(timer); }, [toast]);
  function openCourseLibrary(tab) { setSavedTab(tab); navigate('saved'); }
  function requireMember() { if (!member?.account.isGuest) return true; member.onLogin(); return false; }
  async function logout() { try { await member.onLogout(); } catch(error) { setToast(error.message); } }
  function navigate(next) { if (['my','saved','create','success'].includes(next) && !requireMember()) return; setScreen(next); setDetail(null); setModal(null); setFormError(''); document.querySelector('.main-content')?.scrollTo(0, 0); window.scrollTo(0, 0); }
  function explore(patch = {}) { const next = { ...emptyFilters, ...patch }; setFilters(next); setSelectedFilters(next); navigate('search'); }
  function openTravelFilters(section) {
    const area = placeArea({ region: selectedFilters.region });
    setFilterDraft({ ...selectedFilters, region: selectedFilters.region === '전체' ? '전체' : area.region, city: selectedFilters.city !== '전체' ? selectedFilters.city : area.city || '전체' });
    setFilterFocus(section); setModal('travel-filters');
  }
  function applyTravelFilters() { setSelectedFilters(current => applyFilterSection(current, filterDraft, filterFocus)); setModal(null); }
  function resetTravelFilterDraft() { setFilterDraft(current => resetFilterSection(current, emptyFilters, filterFocus)); }
  function submitCourseSearch(rawQuery, keepOriginal = false) { const query = keepOriginal ? rawQuery : normalizeKeyboardQuery(rawQuery,searchKeyboardDictionary); setOriginalKeyboardQuery(query !== rawQuery ? rawQuery : ''); const next = { ...selectedFilters, query }; setFilters(next); setSelectedFilters(next); setSort('recommended'); navigate('search'); }
  function patch(key, value) { setSelectedFilters(current => ({ ...current, [key]: value })); }
  function open(c) { setOpenedCourseImage({courseId:c.id,placeId:displayedCourseImages.current.get(c.id)||searchCardImages.get(c.id)||c.imagePlaceId||c.stopIds[0]}); setDetail(c.id); setStop(0); setSelectedId(c.stopIds[0]); document.querySelector('.main-content')?.scrollTo(0, 0); window.scrollTo(0, 0); }
  function openPlaceDetails(id) {
    selectPlace(id);
    setModal({ type: 'place', id });
  }
  function selectPlace(id) {
    setSelectedId(id);
    const index = detail?.stopIds.indexOf(id) ?? -1;
    if (index >= 0) setStop(index);
  }
  function removePrivateCourse(id) {
    const privateOwned = myCourses.some(c=>c.id===id && c.isPublic===false);
    setFavorites(values=>values.filter(value=>value!==id));
    if(privateOwned) {
      setMyCourses(values=>values.filter(c=>c.id!==id));
      setLikedCourseIds(values=>values.filter(value=>value!==id));
      if(draft.id===id)setDraft(emptyDraft);
    }
    if(detailId===id) {navigate('saved');setSavedTab('bookmarked');}
    setToast('나만의 코스에서 제거했어요.');
  }
  function toggleCourse(id) {
    if (!requireMember()) return;
    const original=all.find(c=>c.id===id);if(!original)return;
    const existing=myCourses.find(c=>c.originalCourseId===id);
    if(existing){navigate('saved');setSavedTab('bookmarked');setToast('이미 담아둔 사본을 확인해 주세요.');return;}
    if(myCourses.some(c=>c.id===id)){setToast('내가 작성한 코스입니다.');return;}
    const copy={...structuredClone(original),id:`custom-${crypto.randomUUID()}`,author:profile.name,isPublic:false,originalCourseId:id,originalAuthor:original.author,sourceCourseId:id,createdAt:new Date().toISOString(),source:'member-copy'};
    delete copy.authorId;
    setMyCourses(current=>[copy,...current]);setFavorites(current=>[...new Set([...current,copy.id])]);
    setLikedCourseIds(current=>current.map(value=>value===id?copy.id:value));setToast('나만의 코스에 사본을 저장했어요.');
  }
  function togglePlace(id) { if (!requireMember()) return; const selected = savedPlaces.includes(id); setSavedPlaces(current => selected ? current.filter(item => item !== id) : [...current, id]); setToast(selected ? '장소 저장을 해제했어요.' : '저장 화면에 장소를 담았어요.'); }
  async function generatePersonalCourse(event) {
    event.preventDefault();
    setGenerationStatus('loading'); setGenerationError('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const preferred = Object.entries(weights).filter(([,value]) => value > 0).sort((a,b) => b[1]-a[1]).slice(0, 8).map(([tag]) => tag);
      const params = new URLSearchParams({ region: generationRegion, tags: preferred.join(',') });
      Object.entries(taste).forEach(([axis, value]) => params.set(axis, String(value)));
      params.set('saved_ids', savedPlaces.slice(0, 200).join(','));
      params.set('include_cafe', String(generationCafe));
      if (generationAccommodation) params.set('accommodation_id', generationAccommodation.id);
      const base = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/+$/, '');
      const response = await fetch(`${base}/api/generated-course?${params}`, { signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || '코스를 만들지 못했습니다.');
      const course = data.course;
      if (!course || !validDraft(course) || !validList(course.tags) || course.stopIds.length !== (generationCafe ? 5 : 4) || !course.stopIds.every(id => catalog.some(p => p.id === id))) throw new Error('장소 목록을 새로고침한 후 다시 시도해 주세요.');
      setGenerationStatus('success'); setModal(null);
      if (generationToDraft) {
        setDraft({ ...emptyDraft, name: course.name, description: course.description, stopIds: course.stopIds, hours: course.hours, transport: course.transport, accommodationId: course.accommodationId ?? null, schedule: course.schedule, source: course.source, straightLineKm: course.straightLineKm });
        setSelectedId(course.stopIds[0]); setFormError('');
        setToast('취향으로 구성한 초안이에요. 장소를 편집하고 완료를 눌러 저장하세요.');
      } else { setGeneratedCourse(course); open(course); }
    } catch (error) { setGenerationStatus('error'); setGenerationError(error.name === 'AbortError' ? '코스 생성 시간이 초과되었습니다.' : error.message); }
    finally { clearTimeout(timeout); }
  }
  function courseCard(c, match = null, searchType = null) { const imageId = searchCardImages.get(c.id) || c.imagePlaceId || c.stopIds[0]; return <article className="course-card" key={c.id}><div className="course-cover"><button type="button" className="image-open" aria-label={`${c.name} 상세보기`} onClick={() => open(c)}><BannerPhoto course={c} catalog={catalog} preferredId={imageId} query={filters.query} onImageSelected={rememberCourseImage}/></button><span className="photo-chip">{c.region}</span></div><div className="course-copy"><button type="button" className="title-button" onClick={() => open(c)}><h3>{c.name}</h3></button><CourseFitTags tags={(c.representativeTags?.length ? c.representativeTags : c.tags).slice(0, 3)}/><CourseCardMeta course={c} Icon={Icon} hideRegion/></div></article>; }
  function recommendationCard(p) { return <article className="course-card" key={p.id}><div className="course-cover"><button type="button" className="image-open" aria-label={`${p.name} 상세보기`} onClick={() => { selectPlace(p.id); setModal({ type: 'place', id: p.id }); }}><Photo place={p}/></button><span className="photo-chip">{p.region}</span><Save name={p.name} saved={savedPlaces.includes(p.id)} onClick={() => togglePlace(p.id)}/></div><div className="course-copy"><p className="overline">{p.category}</p><button type="button" className="title-button" onClick={() => { selectPlace(p.id); setModal({ type: 'place', id: p.id }); }}><h3>{p.name}</h3></button><div className="course-bottom"><span>{p.location}</span></div></div></article>; }
  function replaceRecommendedPlace(p, oldId) {
    if (!draftRecommendations.get(oldId)?.some(item => item.place.id === p.id)) return false;
    const next = replaceDraftPlace(draft, oldId, p);
    if (next === draft) return false;
    setReplacementUndo({ before: draft, after: next, selectedId });
    setDraft(next); setSelectedId(p.id);
    setToast(`${placeOf(oldId)?.name || '기존 장소'}을 ${p.name}으로 교체했어요.`);
    return true;
  }
  function undoReplacement() {
    if (!replacementUndo || draft !== replacementUndo.after) return;
    setDraft(replacementUndo.before); setSelectedId(replacementUndo.selectedId);
    setReplacementUndo(null); setToast('교체 전 일정으로 되돌렸어요.');
  }
  function addDraftPlace(p, afterId = pickerAfterId) {
    setDraft(current => current.stopIds.includes(p.id) ? current : ({ ...current, stopIds: insertPlace(current.stopIds, p.id, afterId), schedule: undefined }));
    setSelectedId(p.id);
    if (modal === 'places' && afterId !== 'end') setPickerAfterId(p.id);
    setToast(`${p.name}을 추가했어요.`);
  }
  function placeRow(p, add = false, recommendation = null, onPhoto) { return <article className="place-result" key={p.id}>{add ? <button type="button" className="picker-photo-button" aria-label={`${p.name} 상세보기`} onClick={() => { onPhoto?.(p.id); selectPlace(p.id); setModal({type: 'place', id:p.id, returnTo: 'places'}); }}><Photo place={p}/></button> : <Photo place={p}/>}<div><p className="overline">{p.region} · {p.category}</p><h3>{p.name}</h3>{!add && <PlaceDescription key={p.id} text={p.description}/>}<div className="tags">{(add ? [...new Set(p.tags)].slice(0, 3) : p.tags).map(tag => <span key={tag}>#{tag}</span>)}</div>{add && recommendation?.insertionFromName && <small className="picker-place-distance">{recommendation.insertionFromName}에서 {distanceLabel(recommendation.insertionDistance)} · 직선거리{recommendation.nextName && <><br/>{recommendation.nextName}까지 {distanceLabel(recommendation.nextDistance)}</>}</small>}</div>{add ? <button type="button" className="pill secondary" aria-label={`${p.name} 추가`} onClick={() => addDraftPlace(p)}>추가</button> : <Save name={p.name} saved={savedPlaces.includes(p.id)} onClick={() => togglePlace(p.id)}/>}</article>; }
  function reorder(from, to) { if (from < 0 || from >= draft.stopIds.length || from === to || to < 0 || to >= draft.stopIds.length) return; const order = [...draft.stopIds]; order.splice(to, 0, ...order.splice(from, 1)); setDraft(current => ({ ...current, stopIds: order, schedule: undefined })); }
  function complete(e) {
    e.preventDefault();
    if (!draft.name.trim()) { setFormError('코스 제목을 입력해 주세요.'); document.getElementById('course-title').focus(); return; }
    if (draft.name.length > 30) { setFormError('코스 제목은 30자 이내로 입력해 주세요.'); document.getElementById('course-title').focus(); return; }
    if (draft.stopIds.length < 2) { setFormError('여행 장소를 2곳 이상 추가해 주세요.'); return; }
    const stops = draft.stopIds.map(placeOf);
    if (stops.some(p => !p)) { setFormError('일부 장소를 아직 불러오지 못했습니다. 장소 조회 후 다시 시도해 주세요.'); return; }
    if (draft.accommodationId && !draftAccommodation) { setFormError('연결한 숙소를 확인하거나 숙소 연결을 해제해 주세요.'); return; }
    const locations = [...new Set(stops.map(p => p.region))];
    const course = { ...draft, representativeTags: draftSelectedTags, isPublic: myCourses.find(c=>c.id===draft.id)?.isPublic ?? true, id: draft.id || `custom-${crypto.randomUUID()}`, name: draft.name.trim(), description: draft.description.trim() || '내가 발견한 장소로 만든 여행 코스.', region: locations.length === 1 ? locations[0] : '여러 지역', imagePlaceId: draft.stopIds.includes(draft.imagePlaceId) ? draft.imagePlaceId : stops.find(p=>p.imageUrl && !p.imageUrl.startsWith('data:image/svg'))?.id || stops[0].id, tags: [...new Set(stops.flatMap(p => p.tags))], author: profile.name, theme: '나의 여행 시나리오', maxPeople: 6, isSample: true };
    setFormError(''); setPendingSaveCourse(course); setModal('save-choice');
  }
  async function saveChosenCourse(isPublic) { if (!requireMember() || courseSaveLock.current) return;
    if (!pendingSaveCourse) return;
    const course = { ...pendingSaveCourse, isPublic };
    const nextCourses = [course, ...myCourses.filter(c => c.id !== course.id)];
    courseSaveLock.current=true;setCourseSaving(true);setFormError('');
    try { await commitMyCourses(nextCourses); }
    catch(error) {
      setFormError(error.message || '코스를 저장하지 못했습니다. 다시 시도해주세요.');
      setModal(null);setPendingSaveCourse(null);
      requestAnimationFrame(()=>document.querySelector('#course-title')?.focus());
      return;
    } finally {courseSaveLock.current=false;setCourseSaving(false);}

    if (course.sourceCourseId && course.sourceCourseId !== course.id && likedCourseIds.includes(course.sourceCourseId)) {
      const nextLiked = [...new Set(likedCourseIds.map(id=>id===course.sourceCourseId?course.id:id))];
      try {  setLikedCourseIds(nextLiked); }
      catch { setToast('코스는 저장됐지만 취향반영 연결을 저장하지 못했습니다.'); }
      setTasteChange(null);
    }
    setCompletedCourse(course); setPendingSaveCourse(null); setModal(null); setDraft(emptyDraft); navigate('success');
  }
  function toggleLikedCourse(id) { if (!requireMember()) return;
    if (!id || !likeableCourses.some(c=>c.id===id)) {setToast('코스를 먼저 저장한 뒤 좋아요를 선택해 주세요.');return;}
    const selected=likedCourseIds.includes(id);
    const next=selected?likedCourseIds.filter(value=>value!==id):[...new Set([...likedCourseIds,id])];
    try{}
    catch{setToast('좋아요 상태를 저장하지 못했습니다. 저장 공간을 확인해 주세요.');return;}
    setTasteChange(selected ? null : { before: { ...taste }, after: likedCourseTaste(next,likeableCourses,catalog,testTaste).taste });
    setLikedCourseIds(next);setToast(selected?'취향반영 코스에서 제외했어요.':'취향반영 코스에 담았어요.');
  }
  async function unpublishCourse(id) {
    if(courseSaveLock.current)return;
    const next=myCourses.map(c=>c.id===id?{...c,isPublic:false}:c);
    courseSaveLock.current=true;setCourseSaving(true);
    try {await commitMyCourses(next);setToast('공개를 해제해 나만의 코스로 이동했어요.');}
    catch(error){setToast(error.message || '공개 상태를 저장하지 못했습니다. 다시 시도해주세요.');}
    finally{courseSaveLock.current=false;setCourseSaving(false);}
  }
  function beginNewCourse() {
    setEditorReturnTab(null);
    setDraft({ ...emptyDraft, stopIds: [] }); setSelectedId(null); setReplacementUndo(null);
    setPicker(''); setPickerAfterId('end'); setPickerOnlyRecommended(false); setPickerRotation(null); setPickerListPage({context:null,count:3});
    setDrivingRoute(null); setDrivingError(''); setDrivingStatus('idle'); setCompletedCourse(null); navigate('create');
  }
  function requestNewCourse() { if (!requireMember()) return;
    const hasContent = Boolean(draft.id || draft.name.trim() || draft.description.trim() || draft.stopIds.length || draft.accommodationId || draft.schedule?.length || draft.hours !== emptyDraft.hours || draft.transport !== emptyDraft.transport);
    if (hasContent) setModal('new-course'); else beginNewCourse();
  }
  function edit(c) { if (!requireMember()) return; setEditorReturnTab(screen==='saved'?savedTab:null); setDraft({ imagePlaceId: openedCourseImage?.courseId===c.id ? openedCourseImage.placeId : c.imagePlaceId || c.stopIds[0], representativeTags: c.representativeTags || [], isExistingCourse: true, sourceCourseId: c.id, originalCourseId: c.originalCourseId || c.id, originalAuthor: c.originalAuthor || c.author, id: myCourses.some(own=>own.id===c.id) ? c.id : null, name: myCourses.some(own=>own.id===c.id) ? c.name : `${c.name} · 나의 코스`, description: c.description, stopIds: [...c.stopIds], hours: c.hours, transport: c.transport, durationDays: c.durationDays, accommodationId: c.id === detailId ? detailAccommodation?.id ?? null : c.accommodationId ?? null, schedule: c.schedule, source: c.source, straightLineKm: c.straightLineKm }); navigate('create'); }
  const popularity = useMemo(() => popularCourses([...availableTourCourses, ...availableCommunityCourses, ...classifiedTravelCourses], favorites), [availableTourCourses, availableCommunityCourses, classifiedTravelCourses, favorites]);
  const homeCardCourses = useMemo(() => homeTab === 'recommended' ? [heroCourse,...suggestedCourses].slice(0,10) : popularity.slice(0,10),[homeTab,heroCourse,suggestedCourses,popularity]);
  const homeCardImages = useMemo(() => courseListImages(homeCardCourses,catalog),[homeCardCourses,catalog]);
  const title = { search: '코스 검색', create: '코스 만들기', saved: '저장한 여행', my: '내 여행 프로필' }[screen];
  const pickerKeywords = [...new Set(searchCandidates(picker).map(normalizeTag))];
  const matchesPicker = (p, keyword) => [p.name, p.region, p.description, p.category, ...p.tags].some(word => word.toLowerCase().includes(keyword));
  const pickerRanking = recommendAdditions({ candidates: catalog.filter(p => !picker.trim() || pickerKeywords.some(keyword => matchesPicker(p, keyword))), stops: draftStops, region: pickerRegion, afterId: pickerAfterId, accommodation: draftAccommodation, interests: profile.interests, taste });
  const pickerFlowKey = JSON.stringify([draft.id,draft.stopIds]);
  const inferredPickerFlow = itineraryFlow(draftStops,pickerFlowOverride?.key===pickerFlowKey ? pickerFlowOverride.stage : null);
  const freePickerMode = Boolean(draft.isExistingCourse || draft.freePlaceAdditions);
  const pickerFlow = freePickerMode ? {stage:'free',label:'원하는 장소 추가',actions:[],category:null} : inferredPickerFlow;
  const flowRanking = recommendAdditions({ candidates: freePickerMode ? catalog.filter(p=>!picker.trim() || pickerKeywords.some(keyword=>matchesPicker(p,keyword))) : catalog.filter(p=>p.category===pickerFlow.category), stops:draftStops,region:pickerRegion,afterId:pickerAfterId,accommodation:draftAccommodation,interests:profile.interests,taste });
  const pickerResults = pickerRanking.ranked.map(item => item.place);
  const pickerPool = flowRanking.hasAnchor ? flowRanking.ranked.filter(item => item.distance !== null && item.distance <= flowRanking.radius) : flowRanking.ranked;
  const pickerContext = JSON.stringify([pickerFlow.stage,pickerRegion,picker,pickerAfterId,draft.stopIds,draftAccommodation?.id,profile.interests,taste,pickerPool.map(item=>item.place.id)]);
  const activePickerRotation = pickerRotation?.context === pickerContext ? pickerRotation : null;
  const pickerRecommendations = activePickerRotation ? activePickerRotation.selected.map(id => pickerPool.find(item => item.place.id === id)).filter(Boolean) : flowRanking.recommendations;
  const recommendedIds = new Set(pickerRecommendations.map(item => item.place.id));
  const pickerOtherCandidates = pickerRanking.ranked.filter(item => !recommendedIds.has(item.place.id));
  const pickerListContext = JSON.stringify([pickerContext,pickerRecommendations.map(item=>item.place.id)]);
  const pickerVisibleCount = pickerListPage.context === pickerListContext ? pickerListPage.count : 3;
  function rotatePickerRecommendations() { setPickerOnlyRecommended(true); setPickerRotation(previous => nextRecommendationBatch(pickerPool,previous,pickerContext)); }
  useLayoutEffect(() => { document.querySelector('.main-content')?.scrollTo(0, 0); window.scrollTo(0, 0); }, [screen, detail?.id]);
  if (screen === 'welcome') return <div className="app-shell view-welcome"><WelcomeFlow initialPhase="test" onComplete={answers => { const baseline = testTasteFromAnswers(answers); if(!baseline) return false; try {} catch {return false;} setTestTaste(baseline); setTasteChange(null); navigate('home'); return true; }} onHome={() => navigate('home')} onNickname={name => setProfile(value => ({...value,name}))}/></div>;
  return <div className={`app-shell view-${detail ? 'detail' : screen}`}><DeviceStatusBar/><div className="device-home-indicator" aria-hidden="true"/><header className="app-header"><button type="button" className="brand" aria-label="coursepick 홈" onClick={() => navigate('home')}><img className="brand-logo" src="/images/coursepick-logo.png" alt="코스픽"/></button>{screen !== 'home' && <button type="button" className="icon-button" aria-label="내 프로필" onClick={() => navigate('my')}><Icon name="user"/></button>}</header>
    {(error1 || error2 || error3 || error4 || error5 || accommodationStorageError) && <p role="alert" className="storage-warning">브라우저 저장 공간을 사용할 수 없어 변경 내용이 새로고침 후 유지되지 않을 수 있습니다.</p>}
    <main className={`main-content screen-${screen} ${screen === 'search' && results.length === 0 ? 'search-no-results' : ''}`}>
      {detail ? <>
        <div className="detail-top"><button type="button" className="icon-button" aria-label="코스 상세 닫기" onClick={() => { setDetail(null); document.querySelector('.main-content')?.scrollTo(0, 0); window.scrollTo(0, 0); }}><Icon name="back"/></button><strong>코스 상세</strong><div className="inline-actions">{screen === 'saved' && savedTab === 'bookmarked' && <button type="button" className={`editor-like-button ${likedCourseIds.includes(detail.id) ? 'is-liked' : ''}`} aria-label={likedCourseIds.includes(detail.id) ? '취향반영 코스에서 제외' : '취향반영 코스에 추가'} aria-pressed={likedCourseIds.includes(detail.id)} onClick={() => toggleLikedCourse(detail.id)}>{likedCourseIds.includes(detail.id) ? <span className="filled-heart-plus" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 19.5 4.8 12.9C1.4 9.8 2.2 4.6 6.5 4.6c2.3 0 4 1.5 5.5 3.1 1.5-1.6 3.2-3.1 5.5-3.1 3.3 0 4.6 2.8 3.7 5.4h-3.1v4.1h-3.9v3.4Z"/></svg><span className="heart-plus-outline"/></span> : <img src="/images/heart-plus-original.png" alt=""/>}</button>}<Save name={detail.name} saved={courseLibraryLists(myCourses,favorites,all).privateCourses.some(c=>c.id===detail.id)} onClick={() => courseLibraryLists(myCourses,favorites,all).privateCourses.some(c=>c.id===detail.id) ? removePrivateCourse(detail.id) : toggleCourse(detail.id)}/><button type="button" className="icon-button" aria-label="이 코스를 편집하기" onClick={() => edit(detail)}><Icon name="edit"/></button></div></div>
        <div className="detail-layout"><MapPanel showRoute accommodationId={detailAccommodation?.id} roadPaths={drivingRoute?.paths} place={placeOf(detail.stopIds[0])} places={routePlaces} selectedId={selectedId} onSelectPlace={selectPlace}><svg className="map-base" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="100" fill="#e8efe7"/><path d="M0 12H28V45H100M0 70H55V100M68 0V30H100" fill="none" stroke="#fff" strokeWidth="6"/><path d="M-10 54Q25 20 53 56T110 42" fill="none" stroke="#c4e2f0" strokeWidth="12"/><polyline points={previewRoute.map(position => `${position.left},${position.top}`).join(' ')} fill="none" stroke="#8458ed" strokeWidth="1" strokeDasharray="2 1"/></svg>{mapPlaces.map((p, index) => { const id = p.id, position = previewPositions[index]; return <button type="button" key={id} className={`photo-pin ${selectedId === id ? 'active' : ''}`} style={{ left: `clamp(48px, ${position.left}%, calc(100% - 48px))`, top: `${position.top}%` }} aria-label={`${p.id === detailAccommodation?.id ? '숙소' : detail.stopIds.indexOf(p.id) + 1}. ${p.name} 지도에서 선택`} aria-pressed={selectedId === id} onClick={() => selectPlace(id)}><span className="pin-number">{p.id === detailAccommodation?.id ? '숙' : detail.stopIds.indexOf(p.id) + 1}</span><Photo place={p}/><span>{p.name}</span></button>; })}<span className="map-note">실제 지리와 다른 샘플 배치 · 길찾기 미제공</span></MapPanel><section className="detail-panel"><h1>{detail.name}</h1><p className="byline"><img className={detail.author === 'coursepick' ? 'course-author-avatar course-author-logo' : 'course-author-avatar'} src={detail.author === 'coursepick' ? '/images/coursepick-author-logo.png' : '/images/profile-default.svg'} alt={detail.author === 'coursepick' ? '코스픽 로고' : '작성자 기본 이미지'}/>{detail.author !== 'coursepick' && <>by. {detail.author}</>}</p>{detail.originalAuthor && <p className="byline">{detail.originalAuthor}님의 코스를 바탕으로 수정</p>}<div className="tags">{(detail.representativeTags?.length ? detail.representativeTags : detail.tags).slice(0, 3).map(tag => <span key={tag}>#{tag}</span>)}</div><CourseCardMeta course={detail} Icon={Icon} className="detail-course-meta"/><hr className="detail-schedule-divider"/>
          {transitSummary()}{<div className="timeline">{lodgingVisit('숙소 출발')}{detail.stopIds.map((id, index) => { const p = placeOf(id); return <React.Fragment key={id}><button type="button" className={`timeline-stop ${selectedId === id ? 'active' : ''}`} aria-pressed={selectedId === id} onClick={() => openPlaceDetails(id)}><span className="step-number">{index + 1}</span><Photo place={p}/><span className="timeline-copy"><strong>{p.name}</strong>{drivingRoute?.segments[index - (detailAccommodation ? 0 : 1)] && <small>이전 장소에서 자동차 약 {Math.ceil(drivingRoute.segments[index - (detailAccommodation ? 0 : 1)].durationSeconds / 60)}분</small>}{transitRoute?.segments[index - (detailAccommodation ? 0 : 1)] && <small>이전 장소에서 대중교통 이동 약 {Math.ceil(transitRoute.segments[index - (detailAccommodation ? 0 : 1)].durationSeconds/60)}분 · 대기시간 제외</small>}<small>{detail.schedule?.[index] ? [detail.schedule[index].label, stayDuration(detail.schedule[index])].filter(Boolean).join(' · ') : `${p.category} · ${p.region}`}</small></span></button>{selectedCafe?.id === id && <button type="button" className="text-link danger" aria-label={`${p.name} 일정에서 빼기`} onClick={() => { setCafeVisits(current => { const next = { ...current }; delete next[detailId]; return next; }); setStop(1); setSelectedId(baseDetail.stopIds[1]); }}>일정에서 빼기</button>}</React.Fragment>; })}{lodgingVisit('숙소 복귀', true)}</div>}
          <button type="button" className="pill primary wide" onClick={() => edit(detail)}>코스 수정하기 <Icon name="edit" size={17}/></button></section></div>
      </> : <>
        {screen !== 'home' && screen !== 'create' && screen !== 'success' && screen !== 'my' && screen !== 'saved' && <div className="page-title"><button type="button" className="icon-button page-back" aria-label="홈으로 돌아가기" onClick={() => navigate('home')}><Icon name="back"/></button><h1>{title}</h1>{screen !== 'search' && <p className="muted">{screen === 'search' ? '키워드 하나에서 시작하는, 취향에 맞는 여행.' : screen === 'create' ? '마음에 드는 장소들을 나만의 순서로 연결해 보세요.' : screen === 'saved' ? '내가 작성한 코스와 다음 여행을 위해 저장한 코스.' : '기록이 쌓일수록 나의 여행 취향이 더 잘 보여요.'}</p>}</div>}
        {screen === 'success' && completedCourse && <CourseSaved Icon={Icon} course={completedCourse} placeOf={placeOf} Photo={Photo} onHome={() => navigate('home')} onView={() => { navigate('saved'); setSavedTab(completedCourse.isPublic === false ? 'bookmarked' : 'authored'); setDetail(null); document.querySelector('.main-content')?.scrollTo(0,0); }}/> }
        {screen === 'home' && <>
          <CourseSearchBox keyboardDictionary={searchKeyboardDictionary} keywords={searchSuggestionKeywords} query={filters.query} onSearch={submitCourseSearch} home/>
          <TravelFilterBar filters={selectedFilters} onOpen={openTravelFilters} renderIcon={name => <Icon name={name} size={16}/>}/>
          <div className="segmented feed-tabs" role="group" aria-label="홈 코스 추천 종류"><button type="button" className={homeTab === 'recommended' ? 'active' : ''} aria-pressed={homeTab === 'recommended'} onClick={() => setHomeTab('recommended')}>추천</button><button type="button" className={homeTab === 'popular' ? 'active' : ''} aria-pressed={homeTab === 'popular'} onClick={() => setHomeTab('popular')}>인기</button></div>

          <section className="home-feed" aria-label="홈 추천 여행 코스">{(homeTab === 'recommended' ? [heroCourse, ...suggestedCourses].slice(0, 10) : popularity.slice(0, 10)).map(c => <article className="feed-card" key={c.id}><BannerPhoto key={c.id} course={c} catalog={catalog} preferredId={homeCardImages.get(c.id)} onImageSelected={rememberCourseImage}/>{homeTab === 'popular' && <Save name={c.name} saved={favorites.includes(c.id)} onClick={() => toggleCourse(c.id)}/>}<button type="button" className="feed-open" aria-label={`${c.name} 추천 코스 상세보기`} onClick={() => open(c)}><h2>{c.name}</h2><span className="card-tags">{(c.representativeTags?.length ? c.representativeTags : c.tags).slice(0, 3).map(tag => <span key={tag}>#{tag}</span>)}</span><CourseCardMeta course={c} Icon={Icon} className="feed-meta"/>{homeTab === 'popular' && <small className="feed-saves">저장 {c.demoSaveCount}회</small>}</button></article>)}</section>

        </>}
        {screen === 'search' && <>
<CourseSearchBox keyboardDictionary={searchKeyboardDictionary} keywords={searchSuggestionKeywords} query={filters.query} onSearch={submitCourseSearch}/>{originalKeyboardQuery && <p className="keyboard-search-note">{filters.query}로 검색한 결과입니다. <button type="button" className="text-link" onClick={()=>submitCourseSearch(originalKeyboardQuery,true)}>원래 입력으로 검색</button></p>}
          <TravelFilterBar filters={selectedFilters} onOpen={openTravelFilters} renderIcon={name => <Icon name={name} size={16}/>}/>{results.length === 0 && recommendedSearchResults.length === 0 ? <section className="search-empty-result" role="status" aria-live="polite"><svg width="58" height="58" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="5" aria-hidden="true"><circle cx="25" cy="25" r="17"/><path d="M38 38L59 59"/></svg><p>검색 결과가 없습니다.</p></section> : <>          {(filters.infant || filters.pet) && <p className="section-description">동반 가능 여부가 확인된 장소만 표시해요. 정보 미확인 장소는 제외합니다.</p>}
          {recommendedSearchResults.length>0 && <SearchAiCarousel courses={recommendedSearchResults.slice(0,5)} catalog={catalog} images={searchCardImages} query={filters.query} Photo={BannerPhoto} Icon={Icon} onOpen={open} onImageSelected={rememberCourseImage}/>}

          <section ref={userCourseSection} className="search-course-section user-course-section" aria-label="사용자 코스 목록"><div className="section-title"><h2>사용자 코스 <span>({userSearchResults.length}개)</span></h2></div>{userSearchResults.length ? <>{expandedUserCourses && userSearchResults.length > 30 && <div className="user-course-collapse"><button type="button" className="pill secondary" aria-expanded="true" aria-controls="search-user-courses" onClick={collapseUserCourses}>접기 <Icon name="up" size={15}/></button></div>}<div id="search-user-courses" className="course-grid">{(expandedUserCourses ? userSearchResults : userSearchResults.slice(0, 30)).map(c => courseCard(c, searchMatches.get(c.id), 'users'))}</div>{userSearchResults.length > 30 && <button type="button" className="text-link user-courses-more" aria-expanded={expandedUserCourses} aria-controls="search-user-courses" onClick={() => expandedUserCourses ? collapseUserCourses() : setExpandedUserCourses(true)}>{expandedUserCourses ? '접기' : '더 보기'}<Icon name={expandedUserCourses ? 'up' : 'down'} size={16}/></button>}</> : <p className="empty-state compact-empty">조건에 맞는 사용자 코스가 없습니다.</p>}</section>

          </>}
        </>}
        {screen === 'create' && <form id="course-editor-form" className="editor" onSubmit={complete}>
          <header className="editor-top"><button type="button" className="icon-button" aria-label={editorReturnTab ? '내 코스 목록으로 돌아가기' : '홈으로 돌아가기'} onClick={() => { if(editorReturnTab){navigate('saved');setSavedTab(editorReturnTab);}else navigate('home'); }}><Icon name="back"/></button><h1>{draft.isExistingCourse ? '코스 수정하기' : '코스 만들기'}</h1><button type="button" className={`editor-like-button ${likedCourseIds.includes(draft.id || draft.sourceCourseId) ? 'is-liked' : ''}`} aria-label={likedCourseIds.includes(draft.id || draft.sourceCourseId) ? '취향반영 코스에서 제외' : '취향반영 코스에 추가'} aria-pressed={likedCourseIds.includes(draft.id || draft.sourceCourseId)} onClick={() => toggleLikedCourse(draft.id || draft.sourceCourseId)}>{likedCourseIds.includes(draft.id || draft.sourceCourseId) ? <span className="filled-heart-plus" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 19.5 4.8 12.9C1.4 9.8 2.2 4.6 6.5 4.6c2.3 0 4 1.5 5.5 3.1 1.5-1.6 3.2-3.1 5.5-3.1 3.3 0 4.6 2.8 3.7 5.4h-3.1v4.1h-3.9v3.4Z"/></svg><span className="heart-plus-outline"/></span> : <img src="/images/heart-plus-original.png" alt=""/>}</button><button type="submit" className="pill primary">저장</button></header>

          <div className="editor-map"><MapPanel showRoute accommodationId={draftAccommodation?.id} place={draftStops[0] || draftAccommodation || catalog[0]} places={draftRoutePlaces} roadPaths={drivingRoute?.paths} selectedId={selectedId} onSelectPlace={selectPlace}/>{draft.transport === '자동차' && (drivingStatus === 'loading' || drivingRoute) && <p className="map-caption">{draft.transport === '자동차' && drivingStatus === 'success' ? `예상 자동차 이동 ${Math.ceil(drivingRoute.durationSeconds / 60)}분 · ${(drivingRoute.distanceMeters / 1000).toFixed(1)}km · 조회 시점 기준` : draft.transport === '자동차' && drivingStatus === 'loading' ? '자동차 이동시간을 확인하는 중입니다.' : null}</p>}</div>
          <div className="editor-title-field"><label className="field-label" htmlFor="course-title"><Icon name="flag" size={14}/>코스 제목</label><div className="course-title-input-wrap"><input id="course-title" className="field" maxLength={30} aria-invalid={Boolean(formError)} aria-describedby={formError ? "course-title-count course-title-error" : "course-title-count"} placeholder="코스 제목을 입력해주세요" value={draft.name} onChange={e => setDraft(v => ({ ...v, name: e.target.value }))}/><span id="course-title-count" className="char-count">{draft.name.length}/30</span></div>{formError && <p id="course-title-error" className="form-error" role="alert">{formError}</p>}</div>
          <section className="editor-itinerary"><div className="section-title"><h2>여행 장소 <span>({draft.stopIds.length})</span></h2><button type="button" className="itinerary-add-button" onClick={() => { setPicker(''); setPickerRegion(courseRegion(draftStops) === '전체' ? filters.region : courseRegion(draftStops)); setPickerAfterId('end'); setPickerOnlyRecommended(false); setModal('places'); }}>+ 장소 추가</button></div>
          {replacementUndo && draft === replacementUndo.after && <div role="status">장소를 교체했어요. <button type="button" className="text-link" onClick={undoReplacement}>되돌리기</button></div>}
          {transitSummary()}<EditorStops transitRoute={transitRoute} course={draft} Icon={Icon} drivingRoute={drivingRoute} drivingStatus={drivingRequestKey === drivingKey ? drivingStatus : 'loading'} transport={draft.transport} onOpenPlace={openPlaceDetails} ids={draft.stopIds} places={catalog} schedule={draft.schedule} recommendations={draftRecommendations} renderPhoto={p => <Photo place={p}/>} onReorder={reorder} onReplace={replaceRecommendedPlace} onRemove={id => setDraft(v => ({ ...v, stopIds: v.stopIds.filter(item => item !== id), schedule: undefined }))}/>{!draft.stopIds.length && <div className="itinerary-empty"><svg className="itinerary-empty-art" viewBox="0 0 100 80" fill="none" aria-hidden="true"><path d="M12 60C28 27 43 73 62 56S81 39 88 30" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 4"/><path d="M62 18C62 29 50 39 50 39S38 29 38 18A12 12 0 0 1 62 18Z" stroke="currentColor" strokeWidth="1.4"/><circle cx="50" cy="18" r="4" stroke="currentColor" strokeWidth="1.4"/></svg><strong>아직 추가된 장소가 없어요.</strong><p>여행할 장소를 추가해보세요.</p></div>}</section>
          <section className="editor-course-tags" aria-label="대표 키워드 선택"><div className="section-title"><h2>코스 키워드</h2><span>{draftSelectedTags.length}/3</span></div><p>대표 키워드를 최대 3개 선택해 주세요.</p><div className="editor-course-tag-options" role="group" aria-label="코스 해시태그">{draftTagCandidates.map(tag=><button type="button" key={tag} aria-pressed={draftSelectedTags.includes(tag)} className={draftSelectedTags.includes(tag)?'selected':''} onClick={()=>toggleDraftTag(tag)}>#{tag}</button>)}</div>{!draftTagCandidates.length&&<p>장소를 추가하면 키워드가 표시됩니다.</p>}</section>
        </form>}
        {screen === 'saved' && <CourseLibrary placeStatus={placeStatus} onRetryPlaces={() => setPlaceRetry(value=>value+1)} onRemovePrivate={removePrivateCourse} CoursePhoto={BannerPhoto} catalog={catalog} Icon={Icon} tab={savedTab} onTab={setSavedTab} onUnpublish={unpublishCourse} likedCourses={likedCourses} onUnlike={toggleLikedCourse} onToggleLike={toggleLikedCourse} authored={myCourses} savedIds={favorites} courses={all} placeOf={placeOf} Photo={Photo} onOpen={open} onCreate={requestNewCourse} onEdit={edit} onDelete={id => setModal({type:'delete',id})} onUnsave={toggleCourse} onExplore={() => navigate('home')}/>}

        {screen === 'my' && <><section className="my-profile"><img className={`profile-illustration ${profile.photo ? 'uploaded-profile-photo' : ''}`} src={profile.photo || '/images/profile-mvp.png'} alt="프로필 사진"/><button type="button" className="title-button my-name" aria-label="프로필 수정" onClick={() => { setProfileForm({ ...profile, interests: [...profile.interests] }); setModal('profile'); }}><h1>{profile.name}</h1><Icon name="edit" size={16}/></button><p>{profile.bio}</p></section><div className="profile-stats course-library-stats"><button type="button" onClick={() => openCourseLibrary('authored')}><strong><img className="profile-stat-icon" src="/images/profile-share.png" alt=""/>{courseLibraryLists(myCourses,favorites,all).publicCourses.length}</strong><span>공개한 코스</span></button><button type="button" onClick={() => openCourseLibrary('bookmarked')}><strong><img className="profile-stat-icon" src="/images/profile-save.png" alt=""/>{courseLibraryLists(myCourses,favorites,all).privateCourses.length}</strong><span>나만의 코스</span></button><button type="button" className="profile-stat-placeholder" aria-label={`취향반영 코스 ${likedCourses.length}개`} onClick={() => openCourseLibrary('taste')}><strong><img className="profile-stat-icon profile-stat-like" src="/images/profile-like.png" alt=""/>{likedCourses.length}</strong><span>취향반영 코스</span></button></div><section className="my-taste" aria-label="나의 여행 성향"><div className="section-title"><h2>나의 여행 성향</h2></div>{tasteAxes.map(axis => <div className="preference-row" key={axis.id}><span className={`preference-icon axis-${axis.id}`}><Icon name={axis.icon} size={20}/></span><div><strong className="preference-title">{axis.title}</strong><div className="preference-control"><span className="taste-endpoint">{visibleTasteChange && taste[axis.id] < visibleTasteChange.before[axis.id] && <span className="taste-endpoint-change" aria-label={`${axis.left} 방향으로 ${visibleTasteChange.before[axis.id]-taste[axis.id]}점 이동`}>+{visibleTasteChange.before[axis.id]-taste[axis.id]}</span>}<i aria-hidden="true">{({activity:"🌿",space:"🏠",environment:"🏙️",content:"🎥",pace:"🌻"})[axis.id]}</i>{axis.left}</span><div className="taste-meter" role="meter" aria-label={axis.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={taste[axis.id]} aria-valuetext={taste[axis.id] === 50 ? '중립' : `${taste[axis.id] < 50 ? 100 - taste[axis.id] : taste[axis.id]}% ${taste[axis.id] < 50 ? axis.left : axis.right}`}><span className="taste-meter-fill" aria-hidden="true" style={{left: `${Math.min(50,taste[axis.id])}%`,width: `${Math.abs(taste[axis.id]-50)}%`}}/>{visibleTasteChange && taste[axis.id] !== visibleTasteChange.before[axis.id] && <span className="taste-meter-change" aria-hidden="true" style={{left: `${Math.min(visibleTasteChange.before[axis.id],taste[axis.id])}%`,width: `${Math.abs(taste[axis.id]-visibleTasteChange.before[axis.id])}%`}}/>}<span className="taste-meter-dot" style={{ left: `${taste[axis.id]}%` }}/></div><span className="taste-endpoint">{visibleTasteChange && taste[axis.id] > visibleTasteChange.before[axis.id] && <span className="taste-endpoint-change" aria-label={`${axis.right} 방향으로 ${taste[axis.id]-visibleTasteChange.before[axis.id]}점 이동`}>+{taste[axis.id]-visibleTasteChange.before[axis.id]}</span>}{axis.right}<i aria-hidden="true">{({activity:"🏃",space:"🎡",environment:"🌳",content:"👨‍🍳",pace:"👣"})[axis.id]}</i></span></div></div></div>)}</section></>}
      </>}
      {screen !== 'my' && <footer className="app-footer"><span>coursepick · 나의 여행 시나리오</span><small>보완 사진 출처: 한국관광공사 TourAPI · <a href="https://www.kogl.or.kr/info/license.do" target="_blank" rel="noreferrer">공공누리 제1유형</a></small></footer>}
    </main>
    <nav className="bottom-nav" aria-label="주요 메뉴">{[{ id: 'home', name: '홈', icon: 'home' }, { id: 'create', name: '새 코스', icon: 'plus' }, { id: 'saved', name: '내 코스', icon: 'bookmark' }, { id: 'my', name: '마이', icon: 'user' }].map(item => <button type="button" key={item.id} className={screen === item.id ? 'active' : ''} aria-current={screen === item.id ? 'page' : undefined} onClick={() => item.id === 'create' ? requestNewCourse() : navigate(item.id)}><Icon name={item.icon} size={23}/><span>{item.name}</span></button>)}</nav>
    {toast && <div className="toast" role="status">{toast}</div>}
    {modal === 'save-choice' && pendingSaveCourse && <Modal title="코스를 저장할까요?" className="course-save-choice-modal" onClose={() => { if(courseSaveLock.current)return;setModal(null); setPendingSaveCourse(null); }}><CourseSaveChoice course={pendingSaveCourse} onSave={saveChosenCourse} error={formError} saving={courseSaving}/></Modal>}
    {modal === 'new-course' && <Modal title="새 코스를 시작할까요?" onClose={() => setModal(null)}><p>작성 중인 내용을 비우고 새 코스를 시작합니다. 이미 저장한 코스는 유지됩니다.</p><div className="modal-actions"><button type="button" className="pill secondary" onClick={() => navigate('create')}>취소</button><button type="button" className="pill primary" onClick={beginNewCourse}>새 코스 시작</button></div></Modal>}
    {modal === 'travel-filters' && <Modal className={filterFocus === 'region' ? 'region-filter-modal' : filterFocus === 'all' ? '' : `compact-filter-modal ${filterFocus}-filter-modal`} title={travelFilterTitles[filterFocus]} initialFocus={filterFocus === 'all' ? undefined : `[data-filter-section="${filterFocus}"] button`} onClose={() => setModal(null)}><TravelFilterPopup value={filterDraft} onChange={setFilterDraft} places={catalog} focusSection={filterFocus} onReset={resetTravelFilterDraft} onApply={applyTravelFilters} onCancel={() => setModal(null)}/></Modal>}
    {modal === 'places' && <Modal className="place-picker-modal" title="장소 추가" onClose={() => setModal(null)}><PlacePicker freeMode={freePickerMode} stops={draftStops} afterId={pickerAfterId} onAfter={setPickerAfterId} flow={pickerFlow} flowRanked={flowRanking.ranked} onFlow={stage => { if(stage==='free') {setDraft(v=>({...v,freePlaceAdditions:true}));return;} if(stage==='done') {setModal(null);return;} setPickerFlowOverride({key:pickerFlowKey,stage}); setPicker(''); }} onFinish={() => setModal(null)} query={picker} onQuery={setPicker} ranked={pickerRanking.ranked} recommended={pickerRecommendations} onRotate={rotatePickerRecommendations} recycled={activePickerRotation?.recycled} savedIds={savedPlaces} renderRow={(p,item,onPhoto)=>placeRow(p,true,item,onPhoto)} renderMap={(places,id,onSelect)=><MapPanel showRoute routePlaces={draftRoutePlaces} accommodationId={draftAccommodation?.id} place={draftRoutePlaces[0] || places[0] || catalog[0]} places={places} selectedId={id} onSelectPlace={candidateId=>{if(places.some(p=>p.id===candidateId))onSelect(candidateId);}}/>} lodgings={<LodgingSelector region={draftStops[0]?.region || (pickerRegion==='전체'?undefined:pickerRegion)} stops={draftStops} onLoaded={keepLoadedLodgings} id="picker-lodging" onAdd={place => { setDraft(current=>({...current,stopIds:insertPlace(current.stopIds,place.id,pickerAfterId),accommodationId:null,schedule:undefined})); setToast(`${place.name}을 일정에 추가했어요.`); }} candidates={draftLodgings} selected={draftAccommodation} onChange={id=>setDraft(current=>({...current,accommodationId:id}))}/>}/></Modal>}
    {modal?.type === 'place' && placeOf(modal.id) && (() => {
      const p = placeOf(modal.id);
      const hasCoordinates = Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && (p.latitude !== 0 || p.longitude !== 0);
      return <Modal className="place-detail-modal" title={p.name} onClose={() => setModal(modal.returnTo === 'places' ? 'places' : null)}>
        <div className="place-detail-photo"><Photo place={p}/></div>
        <div className="place-detail-heading"><div><p className="overline">{p.region} · {p.category}</p><h3>{p.name}</h3></div><Save name={p.name} saved={savedPlaces.includes(p.id)} onClick={() => togglePlace(p.id)}/></div>
        <div className="tags">{p.tags.map(tag => <span key={tag}>#{tag}</span>)}</div>
        <section className="place-detail-section"><h3>장소 소개</h3><PlaceDescription key={p.id} text={p.description?.trim() || '장소 설명 준비 중입니다.'}/></section>
        <section className="place-detail-section"><h3>기본 정보</h3><dl><dt>주소</dt><dd>{p.location?.trim() || '주소 확인 필요'}</dd><dt>운영시간</dt><dd>{p.openingHours?.trim() || '운영시간 확인 필요'}</dd>{p.companionInfo?.infantStatus&&<><dt>영유아 정보</dt><dd>{p.companionInfo.infantStatus==='allowed'?'동반 가능':p.companionInfo.infantStatus==='not_allowed'?'동반 제한':p.companionInfo.infantStatus==='facilities_confirmed'?'영유아 편의시설 보유 (이용 조건 확인)':'정보 미확인'}</dd>{Object.entries(p.companionInfo.infantFacilities||{}).filter(([,value])=>value).map(([key,value])=><React.Fragment key={key}><dt>{({stroller:'유모차',lactationroom:'수유실',babysparechair:'유아 의자',infantsfamilyetc:'영유아 안내'})[key]||key}</dt><dd>{value}</dd></React.Fragment>)}</>}{typeof p.companionInfo?.petAllowed==='boolean'&&<><dt>반려동물</dt><dd>{p.companionInfo.petStatus==='conditional'?'조건부 동반 가능':p.companionInfo.petStatus==='unknown'?'동반 정보 확인 필요':p.companionInfo.petAllowed?'동반 가능 (아래 조건 확인)':'동반 불가'}</dd>{p.companionInfo.petSize&&<><dt>동물 크기</dt><dd>{p.companionInfo.petSize}</dd></>}{p.companionInfo.petRestrictions&&<><dt>동반 조건</dt><dd>{p.companionInfo.petRestrictions}</dd></>}{p.companionInfo.petDedicated&&<><dt>전용 시설</dt><dd>{p.companionInfo.petDedicated}</dd></>}{p.companionInfo.petExtraFee&&<><dt>추가 요금</dt><dd>{p.companionInfo.petExtraFee}</dd></>}{p.companionInfo.sourceUpdatedAt&&<><dt>정보 기준일</dt><dd>{p.companionInfo.sourceUpdatedAt} · 제공 자료 기준</dd></>}</>}</dl></section>
        <section className="place-detail-section"><h3>위치</h3>{hasCoordinates ? <><MapPanel place={p} places={[p]} selectedId={p.id} onSelectPlace={selectPlace}/><a className="pill secondary wide" href={`https://map.kakao.com/link/map/${encodeURIComponent(p.name)},${p.latitude},${p.longitude}`} target="_blank" rel="noopener noreferrer">카카오맵에서 보기</a></> : <p className="muted">위치 정보 확인 필요</p>}</section>
      </Modal>;
    })()}

    {modal === 'generate' && <Modal title="맞춤 여행 코스 만들기" onClose={() => { if (generationStatus !== 'loading') setModal(null); }}><form onSubmit={generatePersonalCourse}><p className="muted">마이의 관심·저장·작성 기록, 여행 성향 점수와 장소 간 거리를 이용합니다. 생성형 AI는 사용하지 않습니다. 자동차 코스로 구성하며 실제 이동시간은 상세 화면에서 조회합니다.</p><label className="field-label" htmlFor="generation-region">여행 지역</label><select id="generation-region" className="field" value={generationRegion} disabled={generationStatus === 'loading'} onChange={event => { setGenerationRegion(event.target.value); setGenerationAccommodationId(''); }}>{[...new Set(places.filter(p => p.category === '관광지').map(p => p.region))].sort().map(region => <option key={region}>{region}</option>)}</select><LodgingSelector region={generationRegion} onLoaded={keepLoadedLodgings} id="generation-lodging" candidates={generationLodgings} selected={generationAccommodation} onChange={id => setGenerationAccommodationId(id || '')}/><p>당일치기 · 자동차 이동</p><label><input type="checkbox" checked={generationCafe} disabled={generationStatus === 'loading'} onChange={event => setGenerationCafe(event.target.checked)}/> 카페·디저트 포함 (5곳)</label><p>{`${generationAccommodation ? '숙소 → ' : ''}오전 일정 → 점심 → 오후 일정 → ${generationCafe ? '카페·디저트 → ' : ''}저녁${generationAccommodation ? ' → 숙소' : ''}`}</p>{generationToDraft && draft.stopIds.length > 0 && <label><input type="checkbox" checked={generationReplace} onChange={event => setGenerationReplace(event.target.checked)} disabled={generationStatus === 'loading'}/> 작성 중인 일정을 새 추천 초안으로 교체합니다.</label>}{generationError && <p role="alert">{generationError}</p>}<button type="submit" className="pill primary wide" disabled={generationStatus === 'loading' || placeStatus !== 'success' || (generationToDraft && draft.stopIds.length > 0 && !generationReplace)}>{generationStatus === 'loading' ? '맞춤 코스를 만드는 중입니다.' : '코스 추천받기'}</button><p className="muted">{generationToDraft ? '생성 결과는 편집 가능한 초안입니다. 완료를 눌러야 내 코스로 저장됩니다.' : '생성 결과는 이 코스로 나의 여행 만들기에서 저장할 수 있습니다.'}</p></form></Modal>}
    {modal === 'profile' && <Modal title="여행 프로필 편집" onClose={() => setModal(null)}><form onSubmit={e => { e.preventDefault(); if (!profileForm.name.trim()) return; setProfile({ ...profileForm, name: profileForm.name.trim(), bio: profileForm.bio.trim() }); setModal(null); setToast('나의 여행 취향을 저장했어요.'); }}><div className="profile-image-upload"><img src={profileForm.photo || '/images/profile-mvp.png'} alt="프로필 사진 미리보기"/><label className="pill secondary" htmlFor="profile-photo-upload">이미지 업로드</label><input id="profile-photo-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file=event.target.files?.[0]; if(!file)return; if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){setToast('PNG·JPG·WebP 사진을 2MB 이하로 선택해 주세요.');event.target.value='';return;} const reader=new FileReader();reader.onload=async()=>{if(typeof reader.result!=='string')return;try{const data=await memberRequest('photo',{data:reader.result},member.account.access_token);setProfileForm(value=>({...value,photo:data.url,photoPath:data.path}));}catch(error){setToast(error.message);}};reader.onerror=()=>setToast('이미지를 읽지 못했습니다. 다시 선택해 주세요.');reader.readAsDataURL(file);event.target.value=''; }}/></div><label className="field-label" htmlFor="profile-name">이름</label><input id="profile-name" className="field" required maxLength={20} value={profileForm.name} onChange={e => setProfileForm(v => ({ ...v, name: e.target.value }))}/><label className="field-label" htmlFor="profile-bio">한 줄 소개</label><input id="profile-bio" className="field" maxLength={100} value={profileForm.bio} onChange={e => setProfileForm(v => ({ ...v, bio: e.target.value }))}/><button type="submit" className="pill primary wide" disabled={!profileForm.name.trim()}>프로필 저장</button><div className="profile-logout-row"><button type="button" className="profile-logout-button" onClick={logout}>로그아웃</button></div></form></Modal>}
    {modal?.type === 'delete' && <Modal title="작성한 코스를 삭제할까요?" onClose={() => setModal(null)}><p>삭제 후에는 복구할 수 없습니다.</p><div className="modal-actions"><button type="button" className="pill secondary" onClick={() => setModal(null)}>취소</button><button type="button" className="pill primary" onClick={() => { const id = modal.id; setMyCourses(v => v.filter(c => c.id !== id)); setLikedCourseIds(v => v.filter(value => value !== id)); setFavorites(v => v.filter(item => item !== id)); if (draft.id === id) setDraft(emptyDraft); setModal(null); setToast('코스를 삭제했어요.'); }}>삭제 확인</button></div></Modal>}
  </div>;
}
function EmptySaved({ onExplore }) { return <div className="empty-state"><Icon name="bookmark" size={36}/><h2>다음 여행을 담아보세요.</h2><p>사진 위의 저장 버튼을 누르면 이곳에 모아볼 수 있어요.</p><button type="button" className="pill primary" onClick={onExplore}>여행 둘러보기</button></div>; }


