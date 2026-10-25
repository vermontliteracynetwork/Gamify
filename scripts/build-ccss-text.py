"""Builds src/data/ccss-text.json (Common Core code -> standard text).

Source: data/curriculum-standards.json from github.com/withmarbleapp/os-taxonomy
(database under ODbL 1.0; the standard text is the Common Core State Standards,
(c) 2010 NGA Center and CCSSO, under the CCSS public license). Logged in
docs/asset-ledger.md. Usage: python3 -I scripts/build-ccss-text.py <path to curriculum-standards.json>
"""
import json, re, sys

src = json.load(open(sys.argv[1]))
out = {}
for c in src['curricula']:
    if c['slug'] in ('ccss-ela', 'ccss-math'):
        for topic in c['topics']:
            code = re.sub(r'\.([a-z])$', r'\1', topic['code'])  # RF.K.3.a -> RF.K.3a, like L.1.2a
            # Em dashes become commas (house copy rule: none on teacher pages).
            text = re.sub(r'\s*\u2014\s*', ', ', topic['data'].get('description', '')).strip()
            if text:
                out[code] = text
json.dump(dict(sorted(out.items())), open('src/data/ccss-text.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'standards')
