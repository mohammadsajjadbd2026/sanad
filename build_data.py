#!/usr/bin/env python3
"""
build_data.py — يحوّل ملفات Excel في مجلد sources/ إلى ملفات JSON في مجلد data/
ويتحقق من صحتها قبل أن يستعملها مشروع سَنَد.

التشغيل:   python build_data.py
المتطلبات: pip install openpyxl

لا يُعدّل هذا السكربت ملفات Excel أبدًا؛ يقرؤها فقط.
"""
import json, re, sys
from pathlib import Path

try:
    from openpyxl import load_workbook
except ImportError:
    sys.exit('ثبّت المكتبة أولًا:  pip install openpyxl')

ROOT = Path(__file__).resolve().parent
SRC, OUT = ROOT / 'sources', ROOT / 'data'

errors, warnings = [], []
DASHES = {'—', '–', '-'}  # علامات «لا شيء» تُعامل كخانة فارغة
def err(f, row, msg): errors.append(f'[{f}] الصف {row}: {msg}')
def warn(msg): warnings.append(msg)


def read_sheet(fname, sheet):
    """Row 1 = Arabic labels, row 2 = keys, data from row 3. Yields (excel_row, dict)."""
    path = SRC / fname
    if not path.exists():
        errors.append(f'[{fname}] الملف غير موجود في sources/')
        return []
    ws = load_workbook(path, data_only=True)[sheet]
    keys = [c.value for c in ws[2]]
    dups = sorted({k for k in keys if k and keys.count(k) > 1})
    if dups:
        errors.append(f'[{fname}] مفاتيح مكررة في الصف 2: {", ".join(dups)} (لا تغيّر الصف الثاني)')
        return []
    rows = []
    for r in range(3, ws.max_row + 1):
        vals = [ws.cell(row=r, column=j + 1).value for j in range(len(keys))]
        rec = {k: ('' if v is None or str(v).strip() in DASHES else str(v).strip()) for k, v in zip(keys, vals) if k}
        rid = rec.get('id', '')
        if rid.upper().startswith('EX'):
            continue  # example row
        if not any(v for k, v in rec.items() if k not in ('id', 'split', 'target_module', 'review_status', 'required', 'source', 'name_ar', 'language')):
            continue  # empty row (only prefilled fields)
        rows.append((r, rec))
    return rows


def need(f, r, rec, keys):
    ok = True
    for k in keys:
        if not rec.get(k):
            err(f, r, f'الخانة «{k}» فارغة وهي إلزامية')
            ok = False
    return ok


def split_multi(s):
    return [x.strip() for x in s.split('||') if x.strip()] if s else []


def unique_ids(f, rows):
    seen = {}
    for r, rec in rows:
        if rec['id'] in seen:
            err(f, r, f'المعرّف {rec["id"]} مكرر (سبق في الصف {seen[rec["id"]]})')
        seen[rec['id']] = r


# ------------------------------------------------------------------ ruling map (06)
CATS = ['ثابت', 'ضعيف', 'موضوع أو لا أصل له', 'يُهمَل (ليس حكمًا على الحديث)']
# صيغ الأحكام الواضحة تُصنَّف آليًا؛ كل ما عداها يحتاج صفًا في 06_ruling_map.xlsx
CLEAR = {
    'صحيح': CATS[0], 'حسن': CATS[0], 'حسن صحيح': CATS[0], 'صحيح لغيره': CATS[0], 'حسن لغيره': CATS[0],
    'صحيح الإسناد': CATS[0], 'إسناده صحيح': CATS[0], 'إسناده حسن': CATS[0],
    'ضعيف': CATS[1], 'إسناده ضعيف': CATS[1], 'ضعيف جدا': CATS[1], 'ضعيف جداً': CATS[1],
    'موضوع': CATS[2], 'لا أصل له': CATS[2], 'باطل': CATS[2],
}
def clean_ruling(t):
    t = re.sub(r'[\[\]\(\)ً-ْ]', '', t)
    return re.sub(r'\s+', ' ', t).strip(' .،')

