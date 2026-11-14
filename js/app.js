(() => {
const $ = s => document.querySelector(s);
const W = id => AWZAN.find(w => w.id === id);
const R = id => ROOTS.find(r => r.id === id);
const HARAKAT = /[ً-ْٰ]/g;
const skel = s => (s || '').replace(HARAKAT, '');
const AR_NUM = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const WEAK = 'اويءأؤئى';

const verbOf = (rid, w) => VERBS.find(v => v.r === rid && v.w === w);
const verbsOfWazn = w => VERBS.filter(v => v.w === w);

// صياغة قياسية للوزن من الجذر (للجذور السالمة فقط)
function generate(root, wid) {
  const [a, b, c] = root.l;
  if (wid === 1 || wid === 9) return null;            // المجرد سماعي، وافعلّ للألوان فقط
  if ([a, b, c].some(x => WEAK.includes(x))) return null;
  if (b === c) return null;                          // مضعّف
  if (wid === 7 && 'لرمنوي'.includes(a)) return null;
  let slots = W(wid).slots.map(s => s.z ? s.z : root.l[s.r] + s.h);
  if (wid === 8) {
    if ('صضطظ'.includes(a)) slots[2] = 'طَ';
    else if (a === 'ز') slots[2] = 'دَ';
    else if ('دذثت'.includes(a)) return null;
  }
  return slots.join('');
}
function formFor(root, wid) {
  const v = verbOf(root.id, wid);
  const g = generate(root, wid);
  if (v) return { kind: 'quran', text: v.v, v, irregular: !g || skel(g) !== skel(v.v), gen: g };
  if (g) return { kind: 'gen', text: g };
  return { kind: 'none' };
}
const ayahHTML = a => a.replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');

// ===== التبويبات
document.querySelectorAll('.tab').forEach(t => t.onclick = () => showView(t.dataset.view));
function showView(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === id));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === id));
  if (id === 'quiz' && !quiz.cur) nextQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== المصهر
const state = { root: 'غفر', wazn: 10 };
function renderRoots() {
  $('#rootList').innerHTML = ROOTS.map(r =>
    `<button class="chip ${r.id === state.root ? 'active' : ''}" data-r="${r.id}">${r.l.join(' ')}</button>`).join('');
  $('#rootList').querySelectorAll('.chip').forEach(c => c.onclick = () => { state.root = c.dataset.r; refreshForge(); });
}
function renderWazns() {
  const root = R(state.root);
  $('#waznList').innerHTML = AWZAN.map(w => {
    const f = formFor(root, w.id);
    return `<button class="wcard ${w.id === state.wazn ? 'active' : ''} ${f.kind === 'quran' ? '' : 'dim'}" style="--c:${w.color}" data-w="${w.id}">
      <span class="n">${AR_NUM(w.id)}${f.kind === 'quran' ? ' ✦' : ''}</span>
      <div class="p">${w.pattern}</div><div class="s">${w.short}</div></button>`;
  }).join('');
  $('#waznList').querySelectorAll('.wcard').forEach(c => c.onclick = () => { state.wazn = +c.dataset.w; refreshForge(); });
}
function renderAnvil() {
  const root = R(state.root), w = W(state.wazn);
  $('#ingots').innerHTML = root.l.map((l, i) => `<div class="ingot" data-i="${i}">${l}</div>`).join('');
  $('#rootGloss').textContent = root.g;
  $('#moldName').textContent = w.pattern;
  const ph = ['ف', 'ع', 'ل'];
  $('#mold').innerHTML = w.slots.map(s => s.z
    ? `<div class="slot zaid">${s.z}</div>`
    : `<div class="slot root" data-r="${s.r}">${ph[s.r]}${s.h}<span class="ph">${ph[s.r]}</span></div>`).join('');
}
function refreshForge() {
  renderRoots(); renderWazns(); renderAnvil();
  $('#result').classList.add('hidden');
  $('#pourBtn').disabled = false;
}

