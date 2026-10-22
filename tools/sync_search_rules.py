"""Keep backend deployment copies identical to frontend search definitions."""
import argparse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PAIRS=[('homeSearchKeywords.json','home_search_keywords.json'),('approvedSearchRelations.json','approved_search_relations.json')]
def run(check=False):
 mismatches=[]
 for front,back in PAIRS:
  source=ROOT/'src/data'/front;dest=ROOT/'backend'/back
  if not dest.exists() or source.read_bytes().replace(b'\r\n',b'\n')!=dest.read_bytes().replace(b'\r\n',b'\n'):
   mismatches.append(back)
   if not check:dest.write_bytes(source.read_bytes())
 if check and mismatches:raise SystemExit('Search rules out of sync: '+', '.join(mismatches))
 print('Search rules consistent' if not mismatches else 'Updated: '+', '.join(mismatches))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');run(p.parse_args().check)
