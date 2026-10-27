import { validateSearchQuery } from './searchQueryValidation.js';
const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');

export async function getPopularSearchKeywords(signal){
 const response=await fetch(`${base}/api/search-keywords/popular`,{signal,cache:'no-store'});
 if(!response.ok)throw new Error('검색어 순위를 불러오지 못했습니다.');
 const data=await response.json();
 return Array.isArray(data.keywords)?data.keywords.filter(item=>item&&typeof item.keyword==='string').slice(0,8):[];
}

export async function recordPopularSearchKeyword(keyword){
 if(!validateSearchQuery(keyword).valid)return false;
 try{
  await fetch(`${base}/api/search-keywords/record`,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({keyword})});
 }catch{/* Search remains available while aggregate statistics are offline. */}
}
