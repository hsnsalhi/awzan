// الصرف: صياغة الأوزان ومشتقاتها، وربطها ببيانات المدوّنة القرآنية
const HARAKAT = /[ً-ٰٟؐ-ؚۖ-ۭ]/g;
const skel = s => (s || '').replace(HARAKAT, '');
const norm = s => skel(s).replace(/[ٱأإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ـ/g, '').replace(/\s/g, '');
const show = s => (s || '').replace(/ٱ/g, 'ا');
const WEAK = 'اويءأؤئى';
const W = id => AWZAN.find(w => w.id === id);
const KINDS = { mu: 'المضارع', ms: 'المصدر', fa: 'اسم الفاعل', mf: 'اسم المفعول' };
const KIND_KEYS = ['mu', 'ms', 'fa', 'mf'];

// تُملأ بعد تحميل البيانات
let ROOTS = [], ROOT_BY_ID = {}, ROOT_BY_R = {}, SURAS = {}, META = {};
const R = id => ROOT_BY_ID[id];
const curOf = (r, w) => CURATED.find(v => v.r === r.r && v.w === w);

function iftaT(a) {
  if ('صضطظ'.includes(a)) return 'ط';
  if (a === 'ز') return 'د';
  return 'ت';
}
function canGenerate(root, wid) {
  if (root.l.length !== 3) return false;
  const [a, b, c] = root.l;
  if (wid === 1 || wid === 9) return false;
  if ([a, b, c].some(x => WEAK.includes(x))) return false;
  if (b === c) return false;
  if (wid === 7 && 'لرمنوي'.includes(a)) return false;
  if (wid === 8 && 'دذثت'.includes(a)) return false;
  return true;
}
const TPL = {
  2:  (a,b,c) => [a+'َ'+b+'َّ'+c+'َ', 'يُ'+a+'َ'+b+'ِّ'+c+'ُ', 'تَ'+a+'ْ'+b+'ِي'+c, 'مُ'+a+'َ'+b+'ِّ'+c, 'مُ'+a+'َ'+b+'َّ'+c],
  3:  (a,b,c) => [a+'َا'+b+'َ'+c+'َ', 'يُ'+a+'َا'+b+'ِ'+c+'ُ', 'مُ'+a+'َا'+b+'َ'+c+'َة', 'مُ'+a+'َا'+b+'ِ'+c, 'مُ'+a+'َا'+b+'َ'+c],
  4:  (a,b,c) => ['أَ'+a+'ْ'+b+'َ'+c+'َ', 'يُ'+a+'ْ'+b+'ِ'+c+'ُ', 'إِ'+a+'ْ'+b+'َا'+c, 'مُ'+a+'ْ'+b+'ِ'+c, 'مُ'+a+'ْ'+b+'َ'+c],
  5:  (a,b,c) => ['تَ'+a+'َ'+b+'َّ'+c+'َ', 'يَتَ'+a+'َ'+b+'َّ'+c+'ُ', 'تَ'+a+'َ'+b+'ُّ'+c, 'مُتَ'+a+'َ'+b+'ِّ'+c, 'مُتَ'+a+'َ'+b+'َّ'+c],
  6:  (a,b,c) => ['تَ'+a+'َا'+b+'َ'+c+'َ', 'يَتَ'+a+'َا'+b+'َ'+c+'ُ', 'تَ'+a+'َا'+b+'ُ'+c, 'مُتَ'+a+'َا'+b+'ِ'+c, 'مُتَ'+a+'َا'+b+'َ'+c],
  7:  (a,b,c) => ['اِنْ'+a+'َ'+b+'َ'+c+'َ', 'يَنْ'+a+'َ'+b+'ِ'+c+'ُ', 'اِنْ'+a+'ِ'+b+'َا'+c, 'مُنْ'+a+'َ'+b+'ِ'+c, ''],
  8:  (a,b,c,t) => ['اِ'+a+'ْ'+t+'َ'+b+'َ'+c+'َ', 'يَ'+a+'ْ'+t+'َ'+b+'ِ'+c+'ُ', 'اِ'+a+'ْ'+t+'ِ'+b+'َا'+c, 'مُ'+a+'ْ'+t+'َ'+b+'ِ'+c, 'مُ'+a+'ْ'+t+'َ'+b+'َ'+c],
  9:  (a,b,c) => ['اِ'+a+'ْ'+b+'َ'+c+'َّ', 'يَ'+a+'ْ'+b+'َ'+c+'ُّ', 'اِ'+a+'ْ'+b+'ِ'+c+'َا'+c, 'مُ'+a+'ْ'+b+'َ'+c+'ّ', ''],
  10: (a,b,c) => ['اِسْتَ'+a+'ْ'+b+'َ'+c+'َ', 'يَسْتَ'+a+'ْ'+b+'ِ'+c+'ُ', 'اِسْتِ'+a+'ْ'+b+'َا'+c, 'مُسْتَ'+a+'ْ'+b+'ِ'+c, 'مُسْتَ'+a+'ْ'+b+'َ'+c],
};
function patterns(wid) {
  if (wid === 1) return { v: 'فَعَلَ / فَعِلَ / فَعُلَ', mu: 'يَفْعُلُ / يَفْعِلُ / يَفْعَلُ', ms: 'سماعي', fa: 'فَاعِل', mf: 'مَفْعُول' };
  const [v, mu, ms, fa, mf] = TPL[wid]('ف', 'ع', 'ل', 'ت');
  return { v, mu, ms, fa, mf };
}
function generateVerb(root, wid) {
  if (!canGenerate(root, wid)) return null;
  const [a, b, c] = root.l;
  return TPL[wid](a, b, c, iftaT(a))[0];
}
// كل ما يخصّ الجذر في الوزن
function formFor(root, wid) {
  const att = root.f[wid], cur = curOf(root, wid), g = generateVerb(root, wid);
  const key = root.r + '-' + wid;
  let d = null, overridden = false;
  if (FORM_OVERRIDES[key]) { d = FORM_OVERRIDES[key]; overridden = true; }
  else if (wid === 1 && FORM1[root.r]) d = FORM1[root.r];
  else if (g) { const [a, b, c] = root.l; d = TPL[wid](a, b, c, iftaT(a)).slice(1); }
  const der = d ? { mu: d[0], ms: d[1], fa: d[2], mf: d[3] } : { mu: '', ms: '', fa: '', mf: '' };
  if (MASDAR_EXTRA[key] && der.ms) der.ms = MASDAR_EXTRA[key] + ' وَ' + der.ms;
  // أسماء مشتقة وردت في القرآن من هذا الوزن
  const qn = root.n.filter(n => n[0] === wid).map(([, k, lem, count]) => ({ k, lem: show(lem), count }));
  if (att) {
    const text = cur ? cur.v : (g || show(att.lem));
    const irregular = overridden || !g || skel(g) !== skel(text);
    return { kind: 'quran', text, count: att.count, cur, der, qn, irregular, lem: show(att.lem) };
  }
  if (g) return { kind: 'gen', text: g, der, qn };
  return { kind: 'none', der: null, qn };
}
function anatomy(root, wid) {
  return W(wid).slots.map(s => s.z
    ? `<span class="z">${wid === 8 && s.z === 'تَ' ? iftaT(root.l[0]) + 'َ' : s.z}</span>`
    : `<span class="rl">${root.l[s.r]}${s.h}<small>${'فعل'[s.r]}</small></span>`).join('');
}

// ===== التحميل
const cache = { roots: {}, suras: {} };
const getJSON = url => fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.json(); });
async function loadWall() {
  const d = await getJSON('data/wall.json');
  META = d.meta;
  META.suras.forEach(([n, name]) => { SURAS[n] = name; SURAS[norm(name)] = n; });
  ROOTS = d.roots.map(x => {
    const f = {};
    x.f.forEach(([w, lem, count]) => f[w] = { lem, count });
    const r = { id: x.id, r: x.r, l: x.l, f, n: x.n };
    r.total = Object.values(f).reduce((s, v) => s + v.count, 0);
    return r;
  });
  ROOTS.forEach(r => { ROOT_BY_ID[r.id] = r; ROOT_BY_R[r.r] = r; });
}
async function loadRoot(id) {
  return cache.roots[id] || (cache.roots[id] = await getJSON(`data/roots/${id}.json`));
}
async function loadSura(n) {
  return cache.suras[n] || (cache.suras[n] = await getJSON(`data/quran/${n}.json`));
}
// موضع "سورة:آية:كلمة" ← نصّ الآية مع إضاءة الكلمة
async function verseHTML(loc) {
  const [s, a, w] = loc.split(':').map(Number);
  const q = await loadSura(s);
  const words = q.v[a - 1].map((t, i) => i === w - 1 ? `<mark>${t}</mark>` : t).join(' ');
  return `<div class="ayah">${words} <span class="an">﴿${String(a).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d])}﴾</span><span class="ref">${SURAS[s]} · ${a}</span></div>`;
}
// المرجع المختار في الشرح ← موضع في المدوّنة
function curatedLoc(cur, verb) {
  if (!cur || !verb) return null;
  const [name, ay] = cur.s.split(':').map(x => x.trim());
  const sn = SURAS[norm(name)], a = parseInt(ay);
  const locs = verb.forms.flatMap(f => f.locs);
  return locs.find(l => { const [x, y] = l.split(':').map(Number); return x === sn && (y === a || y === a + 1); }) || null;
}
