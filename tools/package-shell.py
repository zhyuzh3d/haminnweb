#!/usr/bin/env python3
"""Archive runnable Shell sources; do not transpile, bundle JavaScript or overwrite releases."""
import argparse,hashlib,io,json,re,zipfile
from datetime import datetime,timezone
from pathlib import Path
root=Path(__file__).resolve().parents[1];shell=root/'public/shell'
p=argparse.ArgumentParser();p.add_argument('--version',required=True);p.add_argument('--code',type=int,required=True);args=p.parse_args()
assert re.fullmatch(r'\d+\.\d+\.\d+',args.version),'Use a numeric semantic version'
assert f'const HAMINN_WEB_VERSION = "{args.version}";' in (shell/'core/runtime.js').read_text(),'Source version differs'
old=json.loads((shell/'manifest.json').read_text())
assert args.code>old['version'],'Version code must increase'
bundle=root/f'public/downloads/haminnshell-v{args.version}-release.zip'
assert not bundle.exists(),'Published release names must never be overwritten'
files=sorted(f for f in shell.rglob('*') if f.is_file() and f.suffix in ('.html','.css','.js','.svg','.png','.webp'))
assert len(files)<=512
out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for f in files:
        entry=zipfile.ZipInfo(f.relative_to(shell).as_posix(),(2020,1,1,0,0,0));entry.compress_type=zipfile.ZIP_DEFLATED;entry.external_attr=0o100644<<16
        z.writestr(entry,f.read_bytes())
raw=out.getvalue();assert len(raw)<32*1024*1024
manifest={'version':args.code,'versionName':args.version,'updatedAt':datetime.now(timezone.utc).isoformat(timespec='seconds'),'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'bundle':'../downloads/'+bundle.name}
with bundle.open('xb') as f:f.write(raw)
(shell/'shell.zip').write_bytes(raw)
(shell/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
