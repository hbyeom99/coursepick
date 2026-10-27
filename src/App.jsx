import {validateSearchQuery} from './lib/searchQueryValidation.js';
import JournalComposer from './components/JournalComposer.jsx';
import CourseCoverPhoto from './components/CourseCoverPhoto.jsx';
import {hasPlacePhoto} from './lib/placePhotoRequests.js';
import LoadingPage from './components/LoadingPage.jsx';
import usePageLoading from './lib/usePageLoading.js';
import PlaceDescription from './components/PlaceDescription.jsx';
import PlaceDetails from './components/PlaceDetails.jsx';
import CourseTimeline from './components/CourseTimeline.jsx';
import EditorialPlaceDetails from './components/EditorialPlaceDetails.jsx';
import CourseSaveTags from './components/CourseSaveTags.jsx';
import EditorialCourseMap from './components/EditorialCourseMap.jsx';
import {realPlaceCandidates,isFictionalPlace} from './lib/placeAuthenticity.js';
import useRegionalAddresses from './lib/useRegionalAddresses.js';
import {rankUserCourses,appendUserExamples} from './lib/userCourseRanking.js';
import useCourseGeneration from './lib/useCourseGeneration.js';
import {userCourseSearchMatch,courseSearchCardTags} from './lib/userCourseSearch.js';
import {courseEntries,reorderCourseEntries,validItineraryOrder} from './lib/itineraryOrder.js';
import {removeCourseDay} from './lib/removeLastCourseDay.js';
import EditorialTimeline from './components/EditorialTimeline.jsx';
import KakaoPlaceDetails from './components/KakaoPlaceDetails.jsx';
import {validKakaoRefs,addKakaoRef,hasExternalPlaces} from './lib/kakaoPlaceRefs.js';
import GooglePlaceDetails from './components/GooglePlaceDetails.jsx';
import {toEditorialCourse} from './lib/editorialCourse.js';
import HomeEditorialReel from './components/HomeEditorialReel.jsx';
import {tripExperiences,TripExperienceBanner} from './components/TripMarketExperiences.jsx';
import {evaluateCourseTraits,courseTraitAffinity,courseTraitsFromAnswers} from './lib/courseTraitsV2.js';
import {travelAxes} from './lib/travelAxes.js';
import {validJournals,validTravelTaste} from './lib/travelJournalValidation.js';
import CourseDayTabs from './components/CourseDayTabs.jsx';
import {courseDay,courseDayCount,courseDayIds,explicitStopDays} from './lib/courseDays.js';
import {createPublicCourseLoader} from './services/publicCourseService.js';
import {placeMatchesKeywords} from './lib/semanticKeywords.js';
import {selectPlaceTags,placeTagMatches} from './lib/placeTagSelection.js';
import { detailTravelInfo } from './lib/detailTravelInfo.js';
import AccessibilityDetails from './components/AccessibilityDetails.jsx';
import { accessibilityKeywordMatch } from './lib/accessibility.js';
import CourseRepresentativePhoto from './components/CourseRepresentativePhoto.jsx';
import {kakaoPlaceDetailUrl} from './lib/kakaoPlaceLink.js';
import ScheduleTiming from './components/ScheduleTiming.jsx';
import { keyboardDictionary, normalizeKeyboardQuery } from './lib/keyboardSearch.js';
import { relatedGroups } from './lib/searchIntent.js';
import CourseFitTags from './components/CourseFitTags.jsx';
import { useMemberStored, useMemberContext, memberRequest } from './lib/memberSession.jsx';

import {HOME_SEARCH_KEYWORDS,allowedHomeQuery,interpretHomeSearch,homeAnchorMatch,loadHomeSearchData,searchTagCandidates,explicitHomeSearchPeriod} from './lib/homeSearchIntent.js';
import {selectDiverseCourses} from './lib/courseDiversity.js';
import {homeKakaoSearch} from './services/homeKakaoSearch.js';
import {interpretNaturalSearch} from './lib/naturalLanguageSearch.js';
import { distanceLabel } from './lib/pickerMap.js';
import SearchAiCarousel from './components/SearchAiCarousel.jsx';
import { courseTagCandidates, selectedCourseTags } from './lib/courseTagSelection.js';
import WelcomeFlow from './components/WelcomeFlow.jsx';
import { itineraryFlow } from './lib/itineraryFlow.js';
import CourseSaveChoice from './components/CourseSaveChoice.jsx';
import CourseCardMeta from './components/CourseCardMeta.jsx';
import DeviceStatusBar from './components/DeviceStatusBar.jsx';
import TravelKeywordSearch from './components/TravelKeywordSearch.jsx';
import {createSearchSubmissionGate,searchRequestKey} from './lib/searchSubmission.js';
import { courseImageCandidates, courseListImages, shuffledCoursePhotos } from './lib/searchCourseImage.js';
import { courseLibraryLists } from './lib/courseLibraryLists.js';
import GoogleCoursePlaces from './components/GoogleCoursePlaces.jsx';
import {validGoogleRefs,coursePlaceCount,addGoogleRef,moveGoogleRef} from './lib/googlePlaceRefs.js';
import CourseVisualCard from './components/CourseVisualCard.jsx';
import PlacePicker from './components/PlacePicker.jsx';
import { nextRecommendationBatch } from './lib/recommendationRotation.js';
import CourseLibrary from './components/CourseLibrary.jsx';
import CourseSaved from './components/CourseSaved.jsx';
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

const emptyTraitTaste=Object.freeze({});

const publicCourseLoader = createPublicCourseLoader(memberRequest);

const emptyDraft = { id: null, name: '', description: '', stopIds: [], kakaoPlaceRefs: [], googlePlaceRefs: [], hours: 2, transport: '도보', accommodationId: null };
// Unset search conditions: all regions, all periods, no companions, all transport.
const emptyFilters = { query: '', category: '전체', region: '전체', theme: '전체', people: '전체', transport: '전체', hours: '전체', city: '전체', period: '전체', infant: false, pet: false, startTime: '09:00' };

const validList = value => Array.isArray(value) && value.every(item => typeof item === 'string');
const validAccommodationId = value => value == null || (typeof value === 'string' && value.trim().length > 0);
const validAccommodationLinks = value => value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(validAccommodationId);
const validDraft = value => value && validKakaoRefs(value.kakaoPlaceRefs) && validItineraryOrder(value) && validGoogleRefs(value.googlePlaceRefs) && typeof value.name === 'string' && typeof value.description === 'string' && Array.isArray(value.stopIds) && validList(value.stopIds) && new Set(value.stopIds).size === value.stopIds.length && Number(value.hours) > 0 && ['도보', '대중교통', '자동차'].includes(value.transport) && validAccommodationId(value.accommodationId);
const MyHub=React.lazy(()=>import('./components/MyHub.jsx'));
const TravelJournal=React.lazy(()=>import('./components/TravelJournal.jsx'));
const ZipFeature=React.lazy(()=>import('./components/zip/ZipFeature.jsx'));
const CourseEditor=React.lazy(()=>import('./components/CourseEditor.jsx'));
const EditorialCourseEditor=React.lazy(()=>import('./components/EditorialCourseEditor.jsx'));
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
  if (name === "courseEdit") return <span className="asset-icon asset-course-edit" style={{width:size,height:size}} aria-hidden="true"/>;
  const paths = { zip: 'M3 7V21H21V7H12L9 3H3ZM12 10V12M12 14V16M11 18H13V21', upload: 'M12 15V3 M8 7 12 3 16 7 M7 10H4V21H20V10H17', flag: 'M5 22V3 M5 4H19L16 8 19 12H5', heartPlus: 'M12 20L4 12C-1 7 5 1 12 7C18 1 24 6 20 11 M19 12V20 M15 16H23', settings: 'M9 3H15L16 6 19 7 21 10 19 13 19 17 16 18 15 21H9L8 18 5 17 5 13 3 10 5 7 8 6Z M16 12A4 4 0 1 1 8 12A4 4 0 1 1 16 12', car: 'M5 7L7 3H17L19 7 M3 7H21V17H3Z M5 17V21 M19 17V21 M6 12H8 M16 12H18', bus: 'M5 3H19V18H5Z M5 10H19 M8 14H9 M15 14H16 M7 18V21 M17 18V21', walk: 'M14 3A2 2 0 1 1 10 3A2 2 0 1 1 14 3 M12 7L9 13 5 14 M12 7L16 12 20 12 M9 13L13 16 15 22 M9 13L7 21', calendar: 'M4 5H20V21H4Z M4 10H20 M8 3V7 M16 3V7', home: 'M3 10 12 3 21 10V21H3Z M9 21V13H15V21', search: 'M16 16 21 21 M17 10A7 7 0 1 1 3 10A7 7 0 1 1 17 10', plus: 'M3 3H21V21H3Z M12 7V17 M7 12H17', bookmark: 'M6 3H18V21L12 17 6 21Z', user: 'M16 7A4 4 0 1 1 8 7A4 4 0 1 1 16 7 M4 21V19A8 8 0 0 1 20 19V21', arrow: 'M4 12H20 M14 6 20 12 14 18', back: 'M15 5 8 12 15 19', close: 'M5 5 19 19 M19 5 5 19', map: 'M3 6 9 3 15 6 21 3V18L15 21 9 18 3 21Z M9 3V18 M15 6V21', pin: 'M19 10C19 15 12 21 12 21S5 15 5 10A7 7 0 0 1 19 10Z M14 10A2 2 0 1 1 10 10A2 2 0 1 1 14 10', edit: 'M4 16 16 4 20 8 8 20H4Z M13 7 17 11', up: 'M5 15 12 8 19 15', down: 'M5 9 12 16 19 9', tune: 'M3 6H21 M3 12H21 M3 18H21 M8 4V8 M16 10V14 M9 16V20' };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.arrow}/></svg>;
}
function Photo({ place, onError }) {
  const source = tourApiEnrichment[place.id];
  const supplied = source?.imageUsed || place.id.startsWith('tourapi_');
  const imageUrl = place.imageUrl?.startsWith('data:image/svg') ? undefined : place.imageUrl;
  return <CourseRepresentativePhoto src={imageUrl} kakaoMapUrl={kakaoPlaceDetailUrl(place)} onError={onError} placeholderAlt={`${place.name} · 사진 준비 중`} alt={placeImageMetadata[place.id]?.alt ?? `${place.name}${supplied ? ' (TourAPI 제공)' : ' 분위기 참고 사진'}`} title={source?.imageUsed ? '사진 출처: 한국관광공사 TourAPI · 공공누리 제1유형' : undefined}/>;
}
function BannerPhoto({ course, catalog, preferredId, query = '', onImageSelected }) {
  const fallbackIds = useMemo(() => shuffledCoursePhotos(course,catalog), [course.id,course.stopIds,catalog]);
  const relevantIds = courseImageCandidates(course,catalog,query);
  const matchedId = relevantIds[0];
  const anchor = catalog.find(p=>p.id===course.imagePlaceId);
  const primary = query.trim()?matchedId:preferredId||matchedId;
  const ids=[...new Set((query.trim()?[...relevantIds,course.imagePlaceId,...(course.stopIds||[])]:[primary,...fallbackIds,...(course.stopIds||[])]).filter(Boolean))];
  const candidates=[];
  const cover=course.editorialVisits?.find(v=>v.cover_image&&hasPlacePhoto(v.image_url));
  const explicit=hasPlacePhoto(course.imageUrl)?course.imageUrl:hasPlacePhoto(course.image_url)?course.image_url:cover?.image_url;
  if(explicit&&!query.trim())candidates.push({key:'cover',src:explicit,alt:course.name});
  if(query.trim()&&course.searchImageRef?.source==='kakao'&&/^\d{1,20}$/.test(course.searchImageRef.placeId))candidates.push({key:'query-k:'+course.searchImageRef.placeId,kakaoMapUrl:'https://place.map.kakao.com/'+course.searchImageRef.placeId,alt:course.name+' · 검색 관련 장소 사진'});
  for(const id of ids){
    const p=catalog.find(p=>p.id===id);if(!p)continue;
    const kakaoMapUrl=kakaoPlaceDetailUrl(p);
    if(!hasPlacePhoto(p.imageUrl)&&!kakaoMapUrl)continue;
    const source=tourApiEnrichment[p.id];
    candidates.push({key:'n:'+id,placeId:id,src:hasPlacePhoto(p.imageUrl)?p.imageUrl:undefined,kakaoMapUrl,alt:placeImageMetadata[id]?.alt||p.name,title:source?.imageUsed?'사진 출처: 한국관광공사 TourAPI · 공공누리 제1유형':undefined});
  }
  if(explicit&&query.trim())candidates.push({key:'cover',src:explicit,alt:course.name});
  // External photos stay out of the catalog and saved course body.
  const refs=new Map((course.kakaoPlaceRefs||[]).map(ref=>['k:'+ref.placeId,ref]));
  const order=[...new Set([...(course.itineraryOrder||[]),...refs.keys()])];
  for(const key of order){const ref=refs.get(key);if(ref&&/^\d{1,20}$/.test(ref.placeId))candidates.push({key,kakaoMapUrl:'https://place.map.kakao.com/'+ref.placeId,alt:course.name+' · 장소 사진'});}
  return <CourseCoverPhoto candidates={candidates} courseId={course.id} onImageSelected={onImageSelected}/>;
}

function Save({ name, saved, onClick }) { return <button type="button" className={`save-button ${saved ? 'is-saved' : ''}`} aria-label={`${name} ${saved ? '저장 해제' : '저장'}`} aria-pressed={saved} onClick={onClick}><Icon name="bookmark" size={20}/></button>; }
function Modal({ title, onClose, children, initialFocus, className = '', suspended = false }) {
  const box = useRef(null), close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (suspended) return;
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
  }, [suspended]);
  return <div style={suspended ? {visibility:'hidden',pointerEvents:'none'} : undefined} className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><section ref={box} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title}><div className="section-title"><h2>{className === 'region-filter-modal' ? <><span className="region-title-accent">지역</span>을 선택해주세요.</> : className.includes('compact-filter-modal') ? <><span className="region-title-accent">{className.includes('period-filter') ? '여행 기간' : className.includes('traveler-filter') ? '여행 구성원' : '이동수단'}</span>을 선택해주세요.</> : title}</h2><button className="icon-button" type="button" aria-label="닫기" onClick={onClose}><Icon name="close"/></button></div>{className.split(' ').includes('place-detail-modal') ? <div className="place-detail-body">{children}</div> : children}</section></div>;
}
const homePopupExperience=tripExperiences.find(experience=>experience.open)||tripExperiences[0];

