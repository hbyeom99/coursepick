"""One local pre-deployment check. No database calls, publish or package install."""
import os,sys,subprocess,shutil,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def run(args):
 result=subprocess.run(args,cwd=ROOT)
 if result.returncode:raise SystemExit(result.returncode)

def scan():
 patterns=[rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',rb'gh[pousr]_[A-Za-z0-9]{30,}',rb'github_pat_[A-Za-z0-9_]{30,}',rb'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}']
 for folder in ['src','backend','public']:
  for p in (ROOT/folder).rglob('*'):
   if not p.is_file() or p.name.startswith('.env') or '__pycache__' in p.parts or p.suffix not in {'.js','.jsx','.ts','.py','.json','.svg'}:continue
   if any(re.search(pattern,p.read_bytes()) for pattern in patterns):raise SystemExit('Credential pattern in '+str(p.relative_to(ROOT)))
 print('Credential pattern scan: passed',flush=True)

def data_check():
 base=ROOT/'src/data';full=json.loads((base/'visitBoundaries.json').read_text(encoding='utf-8'));parts=[]
 for p in (base/'visitDistricts').glob('*.json'):parts.extend(json.loads(p.read_text(encoding='utf-8')))
 assert sorted(parts,key=lambda r:r['id'])==sorted(full['districts'],key=lambda r:r['id'])
 addresses={}
 for p in (base/'jibunRegions').glob('*.json'):addresses.update(json.loads(p.read_text(encoding='utf-8')))
 assert addresses==json.loads((base/'jibunAddresses.json').read_text(encoding='utf-8'))
 print('Regional data equivalence: passed',flush=True)

if __name__=='__main__':
 node=os.environ.get('NODE_BINARY') or shutil.which('node')
 if not node:raise SystemExit('Set NODE_BINARY to the installed Node executable.')
 scan();data_check();run([sys.executable,'tools/sync_search_rules.py','--check'])
 run([sys.executable,'-m','unittest','discover','-s','backend','-p','test_*.py'])
 run([node,'tools/search_regression.mjs']);run([node,'node_modules/vite/bin/vite.js','build']);run([node,'tools/worker_smoke.mjs'])
 print('All local deployment checks passed. Nothing pushed or deployed.')
