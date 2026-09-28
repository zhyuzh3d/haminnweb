#!/usr/bin/env python3
"""Compare the public deployment with local release bytes over HTTPS."""
import concurrent.futures,hashlib,json,subprocess
from pathlib import Path
from urllib.parse import quote
root=Path(__file__).resolve().parents[1]/'public';base='https://haminn.airen.life'
files=[p for p in root.rglob('*') if p.is_file() and not any(x.startswith('.') for x in p.relative_to(root).parts)]
def check(path):
    relative=path.relative_to(root).as_posix()
    result=subprocess.run(['curl','--silent','--show-error','--fail','--max-time','30','--header','Cache-Control: no-cache',base+'/'+quote(relative)],capture_output=True)
    if result.returncode:raise RuntimeError(relative+': '+result.stderr.decode())
    expected=hashlib.sha256(path.read_bytes()).hexdigest();actual=hashlib.sha256(result.stdout).hexdigest()
    if expected!=actual:raise RuntimeError(relative+': deployed bytes differ')
    return relative
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    checked=list(pool.map(check,files))
private=['/AGENTS.md','/docs/architecture.md','/plans/haminnweb-refactor.md','/ops/haminn.airen.life.conf','/tools/check-site.py','/.git/config','/__haminn/bridge/haminn-v1.js']
for url in private:
    result=subprocess.run(['curl','--silent','--show-error','--max-time','20','--output','/dev/null','--write-out','%{http_code}',base+url],capture_output=True,text=True,check=True)
    if result.stdout!='404':raise RuntimeError(url+': expected 404, got '+result.stdout)
manifest=json.loads((root/'shell/manifest.json').read_text())
print(json.dumps({'matchedPublicFiles':len(checked),'privatePaths404':len(private),'shellVersion':manifest['versionName'],'shellVersionCode':manifest['version'],'shellSha256':manifest['sha256'],'shellBytes':manifest['bytes']},indent=2))