def derive_status(cats):
    """حتمي: اتفاق التصنيف يعطي حالة واحدة، واختلافه يعطي HADITH_MULTIPLE_RULINGS (لا ترجيح تلقائي)."""
    cats = {c for c in cats if c != CATS[3]}
    if not cats:
        return None
    if len(cats) > 1:
        return 'HADITH_MULTIPLE_RULINGS'
    return {CATS[0]: 'HADITH_AUTHENTIC', CATS[1]: 'HADITH_WEAK', CATS[2]: 'HADITH_FABRICATED'}[cats.pop()]

F = '06_ruling_map.xlsx'
map_rows = read_sheet(F, 'الأحكام')
ruling_map = {}
for r, x in map_rows:
    if not need(F, r, x, ['hadith_id', 'muhaddith', 'ruling_text', 'category']):
        continue
    if x['category'] not in CATS:
        err(F, r, f'التصنيف «{x["category"]}» ليس من القائمة'); continue
    key = (x['hadith_id'], x['muhaddith'], x['ruling_text'])
    if key in ruling_map:
        err(F, r, 'صف مكرر لنفس الحكم'); continue
    ruling_map[key] = {'row': r, 'category': x['category'], 'note': x.get('reviewer_note', '')}

# ------------------------------------------------------------------ hadith index
F = '01_hadith_index.xlsx'
rows = read_sheet(F, 'الفهرس')
for r, x in rows:
    if not x.get('id'):
        err(F, r, 'صف فيه بيانات بلا معرّف (id)')
rows = [(r, x) for r, x in rows if x.get('id')]
unique_ids(F, rows)
hadith = []
used_map_keys = set()
for r, x in rows:
    if not need(F, r, x, ['id', 'text_ar', 'muhaddith_1', 'source_1', 'ruling_1', 'url']):
        continue
    if not x['url'].startswith('http'):
        err(F, r, 'الرابط لا يبدأ بـ http'); continue
    rulings, takhrij, bad = [], [], False
    for i in (1, 2, 3):
        m, s_, ref, ru = (x.get(f'{k}_{i}', '') for k in ('muhaddith', 'source', 'ref', 'ruling'))
        if not any([m, s_, ref, ru]):
            continue
        if ru and not (m and s_):
            err(F, r, f'الحكم {i} بلا محدّث أو مصدر'); bad = True; continue
        if not ru:  # تخريج بلا حكم: مرجع للحديث لا حكم عليه
            takhrij.append({'muhaddith': m, 'source': s_, 'ref': ref}); continue
        key = (x['id'], m, ru)
        if clean_ruling(ru) in CLEAR:
            cat = CLEAR[clean_ruling(ru)]
        elif key in ruling_map:
            cat = ruling_map[key]['category']; used_map_keys.add(key)
        else:
            err(F, r, f'الحكم {i} «{ru[:40]}» ليس من الصيغ الواضحة ولا صف له في 06_ruling_map'); bad = True; continue
        rulings.append({'muhaddith': m, 'source': s_, 'ref': ref, 'ruling_text': ru, 'category': cat})
    if bad:
        continue
    status = derive_status(r_['category'] for r_ in rulings)
    if status is None:
        err(F, r, 'لا حكم صالح للتصنيف (كل الأحكام «يُهمَل» أو لا شيء)'); continue
    hadith.append({
        'id': x['id'], 'text_ar': x['text_ar'], 'rawi': x.get('rawi', ''), 'rulings': rulings, 'takhrij': takhrij,
        'derived_status': status, 'url': x['url'],
        'common_translations': {l: split_multi(x.get(f'common_{l}', '')) for l in ('en', 'bn', 'ur')},
        'topic': x.get('topic', ''), 'added_by': x.get('added_by', ''), 'notes': x.get('notes', ''),
    })
hadith_ids = {h['id'] for h in hadith}
hadith_status = {h['id']: h['derived_status'] for h in hadith}
for key, v in ruling_map.items():
    if key not in used_map_keys:
        err('06_ruling_map.xlsx', v['row'], f'الصف لا يطابق أي حكم في الفهرس ({key[0]}، {key[1]}): حدّثه أو احذفه')