export default function App({onboardingRequired=false,onOnboardingComplete}={}) {
  const member = useMemberContext();
  const [editorReturnTab, setEditorReturnTab] = useState(null);
  const [saveTagCandidates,setSaveTagCandidates]=useState([]);
  const [testReturnScreen,setTestReturnScreen]=useState('home');
  const [searchResultTab,setSearchResultTab]=useState('ai'),[myLanding,setMyLanding]=useState('home'),[pendingJournalCourse,setPendingJournalCourse]=useState(null);
  const [journalArchive,setJournalArchive]=useState(false);
  const [homePopup,setHomePopup]=useState(false),[homePopupHideToday,setHomePopupHideToday]=useState(false);
  const [welcomePhase, setWelcomePhase] = useState('splash');
  const [pickerFlowOverride, setPickerFlowOverride] = useState(null);
  const [pendingSaveCourse, setPendingSaveCourse] = useState(null);
  const [courseSaving,setCourseSaving]=useState(false);
  const courseSaveLock=useRef(false);
  const [jibunAddresses, setJibunAddresses] = useState({});
  const [homeTab, setHomeTab] = useState('recommended');
  const [editorialData,setEditorialData]=useState({courses:[],places:[]}),[editorialError,setEditorialError]=useState(''),[editorialRetry,setEditorialRetry]=useState(0);
  useEffect(()=>{const controller=new AbortController();setEditorialError('');const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');fetch(base+'/api/editorial-courses',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)]),cache:'no-store'}).then(async response=>{if(!response.ok)throw Error('추천 코스를 불러오지 못했습니다.');return response.json();}).then(value=>{if(!controller.signal.aborted)setEditorialData(value);}).catch(error=>{if(!controller.signal.aborted)setEditorialError(error.name==='TimeoutError'?'코스 조회 시간이 초과되었어요. 다시 불러오기를 눌러 주세요.':error instanceof TypeError?'코스 서버에 연결하지 못했어요. 연결 상태를 확인한 뒤 다시 시도해 주세요.':error.message);});return()=>controller.abort();},[editorialRetry]);
  const editorialCourses=useMemo(()=>editorialData.courses.map(row=>toEditorialCourse(row,editorialData.places)),[editorialData]);

  const [completedCourse, setCompletedCourse] = useState(null);
  const [editorDay,setEditorDay]=useState(1),[detailDay,setDetailDay]=useState(1);
  const [zipRooms,setZipRooms]=useState([]),[zipDeep,setZipDeep]=useState(false),[zipImport,setZipImport]=useState(null);
  const [screen, setScreen] = useState(location.hash.startsWith('#zip')?'zip':'home'), [filters, setFilters] = useState(emptyFilters), [sort, setSort] = useState('recommended');
  const pageHistory = useRef([]);
  const [favorites, setFavorites, error1] = useFavorites();
  const [savedPlaces, setSavedPlaces, error2] = useStored('coursepick.savedPlaces.v1', [], validList);
  const [myCourses, setMyCourses, error3, commitMyCourses] = useStored('coursepick.myCourses.v1', [], value => Array.isArray(value) && value.every(c => validDraft(c) && typeof c.id === 'string' && c.name.trim() && coursePlaceCount(c) >= 2 && validList(c.tags)));
  const [editorialCopies,setEditorialCopies,editorialCopiesError,commitEditorialCopies]=useStored('coursepick.editorialCopies.v1',[],value=>Array.isArray(value)&&value.every(c=>c&&typeof c.id==='string'&&c.id.startsWith('editorial-copy-')&&typeof c.name==='string'&&typeof c.isPublic==='boolean'&&Array.isArray(c.editorialVisits)&&c.editorialVisits.length>=2));
  const [editorialEditing,setEditorialEditing]=useState(null);
  const [travelJournals,setTravelJournals,journalError,commitTravelJournals]=useStored('coursepick.travelJournals.v1',[],validJournals);
  const [travelTaste,setTravelTaste,travelTasteError,commitTravelTaste]=useStored('coursepick.travelTaste.v1',null,validTravelTaste);
  const [likedCourseIds, setLikedCourseIds] = useStored('coursepick.likedCourses.v1', [], validList);
  const [persistedDraft, setPersistedDraft, error4] = useStored('coursepick.draft.v1', emptyDraft, validDraft);
  const [missionDraft,setMissionDraft]=useState(null),[missionReturnTag,setMissionReturnTag]=useState(null),[myMissionTag,setMyMissionTag]=useState(null);
  const draft=missionDraft??persistedDraft,setDraft=missionDraft!==null?setMissionDraft:setPersistedDraft;
  const [profile, setProfile, error5] = useStored('coursepick.profile.v1', { name: member?.account.nickname || '여행자', bio: '좋은 풍경과 맛있는 한 끼를 찾아요.', interests: ['커피', '산책'] }, value => value && typeof value.name === 'string' && value.name.trim() && typeof value.bio === 'string' && validList(value.interests) && value.interests.every(word => tags.includes(word)));
  const [showMyCourses, setShowMyCourses] = useState(false);
  const [detailId, setDetail] = useState(null), [stop, setStop] = useState(0), [savedTab, setSavedTab] = useState('all');


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
  const availableMyCourses = useMemo(() => myCourses.filter(c => Array.isArray(c?.stopIds) && c.stopIds.every(id => catalogById.has(id))).map(c => classifyCourse(c, catalog, catalogById)), [myCourses, catalog]);
  const availableTourCourses = useMemo(() => tourApiCourses.filter(c => Array.isArray(c?.stopIds) && c.stopIds.every(id => catalogById.has(id))).map(c => classifyCourse(c, catalog, catalogById)), [catalog]);
  const classifiedTravelCourses = useMemo(() => travelCourses.map(c => classifyCourse(c, catalog, catalogById)), [catalog]);
  const [memberPublicCourses,setMemberPublicCourses] = useState([]);
  useEffect(()=>{
    let active=true, sequence=0;
    const load=()=>{const current=++sequence;publicCourseLoader.load().then(courses=>{if(active&&current===sequence)setMemberPublicCourses(courses);}).catch(()=>{});};
    const changed=()=>{publicCourseLoader.invalidate();load();};
    const visible=()=>{if(document.visibilityState==='visible')load();};
    load();window.addEventListener('member-courses-saved',changed);document.addEventListener('visibilitychange',visible);
    return()=>{active=false;window.removeEventListener('member-courses-saved',changed);document.removeEventListener('visibilitychange',visible);};
  },[screen]);
  const availableCommunityCourses = useMemo(() => [...communityCourses,...memberPublicCourses.filter(c=>!myCourses.some(own=>own.id===c.id))].filter(c => Array.isArray(c?.stopIds) && c.stopIds.every(id => catalogById.has(id))).map(c => classifyCourse(c, catalog, catalogById)), [communityCourses, memberPublicCourses, myCourses, catalog]);
  const searchSuggestionKeywords=HOME_SEARCH_KEYWORDS;
  const searchKeyboardDictionary=useMemo(()=>keyboardDictionary([...relatedGroups.flat(),...catalog.flatMap(p=>[p.name,p.category,p.region,...(p.tags||[])]),'서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']),[catalog]);
  const [originalKeyboardQuery,setOriginalKeyboardQuery]=useState('');
  const taste=travelTaste||emptyTraitTaste;
  const traitContext=useMemo(()=>{const knownPlaceIds=[...new Set([...savedPlaces,...myCourses.flatMap(c=>c.stopIds||[]),...travelJournals.flatMap(j=>j.placeIds||[])])].filter(id=>catalogById.has(id));return {knownPlaceIds,knownTags:profile.interests,knownCategories:[...new Set(knownPlaceIds.map(id=>catalogById.get(id)?.category).filter(Boolean))]};},[savedPlaces,myCourses,travelJournals,profile.interests,catalogById]);
  const [homeSearchRun,setHomeSearchRun]=useState(0);
  const [searchInterpretationLoading,setSearchInterpretationLoading]=useState(false);
  const searchInterpretationController=useRef(null);
  const searchInterpretationSequence=useRef(0);
  const homeSubmitGate=useRef(createSearchSubmissionGate());
  const homeSubmitToken=useRef(null);
  const [groupKeywordContext,setGroupKeywordContext]=useState(null);
  const [homeLive,setHomeLive]=useState({key:'',places:[],loading:false,failures:0});
  const [openedGeneratedCourse,setOpenedGeneratedCourse]=useState(null);
  const homeRule=useMemo(()=>interpretHomeSearch(filters.query,filters),[filters]);
  const homeSubmissionKey=searchRequestKey(filters.query,filters);
  const homeLookupKey=JSON.stringify([homeRule.key,filters.region,filters.city,homeSearchRun]);
  useEffect(()=>{
    const submitToken=homeSubmitToken.current;
    if(!homeRule.allowed||homeRule.empty){homeSubmitGate.current.finish(homeSubmissionKey,submitToken);setHomeLive({key:homeLookupKey,places:[],loading:false,failures:0});return;}
    const controller=new AbortController();setHomeLive({key:homeLookupKey,places:[],loading:true,failures:0});
    homeKakaoSearch(homeRule,controller.signal).then(data=>{if(!controller.signal.aborted)setHomeLive({key:homeLookupKey,...data,loading:false});}).catch(()=>{if(!controller.signal.aborted)setHomeLive({key:homeLookupKey,places:[],loading:false,failures:1});}).finally(()=>homeSubmitGate.current.finish(homeSubmissionKey,submitToken));
    return()=>controller.abort();
  },[homeLookupKey]);
  const homeSearchLoading=homeRule.allowed&&!homeRule.empty&&(homeLive.key!==homeLookupKey||homeLive.loading);
  const generationPayload=useMemo(()=>({catalog,live:homeLive.key===homeLookupKey?homeLive.places:[],filters,taste:groupKeywordContext?.taste||taste,interests:groupKeywordContext?.interests||profile.interests,context:{...(groupKeywordContext?{knownPlaceIds:[],knownTags:groupKeywordContext.interests,knownCategories:[]}:traitContext),resultLimit:6}}),[catalog,homeLive.places,homeLive.key,homeLookupKey,filters,taste,profile.interests,traitContext,groupKeywordContext]);
  const aiGeneration=useCourseGeneration('ai',generationPayload,homeRule.allowed&&!homeRule.empty&&!homeSearchLoading);
  const keywordGeneratedCourses=aiGeneration.courses;
  const all = useMemo(() => [...editorialCourses,...editorialCopies,...(openedGeneratedCourse?[openedGeneratedCourse]:[]),...keywordGeneratedCourses,...(generatedCourse ? [classifyCourse(generatedCourse, catalog, catalogById)] : []), ...availableMyCourses, ...availableTourCourses, ...availableCommunityCourses, ...classifiedTravelCourses], [editorialCourses,editorialCopies,openedGeneratedCourse,keywordGeneratedCourses, generatedCourse, availableMyCourses, availableTourCourses, availableCommunityCourses, classifiedTravelCourses, catalog]);
  const likeableCourses = useMemo(() => [...new Map([...travelCourses,...tourApiCourses,...communityCourses,...all,...myCourses].map(c=>[c.id,c])).values()], [tourApiCourses,communityCourses,all,myCourses]);
  const courseAssessments=useMemo(()=>new Map(all.map(c=>[c.id,evaluateCourseTraits(c,catalogById,traitContext)])),[all,catalogById,traitContext]);
  const likedCourses = likeableCourses.filter(c=>likedCourseIds.includes(c.id));
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
  const detailStops = useMemo(() => detail ? courseDayIds(detail,detailDay).map(id => catalog.find(p => p.id === id)).filter(Boolean) : [], [detail, catalog,detailDay]);
  const routePlaces = useMemo(() => courseRoute(detailStops, detailAccommodation), [detailStops, detailAccommodation]);
  const routeIds = useMemo(() => routePlaces.map(p => p.id), [routePlaces]);
  const mapPlaces = useMemo(() => [...new Map(routePlaces.map(p => [p.id, p])).values()], [routePlaces]);
  const nearbyLodgings = useMemo(() => lodgingCandidates(catalog, detailStops, detail?.region), [catalog, detailStops, detail?.region]);
  const draftStops = useMemo(() => draft.stopIds.map(id => catalog.find(p => p.id === id)).filter(Boolean), [draft.stopIds, catalog]);
  const [googleKeywordRows,setGoogleKeywordRows] = useState([]);
  const [kakaoKeywordRows,setKakaoKeywordRows] = useState([]);
  const draftGoogleKeywords = googleKeywordRows.filter(row=>(draft.googlePlaceRefs||[]).some(ref=>ref.placeId===row.id));
  const draftTagCandidates = courseTagCandidates([...draftStops,...draftGoogleKeywords,...kakaoKeywordRows.filter(row=>(draft.kakaoPlaceRefs||[]).some(ref=>ref.placeId===row.id))]);
  // Explicit course keyword choices survive transient provider loading/failure.
  for(const tag of draft.representativeTags||[])if(!draftTagCandidates.includes(tag))draftTagCandidates.push(tag);
  const draftSelectedTags = selectedCourseTags(draft.representativeTags,draftTagCandidates);
  function toggleDraftTag(tag) {
    if(draftSelectedTags.includes(tag))setDraft(v=>({...v,representativeTags:draftSelectedTags.filter(t=>t!==tag)}));
    else if(draftSelectedTags.length<3)setDraft(v=>({...v,representativeTags:[...draftSelectedTags,tag]}));
    else setToast('대표 키워드는 최대 3개까지 선택할 수 있어요.');
  }
  const draftAccommodation = catalog.find(p => p.id === draft.accommodationId && p.category === '숙소' && !draft.stopIds.includes(p.id));
  const draftRoutePlaces = useMemo(() => courseRoute(draftStops.filter(p=>courseDay(draft,p.id)===editorDay), draftAccommodation), [draftStops, draftAccommodation,editorDay,draft.stopDays,draft.schedule]);
  const draftLodgings = useMemo(() => lodgingCandidates(catalog, draftStops, draftStops[0]?.region), [catalog, draftStops]);
  const [replacementUndo, setReplacementUndo] = useState(null);
  const draftRecommendations = useMemo(() => new Map(screen === 'create' ? draftStops.map(place => [place.id, recommendReplacements({ scheduleEntry: draft.schedule?.[draft.stopIds.indexOf(place.id)], candidates: realPlaceCandidates(catalog), stops: draftStops, region: place.region, replaceId: place.id, accommodation: draftAccommodation, interests: profile.interests, taste,courseContext:draft,traitContext }).recommendations]) : []), [screen, catalog, draftStops, draftAccommodation, profile.interests, taste, draft.schedule, draft.stopIds, draft.traitFacts,draft.transport,draft.durationDays,draft.stopDays,traitContext]);
  const generationLodgings = catalog.filter(p => p.category === '숙소' && (p.region === generationRegion || p.location.includes(`${generationRegion}시`))).map(place => ({place, distance:null}));
  const generationAccommodation = catalog.find(p => p.id === generationAccommodationId && p.category === '숙소' && (p.region === generationRegion || p.location.includes(`${generationRegion}시`)));
  function lodgingVisit(label, returning = false) {
    if (!detailAccommodation || hasExternalPlaces(detail)) return null;
    const travel = returning ? detailTravelInfo({previous:detailStops.at(-1),place:detailAccommodation,transport:detail.transport,route:detail.transport==='자동차'?drivingRoute:detail.transport==='대중교통'?transitRoute:null,status:detail.transport==='자동차'?drivingStatus:transitStatus}) : '';
    return <button type="button" className={`timeline-stop ${selectedId === detailAccommodation.id ? 'active' : ''}`} aria-label={`${label} · ${detailAccommodation.name}`} onClick={() => openPlaceDetails(detailAccommodation.id)}><span className="step-number">숙</span><Photo place={detailAccommodation}/><span><strong>{label} · {detailAccommodation.name}</strong>{travel && <small className="detail-stop-travel">{travel}</small>}<small>{returning ? '저녁 일정 이후 복귀 · 숙박시간은 코스 소요시간에서 제외' : '투숙 중인 날 기준 · 첫날 체크인은 별도 확인'}</small></span></button>;
  }
  const activeDrivingIds = useMemo(() => screen === 'create' && !detail ? draftRoutePlaces.map(p => p.id) : routeIds, [screen, detail, draftRoutePlaces, routeIds]);
  const activeDrivingTransport = (detail?.editorialVisits || (screen==='create'&&!detail?hasExternalPlaces(draft):hasExternalPlaces(detail))) ? null : screen === 'create' && !detail ? draft.transport : detail?.transport;
  const [routeRetry,setRouteRetry]=useState(0);
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
  }, [activeDrivingTransport, activeDrivingIds, drivingKey, routeRetry]);
  const previewPositions = projectPlacesForPreview(mapPlaces);
  const [transitResponse, setTransitResponse] = useState(null);
  const [transitStatus, setTransitStatus] = useState('idle');
  const [transitError, setTransitError] = useState('');
  const transitKey = activeDrivingTransport === '대중교통' ? activeDrivingIds.join(',') : '';
  const transitRoute = activeDrivingTransport==='대중교통' && transitResponse?.stopIds?.join(',') === transitKey ? transitResponse : null;
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
  }, [transitKey, routeRetry]);
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
    const fit=courseTraitAffinity(courseAssessments.get(c.id)||evaluateCourseTraits(c,catalogById,traitContext),taste);
    return keywords.reduce((sum, tag) => sum + (weights[scoreTags([tag])[0]] || 0), 0) / Math.max(1, keywords.length) + fit*3;
  };
  const heroCourse = useMemo(() => {
    const candidates = [...availableTourCourses, ...availableCommunityCourses, ...classifiedTravelCourses];
    const unseen = candidates.filter(c => !favorites.includes(c.id) && !myCourses.some(owned => owned.id === c.id || (owned.stopIds.length === c.stopIds.length && owned.stopIds.every((id, i) => id === c.stopIds[i]))));
    return [...(unseen.length ? unseen : candidates)].sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id))[0];
  }, [availableTourCourses, availableCommunityCourses, weights, favorites, myCourses, taste, catalog,traitContext,courseAssessments]);
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
  }, [availableTourCourses, availableCommunityCourses, heroCourse, weights, favorites, myCourses, taste, catalog,traitContext,courseAssessments]);
  const courseReason = course => {
    const matching = [...new Set(course.tags)].filter(tag => weights[scoreTags([tag])[0]] > 0).sort((a, b) => (weights[scoreTags([b])[0]] || 0) - (weights[scoreTags([a])[0]] || 0) || a.localeCompare(b, 'ko')).slice(0, 2);
    const assessment=courseAssessments.get(course.id)||evaluateCourseTraits(course,catalogById,traitContext);
    const supported=travelAxes.filter(axis=>assessment.axes[axis.id].score!==null&&Number.isFinite(taste[axis.id])&&Math.abs(assessment.axes[axis.id].score-taste[axis.id])<=20).map(a=>a.name);
    return supported.length ? `코스 전체의 ${supported.slice(0,2).join(' · ')} 성향을 비교했어요` : matching.length ? `${matching.join(' · ')} 취향을 반영한 코스` : '새로운 취향을 발견해 보세요';
  };
  const heroKeywords = [...new Set(heroCourse.tags)].filter(tag => weights[scoreTags([tag])[0]] > 0).sort((a, b) => (weights[scoreTags([b])[0]] || 0) - (weights[scoreTags([a])[0]] || 0) || a.localeCompare(b, 'ko')).slice(0, 2);
  const heroReason = heroKeywords.length ? `관심 키워드와 저장·작성 기록에서 ‘${heroKeywords.join('’, ‘')}’ 취향을 반영했어요.` : '먼저 둘러보기 좋은 코스예요. 마이에서 관심 키워드를 선택하면 추천이 더 잘 맞아요.';


  const keyword = normalizeTag(filters.query.trim().replace(/^#+/, '').trim()).toLowerCase();
  const matches = (p, withQuery = true, withTheme = true) => Boolean(p) && areaMatches(p, filters) && (filters.category === '전체' || p.category === filters.category) && (!withTheme || filters.theme === '전체' || p.tags.includes(filters.theme)) && (!withQuery || (accessibilityKeywordMatch(p,keyword) ?? placeMatchesKeywords(p,keyword)));
  const recommendedSearchCourses = useMemo(() => [...new Map([...(generatedCourse ? [classifyCourse(generatedCourse, catalog, catalogById)] : []), ...availableTourCourses, ...classifiedTravelCourses, ...availableCommunityCourses.filter(c => c.id.startsWith('ai-theme-'))].map(c => [c.id,c])).values()], [editorialCourses,generatedCourse,catalog,availableTourCourses,classifiedTravelCourses,availableCommunityCourses]);
  const recommendedSearchIds = useMemo(() => new Set(recommendedSearchCourses.map(c => c.id)), [recommendedSearchCourses]);
  const searchCourses = useMemo(() => [...new Map([...recommendedSearchCourses,...editorialCourses,...availableMyCourses.filter(c=>c.isPublic===true), ...availableCommunityCourses].map(c => [c.id,c])).values()], [recommendedSearchCourses,editorialCourses,availableMyCourses,availableCommunityCourses]);
  const searchMatches = useMemo(() => new Map(searchCourses.map(c => [c.id,userCourseSearchMatch(c,filters.query,filters.searchTags||[])])), [searchCourses,filters.query,filters.searchTags]);
  const results = useMemo(() => searchCourses.filter(c => c.editorialVisits ? (homeRule.allowed&&userCourseSearchMatch(c,filters.query,filters.searchTags||[]).matched&&areaMatches({region:c.region},filters)&&courseConditionsMatch(c,[],filters)&&filters.category==='전체'&&(filters.hours==='전체'||Number.isFinite(c.hours)&&c.hours<=Number(filters.hours))) : homeRule.allowed && courseConditionsMatch(c, c.stopIds.map(placeOf).filter(Boolean), filters) && (filters.theme === '전체' || c.tags.includes(filters.theme) || c.stopIds.some(id => placeOf(id)?.tags.includes(filters.theme))) && (c.stopIds.some(id => matches(placeOf(id), false, false)) || (!c.stopIds.length&&hasExternalPlaces(c)&&filters.category==='전체'&&areaMatches({region:c.region},filters))) && searchMatches.get(c.id).matched && (filters.people === '전체' || c.maxPeople >= Number(filters.people)) && (filters.transport === '전체' || c.transport === filters.transport) && (filters.hours === '전체' || c.hours <= Number(filters.hours))).sort((a, b) => (keyword ? searchMatches.get(a.id).rank - searchMatches.get(b.id).rank || searchMatches.get(b.id).related - searchMatches.get(a.id).related : 0) || (sort === 'short' ? a.hours - b.hours : sort === 'name' ? a.name.localeCompare(b.name, 'ko') : score(b))), [searchCourses,searchMatches,catalogById,filters,keyword,sort,weights,taste,traitContext,courseAssessments,homeRule]);
  const recommendedSearchResults = useMemo(() => {
    if(!homeRule.allowed)return [];
    if (!keyword) return results.filter(c => recommendedSearchIds.has(c.id)).slice(0,6);
    if(keywordGeneratedCourses.length)return keywordGeneratedCourses;
    const candidates=results.filter(c=>recommendedSearchIds.has(c.id)).map(course=>{
      const stops=(course.stopIds||[]).map(placeOf).filter(Boolean);
      const ids=[...(course.stopIds||[]),...(course.kakaoPlaceRefs||[]).map(ref=>`k:${ref.placeId}`),...(course.googlePlaceRefs||[]).map(ref=>`g:${ref.placeId}`)];
      return {course,anchor:stops.find(place=>homeAnchorMatch(place,homeRule))?.id||course.imagePlaceId||ids[0]||course.id,ids,region:course.region||'',kind:course.source||course.generationMethod||'existing',score:score(course)};
    });
    return selectDiverseCourses(candidates,{limit:6});
  }, [keyword,keywordGeneratedCourses,results,recommendedSearchIds,homeRule]);
  const existingUserSearchResults = useMemo(() => rankUserCourses(results.filter(c=>!recommendedSearchIds.has(c.id)),filters.query,c=>courseTraitAffinity(courseAssessments.get(c.id)||evaluateCourseTraits(c,catalogById,traitContext),taste),c=>(c.editorialVisits?c.editorialVisits.map(v=>catalogById.get(v.place_id)):c.stopIds.map(id=>catalogById.get(id))).filter(Boolean),filters.searchTags||[]),[results,recommendedSearchIds,filters.query,filters.searchTags,courseAssessments,catalogById,traitContext,taste]);
  const personaPayload=useMemo(()=>({catalog,filters,existing:existingUserSearchResults,ai:keywordGeneratedCourses,live:homeLive.key===homeLookupKey?homeLive.places:[]}),[catalog,filters,existingUserSearchResults,keywordGeneratedCourses,homeLive.places,homeLive.key,homeLookupKey]);
  const personaGeneration=useCourseGeneration('persona',personaPayload,homeRule.allowed&&!homeRule.empty&&!homeSearchLoading&&!aiGeneration.busy&&!aiGeneration.error&&existingUserSearchResults.length<30);
  // Real/existing courses always keep the first positions; examples only fill vacancies.
  const userSearchResults=useMemo(()=>appendUserExamples(existingUserSearchResults,rankUserCourses(personaGeneration.courses,filters.query,c=>courseTraitAffinity(evaluateCourseTraits(c,catalogById,traitContext),taste),c=>c.stopIds.map(id=>catalogById.get(id)).filter(Boolean),filters.searchTags||[])),[existingUserSearchResults,personaGeneration.courses,filters.query,filters.searchTags,catalogById,traitContext,taste]);
  const visibleAddressLocations=useMemo(()=>{
    const ids=new Set(detailId?(baseDetail?.stopIds||[]):screen==='create'?draft.stopIds:screen==='search'?[...recommendedSearchResults,...userSearchResults.slice(0,30)].flatMap(c=>c.stopIds||[]):[]);
    return [...ids].map(id=>catalogById.get(id)?.location).filter(Boolean);
  },[detailId,baseDetail,screen,draft.stopIds,recommendedSearchResults,userSearchResults,catalogById]);
  useRegionalAddresses(visibleAddressLocations,setJibunAddresses);
  const searchCardImages = useMemo(() => courseListImages([...recommendedSearchResults.slice(0,6),...userSearchResults],catalog,filters.query),[recommendedSearchResults,userSearchResults,catalog,filters.query]);

  const [visibleUserCourseCount,setVisibleUserCourseCount]=useState(10);
  const userCourseSection=useRef(null),userCourseSentinel=useRef(null);
  useEffect(()=>{setVisibleUserCourseCount(10);},[filters,sort]);
  useEffect(()=>{
    if(screen!=='search'||searchResultTab!=='users'||visibleUserCourseCount>=userSearchResults.length)return;
    const target=userCourseSentinel.current;if(!target)return;
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();setVisibleUserCourseCount(count=>Math.min(count+10,userSearchResults.length));}
    },{root:target.closest('.main-content'),threshold:0});
    observer.observe(target);return()=>observer.disconnect();
  },[screen,searchResultTab,visibleUserCourseCount,userSearchResults.length]);

  const filteredPlaces = useMemo(() => places.filter(p => matches(p) && companionsMatch(p, filters) && ((!needsCourseForPlace(filters) && [filters.people, filters.transport, filters.hours].every(value => value === '전체')) || results.some(c => c.stopIds.includes(p.id)))), [places, filters, all]);
  useEffect(() => {
    if (screen === 'search' && !detailId && selectedId !== null && !filteredPlaces.some(p => p.id === selectedId)) setSelectedId(null);
  }, [filteredPlaces, selectedId, screen, detailId]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3000); return () => clearTimeout(timer); }, [toast]);
  function openCourseLibrary(tab) { setSavedTab(tab); navigate('saved'); }
  function requireMember() { if (!member?.account.isGuest) return true; member.onLogin(); return false; }
  async function logout() { try { await member.onLogout(); } catch(error) { setToast(error.message); } }
  function currentPage() { return {screen,detailId,savedTab,myLanding,stop}; }
  function rememberPage() { pageHistory.current.push(currentPage());if(pageHistory.current.length>50)pageHistory.current.shift(); }
  function resetPageScroll() { document.querySelector('.main-content')?.scrollTo(0,0); window.scrollTo(0,0); }
  function restorePage(page) {
    if(!page)return;
    if(page.screen!=='zip'&&location.hash.startsWith('#zip'))history.replaceState(null,'',location.pathname+location.search);
    setScreen(page.screen);if(page.screen==='home')showHomePopupForHomeEntry();setDetail(page.detailId||null);setSavedTab(page.savedTab||'all');setMyLanding(page.myLanding||'home');setStop(page.stop||0);setModal(null);setFormError('');resetPageScroll();
  }
  function goBack(fallback='home') {
    const previous=pageHistory.current.pop();
    if(previous){restorePage(previous);return;}
    setDetail(null);setModal(null);setScreen(fallback);if(fallback==='home')showHomePopupForHomeEntry();resetPageScroll();
  }
  function navigate(next) { if(next!==screen||detailId)rememberPage();if(next==='home')showHomePopupForHomeEntry();if(next!=='create')setEditorialEditing(null); if(next!=='create'&&missionDraft!==null)setMissionDraft(null); if(next!=='zip'&&location.hash.startsWith('#zip'))history.replaceState(null,'',location.pathname+location.search);setScreen(next); setDetail(null); setModal(null); setFormError(''); resetPageScroll(); }
  function explore(patch = {}) { const next = { ...emptyFilters, ...patch }; setFilters(next); setSelectedFilters(next); navigate('search'); }
  function openTravelFilters(section) {
    const area = placeArea({ region: selectedFilters.region });
    setFilterDraft({ ...selectedFilters, region: selectedFilters.region === '전체' ? '전체' : area.region, city: selectedFilters.city !== '전체' ? selectedFilters.city : area.city || '전체' });
    setFilterFocus(section); setModal('travel-filters');
  }
  function applyTravelFilters() { setSelectedFilters(current => applyFilterSection(current, filterDraft, filterFocus)); setFilters(current => applyFilterSection(current, filterDraft, filterFocus)); setModal(null); }
  function resetTravelFilterDraft() { setFilterDraft(current => resetFilterSection(current, emptyFilters, filterFocus)); }
  async function submitCourseSearch(rawQuery, keepOriginal = false,groupContext=null) {
    const raw=String(rawQuery||'').trim();
    const validation=validateSearchQuery(raw);
    if(!validation.valid){if(validation.reason!=='empty')setToast(validation.message);return false;}
    try{await loadHomeSearchData({regions:[raw,selectedFilters.region,groupContext?.region]});}catch{setToast('검색 자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');return false;}
    searchInterpretationController.current?.abort();
    setSearchInterpretationLoading(false);
    const sequence=++searchInterpretationSequence.current;
    const controller=new AbortController();searchInterpretationController.current=controller;
    const baseFilters=groupContext?{...emptyFilters,region:groupContext.region||'전체'}:selectedFilters;
    const local=interpretHomeSearch(raw,baseFilters);
    const natural=!allowedHomeQuery(raw)&&!keepOriginal;
    const nextBase={...baseFilters};
    const submissionQuery=natural?raw:local.allowed&&!local.empty?local.query:raw;
    let nextSearchIntentTags=[];
    const gateKey=searchRequestKey(submissionQuery,nextBase);
    const admission=homeSubmitGate.current.accept(gateKey);
    if(!admission.accepted){setToast(admission.reason==='pending'?'같은 검색을 진행 중입니다.':'같은 검색은 5초 후 다시 시도해 주세요.');return false;}
    let query=submissionQuery,next={...nextBase,query,period:explicitHomeSearchPeriod(raw)||nextBase.period};
    if(natural){
      setSearchInterpretationLoading(true);
      try{
        const parsed=await interpretNaturalSearch(raw,{filters:baseFilters,catalog,token:member?.account.isGuest?null:member?.account.access_token,signal:controller.signal,candidateTags:searchTagCandidates(raw)});
        if(sequence!==searchInterpretationSequence.current)return false;
        await loadHomeSearchData({regions:[parsed.region]});
        if(!validateSearchQuery(parsed.query).valid)throw Error('검색 주제를 확인할 수 없어요. 검색어를 조금 더 구체적으로 입력해 주세요.');
        query=parsed.query;
        nextSearchIntentTags=parsed.tags||[];
        next={...baseFilters,query,region:parsed.region&&parsed.region!=='전체'?parsed.region:baseFilters.region,city:parsed.city&&parsed.city!=='전체'?parsed.city:parsed.region&&parsed.region!=='전체'&&parsed.region!==baseFilters.region?'전체':baseFilters.city,period:explicitHomeSearchPeriod(raw)||(parsed.period&&parsed.period!=='전체'?parsed.period:baseFilters.period),transport:parsed.transport&&parsed.transport!=='전체'?parsed.transport:baseFilters.transport,infant:parsed.infant||baseFilters.infant,pet:parsed.pet||baseFilters.pet};
      }catch(error){
        if(sequence!==searchInterpretationSequence.current||controller.signal.aborted){homeSubmitGate.current.finish(gateKey,admission.token);return false;}
        query=raw;nextSearchIntentTags=[];next={...baseFilters,query:raw,period:explicitHomeSearchPeriod(raw)||baseFilters.period};
      }finally{
        if(sequence===searchInterpretationSequence.current)setSearchInterpretationLoading(false);
      }
      homeSubmitGate.current.finish(gateKey,admission.token);
      homeSubmitToken.current=null;
    }else homeSubmitToken.current=admission.token;
    if(sequence!==searchInterpretationSequence.current)return false;
    setGroupKeywordContext(groupContext);setOriginalKeyboardQuery('');setHomeSearchRun(v=>v+1);next.searchTags=nextSearchIntentTags;setFilters(next);setSelectedFilters(next);setSort('recommended');navigate('search');
    return true;
  }
  function patch(key, value) { setSelectedFilters(current => ({ ...current, [key]: value })); }
  function open(c) { if(c.generationMethod==='keyword-purpose-four-traits'||c.generationMethod==='persona-search')setOpenedGeneratedCourse(c);rememberPage();setOpenedCourseImage({courseId:c.id,placeId:displayedCourseImages.current.get(c.id)||searchCardImages.get(c.id)||c.imagePlaceId||c.stopIds[0]}); setDetail(c.id); setStop(0); setSelectedId(c.stopIds[0]); resetPageScroll(); }
  function openJournalForCourse(course){if(!requireMember())return;setPendingJournalCourse(course);}
  function openHomePopupExperience(){closeHomePopup();setMyMissionTag(null);setMyLanding('events');navigate('my');}
  function closeHomePopup(){if(homePopupHideToday){try{localStorage.setItem('coursepick.homeEventHiddenDate.v1',new Date().toLocaleDateString('sv-SE'));}catch{}}setHomePopup(false);}
  function showHomePopupForHomeEntry(){let hiddenDate='';try{hiddenDate=localStorage.getItem('coursepick.homeEventHiddenDate.v1')||'';}catch{}if(hiddenDate!==new Date().toLocaleDateString('sv-SE')){setHomePopupHideToday(false);setHomePopup(true);}else setHomePopup(false);}
  useEffect(()=>{if(screen!=='home')return;let hiddenDate='';try{hiddenDate=localStorage.getItem('coursepick.homeEventHiddenDate.v1')||'';}catch{}if(hiddenDate!==new Date().toLocaleDateString('sv-SE')){setHomePopupHideToday(false);setHomePopup(true);}else setHomePopup(false);},[screen]);
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
    if(editorialCopies.some(c=>c.id===id)){setEditorialCopies(values=>values.filter(c=>c.id!==id));setLikedCourseIds(values=>values.filter(value=>value!==id));}
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
    if(original.editorialVisits){setFavorites(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);setToast('나만의 코스에 담았어요.');return;}
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
      params.set('known_tags',traitContext.knownTags.join(',').slice(0,2000));params.set('known_categories',traitContext.knownCategories.join(',').slice(0,500));
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
  function courseCard(c, match = null, searchType = null) { const imageId = searchCardImages.get(c.id) || c.imagePlaceId || c.stopIds[0]; return <CourseVisualCard course={c} key={c.id} showTitle={searchType==='users'} name={c.name} tags={searchType==='users'?courseSearchCardTags(c,filters.query,filters.searchTags||[]):c.representativeTags?.length?c.representativeTags:c.tags} photo={<BannerPhoto course={c} catalog={catalog} preferredId={imageId} query={filters.query} onImageSelected={rememberCourseImage}/>} meta={<CourseCardMeta course={c} Icon={Icon}/>} onOpen={()=>open(c)}/>; }

  function recommendationCard(p) { return <article className="course-card" key={p.id}><div className="course-cover"><button type="button" className="image-open" aria-label={`${p.name} 상세보기`} onClick={() => { selectPlace(p.id); setModal({ type: 'place', id: p.id }); }}><Photo place={p}/></button><span className="photo-chip">{p.region}</span><Save name={p.name} saved={savedPlaces.includes(p.id)} onClick={() => togglePlace(p.id)}/></div><div className="course-copy"><p className="overline">{p.category}</p><button type="button" className="title-button" onClick={() => { selectPlace(p.id); setModal({ type: 'place', id: p.id }); }}><h3>{p.name}</h3></button><div className="tags">{selectPlaceTags(p.tags,filters.query).map(tag=><span key={tag}>#{tag}</span>)}</div><div className="course-bottom"><span>{p.location}</span></div></div></article>; }
  function replaceRecommendedPlace(p, oldId) {
    if (!draftRecommendations.get(oldId)?.some(item => item.place.id === p.id)) return false;
    const replacement = replaceDraftPlace(draft, oldId, p);
    const next=replacement===draft?draft:{...replacement,itineraryOrder:draft.itineraryOrder?.map(key=>key==='n:'+oldId?'n:'+p.id:key),durationDays:courseDayCount(draft),stopDays:Object.fromEntries(replacement.stopIds.map(id=>[id,id===p.id?courseDay(draft,oldId):courseDay(draft,id)]))};
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
  function addDraftKakao(place){
    if((draft.kakaoPlaceRefs||[]).some(ref=>ref.placeId===place.id)){setToast('이미 추가한 장소입니다.');return;}
    if((draft.kakaoPlaceRefs?.length||0)>=20){setToast('카카오 장소는 20곳까지 추가할 수 있습니다.');return;}
    setDraft(v=>{const refs=addKakaoRef(v.kakaoPlaceRefs||[],place,editorDay);if(refs===v.kakaoPlaceRefs)return v;const order=courseEntries(v).map(e=>e.key).filter(key=>key!=='k:'+place.id);const after=pickerAfterId!=='end'?order.indexOf('n:'+pickerAfterId):-1;const last=courseEntries(v,editorDay).at(-1)?.key;const insert=after>=0?after+1:last?order.indexOf(last)+1:order.length;order.splice(insert,0,'k:'+place.id);return {...v,kakaoPlaceRefs:refs,itineraryOrder:order,schedule:undefined};});
    setKakaoKeywordRows(rows=>[...rows.filter(row=>row.id!==place.id),place]);setToast('카카오 장소를 코스에 추가했어요.');
  }
  function addDraftGoogle(id){setDraft(v=>({...v,googlePlaceRefs:addGoogleRef(v.googlePlaceRefs||[],id,editorDay)}));setToast('Google 장소를 코스에 추가했어요.');}
  function addDraftPlace(p, afterId = pickerAfterId) {
    if (draft.stopIds.includes(p.id) || draft.accommodationId === p.id) { setToast('이미 추가한 장소입니다.'); return; }
    setDraft(current => current.stopIds.includes(p.id) ? current : ({ ...current, stopIds: insertPlace(current.stopIds, p.id, afterId),stopDays:{...explicitStopDays(current),[p.id]:editorDay}, schedule: undefined }));
    setSelectedId(p.id);
    if ((modal === 'places' || modal?.returnTo === 'places') && afterId !== 'end') setPickerAfterId(p.id);
    setToast(`${p.name}을 추가했어요.`);
  }
  function placeRow(p, add = false, recommendation = null, onPhoto) { return <article className="place-result" key={p.id}>{add ? <button type="button" className="picker-photo-button" aria-label={`${p.name} 상세보기`} onClick={() => { onPhoto?.(p.id); selectPlace(p.id); setModal({type: 'place', id:p.id, returnTo: 'places'}); }}><Photo place={p}/></button> : <Photo place={p}/>}<div><div className="picker-place-heading"><p className="overline">{p.region} · {p.category}</p>{add && <button type="button" className="pill secondary picker-add-place" disabled={draft.stopIds.includes(p.id) || draft.accommodationId===p.id} aria-label={`${p.name} 추가`} onClick={() => addDraftPlace(p)}>+ 장소 추가</button>}</div><h3>{p.name}</h3>{!add && <PlaceDescription key={p.id} text={p.description}/>}<div className="tags">{selectPlaceTags(p.tags,add?picker:filters.query).map(tag => <span key={tag}>#{tag}</span>)}</div>{add && recommendation?.insertionFromName && <small className="picker-place-distance">{recommendation.insertionFromName}에서 {distanceLabel(recommendation.insertionDistance)} · 직선거리{recommendation.nextName && <><br/>{recommendation.nextName}까지 {distanceLabel(recommendation.nextDistance)}</>}</small>}</div>{!add && <Save name={p.name} saved={savedPlaces.includes(p.id)} onClick={() => togglePlace(p.id)}/>}</article>; }
  function updateStopDetails(key,patch){setDraft(v=>({...v,stopDetails:{...(v.stopDetails||{}),[key]:{...v.stopDetails?.[key],...patch}}}));}
  function reorder(from, to) { if (from < 0 || from >= draft.stopIds.length || from === to || to < 0 || to >= draft.stopIds.length) return; const order = [...draft.stopIds]; order.splice(to, 0, ...order.splice(from, 1)); setDraft(current => ({ ...current, stopIds: order,itineraryOrder:undefined,durationDays:courseDayCount(current),stopDays:explicitStopDays(current), schedule: undefined })); }
  function complete(e) {
    e.preventDefault();
    if (!draft.name.trim()) { setFormError('코스 제목을 입력해 주세요.'); document.getElementById('course-title').focus(); return; }
    if (draft.name.length > 30) { setFormError('코스 제목은 30자 이내로 입력해 주세요.'); document.getElementById('course-title').focus(); return; }
    if (coursePlaceCount(draft) < 2) { setFormError('여행 장소를 2곳 이상 추가해 주세요.'); return; }
    if(draft.stopIds.some(id=>isFictionalPlace({id}))){setFormError('가상 시연 장소는 코스에 저장할 수 없습니다. 해당 장소를 삭제한 뒤 실제 장소를 추가해 주세요.');return;}
    const stops = draft.stopIds.map(placeOf);
    if (stops.some(p => !p)) { setFormError('일부 장소를 아직 불러오지 못했습니다. 장소 조회 후 다시 시도해 주세요.'); return; }
    if (draft.accommodationId && !draftAccommodation) { setFormError('연결한 숙소를 확인하거나 숙소 연결을 해제해 주세요.'); return; }
    const locations = [...new Set(stops.map(p => p.region))];
    const course = { ...draft, representativeTags: draftSelectedTags, isPublic: myCourses.find(c=>c.id===draft.id)?.isPublic ?? true, id: draft.id || `custom-${crypto.randomUUID()}`, name: draft.name.trim(), description: draft.description.trim() || '내가 발견한 장소로 만든 여행 코스.', region: locations.length === 1 ? locations[0] : locations.length ? '여러 지역' : '지역 미정', imagePlaceId: draft.stopIds.includes(draft.imagePlaceId) ? draft.imagePlaceId : stops.find(p=>p.imageUrl && !p.imageUrl.startsWith('data:image/svg'))?.id || stops[0]?.id || null, tags: [...new Set(stops.flatMap(p => p.tags))], author: profile.name, theme: '나의 여행 시나리오', maxPeople: 6, isSample: true };
    const candidates=[...new Set([...stops,...draftGoogleKeywords,...kakaoKeywordRows.filter(row=>(draft.kakaoPlaceRefs||[]).some(ref=>ref.placeId===row.id))].flatMap(p=>p.tags||[]))];
    setSaveTagCandidates(candidates);setFormError(''); setPendingSaveCourse({...course,representativeTags:selectedCourseTags(draft.representativeTags,candidates)}); setModal('save-choice');
  }
  async function saveChosenCourse(isPublic) { if (!requireMember() || courseSaveLock.current) return;
    if (!pendingSaveCourse) return;
    const course = { ...pendingSaveCourse, author:profile.name,isPublic: isPublic };
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
      catch { setToast('코스는 저장됐지만 내 여행기 연결을 저장하지 못했습니다.'); }
      
    }
    setCompletedCourse(course); setPendingSaveCourse(null); setModal(null); setDraft(emptyDraft); navigate('success');
  }
  function toggleLikedCourse(id) { if (!requireMember()) return;
    if (!id || !likeableCourses.some(c=>c.id===id)) {setToast('코스를 먼저 저장한 뒤 좋아요를 선택해 주세요.');return;}
    const selected=likedCourseIds.includes(id);
    const next=selected?likedCourseIds.filter(value=>value!==id):[...new Set([...likedCourseIds,id])];
    try{}
    catch{setToast('좋아요 상태를 저장하지 못했습니다. 저장 공간을 확인해 주세요.');return;}
    
    setLikedCourseIds(next);setToast(selected?'내 여행기에서 제외했어요.':'내 여행기에 담았어요.');
  }
  async function toggleOwnCourseVisibility(id){
    if(courseSaveLock.current||!requireMember())return;
    const own=myCourses.find(c=>c.id===id);if(!own)return;
    const isPublic=own.isPublic===false;
    courseSaveLock.current=true;setCourseSaving(true);
    try{await commitMyCourses(myCourses.map(c=>c.id===id?{...c,isPublic}:c));setDraft(current=>current.id===id?{...current,isPublic}:current);setToast(isPublic?'모두 공개로 전환했어요.':'나만 보기로 전환했어요.');}
    catch(error){setToast(error.message||'공개 상태를 저장하지 못했습니다.');}
    finally{courseSaveLock.current=false;setCourseSaving(false);}
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
    setEditorialEditing(null);setMissionDraft(null);
    setEditorDay(1);
    setEditorReturnTab(null);
    setDraft({ ...emptyDraft, stopIds: [] }); setSelectedId(null); setReplacementUndo(null);
    setPicker(''); setPickerAfterId('end'); setPickerOnlyRecommended(false); setPickerRotation(null); setPickerListPage({context:null,count:3});
    setDrivingRoute(null); setDrivingError(''); setDrivingStatus('idle'); setCompletedCourse(null); navigate('create');
  }
  function startKeywordMissionCourse(tag){
    setMissionReturnTag(tag);setMissionDraft({...emptyDraft,stopIds:[],representativeTags:[tag]});
    setEditorDay(1);setEditorReturnTab(null);setSelectedId(null);setReplacementUndo(null);
    setPicker('');setPickerAfterId('end');setPickerOnlyRecommended(false);setPickerRotation(null);setPickerListPage({context:null,count:3});
    setDrivingRoute(null);setDrivingError('');setDrivingStatus('idle');setCompletedCourse(null);navigate('create');
    setToast(`#${tag} 태그를 포함해 공개 저장해 주세요.`);
  }
  function requestNewCourse() {
    if(screen==='search'){beginNewCourse();return;}
    const hasContent = Boolean(draft.id || draft.name.trim() || draft.description.trim() || coursePlaceCount(draft) || draft.accommodationId || draft.schedule?.length || draft.hours !== emptyDraft.hours || draft.transport !== emptyDraft.transport);
    if(hasContent){if(screen!=='create'){navigate('create');return;}setModal('new-course');}else beginNewCourse();
  }
  function edit(c) { if(c.editorialVisits){if(requireMember()){navigate('create');setEditorialEditing(c);}return;} setEditorDay(1); setEditorReturnTab(screen==='saved'?savedTab:null); setDraft({ stopDetails:c.stopDetails||{},itineraryOrder:c.itineraryOrder, kakaoPlaceRefs:c.kakaoPlaceRefs||[], googlePlaceRefs:c.googlePlaceRefs||[], traitFacts:c.traitFacts||{}, imagePlaceId: openedCourseImage?.courseId===c.id ? openedCourseImage.placeId : c.imagePlaceId || c.stopIds[0], representativeTags: c.representativeTags || [], isExistingCourse: true, sourceCourseId: c.id, originalCourseId: c.originalCourseId || c.id, originalAuthor: c.originalAuthor || c.author, id: myCourses.some(own=>own.id===c.id) ? c.id : null, name: myCourses.some(own=>own.id===c.id) ? c.name : `${c.name} · 나의 코스`, description: c.description, stopIds: [...c.stopIds], hours: c.hours, transport: c.transport, durationDays: courseDayCount(c), stopDays:explicitStopDays(c), accommodationId: c.id === detailId ? detailAccommodation?.id ?? null : c.accommodationId ?? null, schedule: c.schedule, source: c.source, straightLineKm: c.straightLineKm }); navigate('create'); }
  const popularity = useMemo(() => popularCourses([...availableTourCourses, ...availableCommunityCourses, ...classifiedTravelCourses], favorites), [availableTourCourses, availableCommunityCourses, classifiedTravelCourses, favorites]);
  const homeCardCourses = useMemo(() => homeTab === 'recommended' ? [heroCourse,...suggestedCourses].slice(0,10) : popularity.slice(0,10),[homeTab,heroCourse,suggestedCourses,popularity]);
  const homeCardImages = useMemo(() => courseListImages(homeCardCourses,catalog),[homeCardCourses,catalog]);
  const title = { search: '코스 검색', create: '코스 만들기', saved: '저장한 여행', my: '내 여행 프로필' }[screen];
  const pickerKeywords = [...new Set(searchCandidates(picker).map(normalizeTag))];
  const matchesPicker = (p, keyword) => accessibilityKeywordMatch(p,keyword) ?? placeMatchesKeywords(p,keyword);
  const pickerRanking = recommendAdditions({ candidates: realPlaceCandidates(catalog).filter(p => !picker.trim() || matchesPicker(p, picker)), stops: draftStops, region: pickerRegion, afterId: pickerAfterId, accommodation: draftAccommodation, interests: profile.interests, taste,courseContext:draft,traitContext });
  const pickerFlowKey = JSON.stringify([draft.id,draft.stopIds]);
  const inferredPickerFlow = itineraryFlow(draftStops,pickerFlowOverride?.key===pickerFlowKey ? pickerFlowOverride.stage : null);
  const freePickerMode = Boolean(draft.isExistingCourse || draft.freePlaceAdditions);
  const pickerFlow = freePickerMode ? {stage:'free',label:'원하는 장소 추가',actions:[],category:null} : inferredPickerFlow;
  const flowRanking = recommendAdditions({ candidates: freePickerMode ? realPlaceCandidates(catalog).filter(p=>!picker.trim() || matchesPicker(p, picker)) : realPlaceCandidates(catalog).filter(p=>p.category===pickerFlow.category), stops:draftStops,region:pickerRegion,afterId:pickerAfterId,accommodation:draftAccommodation,interests:profile.interests,taste,courseContext:draft,traitContext });
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
  useEffect(()=>setDetailDay(1),[detail?.id]);
  const editorDayIds=courseDayIds(draft,Math.min(editorDay,courseDayCount(draft)));
  useLayoutEffect(() => { document.querySelector('.main-content')?.scrollTo(0, 0); window.scrollTo(0, 0); }, [screen, detail?.id]);
  async function saveEditorialCopy(changed){
    if(!requireMember())throw Error('로그인 후 저장할 수 있어요.');
    const own=editorialCopies.some(c=>c.id===changed.id);
    const visits=changed.editorialVisits.map(v=>({...v}));
    if(!visits.some(v=>v.cover_image&&v.image_url)){const first=visits.find(v=>v.image_url);if(first)first.cover_image=true;}
    const copy={...changed,id:own?changed.id:'editorial-copy-'+crypto.randomUUID(),originalCourseId:changed.originalCourseId||changed.id,editorialVisits:visits,stopIds:[...new Set(visits.map(v=>v.place_id).filter(Boolean))],imagePlaceId:null,source:'editorial-copy',isPublic:changed.isPublic===true,author:profile.name,editorialNotices:changed.editorialNotices||[]};
    await commitEditorialCopies([copy,...editorialCopies.filter(c=>c.id!==copy.id)]);
    if(likedCourseIds.includes(changed.id)&&changed.id!==copy.id)setLikedCourseIds(values=>[...new Set(values.map(id=>id===changed.id?copy.id:id))]);
    setEditorialEditing(null);navigate('saved');setSavedTab(copy.isPublic?'authored':'bookmarked');setToast(copy.isPublic?'모두 공개로 저장했어요.':'나만 보기로 저장했어요.');
  }
  const loadingKey=JSON.stringify([screen,detail?.id,typeof modal==='string'?modal:modal?.type,modal?.place?.id,modal?.id,modal?.visit?.visit_id,editorialRetry,placeRetry,screen==='search'?homeLookupKey:'']);
  const loadingBusy=screen==='home'?!editorialCourses.length&&!editorialError||searchInterpretationLoading:screen==='search'?(homeSearchLoading||aiGeneration.busy||personaGeneration.busy||searchInterpretationLoading):screen==='create'?placeStatus==='loading':false;
  const loadingMessage=searchInterpretationLoading?'검색어를 해석하고 있어요':screen==='search'?(aiGeneration.busy||personaGeneration.busy?'여행 코스를 만들고 있어요':'여행 장소를 찾고 있어요'):screen==='home'?'코스를 불러오고 있어요':screen==='create'?'장소를 불러오고 있어요':'페이지를 불러오고 있어요';
  const pageLoading=usePageLoading(loadingKey,loadingBusy);
  if (onboardingRequired || screen === 'welcome') return <div className="app-shell view-welcome"><WelcomeFlow initialPhase="test" onComplete={async answers=>{const baseline=courseTraitsFromAnswers(answers);if(!baseline)return false;if(member.account.isGuest)setTravelTaste(baseline);else {await commitTravelTaste(baseline);if(onboardingRequired){await member.save('coursepick.testTaste.v1',{completed:true,version:1});onOnboardingComplete?.();}}if(!onboardingRequired)goBack(testReturnScreen);return true;}} onHome={()=>goBack()} onNickname={name=>setProfile(value=>({...value,name}))}/></div>;
  return <div className={`app-shell view-${detail ? 'detail' : screen}${detail&&screen==='search'?' search-course-detail':''}${screen==='zip'&&zipDeep?' zip-deep':''}${homePopup&&screen==='home'&&!detail?' home-popup-open':''}`}>{detail ? <div className="detail-fixed-header"><DeviceStatusBar/><div className="detail-top"><button type="button" className="icon-button" aria-label="이전 페이지" onClick={() => goBack(screen)}><Icon name="back"/></button><strong>코스 상세</strong><div className="inline-actions">{(screen==='saved'||[...myCourses,...editorialCopies].some(course=>course.id===detail.id))&&<button type="button" className="detail-write-journal" aria-label="여행기 작성" onClick={()=>openJournalForCourse(detail)}><span>여행기 작성</span><svg width="22" height="24" viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="M4 3h7l11 12-9 10L2 13V5Z" fill="currentColor"/><circle cx="6" cy="7" r="1.6" fill="#8F5CFB"/><path d="m13 10 1.3 3 3.2.3-2.4 2.1.7 3.2-2.8-1.7-2.8 1.7.7-3.2-2.4-2.1 3.2-.3Z" fill="#8F5CFB"/><path d="M5 5C0 3-1 0 2 1l4 4" stroke="currentColor" strokeWidth="1.3"/></svg></button>}{screen === 'saved' && savedTab === 'bookmarked' && <button type="button" className={`editor-like-button ${likedCourseIds.includes(detail.id) ? 'is-liked' : ''}`} aria-label={likedCourseIds.includes(detail.id) ? '내 여행기에서 제외' : '내 여행기에 추가'} aria-pressed={likedCourseIds.includes(detail.id)} onClick={() => toggleLikedCourse(detail.id)}>{likedCourseIds.includes(detail.id) ? <span className="filled-heart-plus" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 19.5 4.8 12.9C1.4 9.8 2.2 4.6 6.5 4.6c2.3 0 4 1.5 5.5 3.1 1.5-1.6 3.2-3.1 5.5-3.1 3.3 0 4.6 2.8 3.7 5.4h-3.1v4.1h-3.9v3.4Z"/></svg><span className="heart-plus-outline"/></span> : <img src="/images/heart-plus-original.png" alt=""/>}</button>}<Save name={detail.name} saved={courseLibraryLists([...myCourses,...editorialCopies],favorites,all).privateCourses.some(c=>c.id===detail.id)} onClick={() => courseLibraryLists([...myCourses,...editorialCopies],favorites,all).privateCourses.some(c=>c.id===detail.id) ? removePrivateCourse(detail.id) : toggleCourse(detail.id)}/></div></div></div> : <DeviceStatusBar/>}<div className="device-home-indicator" aria-hidden="true"/><header className="app-header">{screen==='home'&&!detail&&<><span className="home-plan-menu" aria-hidden="true"><img src="/images/home-plan-menu.svg" alt=""/></span><span className="home-plan-bell" aria-hidden="true"><img src="/images/home-plan-bell.svg" alt=""/></span></>}<button type="button" className="brand" aria-label="coursepick 홈" onClick={() => navigate('home')}><img className="brand-logo" src={screen==='home'?'/images/home-plan-logo.png':'/images/coursepick-logo.png'} alt="코스픽"/></button>{screen === 'home'&&!detail&&<TravelKeywordSearch iconOnly alignTop busy={homeSearchLoading} keyboardDictionary={searchKeyboardDictionary} keywords={searchSuggestionKeywords} query={filters.query} onSearch={submitCourseSearch} home/>}{screen==='search'&&!detail&&<button type="button" className="search-create-course" aria-label="코스 만들기" onClick={requestNewCourse}><img src="/images/create-course-button.svg" alt="" width="126" height="32"/></button>}{screen !== 'home' && <button type="button" className="icon-button" aria-label="내 프로필" onClick={() => navigate('my')}><Icon name="user"/></button>}</header>
    {(error1 || error2 || error3 || error4 || error5 || accommodationStorageError || editorialCopiesError) && <p role="alert" className="storage-warning">브라우저 저장 공간을 사용할 수 없어 변경 내용이 새로고침 후 유지되지 않을 수 있습니다.</p>}
    <LoadingPage active={pageLoading} message={loadingMessage}/>
    <main className={`main-content screen-${screen} ${screen === 'search' && results.length === 0 ? 'search-no-results' : ''}`}>
      {screen==='zip'&&<React.Suspense fallback={<LoadingPage/>}><ZipFeature onWriteJournal={async course=>{if(new Set([...(course.stopIds||[]),...(course.kakaoPlaceRefs||[]).map(r=>r.placeId)]).size<3){openJournalForCourse(course);return;}try{await commitMyCourses([...myCourses.filter(c=>c.id!==course.id),course]);openJournalForCourse(course);}catch(error){setToast(error.message||'최종 일정을 준비하지 못했습니다.');}}} onSaveTaste={commitTravelTaste} savedPlaceIds={savedPlaces} onKeywordSearch={(word,context)=>submitCourseSearch(word,false,context)} rooms={zipRooms} onRoomsChange={setZipRooms} token={member?.account.isGuest?null:member?.account.access_token} onLogin={member?.onLogin} importCourse={zipImport} onImported={()=>setZipImport(null)} member={{id:member?.account.userId||'guest',name:profile.name,photo:profile.photo||'',taste:travelTaste}} places={catalog} courses={all.filter(c=>!hasExternalPlaces(c)&&!c.editorialVisits)} hidden={screen!=='zip'||Boolean(detail)} onExit={()=>goBack()} onOpenCourse={open} onDepthChange={setZipDeep}/></React.Suspense>}
      {detail ? <>

        {screen==='zip'&&!detail.editorialVisits&&<button className="zip-primary zip-import-course" onClick={()=>{setZipImport(detail);setDetail(null);}}>최종 일정 첫날에 불러오기</button>}<div className="detail-layout">{hasExternalPlaces(detail)&&!detail.editorialVisits&&<div id="detail-external-map" className="detail-external-map"/>}{detail.editorialVisits&&<EditorialCourseMap course={detail} catalog={catalog} day={detailDay} onOpenVisit={visit=>setModal({type:'editorial-place',visit})}/>}{!hasExternalPlaces(detail)&&!detail.editorialVisits&&<MapPanel showRoute accommodationId={detailAccommodation?.id} roadPaths={drivingRoute?.paths} place={detailStops[0]||detailAccommodation||catalog[0]} places={routePlaces} selectedId={selectedId} onSelectPlace={selectPlace}><svg className="map-base" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="100" fill="#e8efe7"/><path d="M0 12H28V45H100M0 70H55V100M68 0V30H100" fill="none" stroke="#fff" strokeWidth="6"/><path d="M-10 54Q25 20 53 56T110 42" fill="none" stroke="#c4e2f0" strokeWidth="12"/><polyline points={previewRoute.map(position => `${position.left},${position.top}`).join(' ')} fill="none" stroke="#8458ed" strokeWidth="1" strokeDasharray="2 1"/></svg>{mapPlaces.map((p, index) => { const id = p.id, position = previewPositions[index]; return <button type="button" key={id} className={`photo-pin ${selectedId === id ? 'active' : ''}`} style={{ left: `clamp(48px, ${position.left}%, calc(100% - 48px))`, top: `${position.top}%` }} aria-label={`${p.id === detailAccommodation?.id ? '숙소' : detail.stopIds.indexOf(p.id) + 1}. ${p.name} 지도에서 선택`} aria-pressed={selectedId === id} onClick={() => selectPlace(id)}><span className="pin-number">{p.id === detailAccommodation?.id ? '숙' : detail.stopIds.indexOf(p.id) + 1}</span><Photo place={p}/><span>{p.name}</span></button>; })}<span className="map-note">실제 지리와 다른 샘플 배치 · 길찾기 미제공</span></MapPanel>}<section className="detail-panel"><p className="byline"><img className={detail.author === 'coursepick' ? 'course-author-avatar course-author-logo' : 'course-author-avatar'} src={detail.author === 'coursepick' ? '/images/coursepick-author-logo.png' : '/images/profile-default.svg'} alt={detail.author === 'coursepick' ? '코스픽 로고' : '작성자 기본 이미지'}/>{detail.author !== 'coursepick' && <>by. {detail.author}</>}</p><h1>{detail.name}</h1><div className="tags">{(detail.representativeTags?.length ? detail.representativeTags : detail.tags).slice(0, 3).map(tag => <span key={tag}>#{tag}</span>)}</div><CourseCardMeta course={detail} Icon={Icon} className="detail-course-meta"/>{(detail.editorialVisits||detail.source==='keyword'||detail.generationMethod==='keyword-theme-four-traits')&&<p className="editorial-standard-description">{detail.description}</p>}<hr className="detail-schedule-divider"/>
          <CourseDayTabs course={detail} day={Math.min(detailDay,courseDayCount(detail))} onChange={setDetailDay}/>{detail.editorialVisits?<EditorialTimeline catalog={catalog} course={detail} day={detailDay} onOpenVisit={visit=>setModal({type:'editorial-place',visit})}/>:hasExternalPlaces(detail)?null:<CourseTimeline inlineTime query={filters.query} selectedId={selectedId} before={lodgingVisit('숙소 출발')} after={lodgingVisit('숙소 복귀',true)} entries={detail.stopIds.flatMap((id,index)=>{if(courseDay(detail,id)!==detailDay)return [];const p=placeOf(id);return [{...p,id,timing:(detail.schedule?.[index]||detail.stopDetails?.['n:'+id])?{...detail.schedule?.[index],...detail.stopDetails?.['n:'+id]}:null,note:detail.stopDetails?.['n:'+id]?.note,travel:((index>0&&courseDay(detail,detail.stopIds[index-1])===detailDay)||detailAccommodation)?detailTravelInfo({previous:index>0&&courseDay(detail,detail.stopIds[index-1])===detailDay?placeOf(detail.stopIds[index-1]):detailAccommodation,place:p,transport:detail.transport,route:detail.transport==='자동차'?drivingRoute:detail.transport==='대중교통'?transitRoute:null,status:detail.transport==='자동차'?(drivingRequestKey===drivingKey?drivingStatus:'loading'):transitStatus}):null}];})} onOpen={p=>openPlaceDetails(p.id)} renderPhoto={p=><Photo place={p}/>} renderAfter={p=>selectedCafe?.id===p.id&&<button type="button" className="text-link danger" aria-label={`${p.name} 일정에서 빼기`} onClick={()=>{setCafeVisits(current=>{const next={...current};delete next[detailId];return next;});setStop(1);setSelectedId(baseDetail.stopIds[1]);}}>일정에서 빼기</button>}/>}
          <GoogleCoursePlaces mapTargetId="detail-external-map" kakaoRefs={detail.kakaoPlaceRefs||[]} onOpenKakao={place=>setModal({type:'kakao-place',place})} course={detail} nativeOptions={{renderPhoto:p=><Photo place={p}/>,onOpenPlace:openPlaceDetails}} onOpenGoogle={place=>setModal({type:'google-place',place})} nativeStops={detailStops} transport={detail.transport} refs={detail.googlePlaceRefs||[]} day={detailDay} days={courseDayCount(detail)}/>
          {myCourses.some(course=>course.id===detail.id)&&<button type="button" className="pill secondary wide" onClick={()=>openJournalForCourse(detail)}>여행기 작성 ♡</button>}{<button type="button" className="pill primary wide" onClick={() => edit(detail)}>코스 수정하기 <Icon name="courseEdit" size={17}/></button>}</section></div>
      </> : <>
        {screen !== 'home' && screen !== 'create' && screen !== 'success' && screen !== 'my' && screen !== 'saved' && screen !== 'search' && <div className="page-title"><button type="button" className="icon-button page-back" aria-label="이전 페이지" onClick={() => goBack()}><Icon name="back"/></button><h1>{title}</h1>{screen !== 'search' && <p className="muted">{screen === 'search' ? '키워드 하나에서 시작하는, 취향에 맞는 여행.' : screen === 'create' ? '마음에 드는 장소들을 나만의 순서로 연결해 보세요.' : screen === 'saved' ? '내가 작성한 코스와 다음 여행을 위해 저장한 코스.' : '기록이 쌓일수록 나의 여행 취향이 더 잘 보여요.'}</p>}</div>}
        {screen === 'success' && completedCourse && <CourseSaved Icon={Icon} course={completedCourse} placeOf={placeOf} Photo={Photo} onHome={() => goBack()} onView={() => { navigate('saved'); setSavedTab(completedCourse.isPublic === false ? 'bookmarked' : 'authored'); setDetail(null); document.querySelector('.main-content')?.scrollTo(0,0); }}/> }
        {screen === 'home' && <HomeEditorialReel courses={editorialCourses} onOpen={open} Icon={Icon} error={editorialError} onRetry={()=>setEditorialRetry(v=>v+1)}/>}
        {screen === 'search' && <>
<nav className="search-design-tabs" aria-label="추천 종류">{[['ai','AI 추천'],['users','사용자 추천']].map(([id,label])=><button type="button" key={id} className={searchResultTab===id?'active':''} aria-pressed={searchResultTab===id} onClick={()=>setSearchResultTab(id)}>{label}</button>)}</nav>
<TravelKeywordSearch trackSearches overlayTopOffset={-12} busy={homeSearchLoading&&searchRequestKey(filters.query,selectedFilters)===searchRequestKey(filters.query,filters)} keyboardDictionary={searchKeyboardDictionary} keywords={searchSuggestionKeywords} query={filters.query} onSearch={submitCourseSearch}/>{originalKeyboardQuery && <p className="keyboard-search-note">{filters.query}로 검색한 결과입니다. <button type="button" className="text-link" onClick={()=>submitCourseSearch(originalKeyboardQuery,true)}>원래 입력으로 검색</button></p>}
          <TravelFilterBar hideTraveler hideIcons filters={selectedFilters} onOpen={openTravelFilters} renderIcon={name => <Icon name={name} size={16}/>}/> {(aiGeneration.busy||personaGeneration.busy)&&<p role="status" className="section-description">조건에 맞는 코스를 구성하고 있어요…</p>}{homeSearchLoading&&<p role="status" className="section-description">Kakao에서 장소 후보를 찾고 있어요…</p>}{homeRule.allowed&&!homeRule.empty&&!homeSearchLoading&&homeLive.failures>0&&<p role="status" className="section-description">{homeLive.retryAfterSeconds?`요청이 많아 Kakao 검색을 잠시 쉬고 있어요. ${homeLive.retryAfterSeconds}초 후 다시 검색해 주세요.`:'일부 Kakao 후보를 불러오지 못해 앱에 등록된 장소와 조회된 후보로 추천합니다.'}</p>}{aiGeneration.error&&<p role="alert" className="section-description">{aiGeneration.error}</p>}{userSearchResults.length === 0 && recommendedSearchResults.length === 0 ? (homeSearchLoading||aiGeneration.busy||personaGeneration.busy?null:<section className="search-empty-result" role="status" aria-live="polite"><svg width="58" height="58" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="5" aria-hidden="true"><circle cx="25" cy="25" r="17"/><path d="M38 38L59 59"/></svg><p>검색 결과가 없습니다.</p>{homeRule.allowed&&<small>검색 목적에 맞는 장소 근거를 확인하지 못했습니다. 다른 키워드나 지역으로 검색해 주세요.</small>}</section>) : <>          {(filters.infant || filters.pet) && <p className="section-description">선택한 동반 조건이 확인된 장소가 과반수인 코스입니다. 나머지 장소의 동반 여부는 개별 확인해 주세요.</p>}
          {searchResultTab==='ai'&&!recommendedSearchResults.length&&!aiGeneration.busy&&!homeSearchLoading&&<p className="empty-state">조건에 맞는 AI 추천 코스가 없습니다.</p>}{searchResultTab==='ai' && recommendedSearchResults.length>0 && <SearchAiCarousel courses={recommendedSearchResults.slice(0,6)} catalog={catalog} images={searchCardImages} query={filters.query} relatedQueries={filters.searchTags||[]} Photo={BannerPhoto} Icon={Icon} onOpen={open} onImageSelected={rememberCourseImage}/>}

          <section hidden={searchResultTab!=='users'} ref={userCourseSection} className="search-course-section user-course-section" aria-label="사용자 코스 목록"><div className="section-title"><h2>사용자 코스 <span>({userSearchResults.length}개)</span></h2></div>{userSearchResults.length ? <><div id="search-user-courses" className="course-grid">{userSearchResults.slice(0,visibleUserCourseCount).map(c=>courseCard(c,searchMatches.get(c.id),'users'))}</div>{visibleUserCourseCount<userSearchResults.length&&<div ref={userCourseSentinel} className="user-course-load-sentinel" aria-hidden="true" style={{height:1}}/>}</> : <p className="empty-state compact-empty">조건에 맞는 사용자 코스가 없습니다.</p>}</section>

          </>}
        </>}
        {screen === 'create' && <React.Suspense fallback={<LoadingPage/>}>{(editorialEditing?<EditorialCourseEditor embedded isSaved={editorialCopies.some(c=>c.id===editorialEditing.id)||favorites.includes(editorialEditing.id)} key={editorialEditing.id} catalog={catalog} course={editorialEditing} onWriteJournal={openJournalForCourse} Icon={Icon} onClose={()=>{setEditorialEditing(null);goBack('saved');}} onSave={saveEditorialCopy} onRemovePrivate={id=>removePrivateCourse(id)}/>:<CourseEditor draft={draft} onChange={setDraft} onSubmit={complete} Icon={Icon} error={formError} backLabel={missionDraft!==null?'키워드 미션으로 돌아가기':'이전 페이지로 돌아가기'} onBack={() => { if(missionDraft!==null){setMissionDraft(null);setMyMissionTag(missionReturnTag);setMyLanding('events');goBack('my');return;} goBack(editorReturnTab?'saved':'home'); }} headerAction={draft.isExistingCourse?<button type="button" className="editor-write-journal" aria-label="여행기 작성" onClick={()=>openJournalForCourse(draft)}><img src="/images/write-journal-button.svg" alt="여행기 작성"/></button>:null} map={<div className="editor-map" hidden={hasExternalPlaces(draft)}><MapPanel showRoute accommodationId={draftAccommodation?.id} place={draftStops[0] || draftAccommodation || catalog[0]} places={draftRoutePlaces} roadPaths={drivingRoute?.paths} selectedId={selectedId} onSelectPlace={selectPlace}/>{draftRoutePlaces.length>1 && ['자동차','대중교통'].includes(draft.transport) && <div className="editor-route-summary" role="status">{draft.transport==='자동차' ? (drivingRoute ? `예상 자동차 이동 ${Math.ceil(drivingRoute.durationSeconds/60)}분 · ${(drivingRoute.distanceMeters/1000).toFixed(1)}km · 조회 시점 기준` : drivingStatus==='error' ? '자동차 이동정보를 불러오지 못했습니다.' : '자동차 이동정보 계산 중…') : (transitRoute ? `예상 대중교통 이동 ${Math.ceil(transitRoute.durationSeconds/60)}분${transitRoute.segments.every(s=>Number.isFinite(s.distanceMeters))?` · ${(transitRoute.segments.reduce((n,s)=>n+s.distanceMeters,0)/1000).toFixed(1)}km`:''} · 거리 기반 추정 · 대기시간 제외` : transitStatus==='error' ? '대중교통 이동정보를 불러오지 못했습니다.' : '대중교통 이동정보 계산 중…')}{!(draft.transport==='자동차'?drivingRoute?.paths?.length:false) && <small>지도 점선은 장소 순서의 직선 연결이며 실제 이동 동선이 아닙니다.</small>}{(draft.transport==='자동차'?drivingStatus==='error':transitStatus==='error') && <><small>{draft.transport==='자동차'?drivingError:transitError}</small><button type="button" className="text-link" onClick={()=>setRouteRetry(v=>v+1)}>다시 계산</button></>}</div>}</div>} itineraryActions={<><button type="button" className="editor-transport-button" aria-label={`코스 이동수단: ${draft.transport}`} aria-haspopup="dialog" onClick={()=>setModal('editor-transport')}><Icon name={draft.transport==='도보'?'walk':draft.transport==='대중교통'?'bus':'car'} size={16}/><span>{draft.transport==='도보'?'이동수단 선택':draft.transport}</span><span aria-hidden="true">⌄</span></button><button type="button" className="itinerary-add-button" onClick={() => { setPicker(''); setPickerRegion(courseRegion(draftStops) === '전체' ? filters.region : courseRegion(draftStops)); setPickerAfterId('end'); setPickerOnlyRecommended(false); setModal('places'); }}>+ 장소 추가</button></>} managementActions={draft.id&&myCourses.some(own=>own.id===draft.id)?<section className="editor-course-management"><h2>내 코스 관리</h2><button type="button" disabled={courseSaving} onClick={()=>toggleOwnCourseVisibility(draft.id)}>{myCourses.find(own=>own.id===draft.id)?.isPublic===false?'모두 공개로 전환':'나만 보기로 전환'}</button><button type="button" className="danger" onClick={()=>setModal({type:"delete",id:draft.id})}>코스 삭제</button></section>:null} tagCandidates={draftTagCandidates} selectedTags={draftSelectedTags} onToggleTag={toggleDraftTag}>
          {replacementUndo && draft === replacementUndo.after && <div role="status">장소를 교체했어요. <button type="button" className="text-link" onClick={undoReplacement}>되돌리기</button></div>}
          <CourseDayTabs onRemove={selected=>{const count=courseDayCount(draft);if(count<=1)return;setDraft(value=>removeCourseDay(value,selected));setEditorDay(Math.min(selected,count-1));}} course={draft} day={Math.min(editorDay,courseDayCount(draft))} onChange={setEditorDay} onAdd={day=>{setDraft(v=>({...v,durationDays:day,stopDays:explicitStopDays(v)}));setEditorDay(day);}}/>{!hasExternalPlaces(draft)&&<EditorStops onUpdateDetails={updateStopDetails} query={filters.query} transitStatus={transitStatus} transitRoute={transitRoute} course={draft} Icon={Icon} drivingRoute={drivingRoute} drivingStatus={drivingRequestKey === drivingKey ? drivingStatus : 'loading'} transport={draft.transport} onOpenPlace={openPlaceDetails} ids={editorDayIds} places={catalog} schedule={draft.schedule?editorDayIds.map(id=>draft.schedule[draft.stopIds.indexOf(id)]):undefined} recommendations={draftRecommendations} renderPhoto={p => <Photo place={p}/>} onReorder={(from,to)=>{if(to>=0&&to<editorDayIds.length)reorder(draft.stopIds.indexOf(editorDayIds[from]),draft.stopIds.indexOf(editorDayIds[to]));}} onReplace={replaceRecommendedPlace} onRemove={id => setDraft(v => ({ ...v, stopIds: v.stopIds.filter(item => item !== id),stopDays:Object.fromEntries(v.stopIds.filter(pid=>pid!==id).map(pid=>[pid,courseDay(v,pid)])), schedule: undefined }))}/>}{!editorDayIds.length && !(draft.googlePlaceRefs||[]).some(ref=>ref.day===editorDay) && !(draft.kakaoPlaceRefs||[]).some(ref=>ref.day===editorDay) && <div className="itinerary-empty"><svg className="itinerary-empty-art" viewBox="0 0 100 80" fill="none" aria-hidden="true"><path d="M12 60C28 27 43 73 62 56S81 39 88 30" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 4"/><path d="M62 18C62 29 50 39 50 39S38 29 38 18A12 12 0 0 1 62 18Z" stroke="currentColor" strokeWidth="1.4"/><circle cx="50" cy="18" r="4" stroke="currentColor" strokeWidth="1.4"/></svg><strong>아직 추가된 장소가 없어요.</strong><p>여행할 장소를 추가해보세요.</p></div>}<GoogleCoursePlaces kakaoRefs={draft.kakaoPlaceRefs||[]} onKakaoRows={setKakaoKeywordRows} onOpenKakao={place=>setModal({type:'kakao-place',place,canAdd:true})} onKakaoChange={(id,day)=>setDraft(v=>({...v,kakaoPlaceRefs:v.kakaoPlaceRefs.map(ref=>ref.placeId===id?{...ref,day}:ref)}))} onKakaoRemove={id=>setDraft(v=>({...v,kakaoPlaceRefs:v.kakaoPlaceRefs.filter(ref=>ref.placeId!==id)}))} course={draft} onOrder={(from,to)=>setDraft(v=>reorderCourseEntries(v,editorDay,from,to))} nativeOptions={{onUpdateDetails:updateStopDetails,Icon,query:filters.query,recommendations:draftRecommendations,renderPhoto:p=><Photo place={p}/>,onOpenPlace:openPlaceDetails,onReplace:replaceRecommendedPlace,onRemove:id=>setDraft(v=>({...v,stopIds:v.stopIds.filter(item=>item!==id),stopDays:Object.fromEntries(v.stopIds.filter(pid=>pid!==id).map(pid=>[pid,courseDay(v,pid)])),schedule:undefined}))}} onKeywords={setGoogleKeywordRows} onOpenGoogle={place=>setModal({type:'google-place',place,canAdd:true})} nativeStops={draftStops.filter(p=>courseDay(draft,p.id)===editorDay)} transport={draft.transport} refs={draft.googlePlaceRefs||[]} day={editorDay} days={courseDayCount(draft)} active={modal!=='places'&&modal?.returnTo!=='places'} onChange={(id,day)=>setDraft(v=>({...v,googlePlaceRefs:v.googlePlaceRefs.map(ref=>ref.placeId===id?{...ref,day}:ref)}))} onMove={(id,direction)=>setDraft(v=>({...v,googlePlaceRefs:moveGoogleRef(v.googlePlaceRefs,id,direction)}))} onRemove={id=>setDraft(v=>({...v,googlePlaceRefs:v.googlePlaceRefs.filter(ref=>ref.placeId!==id)}))}/></CourseEditor>)}</React.Suspense>}
        {screen === 'saved' && <CourseLibrary initialContentFilter={journalArchive?'journals':'all'} journals={travelJournals} reportPanel={<React.Suspense fallback={<LoadingPage/>}><MyHub savedCourses={[...new Map([...all.filter(course=>favorites.includes(course.id)),...myCourses.map(course=>({...course,reportOwned:true})),...editorialCopies.map(course=>({...course,reportOwned:true}))].map(course=>[course.id,course])).values()]} courseCatalog={all} zipRooms={zipRooms} communityCourses={availableCommunityCourses} authoredCourses={myCourses} onCreateKeywordCourse={startKeywordMissionCourse} initialTab={myMissionTag?'missions':myLanding==='events'?'experience':undefined} initialMissionTag={myMissionTag} initialPage="tasteReport" onHomePage={()=>{setMyLanding('home');setMyMissionTag(null);}} profile={profile} account={member?.account} requireMember={requireMember} onEdit={()=>{setProfileForm({...profile,interests:[...profile.interests]});if(requireMember())setModal('profile');}} journals={travelJournals} catalog={catalog} taste={travelTaste} onSaveTaste={commitTravelTaste} onTest={()=>{setTestReturnScreen('my');navigate('welcome');}} onCourses={openCourseLibrary} onPageBack={()=>document.querySelector('.archive-design-tabs>button')?.click()}/></React.Suspense>} journalsPanel={<React.Suspense fallback={<LoadingPage/>}><TravelJournal accountId={member?.account.userId||'guest'} onRecap={()=>{setMyLanding('tasteReport');navigate('my');}} hideTabs courses={[...new Map([...likedCourses,...all.filter(course=>travelJournals.some(record=>record.courseId===course.id)),...myCourses.filter(course=>travelJournals.some(record=>record.courseId===course.id)),...editorialCopies.filter(course=>travelJournals.some(record=>record.courseId===course.id))].map(course=>[course.id,course])).values()]} journals={travelJournals} catalog={catalog} onSave={record=>commitTravelJournals([...travelJournals.filter(j=>j.courseId!==record.courseId),record])} onDelete={id=>commitTravelJournals(travelJournals.filter(j=>j.courseId!==id))} onUnlike={toggleLikedCourse} onOpen={open} CoursePhoto={BannerPhoto} requireMember={requireMember}/></React.Suspense>} placeStatus={placeStatus} onRetryPlaces={() => setPlaceRetry(value=>value+1)} onRemovePrivate={removePrivateCourse} CoursePhoto={BannerPhoto} catalog={catalog} Icon={Icon} tab={savedTab} onTab={setSavedTab} onUnpublish={unpublishCourse} likedCourses={likedCourses} onUnlike={toggleLikedCourse} onToggleLike={toggleLikedCourse} authored={[...myCourses,...editorialCopies]} savedIds={favorites} courses={all} placeOf={placeOf} Photo={Photo} onOpen={open} onCreate={requestNewCourse} onEdit={edit} onDelete={id => setModal({type:'delete',id})} onUnsave={toggleCourse} onExplore={() => navigate('home')} onReport={()=>{setMyLanding('tasteReport');navigate('my');}} onWriteJournal={openJournalForCourse} journalCourseIds={travelJournals.map(record=>record.courseId)}/>}

        {screen === 'my' && <React.Suspense fallback={<LoadingPage/>}><MyHub savedCourses={[...new Map([...all.filter(course=>favorites.includes(course.id)),...myCourses.map(course=>({...course,reportOwned:true})),...editorialCopies.map(course=>({...course,reportOwned:true}))].map(course=>[course.id,course])).values()]} courseCatalog={all} zipRooms={zipRooms} communityCourses={availableCommunityCourses} authoredCourses={myCourses} onCreateKeywordCourse={startKeywordMissionCourse} initialTab={myMissionTag?'missions':myLanding==='events'?'experience':undefined} initialMissionTag={myMissionTag} initialPage={myLanding} onHomePage={()=>{setMyLanding('home');setMyMissionTag(null);}} profile={profile} account={member?.account} requireMember={requireMember} onEdit={()=>{setProfileForm({...profile,interests:[...profile.interests]});if(requireMember())setModal('profile');}} journals={travelJournals} catalog={catalog} taste={travelTaste} onSaveTaste={commitTravelTaste} onTest={()=>{setTestReturnScreen('my');navigate('welcome');}} onCourses={openCourseLibrary} onPageBack={()=>goBack()}/></React.Suspense>}
      </>}
      {screen !== 'my' && <footer className="app-footer"><span>coursepick · 나의 여행 시나리오</span><small>보완 사진 출처: 한국관광공사 TourAPI · <a href="https://www.kogl.or.kr/info/license.do" target="_blank" rel="noreferrer">공공누리 제1유형</a></small></footer>}
    </main>
    <nav className="bottom-nav" aria-label="주요 메뉴">{[{ id: 'home', name: '홈', icon: 'home' }, { id: 'zip', name: 'Zip', icon: 'zip' }, { id: 'search', name: '검색', icon: 'search' }, { id: 'saved', name: '아카이브', icon: 'archive' }, { id: 'my', name: '마이', icon: 'my' }].map(item => <button type="button" key={item.id} className={screen === item.id ? 'active' : ''} aria-current={screen === item.id ? 'page' : undefined} onClick={() => {if(item.id==='my')setMyLanding('home');item.id === 'saved' ? openCourseLibrary('all') : navigate(item.id);}}><img className="home-plan-nav-icon" src={`/images/home-plan-nav-${item.icon}.svg`} alt=""/><span>{item.name}</span></button>)}</nav>
    {pendingJournalCourse&&<JournalComposer key={pendingJournalCourse.id} course={pendingJournalCourse} catalog={catalog} record={travelJournals.find(j=>j.courseId===pendingJournalCourse.id)} accountId={member?.account.userId||'guest'} onClose={()=>setPendingJournalCourse(null)} onSave={async record=>{await commitTravelJournals([...travelJournals.filter(j=>j.courseId!==record.courseId),record]);setPendingJournalCourse(null);setEditorialEditing(null);setDetail(null);setJournalArchive(true);setSavedTab(record.isPublic===false?'bookmarked':'all');navigate('saved');setToast('나의 여행기에 저장했어요.');}}/>}
    {homePopup&&screen==='home'&&!detail&&<div className="home-event-shade" role="presentation" onClick={e=>{if(e.target===e.currentTarget)closeHomePopup();}}><section className="home-event-popup" role="dialog" aria-modal="true" aria-label="체험단 안내"><TripExperienceBanner experience={homePopupExperience} onClick={openHomePopupExperience}/><div className="home-event-actions"><label className="home-event-hide"><input type="checkbox" checked={homePopupHideToday} onChange={e=>setHomePopupHideToday(e.target.checked)}/>오늘 하루 보지 않기</label><button type="button" className="home-event-dismiss" onClick={closeHomePopup}>닫기</button></div></section></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
    {modal==='save-tags'&&pendingSaveCourse&&<Modal title="대표 태그 선택" onClose={()=>setModal(null)}><CourseSaveTags candidates={saveTagCandidates} selected={pendingSaveCourse.representativeTags||[]} onChange={tags=>setPendingSaveCourse(c=>({...c,representativeTags:tags}))} onConfirm={()=>setModal('save-choice')}/></Modal>}
    {modal === 'save-choice' && pendingSaveCourse && <Modal title="코스를 저장할까요?" className="course-save-choice-modal" onClose={() => { if(courseSaveLock.current)return;setModal(null); setPendingSaveCourse(null); }}><CourseSaveChoice course={pendingSaveCourse} onSave={saveChosenCourse} error={formError} saving={courseSaving}/></Modal>}
    {modal === 'new-course' && <Modal title="새 코스를 시작할까요?" onClose={() => setModal(null)}><p>작성 중인 내용을 비우고 새 코스를 시작합니다. 이미 저장한 코스는 유지됩니다.</p><div className="modal-actions"><button type="button" className="pill secondary" onClick={() => navigate('create')}>취소</button><button type="button" className="pill primary" onClick={beginNewCourse}>새 코스 시작</button></div></Modal>}
    {modal === 'travel-filters' && <Modal className={filterFocus === 'region' ? 'region-filter-modal' : filterFocus === 'all' ? '' : `compact-filter-modal ${filterFocus}-filter-modal`} title={travelFilterTitles[filterFocus]} initialFocus={filterFocus === 'all' ? undefined : `[data-filter-section="${filterFocus}"] button`} onClose={() => setModal(null)}><TravelFilterPopup value={filterDraft} onChange={setFilterDraft} places={catalog} focusSection={filterFocus} onReset={resetTravelFilterDraft} onApply={applyTravelFilters} onCancel={() => setModal(null)}/></Modal>}
    {modal==='editor-transport' && <Modal className="editor-transport-modal" title="이동수단 선택" onClose={()=>setModal(null)}><p className="muted">현재 코스의 모든 장소 간 이동에 적용합니다.</p><div className="editor-transport-options" role="group" aria-label="코스 이동수단 선택">{['자동차','대중교통'].map(value=><button type="button" key={value} className={`pill ${draft.transport===value?'primary':'secondary'}`} aria-pressed={draft.transport===value} onClick={()=>{if(draft.transport===value)setRouteRetry(v=>v+1);else setDraft(current=>({...current,transport:value}));setModal(null);}}><Icon name={value==='도보'?'walk':value==='자동차'?'car':'bus'} size={18}/>{value}</button>)}</div></Modal>}
    {(modal === 'places' || modal?.returnTo === 'places') && <Modal suspended={modal !== 'places'} className="place-picker-modal" title="장소 추가" onClose={() => setModal(null)}><PlacePicker kakaoPlaceRefs={draft.kakaoPlaceRefs||[]} onAddKakao={addDraftKakao} onOpenKakao={place=>setModal({type:'kakao-place',place,returnTo:'places',canAdd:true})} kakaoAnchor={kakaoKeywordRows.find(p=>p.id===(draft.kakaoPlaceRefs||[]).filter(ref=>ref.day===editorDay).at(-1)?.placeId)} onOpenGoogle={place=>setModal({type:'google-place',place,returnTo:'places',canAdd:true})} googleDay={editorDay} distanceStops={draftStops.filter(p=>courseDay(draft,p.id)===editorDay)} googlePlaceRefs={draft.googlePlaceRefs||[]} onAddGoogle={addDraftGoogle} catalog={realPlaceCandidates(catalog)} freeMode={freePickerMode} stops={draftStops} afterId={pickerAfterId} onAfter={setPickerAfterId} flow={pickerFlow} flowRanked={flowRanking.ranked} onFlow={stage => { if(stage==='free') {setDraft(v=>({...v,freePlaceAdditions:true}));return;} if(stage==='done') {setModal(null);return;} setPickerFlowOverride({key:pickerFlowKey,stage}); setPicker(''); }} onFinish={() => setModal(null)} query={picker} onQuery={setPicker} ranked={pickerRanking.ranked} interests={profile.interests} taste={taste} recommendationContext={JSON.stringify([pickerRegion,pickerFlow.stage,profile.interests,taste])} savedIds={savedPlaces} renderRow={(p,item,onPhoto)=>placeRow(p,true,item,onPhoto)} renderMap={(places,id,onSelect)=><MapPanel showRoute routePlaces={draftRoutePlaces} accommodationId={draftAccommodation?.id} place={draftRoutePlaces[0] || places[0] || catalog[0]} places={places} selectedId={id} onSelectPlace={candidateId=>{if(places.some(p=>p.id===candidateId))onSelect(candidateId);}}/>} lodgingPlaces={catalog.filter(p=>p.category==='숙소')} lodgingRegion={draftStops[0]?.region || (pickerRegion==='전체'?undefined:pickerRegion)} onLoadedLodgings={keepLoadedLodgings} onOpenPlace={id=>{selectPlace(id);setModal({type:'place',id,returnTo:'places'});}}/></Modal>}
    {modal?.type==='kakao-place'&&<Modal className="place-detail-modal google-place-detail-modal" title={modal.place.name} onClose={()=>setModal(modal.returnTo==='places'?'places':null)}><KakaoPlaceDetails place={modal.place} onAdd={modal.canAdd?addDraftKakao:undefined} added={(draft.kakaoPlaceRefs||[]).some(ref=>ref.placeId===modal.place.id)} disabled={(draft.kakaoPlaceRefs?.length||0)>=20}/></Modal>}
    {modal?.type==='google-place'&&<Modal className="place-detail-modal google-place-detail-modal" title={modal.place.name} onClose={()=>setModal(modal.returnTo==='places'?'places':null)}><GooglePlaceDetails initial={modal.place} onAdd={modal.canAdd?addDraftGoogle:undefined} added={(draft.googlePlaceRefs||[]).some(ref=>ref.placeId===modal.place.id)} disabled={(draft.googlePlaceRefs?.length||0)>=20} renderDescription={text=><PlaceDescription text={text}/>}/></Modal>}
    {modal?.type==='editorial-place'&&<Modal className="place-detail-modal" title={modal.visit.name} onClose={()=>setModal(null)}><EditorialPlaceDetails place={modal.visit}/></Modal>}
    {modal?.type === 'place' && placeOf(modal.id) && (() => {
      const p = placeOf(modal.id);
      const hasCoordinates = Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && (p.latitude !== 0 || p.longitude !== 0);
      return <Modal className="place-detail-modal" title={p.name} onClose={() => setModal(modal.returnTo === 'places' ? 'places' : null)}>
        <PlaceDetails p={p} Photo={Photo} query={modal?.returnTo==='places'?picker:filters.query} onSelectPlace={selectPlace} headingAction={modal.returnTo==='places' && <button type="button" className="pill secondary picker-add-place" disabled={draft.stopIds.includes(p.id) || draft.accommodationId===p.id} aria-label={`${p.name} 추가`} onClick={()=>addDraftPlace(p)}>{draft.stopIds.includes(p.id) || draft.accommodationId===p.id ? '추가됨' : '+ 장소 추가'}</button>} saveAction={<Save name={p.name} saved={savedPlaces.includes(p.id)} onClick={() => togglePlace(p.id)}/>} externalInfo={<><section className="place-detail-section"><h3>외부 정보 확인</h3><p className="muted">Google 제공 정보는 지도 없는 별도 화면에서 확인할 수 있어요.</p><a className="pill secondary wide" href={`/?googlePlace=${encodeURIComponent(p.id)}`} target="_blank" rel="noopener noreferrer">Google 장소 정보 확인</a></section></>}/>

      </Modal>;
    })()}

    {modal === 'generate' && <Modal title="맞춤 여행 코스 만들기" onClose={() => { if (generationStatus !== 'loading') setModal(null); }}><form onSubmit={generatePersonalCourse}><p className="muted">마이의 관심·저장·작성 기록, 여행 성향 점수와 장소 간 거리를 이용합니다. 생성형 AI는 사용하지 않습니다. 자동차 코스로 구성하며 실제 이동시간은 상세 화면에서 조회합니다.</p><label className="field-label" htmlFor="generation-region">여행 지역</label><select id="generation-region" className="field" value={generationRegion} disabled={generationStatus === 'loading'} onChange={event => { setGenerationRegion(event.target.value); setGenerationAccommodationId(''); }}>{[...new Set(places.filter(p => p.category === '관광지').map(p => p.region))].sort().map(region => <option key={region}>{region}</option>)}</select><LodgingSelector region={generationRegion} onLoaded={keepLoadedLodgings} id="generation-lodging" candidates={generationLodgings} selected={generationAccommodation} onChange={id => setGenerationAccommodationId(id || '')}/><p>당일치기 · 자동차 이동</p><label><input type="checkbox" checked={generationCafe} disabled={generationStatus === 'loading'} onChange={event => setGenerationCafe(event.target.checked)}/> 카페·디저트 포함 (5곳)</label><p>{`${generationAccommodation ? '숙소 → ' : ''}오전 일정 → 점심 → 오후 일정 → ${generationCafe ? '카페·디저트 → ' : ''}저녁${generationAccommodation ? ' → 숙소' : ''}`}</p>{generationToDraft && draft.stopIds.length > 0 && <label><input type="checkbox" checked={generationReplace} onChange={event => setGenerationReplace(event.target.checked)} disabled={generationStatus === 'loading'}/> 작성 중인 일정을 새 추천 초안으로 교체합니다.</label>}{generationError && <p role="alert">{generationError}</p>}<button type="submit" className="pill primary wide" disabled={generationStatus === 'loading' || placeStatus !== 'success' || (generationToDraft && draft.stopIds.length > 0 && !generationReplace)}>{generationStatus === 'loading' ? '맞춤 코스를 만드는 중입니다.' : '코스 추천받기'}</button><p className="muted">{generationToDraft ? '생성 결과는 편집 가능한 초안입니다. 완료를 눌러야 내 코스로 저장됩니다.' : '생성 결과는 이 코스로 나의 여행 만들기에서 저장할 수 있습니다.'}</p></form></Modal>}
    {modal === 'profile' && <Modal title="여행 프로필 편집" onClose={() => setModal(null)}><form onSubmit={e => { e.preventDefault(); if(!requireMember())return; if (!profileForm.name.trim()) return; setProfile({ ...profileForm, name: profileForm.name.trim(), bio: profileForm.bio.trim() }); setModal(null); setToast('나의 여행 취향을 저장했어요.'); }}><div className="profile-image-upload"><img src={profileForm.photo || '/images/profile-mvp.png'} alt="프로필 사진 미리보기"/><label className="pill secondary" htmlFor="profile-photo-upload">이미지 업로드</label><input id="profile-photo-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file=event.target.files?.[0]; if(!file)return; if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){setToast('PNG·JPG·WebP 사진을 2MB 이하로 선택해 주세요.');event.target.value='';return;} const reader=new FileReader();reader.onload=async()=>{if(typeof reader.result!=='string')return;try{const data=await memberRequest('photo',{data:reader.result},member.account.access_token);setProfileForm(value=>({...value,photo:data.url,photoPath:data.path}));}catch(error){setToast(error.message);}};reader.onerror=()=>setToast('이미지를 읽지 못했습니다. 다시 선택해 주세요.');reader.readAsDataURL(file);event.target.value=''; }}/></div><label className="field-label" htmlFor="profile-name">이름</label><input id="profile-name" className="field" required maxLength={20} value={profileForm.name} onChange={e => setProfileForm(v => ({ ...v, name: e.target.value }))}/><label className="field-label" htmlFor="profile-bio">한 줄 소개</label><input id="profile-bio" className="field" maxLength={100} value={profileForm.bio} onChange={e => setProfileForm(v => ({ ...v, bio: e.target.value }))}/><button type="submit" className="pill primary wide" disabled={!profileForm.name.trim()}>프로필 저장</button><div className="profile-logout-row"><button type="button" className="profile-logout-button" onClick={logout}>로그아웃</button></div></form></Modal>}
    {modal?.type === 'delete' && <Modal title="작성한 코스를 삭제할까요?" onClose={() => setModal(null)}><p>삭제 후에는 복구할 수 없습니다.</p><div className="modal-actions"><button type="button" className="pill secondary" onClick={() => setModal(null)}>취소</button><button type="button" className="pill primary" onClick={() => { const id = modal.id; setMyCourses(v => v.filter(c => c.id !== id)); setLikedCourseIds(v => v.filter(value => value !== id)); setFavorites(v => v.filter(item => item !== id)); if (draft.id === id) setDraft(emptyDraft); setModal(null); setToast('코스를 삭제했어요.'); }}>삭제 확인</button></div></Modal>}
  </div>;
}
function EmptySaved({ onExplore }) { return <div className="empty-state"><Icon name="bookmark" size={36}/><h2>다음 여행을 담아보세요.</h2><p>사진 위의 저장 버튼을 누르면 이곳에 모아볼 수 있어요.</p><button type="button" className="pill primary" onClick={onExplore}>여행 둘러보기</button></div>; }


