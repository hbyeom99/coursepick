const base=(import.meta.env.VITE_API_BASE_URL?.trim()||(import.meta.env.DEV?'http://localhost:8000':'')).replace(/\/+$/,'');
export async function zipRequest(path,token,data,method='GET'){
 if(!token&&path!=='invite-preview')throw Error('회원 로그인 후 이용할 수 있어요.');
 const response=await fetch(base+'/api/zip/'+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
 const result=await response.json();if(!response.ok){const error=Error(typeof result.detail==='string'?result.detail:'입력 정보를 확인해 주세요.');error.status=response.status;throw error;}return result;
}
