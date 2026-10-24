import {generateHomeKeywordCourses} from './homeKeywordCourses.js';
import {supplementPersonaCourses} from './personaSearchCourses.js';
import {loadHomeSearchData} from './homeSearchIntent.js';
self.onmessage=async({data})=>{
 try{const {mode,payload}=data;await loadHomeSearchData({regions:[payload.filters.query,payload.filters.region]});const courses=mode==='persona'?supplementPersonaCourses(payload.catalog,payload.filters,payload.existing,payload.ai,payload.live):generateHomeKeywordCourses(payload.catalog,payload.live,payload.filters,payload.taste,payload.interests,payload.context);self.postMessage({courses});}
 catch{self.postMessage({error:'코스를 만들지 못했습니다. 다시 검색해 주세요.'});}
};
