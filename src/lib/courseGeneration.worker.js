import {generateHomeKeywordCourses} from './homeKeywordCourses.js';
import {supplementPersonaCourses} from './personaSearchCourses.js';
import {loadHomeSearchData} from './homeSearchIntent.js';
self.onmessage=async({data})=>{
 try{const {mode,payload}=data;await loadHomeSearchData({regions:[payload.filters.query,payload.filters.region]});const courses=mode==='persona'?supplementPersonaCourses(payload.catalog,payload.filters,payload.existing,payload.ai,payload.live):generateHomeKeywordCourses(payload.catalog,payload.live,payload.filters,payload.taste,payload.interests,payload.context);self.postMessage({courses});}
 catch(error){console.error('[Coursepick] Search course generation failed:',error);self.postMessage({error:'generation-failed'});}
};
