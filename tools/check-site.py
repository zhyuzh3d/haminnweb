#!/usr/bin/env python3
"""Static public-resource, Shell DOM, Native-method and release checks. No server needed."""
import argparse,hashlib,json,re,subprocess,zipfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
VOID=set('area base br col embed hr img input link meta param source track wbr'.split())
class Document(HTMLParser):
    def __init__(self,path):
        super().__init__(convert_charrefs=True);self.path=path;self.stack=[];self.ids=set();self.refs=[];self.aria=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'{self.path}: duplicate ID {attrs["id"]}'
            self.ids.add(attrs['id'])
        if tag not in VOID:self.stack.append(tag)
        for attr in ('href','src'):
            if attrs.get(attr):self.refs.append(attrs[attr])
        for attr in ('aria-labelledby','aria-describedby'):
            if attrs.get(attr):self.aria.extend(attrs[attr].split())
    def handle_endtag(self,tag):
        assert self.stack and self.stack[-1]==tag, f'{self.path}: unexpected </{tag}>, open={self.stack[-4:]}'
        self.stack.pop()
    def handle_startendtag(self,tag,attrs):
        self.handle_starttag(tag,attrs)
        if tag not in VOID:self.handle_endtag(tag)
def local_ref(source,value):
    u=urlsplit(value)
    if u.scheme or u.netloc or value.startswith('data:'):return None,u.fragment
    part=unquote(u.path)
    if part.startswith('/__haminn/icons/fontawesome/'):
        part='/assets/vendor/fontawesome/'+part[len('/__haminn/icons/fontawesome/'):]
    target=(PUBLIC/part.lstrip('/') if part.startswith('/') else source.parent/part) if part else source
    target=target.resolve()
    assert target.is_relative_to(PUBLIC), f'{source}: resource escapes public: {value}'
    if target.is_dir():target=target/'index.html'
    assert target.is_file(), f'{source.relative_to(PUBLIC)}: missing {value}'
    return target,u.fragment

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--release',action='store_true');parser.add_argument('--host-source',type=Path);args=parser.parse_args()
    docs={}
    for f in PUBLIC.rglob('*.html'):
        doc=Document(f.relative_to(PUBLIC));doc.feed(f.read_text());doc.close()
        assert not doc.stack, f'{f}: unclosed {doc.stack}'
        assert all(x in doc.ids for x in doc.aria), f'{f}: unresolved ARIA reference'
        docs[f.resolve()]=doc
    for f,doc in docs.items():
        for ref in doc.refs:
            target,fragment=local_ref(f,ref)
            if target and fragment:assert target in docs and fragment in docs[target].ids,f'{f}: missing anchor {ref}'
    for f in PUBLIC.rglob('*.css'):
        text=f.read_text()
        for match in re.finditer(r'url\([\s\'"]*([^\)\'"\s]+)',text):local_ref(f,match.group(1))
        assert text.count('{')==text.count('}'), f'{f}: unbalanced CSS braces'
    shell=PUBLIC/'shell';ids=docs[(shell/'index.html').resolve()].ids
    scripts=[]
    for f in PUBLIC.rglob('*.js'):
        subprocess.run(['node','--check',str(f)],check=True,capture_output=True)
        if f.is_relative_to(shell):scripts.append(f.read_text())
    for script in scripts:
        for ident in re.findall(r'\$\("#([A-Za-z][\w-]*)"\)',script):assert ident in ids,f'Shell missing DOM #{ident}'
    for f in shell.rglob('*.js'):
        if f.parent.name!='platform':assert not re.search(r'haminn\.(host|call|clipboard)',f.read_text()),f'{f}: direct Bridge access outside Platform'
    calls=set(re.findall(r'host\.call\("([\w.]+)"', '\n'.join(scripts)))
    calls.update(re.findall(r'step\("([\w.]+)"','\n'.join(scripts)))
    adapter=(shell/'platform/host.js').read_text()
    assert all('"'+c+'"' in adapter for c in calls),'Host method missing from adapter'
    if args.host_source:
        native=args.host_source.read_text()
        assert all('"host.'+c+'"' in native for c in calls),'Host method absent from Native dispatcher'
    for forbidden in ('AGENTS.md','.git','docs','plans','ops','tools','__haminn'):
        assert not (PUBLIC/forbidden).exists(),f'Private/reserved path in public: {forbidden}'
    apk=json.loads((PUBLIC/'downloads/android.json').read_text());data=(PUBLIC/'downloads'/apk['file']).read_bytes()
    assert len(data)==apk['bytes'] and hashlib.sha256(data).hexdigest()==apk['sha256'],'APK metadata mismatch'
    if args.release:
        manifest=json.loads((shell/'manifest.json').read_text());bundle,_=local_ref(shell/'manifest.json',manifest['bundle']);raw=bundle.read_bytes()
        assert hashlib.sha256(raw).hexdigest()==manifest['sha256'],'ZIP digest mismatch'
        assert len(raw)==manifest['bytes'],'ZIP size mismatch'
        assert (shell/'shell.zip').read_bytes()==raw,'Compatibility ZIP mismatch'
        with zipfile.ZipFile(bundle) as archive:
            expected={p.relative_to(shell).as_posix() for p in shell.rglob('*') if p.is_file() and p.suffix in ('.html','.css','.js','.svg','.png','.webp')}
            assert set(archive.namelist())==expected,'ZIP runtime file closure mismatch'
            for name in expected:assert archive.read(name)==(shell/name).read_bytes(),f'Stale ZIP entry: {name}'
    print(f'PASS: {len(docs)} HTML pages, all local links/resources, DOM IDs, JS syntax, {len(calls)} Host methods, APK metadata'+(', release ZIP closure' if args.release else ''))
if __name__=='__main__':main()