no_trans = sum(1 for h in hadith if not any(h['common_translations'].values()))
if no_trans:
    warn(f'{no_trans} حديثًا بلا أي صيغة مترجمة متداولة؛ المطابقة عبر اللغات ستضعف فيها')
tk = sum(1 for h in hadith if h['takhrij'])
if tk:
    warn(f'{tk} حديثًا فيه تخريجات بلا حكم (تُحفظ في takhrij ولا تُعرض حكمًا)')

# ------------------------------------------------------------------ quran (Tanzil pipe format)
QDIR = SRC / 'quran'
quran, translations = {}, {}
def read_pipe(p):
    out = {}
    for ln in p.read_text(encoding='utf-8-sig').splitlines():
        if not ln.strip() or ln.startswith('#'):
            continue
        parts = ln.split('|', 2)
        if len(parts) == 3 and parts[0].isdigit() and parts[1].isdigit():
            out[f'{int(parts[0])}:{int(parts[1])}'] = parts[2].strip()
    return out
if QDIR.exists():
    files = {p.stem: p for p in QDIR.glob('*.txt')}
    if 'ar-uthmani' in files and 'ar-clean' in files:
        u, c = read_pipe(files['ar-uthmani']), read_pipe(files['ar-clean'])
        if len(u) != 6236 or len(c) != 6236:
            errors.append(f'[quran] عدد الآيات غير صحيح: عثماني {len(u)}، مجرّد {len(c)}، والمتوقع 6236')
        quran = {k: {'uthmani': u.get(k, ''), 'clean': c.get(k, '')} for k in u}
    else:
        warn('ملفا القرآن العربي غير موجودين: ضع sources/quran/ar-uthmani.txt و ar-clean.txt')
    for lang in ('en', 'bn', 'ur'):
        if lang in files:
            t = read_pipe(files[lang])
            if len(t) != 6236:
                errors.append(f'[quran/{lang}.txt] عدد الآيات {len(t)} والمتوقع 6236')
            translations[lang] = t
        else:
            warn(f'ترجمة {lang} غير موجودة: sources/quran/{lang}.txt')
else:
    warn('مجلد sources/quran غير موجود؛ تخطيت القرآن')

# ------------------------------------------------------------------ test set
F = '02_testset.xlsx'
STATUSES = {'QURAN_VERIFIED', 'QURAN_WORDING_DIFFERS', 'HADITH_AUTHENTIC', 'HADITH_WEAK', 'HADITH_FABRICATED',
            'HADITH_MULTIPLE_RULINGS', 'NOT_FOUND', 'OUT_OF_SCOPE', 'REFER_TO_SCHOLAR'}
rows = read_sheet(F, 'الحالات'); unique_ids(F, rows)
testset = []
for r, x in rows:
    if not need(F, r, x, ['id', 'split', 'category', 'lang', 'kind', 'target_module', 'text', 'expected_status']):
        continue
    st, ref = x['expected_status'], x.get('expected_ref', '')
    if st not in STATUSES:
        err(F, r, f'حالة غير معروفة: {st}'); continue
    if st.startswith('QURAN'):
        if not re.fullmatch(r'\d{1,3}:\d{1,3}', ref):
            err(F, r, 'المرجع المتوقع للآية يجب أن يكون بصيغة سورة:آية مثل 51:56'); continue
        if quran and ref not in quran:
            err(F, r, f'الآية {ref} غير موجودة في المصحف'); continue
    if st.startswith('HADITH'):
        if ref not in hadith_ids:
            err(F, r, f'المرجع {ref or "(فارغ)"} غير موجود في فهرس الأحاديث'); continue
        if st != hadith_status[ref]:
            err(F, r, f'الحالة المتوقعة {st} تخالف المشتقة من أحكام الفهرس والخريطة ({hadith_status[ref]}) للحديث {ref}'); continue
    testset.append({k: x.get(k, '') for k in ('id', 'split', 'category', 'lang', 'kind', 'target_module', 'text',
                                              'expected_status', 'expected_ref', 'review_status', 'notes')})
unrev = sum(1 for t in testset if t['review_status'] != 'مقبول')
if unrev:
    warn(f'{unrev} حالة اختبار لم تُقبل بعد من المراجع الشرعي (سكربت القياس سيتجاهلها افتراضيًا)')

