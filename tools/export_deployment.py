"""Create a clean source deployment archive. No build, network or Git mutation."""
import argparse,hashlib,json,re,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ROOT_FILES={'index.html','script.js','style.css','package.json','package-lock.json','tsconfig.json','.vercelignore'}
BLOCKED={'.git','node_modules','.pnpm-store','dist','work','outputs','private','.secrets','coursepick','__pycache__'}
SECRETS=[rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',rb'gh[pousr]_[A-Za-z0-9]{30,}',rb'github_pat_[A-Za-z0-9_]{30,}',rb'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}']
def allowed(path):
 rel=path.relative_to(ROOT)
 if any(p in BLOCKED for p in rel.parts) or path.is_symlink():return False
 if path.name.startswith('.env') or path.suffix in {'.log','.zip','.sqlite3','.pyc','.dump','.bak'}:return False
 if rel.as_posix() in {'src/data/visitBoundaries.json','src/data/jibunAddresses.json'}:return False
 if len(rel.parts)==1:return path.name in ROOT_FILES
 if rel.parts[0] in {'src','public'}:return True
 if rel.parts[0]=='backend':return ((not path.name.startswith('test_') and path.suffix in {'.py','.json','.txt'}) or rel.as_posix()=='backend/.vercelignore')
 return False

def export(output):
 output=output.resolve()
 if not output.is_relative_to(ROOT/'outputs'):raise ValueError('Output must stay inside project outputs/')
 paths=[]
 for base in ['src','public','backend']:
  paths.extend(p for p in (ROOT/base).rglob('*') if p.is_file() and allowed(p))
 paths.extend(ROOT/name for name in sorted(ROOT_FILES) if (ROOT/name).is_file())
 paths=sorted(set(paths));manifest=[]
 for p in paths:
  data=p.read_bytes()
  if p.suffix not in {'.png','.jpg','.jpeg','.webp','.ttf','.woff','.woff2','.gif','.ico'} and any(re.search(pattern,data) for pattern in SECRETS):raise ValueError('Credential pattern detected in '+str(p.relative_to(ROOT)))
  manifest.append({'path':p.relative_to(ROOT).as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
 output.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
  for p in paths:archive.write(p,p.relative_to(ROOT).as_posix())
  archive.writestr('deployment-manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2))
 print(json.dumps({'files':len(paths),'sourceBytes':sum(i['bytes'] for i in manifest),'archiveBytes':output.stat().st_size,'output':str(output)},ensure_ascii=True))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=ROOT/'outputs/coursepick-deploy-source.zip');args=parser.parse_args();export(args.output)
