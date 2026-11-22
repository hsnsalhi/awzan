#!/usr/bin/env python3
"""يبني بيانات زليج الأوزان من بيانات مشروع roots (غابة الجذور).

الاستعمال:  python3 scripts/build_data.py /path/to/roots
المصادر: Quranic Arabic Corpus (GPL) ، تنزيل (CC BY 3.0) ، مقاييس اللغة والمفردات (ملك عام) — انظر README.
"""
import json, os, shutil, sys

src = os.path.join(sys.argv[1], 'public', 'data')
out = os.path.join(os.path.dirname(__file__), '..', 'data')
shutil.rmtree(out, ignore_errors=True)
os.makedirs(os.path.join(out, 'roots'))
shutil.copytree(os.path.join(src, 'quran'), os.path.join(out, 'quran'))

idx = json.load(open(os.path.join(src, 'index.json'), encoding='utf8'))
KIND = {'ACT_PCPL': 'fa', 'PASS_PCPL': 'mf', 'VN': 'ms'}
wall, n_lem, n_tok, n_nouns = [], 0, 0, 0
for r in idx['roots']:
    if not r['v']:
        continue
    d = json.load(open(os.path.join(src, 'roots', r['id'] + '.json'), encoding='utf8'))
    shutil.copy(os.path.join(src, 'roots', r['id'] + '.json'), os.path.join(out, 'roots'))
    forms = {}
    for v in d['verbs']:
        f = v['form']
        if f not in forms or v['count'] > forms[f][1]:
            forms[f] = [v['lem'], forms.get(f, [None, 0])[1] + v['count']]
        else:
            forms[f][1] += v['count']
        n_lem += 1
        n_tok += v['count']
    nouns = []
    for n in d['nouns']:
        if n['pos'] in KIND and n['form']:
            nouns.append([n['form'], KIND[n['pos']], n['lem'], n['count']])
            n_nouns += 1
    wall.append({'id': r['id'], 'r': r['r'], 'l': d['letters'],
                 'f': [[f, *forms[f]] for f in sorted(forms)], 'n': nouns})

meta = {'suras': [[s['n'], s['name']] for s in idx['meta']['suras']],
        'counts': {'roots': len(wall), 'verbs': n_lem, 'tokens': n_tok, 'nouns': n_nouns}}
json.dump({'meta': meta, 'roots': wall}, open(os.path.join(out, 'wall.json'), 'w', encoding='utf8'),
          ensure_ascii=False, separators=(',', ':'))
print(meta['counts'])
