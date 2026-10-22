import {Worker} from 'node:worker_threads';
import {readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const name=(await readdir('dist/assets')).find(file=>file.startsWith('courseGeneration.worker-')&&file.endsWith('.js'));
assert.ok(name,'Production worker asset missing');
const url=pathToFileURL(process.cwd()+'/dist/assets/'+name).href;
const bootstrap=`const {parentPort}=require('node:worker_threads');global.self={postMessage:value=>parentPort.postMessage(value)};import(${JSON.stringify(url)}).then(()=>{parentPort.on('message',data=>self.onmessage({data}));parentPort.postMessage({ready:true});});`;
for(const mode of ['ai','persona']){
 const worker=new Worker(bootstrap,{eval:true});
 try{const result=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Worker timeout')),10000);worker.on('error',reject);worker.on('message',value=>{if(value.ready)worker.postMessage({mode,payload:{catalog:[],live:[],filters:{query:'오로라'},existing:[],ai:[],taste:{},interests:[],context:{}}});else{clearTimeout(timer);resolve(value);}});});assert.deepEqual(result.courses,[]);assert.equal(result.error,undefined);}
 finally{await worker.terminate();}
}
console.log('Production worker smoke: passed (AI and persona)');