# ------------------------------------------------------------------ bayyinat
F = '03_bayyinat.xlsx'
rows = read_sheet(F, 'الأسئلة'); unique_ids(F, rows)
bayyinat = []
for r, x in rows:
    if need(F, r, x, ['id', 'question_ar', 'answer_ar', 'page']):
        bayyinat.append({k: x.get(k, '') for k in ('id', 'question_ar', 'answer_ar', 'page', 'topic', 'audience_tags', 'level')})

# ------------------------------------------------------------------ glossary
F = '04_glossary_project_ready.xlsx'
rows = read_sheet(F, 'المصطلحات'); unique_ids(F, rows)
glossary = []
for r, x in rows:
    if not need(F, r, x, ['id', 'term_ar', 'en', 'usage_note_ar', 'source', 'source_ref', 'verification_status',
                          'ai_usage_policy', 'bn_source']):
        continue
    glossary.append({
        'id': x['id'], 'term_ar': x['term_ar'], 'usage_note_ar': x['usage_note_ar'],
        'source_ref': x['source_ref'], 'verification_status': x['verification_status'],
        'ai_usage_policy': x['ai_usage_policy'], 'bn_source': x['bn_source'],
        'glossary_version': x.get('glossary_version', ''), 'verification_note': x.get('verification_note', ''),
        'required': x.get('required', 'نعم') == 'نعم', 'source': x['source'],
        'preferred': {l: split_multi(x.get(l, '').replace(' / ', ' || ')) for l in ('en', 'bn', 'ur')},
        'avoid': {l: split_multi(x.get(f'avoid_{l}', '')) for l in ('en', 'bn', 'ur')},
    })
for lang in ('bn', 'ur'):
    miss = sum(1 for g in glossary if not g['preferred'][lang])
    if miss:
        warn(f'{miss} مصطلحًا بلا مقابل بلغة {lang}')

# ------------------------------------------------------------------ audiences
F = '05_audiences_updated.xlsx'
rows = read_sheet(F, 'الجمهور'); unique_ids(F, rows)
audiences = []
for r, x in rows:
    if need(F, r, x, ['id', 'name_ar', 'language', 'background', 'prior_knowledge', 'entry_points', 'sensitivities',
                      'tone', 'country_or_region', 'religious_background', 'evidence_urls', 'review_status']):
        audiences.append({k: x.get(k, '') for k in ('id', 'name_ar', 'language', 'background', 'prior_knowledge',
                                                   'entry_points', 'examples_to_use', 'sensitivities', 'avoid', 'tone', 'sources',
                                                   'country_or_region', 'religious_background', 'evidence_urls',
                                                   'review_status', 'reviewer_note')})

# ------------------------------------------------------------------ write
def dump(rel, obj):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding='utf-8')

dump('hadith/index.json', hadith)
dump('hadith/ruling_map.json', [{'hadith_id': k[0], 'muhaddith': k[1], 'ruling_text': k[2], 'category': v['category'], 'reviewer_note': v['note']} for k, v in ruling_map.items()])
dump('testset.json', testset)
dump('bayyinat.json', bayyinat)
dump('glossary.json', glossary)
dump('audiences.json', audiences)
if quran:
    dump('quran/ar.json', quran)
for lang, t in translations.items():
    dump(f'quran/{lang}.json', t)

print('— الملخص —')
print(f'أحاديث: {len(hadith)} (خريطة أحكام: {len(ruling_map)}) | حالات اختبار: {len(testset)} (dev {sum(t["split"]=="dev" for t in testset)}) '
      f'| أسئلة بيّنات: {len(bayyinat)} | مصطلحات: {len(glossary)} | ملفات جمهور: {len(audiences)} '
      f'| آيات: {len(quran)} | ترجمات: {", ".join(translations) or "لا شيء"}')
for w in warnings:
    print('تنبيه:', w)
if errors:
    print(f'\n{len(errors)} خطأ — الصفوف الخاطئة لم تُكتب إلى data/:')
    for e in errors:
        print(' ✗', e)
    sys.exit(1)
print('\nلا أخطاء. الملفات جاهزة في data/')
