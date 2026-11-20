// الصرف: صياغة الأوزان ومشتقاتها
const HARAKAT = /[ً-ْٰ]/g;
const skel = s => (s || '').replace(HARAKAT, '');
const WEAK = 'اويءأؤئى';
const W = id => AWZAN.find(w => w.id === id);
const R = id => ROOTS.find(r => r.id === id);
const verbOf = (rid, w) => VERBS.find(v => v.r === rid && v.w === w);
const KINDS = { mu: 'المضارع', ms: 'المصدر', fa: 'اسم الفاعل', mf: 'اسم المفعول' };
const KIND_KEYS = ['mu', 'ms', 'fa', 'mf'];

// التاء في افتعل بعد حروف الإطباق والزاي
function iftaT(a) {
  if ('صضطظ'.includes(a)) return 'ط';
  if (a === 'ز') return 'د';
  return 'ت';
}
function canGenerate(root, wid) {
  const [a, b, c] = root.l;
  if (wid === 1 || wid === 9) return false;
  if ([a, b, c].some(x => WEAK.includes(x))) return false;
  if (b === c) return false;
  if (wid === 7 && 'لرمنوي'.includes(a)) return false;
  if (wid === 8 && 'دذثت'.includes(a)) return false;
  return true;
}
// [الماضي، المضارع، المصدر، اسم الفاعل، اسم المفعول]
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
// أنماط الوزن (بحروف ف ع ل)
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
  const v = verbOf(root.id, wid);
  const g = generateVerb(root, wid);
  const key = root.id + '-' + wid;
  let d = null, irregular = false;
  if (FORM_OVERRIDES[key]) { d = FORM_OVERRIDES[key]; irregular = true; }
  else if (wid === 1 && FORM1[root.id]) d = FORM1[root.id];
  else if (g) { const [a, b, c] = root.l; d = TPL[wid](a, b, c, iftaT(a)).slice(1); }
  const der = d ? { mu: d[0], ms: d[1], fa: d[2], mf: d[3] } : null;
  if (der && MASDAR_EXTRA[key]) der.ms = MASDAR_EXTRA[key] + ' وَ' + der.ms;
  if (v) return { kind: 'quran', text: v.v, v, der, irregular: irregular || !g || skel(g) !== skel(v.v) };
  if (g) return { kind: 'gen', text: g, der };
  return { kind: 'none', der: null };
}
// تشريح الفعل: الحروف الزائدة وحروف الجذر
function anatomy(root, wid) {
  const w = W(wid);
  return w.slots.map(s => s.z
    ? `<span class="z">${wid === 8 && s.z === 'تَ' ? iftaT(root.l[0]) + 'َ' : s.z}</span>`
    : `<span class="rl">${root.l[s.r]}${s.h}<small>${'فعل'[s.r]}</small></span>`).join('');
}
const nounsOf = (rid, w) => NOUNS.filter(n => n.r === rid && n.w === w);