$('#pourBtn').onclick = pour;
function pour() {
  const btn = $('#pourBtn'); btn.disabled = true;
  const root = R(state.root), w = W(state.wazn);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slots = [...document.querySelectorAll('#mold .slot.root')];
  let delay = 0;
  slots.forEach(slot => {
    const i = +slot.dataset.r;
    const src = document.querySelector(`#ingots .ingot[data-i="${i}"]`);
    const h = w.slots.find(s => s.r === i).h;
    const fill = () => { slot.classList.remove('root'); slot.classList.add('filled'); slot.innerHTML = root.l[i] + h; };
    if (reduce) { fill(); return; }
    const a = src.getBoundingClientRect(), b = slot.getBoundingClientRect();
    const fl = src.cloneNode(true); fl.classList.add('flyer');
    Object.assign(fl.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    setTimeout(() => {
      document.body.appendChild(fl);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        fl.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width})`;
      }));
      setTimeout(() => { fl.remove(); fill(); }, 720);
    }, delay);
    delay += 260;
  });
  setTimeout(() => {
    document.querySelectorAll('#mold .slot').forEach(s => s.classList.add('cool'));
    showResult(); btn.disabled = false;
  }, reduce ? 0 : delay + 750);
}

function wMeaningsHTML(w) {
  return `<ul class="meanings" style="--c:${w.color}">${w.meanings.map(([t, d]) => `<li><b>${t}:</b> ${d}</li>`).join('')}</ul>`;
}
function familyHTML(root, curW) {
  return `<div class="family">${AWZAN.map(w => {
    const f = formFor(root, w.id);
    if (f.kind === 'none') return '';
    return `<button class="fam ${f.kind === 'quran' ? 'on' : ''} ${w.id === curW ? 'cur' : ''}" style="--c:${w.color}" data-w="${w.id}" title="${w.pattern}">${f.text}</button>`;
  }).join('')}</div>`;
}
function compareHTML(wid, exceptRoot) {
  const list = verbsOfWazn(wid).filter(v => v.r !== exceptRoot);
  if (!list.length) return '<p class="gloss">لا توجد أمثلة أخرى في المصهر لهذا الوزن بعد.</p>';
  const c = W(wid).color;
  return `<div class="compare">${list.map(v => `<div class="cmp" style="--c:${c}" data-r="${v.r}" data-w="${v.w}">
    <div class="v">${v.v}</div><div class="m">${v.m}</div></div>`).join('')}</div>`;
}

function showResult() {
  const root = R(state.root), w = W(state.wazn), f = formFor(root, w.id);
  const el = $('#result');
  let main;
  if (f.kind === 'quran') {
    const v = f.v;
    main = `<div class="card verb-hero">
        <div class="verb-big">${v.v}</div>
        <div>
          <span class="tag ok">✦ ورد في القرآن الكريم</span>
          <span class="tag w" style="--c:${w.color}">وزن ${w.pattern}</span>
          ${f.irregular ? '<span class="tag">تغيّر في الصيغة</span>' : ''}
          <div class="meaning">المعنى: <b>${v.m}</b></div>
          <div class="why">◀ ${v.y}</div>
        </div>
      </div>
      <div class="card"><div class="ayah">﴿ ${ayahHTML(v.a)} ﴾</div><span class="ref">${v.s}</span></div>`;
  } else if (f.kind === 'gen') {
    main = `<div class="card verb-hero"><div class="verb-big" style="opacity:.6">${f.text}</div>
      <div><span class="tag no">صيغة قياسية — لم ترد في القرآن من هذا الجذر</span>
      <div class="meaning">هذا ما يُخرجه القالب نظريًا. جرّب قالبًا مضيئًا ✦ لترى فعلًا قرآنيًا.</div></div></div>`;
  } else {
    main = `<div class="card"><span class="tag no">لا يُصاغ هذا القالب من هذا الجذر هنا</span>
      <p class="meaning">إمّا لأن الجذر معتلّ أو مضعّف فتتغيّر صورته، أو لأن الوزن خاصّ بمعانٍ معيّنة (مثل الألوان في اِفْعَلَّ). اختر قالبًا مضيئًا ✦.</p></div>`;
  }
  el.innerHTML = main + `
    <div class="card"><h3>معاني قالب ${w.pattern}</h3>${wMeaningsHTML(w)}</div>
    <div class="card"><h3>عائلة الجذر ${root.l.join(' ')} في القوالب</h3>${familyHTML(root, w.id)}</div>
    <div class="card"><h3>قارِن: أفعال قرآنية أخرى على وزن ${w.pattern}</h3>${compareHTML(w.id, root.id)}</div>`;
  el.classList.remove('hidden');
  el.querySelectorAll('.fam').forEach(b => b.onclick = () => { state.wazn = +b.dataset.w; refreshForge(); setTimeout(pour, 50); });
  el.querySelectorAll('.cmp').forEach(b => b.onclick = () => openVerb(b.dataset.r, +b.dataset.w));
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== النافذة
function openModal(html) {
  $('#modalBody').innerHTML = html; $('#modal').classList.remove('hidden');
}
$('#modal').onclick = e => { if (e.target.id === 'modal' || e.target.classList.contains('close')) $('#modal').classList.add('hidden'); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#modal').classList.add('hidden'); });

function openVerb(rid, wid) {
  const v = verbOf(rid, wid), w = W(wid), root = R(rid);
  openModal(`<div class="verb-hero"><div class="verb-big">${v.v}</div>
      <div><span class="tag w" style="--c:${w.color}">وزن ${w.pattern}</span> <span class="tag">الجذر: ${root.l.join(' ')}</span>
      <div class="meaning">المعنى: <b>${v.m}</b></div><div class="why">◀ ${v.y}</div></div></div>
    <div class="ayah" style="margin-top:12px">﴿ ${ayahHTML(v.a)} ﴾</div><span class="ref">${v.s}</span>
    <p style="text-align:center"><button class="pour" id="toForge">افتحه في المصهر ⚒</button></p>`);
  $('#toForge').onclick = () => { state.root = rid; state.wazn = wid; $('#modal').classList.add('hidden'); showView('forge'); refreshForge(); setTimeout(pour, 300); };
}
function openWazn(wid) {
  const w = W(wid);
  openModal(`<h3 style="font-size:30px;font-family:var(--f-q);color:${w.color}">${w.pattern} <small style="font:14px var(--f-ui);color:var(--muted)">— ${w.name}</small></h3>
    ${wMeaningsHTML(w)}<h3 style="margin-top:16px">أفعال قرآنية على هذا الوزن</h3>${compareHTML(wid, null)}`);
  $('#modalBody').querySelectorAll('.cmp').forEach(b => b.onclick = () => openVerb(b.dataset.r, +b.dataset.w));
}

// ===== الشبكة
function renderGrid() {
  const head = `<tr><th class="rh">الجذر</th>${AWZAN.map(w => `<th style="--c:${w.color}" data-w="${w.id}">${w.pattern}<small>${w.short}</small></th>`).join('')}</tr>`;
  const rows = ROOTS.map(r => `<tr data-r="${r.id}"><th class="rh" title="${r.g}">${r.l.join(' ')}</th>${AWZAN.map(w => {
    const f = formFor(r, w.id);
    if (f.kind === 'quran') return `<td class="on" style="--c:${w.color}" data-r="${r.id}" data-w="${w.id}" title="${f.v.m}">${f.text}</td>`;
    if (f.kind === 'gen') return `<td class="gen" data-w="${w.id}">${f.text}</td>`;
    return `<td class="none" data-w="${w.id}">·</td>`;
  }).join('')}</tr>`).join('');
  const t = $('#gridTable'); t.innerHTML = head + rows;
  t.querySelectorAll('td.on').forEach(td => td.onclick = () => openVerb(td.dataset.r, +td.dataset.w));
  t.querySelectorAll('thead th[data-w], tr:first-child th[data-w]').forEach(th => {
    th.onclick = () => openWazn(+th.dataset.w);
    th.onmouseenter = () => t.querySelectorAll(`td[data-w="${th.dataset.w}"]`).forEach(td => { td.style.setProperty('--c', W(+th.dataset.w).color); td.classList.add('colhl'); });
    th.onmouseleave = () => t.querySelectorAll('.colhl').forEach(td => td.classList.remove('colhl'));
  });
  t.querySelectorAll('th.rh').forEach(th => { const tr = th.parentElement; if (!tr.dataset.r) return;
    th.onclick = () => { state.root = tr.dataset.r; showView('forge'); refreshForge(); }; th.style.cursor = 'pointer'; });
}

// ===== الاختبار
const quiz = { score: 0, total: 0, streak: 0, cur: null };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];

function nextQuestion() {
  const v = pick(VERBS.filter(x => x !== quiz.cur?.v));
  const type = Math.random() < .5 ? 'wazn' : 'meaning';
  let opts, correct;
  if (type === 'wazn') {
    correct = W(v.w).pattern;
    opts = shuffle([correct, ...shuffle(AWZAN.filter(w => w.id !== v.w)).slice(0, 3).map(w => w.pattern)]);
  } else {
    correct = v.m;
    const others = [...new Set(shuffle(VERBS.filter(x => x.m !== v.m)).map(x => x.m))].slice(0, 3);
    opts = shuffle([correct, ...others]);
  }
  quiz.cur = { v, type, correct };
  const title = type === 'wazn'
    ? 'على أيّ وزن جاء الفعل المُضيء في الآية؟'
    : `ما معنى «${v.a.match(/\[\[(.+?)\]\]/)[1]}» في الآية؟ استعن بوزنه <span style="color:${W(v.w).color};font-family:var(--f-q)">${W(v.w).pattern}</span>`;
  $('#quizCard').innerHTML = `<p class="q-title">${title}</p>
    <div class="ayah">﴿ ${ayahHTML(v.a)} ﴾</div><span class="ref">${v.s}</span>
    <div class="opts">${opts.map(o => `<button class="opt ${type === 'meaning' ? 'small' : ''}">${o}</button>`).join('')}</div>
    <div class="feedback"></div>`;
  $('#quizCard').querySelectorAll('.opt').forEach(b => b.onclick = () => answer(b));
}
function answer(btn) {
  const { v, correct } = quiz.cur, w = W(v.w);
  const ok = btn.textContent === correct;
  quiz.total++; if (ok) { quiz.score++; quiz.streak++; } else quiz.streak = 0;
  $('#quizCard').querySelectorAll('.opt').forEach(b => { b.disabled = true; if (b.textContent === correct) b.classList.add('right'); });
  if (!ok) btn.classList.add('wrong');
  $('#qScore').textContent = AR_NUM(quiz.score); $('#qTotal').textContent = AR_NUM(quiz.total); $('#qStreak').textContent = AR_NUM(quiz.streak);
  $('#quizCard .feedback').innerHTML = `<div class="card">
      <b style="color:${ok ? '#9be08a' : '#ff9a8a'}">${ok ? 'أحسنت! ✔' : 'ليس تمامًا ✘'}</b>
      الفعل <b style="font-family:var(--f-q);font-size:20px">${v.v}</b> من الجذر (${R(v.r).l.join(' ')}) على وزن
      <b style="color:${w.color};font-family:var(--f-q);font-size:20px">${w.pattern}</b>، ومعناه: ${v.m}.
      <div class="why">◀ ${v.y}</div></div>
    <button class="pour next">السؤال التالي ←</button>`;
  $('#quizCard .next').onclick = nextQuestion;
}

// ===== البدء
renderGrid();
refreshForge();
})();
