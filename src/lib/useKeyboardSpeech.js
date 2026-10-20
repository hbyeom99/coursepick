import { useEffect, useRef, useState } from 'react';
export default function useKeyboardSpeech(onText){
 const recognition=useRef(null),callback=useRef(onText);
 callback.current=onText;
 const [listening,setListening]=useState(false),[notice,setNotice]=useState('');
 function stop(){if(recognition.current){const current=recognition.current;recognition.current=null;current.onresult=null;current.onend=null;current.onerror=null;current.onstart=null;current.abort();}setListening(false);setNotice('');}
 useEffect(()=>()=>{const current=recognition.current;if(current){current.onresult=null;current.onend=null;current.onerror=null;current.onstart=null;current.abort();}},[]);
 function toggle(){
  if(recognition.current){recognition.current.stop();return;}
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){setNotice('이 브라우저에서는 음성 입력을 지원하지 않습니다.');return;}
  const current=new Recognition();recognition.current=current;
  current.lang='ko-KR';current.continuous=false;current.interimResults=false;
  setNotice('마이크 권한을 허용한 뒤 말씀해 주세요.');setListening(true);
  current.onstart=()=>setNotice('음성을 듣고 있어요. 다시 누르면 중지합니다.');
  current.onresult=event=>{for(let i=event.resultIndex;i<event.results.length;i++){if(event.results[i].isFinal){const text=event.results[i][0].transcript.trim();if(text){callback.current(text);setNotice('음성이 검색창에 입력됐어요.');}}}};
  current.onerror=event=>{setListening(false);setNotice(({ 'not-allowed':'마이크 사용 권한을 허용해 주세요.','service-not-allowed':'이 환경에서는 음성 입력을 사용할 수 없습니다.','audio-capture':'사용 가능한 마이크를 확인해 주세요.','no-speech':'음성이 인식되지 않았어요. 다시 시도해 주세요.','network':'음성 인식 서비스 연결을 확인해 주세요.' })[event.error]||'음성 입력을 시작하지 못했습니다.');};
  current.onend=()=>{if(recognition.current===current)recognition.current=null;setListening(false);setNotice(value=>value.startsWith('음성을 듣고')||value.startsWith('마이크 권한')?'':value);};
  try{current.start();}catch{recognition.current=null;setListening(false);setNotice('음성 입력을 시작하지 못했습니다.');}
 }
 return {listening,notice,toggle,stop};
}
