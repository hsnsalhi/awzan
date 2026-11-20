(() => {
const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const ayahHTML = a => a.replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');
const deg = Math.PI / 180;
const P = (r, t) => [r * Math.cos(t * deg), r * Math.sin(t * deg)];
const pts = arr => arr.map(p => p.map(n => n.toFixed(2)).join(',')).join(' ');
const ang = i => -90 - i * 36;              // البتلة الأولى في الأعلى ثم عكس عقارب الساعة

// ===== هندسة النجمة العشرية
function kite(i, R, r0, rm, k = 0.9) {
  const t = ang(i);
  const q = [P(r0, t), P(rm, t - 18), P(R, t), P(rm, t + 18)];
  const cx = q.reduce((s, p) => s + p[0], 0) / 4, cy = q.reduce((s, p) => s + p[1], 0) / 4;
  return q.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
}
function starOutline(R, rm) {
  const a = [];
  for (let i = 0; i < 10; i++) { const t = ang(i); a.push(P(R, t), P(rm, t - 18)); }
  return a;
}
function rosetteSVG(root, R, opts = {}) {
  const r0 = R * 0.36, rm = R * 0.62;
  let s = `<polygon class="grout" points="${pts(starOutline(R * 1.04, rm * 1.04))}"/>`;
  AWZAN.forEach((w, i) => {
    const f = formFor(root, w.id);
    const k = pts(kite(i, R, r0, rm));
    s += `<polygon class="petal ${f.kind}" data-w="${w.id}" style="--c:${w.color}" points="${k}"/>`;
    if (f.kind === 'quran') s += `<polygon class="glaze" points="${k}"/>`;
  });
  s += `<polygon class="core" points="${pts(Array.from({ length: 10 }, (_, i) => P(r0 * 0.98, ang(i) + 18)))}"/>`;
  s += `<text class="letters" y="${R * 0.07}" font-size="${R * 0.22}">${root.l.join(' ')}</text>`;
  if (opts.labels) {
    AWZAN.forEach((w, i) => {
      const f = formFor(root, w.id), t = ang(i);
      const [x, y] = P(R * 1.2, t);
      s += `<g class="lab ${f.kind}" data-w="${w.id}" style="--c:${w.color}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
        <text class="lv" font-size="${R * 0.12}" y="${-R * 0.02}">${f.kind === 'none' ? '—' : f.text}</text>
        <text class="lp" font-size="${R * 0.065}" y="${R * 0.1}">${w.pattern}</text></g>`;
    });
  }
  return s;
}

// ===== الجدار
const GLAZE = `<linearGradient id="glaze" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>`;
const wall = $('#wall');
const TILE_R = 100, GAP = 218;
let tiles = [];
function layoutWall() {
  const n = ROOTS.length, ar = innerWidth / Math.max(innerHeight - 170, 200);
  const cols = Math.max(3, Math.round(Math.sqrt(n * ar * 1.1)));
  tiles = ROOTS.map((r, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    return { r, x: col * GAP + (row % 2 ? GAP / 2 : 0), y: row * GAP * 0.88 };
  });
}
function renderWall() {
  layoutWall();
  const cx = tiles.reduce((s, t) => s + t.x, 0) / tiles.length, cy = tiles.reduce((s, t) => s + t.y, 0) / tiles.length;
  let s = `<defs>
    ${GLAZE}
    <pattern id="zl" width="${GAP / 2}" height="${GAP * 0.44}" patternUnits="userSpaceOnUse">
      <path d="M${GAP / 4} 0 L${GAP / 2} ${GAP * 0.22} L${GAP / 4} ${GAP * 0.44} L0 ${GAP * 0.22}Z" fill="none" stroke="#c9a22722" stroke-width="1"/>
    </pattern></defs>
    <rect x="-4000" y="-4000" width="9000" height="9000" fill="url(#zl)"/>`;
  // نجيمات الوصل بين البلاطات
  tiles.forEach((t, i) => {
    const d = Math.hypot(t.x - cx, t.y - cy);
    s += `<g class="tile" data-r="${t.r.id}" transform="translate(${t.x},${t.y})" style="animation-delay:${(d * 1.4).toFixed(0)}ms">
      <g class="in">${rosetteSVG(t.r, TILE_R)}</g></g>`;
  });
  wall.innerHTML = s;
  wall.querySelectorAll('.tile').forEach(g => {
    g.addEventListener('click', () => { if (!drag.moved) openRose(g.dataset.r); });
    g.addEventListener('pointerenter', e => showTip(g.dataset.r, e));
    g.addEventListener('pointermove', moveTip);
    g.addEventListener('pointerleave', hideTip);
  });
  fit();
}

// ===== التكبير والتحريك
let vb = { x: 0, y: 0, w: 1000, h: 1000 };
const setVB = () => wall.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
function fit() {
  const xs = tiles.map(t => t.x), ys = tiles.map(t => t.y), pad = TILE_R * 1.4;
  const bx = Math.min(...xs) - pad, by = Math.min(...ys) - pad - 90, bw = Math.max(...xs) - Math.min(...xs) + 2 * pad, bh = Math.max(...ys) - Math.min(...ys) + 2 * pad + 170;
  const ar = innerWidth / innerHeight;
  if (bw / bh > ar) vb = { x: bx, y: by + bh / 2 - bw / ar / 2, w: bw, h: bw / ar };
  else vb = { x: bx + bw / 2 - bh * ar / 2, y: by, w: bh * ar, h: bh };
  setVB();
}
function zoomAt(f, px = innerWidth / 2, py = innerHeight / 2) {
  const mx = vb.x + px / innerWidth * vb.w, my = vb.y + py / innerHeight * vb.h;
  const nw = Math.min(Math.max(vb.w * f, 250), 12000);
  f = nw / vb.w;
  vb = { x: mx - (mx - vb.x) * f, y: my - (my - vb.y) * f, w: nw, h: vb.h * f }; setVB();
}
wall.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.deltaY > 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }, { passive: false });
const drag = { ptrs: new Map(), moved: false };
wall.addEventListener('pointerdown', e => { drag.ptrs.set(e.pointerId, [e.clientX, e.clientY]); drag.moved = false; drag.start = [e.clientX, e.clientY]; });
addEventListener('pointermove', e => {
  if (!drag.ptrs.has(e.pointerId)) return;
  const prev = drag.ptrs.get(e.pointerId);
  if (drag.ptrs.size === 1) {
    if (Math.hypot(e.clientX - drag.start[0], e.clientY - drag.start[1]) > 6) drag.moved = true;
    if (drag.moved) { vb.x -= (e.clientX - prev[0]) / innerWidth * vb.w; vb.y -= (e.clientY - prev[1]) / innerHeight * vb.h; setVB(); hideTip(); }
  } else if (drag.ptrs.size === 2) {
    const [a, b] = [...drag.ptrs.values()];
    const other = a === prev ? b : a;
    const d0 = Math.hypot(prev[0] - other[0], prev[1] - other[1]), d1 = Math.hypot(e.clientX - other[0], e.clientY - other[1]);
    if (d0 > 0) zoomAt(d0 / d1, (e.clientX + other[0]) / 2, (e.clientY + other[1]) / 2);
    drag.moved = true;
  }
  drag.ptrs.set(e.pointerId, [e.clientX, e.clientY]);
});
['pointerup', 'pointercancel'].forEach(t => addEventListener(t, e => drag.ptrs.delete(e.pointerId)));
document.querySelectorAll('.zoom button').forEach(b => b.onclick = () => b.dataset.z === 'fit' ? fit() : zoomAt(b.dataset.z === 'in' ? 0.75 : 1.33));
addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(() => { renderWall(); setFilterClasses(); }, 150); });

// ===== التلميح
const tip = $('#tip');
function showTip(rid, e) {
  const r = R(rid), n = VERBS.filter(v => v.r === rid).length;
  tip.innerHTML = `<b>${r.l.join(' ')}</b> — ${r.g}<br><small>${AR(n)} ${n > 2 && n < 11 ? 'أوزان' : 'وزن'} في القرآن · انقر للفتح</small>`;
  tip.classList.remove('hidden'); moveTip(e);
}
function moveTip(e) { tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY - 14 + 'px'; }
function hideTip() { tip.classList.add('hidden'); }

// ===== مرشّح الأوزان
let filter = null;
function renderFilters() {
  $('#filters').innerHTML = `<button class="f ${filter ? '' : 'on'}" data-w="0">الكل</button>` + AWZAN.map(w =>
    `<button class="f ${filter === w.id ? 'on' : ''}" data-w="${w.id}" style="--c:${w.color}"><i></i>${w.pattern}</button>`).join('');
  $('#filters').querySelectorAll('.f').forEach(b => b.onclick = () => setFilter(+b.dataset.w || null));
}
function setFilterClasses() {
  wall.classList.toggle('filtering', !!filter);
  wall.querySelectorAll('.petal').forEach(p => p.classList.toggle('hit', +p.dataset.w === filter));
}
function setFilter(w) {
  filter = filter === w ? null : w;
  setFilterClasses();
  renderFilters();
  if (filter) openWaznPanel(filter); else closeSide();
}

// ===== لوحة الوزن
function waznPanelHTML(wid, exceptRoot) {
  const w = W(wid), p = patterns(wid);
  const vs = VERBS.filter(v => v.w === wid && v.r !== exceptRoot), ns = NOUNS.filter(n => n.w === wid);
  return `<div class="wz-head" style="--c:${w.color}"><div class="wz-p">${w.pattern}</div><div><b>${w.name}</b><br><span>${AR(VERBS.filter(v => v.w === wid).length)} فعلًا في الجدار</span></div></div>
    <ul class="meanings" style="--c:${w.color}">${w.meanings.map(([t, d]) => `<li><b>${t}</b> ${d}</li>`).join('')}</ul>
    <h3>قوالب الوزن</h3>
    <div class="ptable" style="--c:${w.color}">
      <div><span>الماضي</span><b>${p.v}</b></div>
      ${KIND_KEYS.filter(k => p[k]).map(k => `<div><span>${KINDS[k]}</span><b>${p[k]}</b></div>`).join('')}
    </div>
    <h3>${exceptRoot ? 'قارِن بأفعال أخرى على الوزن نفسه' : 'أفعال قرآنية على هذا الوزن'}</h3>
    <div class="vlist">${vs.map(v => `<button class="vchip" style="--c:${w.color}" data-r="${v.r}" data-w="${v.w}"><b>${v.v}</b><span>${v.m}</span></button>`).join('') || '<p class="muted">لا أمثلة أخرى بعد.</p>'}</div>
    ${ns.length ? `<h3>أسماء من هذا الوزن في القرآن</h3><div class="vlist">${ns.map(n => `<button class="vchip" style="--c:${w.color}" data-r="${n.r}" data-w="${n.w}"><b>${n.t}</b><span>${KINDS[n.k]} · ${n.s}</span></button>`).join('')}</div>` : ''}`;
}
function bindChips(el) {
  el.querySelectorAll('.vchip').forEach(b => b.onclick = () => openRose(b.dataset.r, +b.dataset.w));
}
function openWaznPanel(wid) {
  $('#sideBody').innerHTML = waznPanelHTML(wid);
  bindChips($('#sideBody'));
  $('#side').classList.remove('hidden');
}
function closeSide() { $('#side').classList.add('hidden'); }
$('#side .x').onclick = () => { closeSide(); if (filter) setFilter(filter); };

// ===== النجمة المفتوحة
let cur = { root: null, w: null };
function openRose(rid, wid) {
  const root = R(rid);
  cur.root = rid;
  if (!wid) { const first = AWZAN.find(w => verbOf(rid, w.id)); wid = first ? first.id : 1; }
  const svg = $('#roseSvg');
  svg.innerHTML = `<defs>${GLAZE}</defs>
    <circle class="halo" r="245"/>${rosetteSVG(root, 200, { labels: true })}`;
  svg.querySelectorAll('.petal, .lab').forEach(p => p.addEventListener('click', () => selectPetal(+p.dataset.w)));
  $('#rose').classList.remove('hidden');
  $('#rose').classList.remove('enter'); void $('#rose').offsetWidth; $('#rose').classList.add('enter');
  hideTip(); $('#results').classList.add('hidden');
  selectPetal(wid);
}
function selectPetal(wid) {
  cur.w = wid;
  const root = R(cur.root), w = W(wid), f = formFor(root, wid);
  $('#roseSvg').querySelectorAll('.petal, .lab').forEach(p => p.classList.toggle('sel', +p.dataset.w === wid));
  const ns = nounsOf(root.id, wid);
  let body = `<div class="rp-root"><b>${root.l.join(' ')}</b> <span>${root.g}</span></div>
    <div class="rp-w" style="--c:${w.color}"><span class="wz-p sm">${w.pattern}</span> ${w.short}</div>`;
  if (f.kind === 'none') {
    body += `<div class="card muted">لا يُصاغ هذا الوزن من هذا الجذر قياسيًا (جذر معتلّ أو مضعّف، أو وزن خاصّ بالألوان). اختر بتلة مضيئة.</div>`;
  } else {
    const regular = !f.irregular && wid !== 1;
    body += `<div class="big-verb" style="--c:${w.color}">${f.text}</div>
      ${regular ? `<div class="anat" style="--c:${w.color}">${anatomy(root, wid)}</div>` : ''}
      <div class="tags">${f.kind === 'quran' ? '<span class="tag ok">✦ ورد في القرآن</span>' : '<span class="tag no">صيغة قياسية لم ترد في القرآن</span>'}
      ${!f.irregular && wid !== 1 ? '<span class="tag"><i class="dot z"></i>حروف زائدة <i class="dot rl"></i>حروف الجذر</span>' : ''}
      ${f.irregular && wid !== 1 ? '<span class="tag">تغيّرت الصيغة (إعلال/إدغام/إبدال)</span>' : ''}</div>`;
    if (f.kind === 'quran') body += `<p class="mean">المعنى: <b>${f.v.m}</b></p><p class="why" style="--c:${w.color}">◀ ${f.v.y}</p>
      <div class="ayah">﴿ ${ayahHTML(f.v.a)} ﴾<span class="ref">${f.v.s}</span></div>`;
    if (f.der) {
      const p = patterns(wid);
      body += `<h3>المشتقّات · أوزان الأسماء</h3><div class="ders" style="--c:${w.color}">${KIND_KEYS.filter(k => f.der[k]).map(k => {
        const n = ns.find(x => x.k === k);
        return `<div class="der ${n ? 'q' : ''}" ${n ? `data-k="${k}"` : ''}><span>${KINDS[k]}</span><b>${f.der[k]}</b><small>${p[k]}</small>${n ? '<em>✦ في القرآن</em>' : ''}</div>`;
      }).join('')}</div><div id="nounAyah"></div>`;
    }
  }
  body += `<h3>معاني الوزن</h3><ul class="meanings" style="--c:${w.color}">${w.meanings.map(([t, d]) => `<li><b>${t}</b> ${d}</li>`).join('')}</ul>`;
  const others = VERBS.filter(v => v.w === wid && v.r !== root.id);
  body += `<h3>قارِن على وزن ${w.pattern}</h3><div class="vlist">${others.map(v => `<button class="vchip" style="--c:${w.color}" data-r="${v.r}" data-w="${v.w}"><b>${v.v}</b><span>${v.m}</span></button>`).join('') || '<p class="muted">لا أمثلة أخرى بعد.</p>'}</div>`;
  const panel = $('#rosePanel');
  panel.innerHTML = body; panel.scrollTop = 0;
  bindChips(panel);
  panel.querySelectorAll('.der.q').forEach(d => d.onclick = () => {
    const n = ns.find(x => x.k === d.dataset.k);
    $('#nounAyah').innerHTML = `<div class="ayah sm">﴿ ${ayahHTML(n.a)} ﴾<span class="ref">${n.s}</span></div>`;
  });
}
$('#rose .back').onclick = () => $('#rose').classList.add('hidden');

// ===== البحث
const norm = s => skel(s).replace(/[أإآٱ]/g, 'ا').replace(/\s/g, '');
$('#q').addEventListener('input', e => {
  const q = norm(e.target.value), box = $('#results');
  if (!q) { box.classList.add('hidden'); return; }
  const hits = [];
  ROOTS.forEach(r => { if (norm(r.id).includes(q)) hits.push({ r: r.id, label: r.l.join(' '), sub: 'جذر · ' + r.g }); });
  VERBS.forEach(v => { if (norm(v.v).includes(q) || norm(v.a.match(/\[\[(.+?)\]\]/)[1]).includes(q)) hits.push({ r: v.r, w: v.w, label: v.v, sub: 'فعل · ' + W(v.w).pattern }); });
  NOUNS.forEach(n => { if (norm(n.t).includes(q)) hits.push({ r: n.r, w: n.w, label: n.t, sub: KINDS[n.k] + ' · ' + W(n.w).pattern }); });
  box.innerHTML = hits.slice(0, 12).map(h => `<button data-r="${h.r}" data-w="${h.w || ''}"><b>${h.label}</b><span>${h.sub}</span></button>`).join('') || '<p class="muted">لا نتائج</p>';
  box.classList.remove('hidden');
  box.querySelectorAll('button').forEach(b => b.onclick = () => { openRose(b.dataset.r, +b.dataset.w || undefined); $('#q').value = ''; });
});

// ===== التحدّي
const quiz = { score: 0, total: 0, streak: 0, cur: null };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
function nextQ() {
  const t = pick(['wazn', 'meaning', 'noun']);
  let q;
  if (t === 'noun') {
    const n = pick(NOUNS), correct = patterns(n.w)[n.k];
    const pool = [...new Set(AWZAN.filter(w => w.id !== n.w).map(w => patterns(w.id)[n.k]).filter(x => x && x !== correct && x !== 'سماعي'))];
    q = { t, src: n, correct, opts: shuffle([correct, ...shuffle(pool).slice(0, 3)]),
      title: `«${n.t}» ${KINDS[n.k]}. على أيّ قالب صيغ؟` };
  } else {
    const v = pick(VERBS), w = W(v.w);
    if (t === 'wazn') q = { t, src: v, correct: w.pattern, opts: shuffle([w.pattern, ...shuffle(AWZAN.filter(x => x.id !== v.w)).slice(0, 3).map(x => x.pattern)]), title: 'على أيّ وزن جاء الفعل المضيء؟' };
    else q = { t, src: v, correct: v.m, opts: shuffle([v.m, ...[...new Set(shuffle(VERBS.filter(x => x.m !== v.m)).map(x => x.m))].slice(0, 3)]),
      title: `ما معنى الكلمة المضيئة؟ استعن بوزنها <span style="color:${w.color}">${w.pattern}</span>` };
  }
  quiz.cur = q;
  $('#quizCard').innerHTML = `<p class="q-title">${q.title}</p><div class="ayah">﴿ ${ayahHTML(q.src.a)} ﴾<span class="ref">${q.src.s}</span></div>
    <div class="opts">${q.opts.map(o => `<button class="opt ${q.t === 'meaning' ? 'sm' : ''}">${o}</button>`).join('')}</div><div class="fb"></div>`;
  $('#quizCard').querySelectorAll('.opt').forEach(b => b.onclick = () => answer(b));
}
function answer(btn) {
  const q = quiz.cur, ok = btn.textContent === q.correct, w = W(q.src.w);
  quiz.total++; ok ? (quiz.score++, quiz.streak++) : (quiz.streak = 0);
  $('#quizCard').querySelectorAll('.opt').forEach(b => { b.disabled = true; if (b.textContent === q.correct) b.classList.add('right'); });
  if (!ok) btn.classList.add('wrong');
  $('#qScore').textContent = AR(quiz.score); $('#qTotal').textContent = AR(quiz.total); $('#qStreak').textContent = AR(quiz.streak);
  const word = q.t === 'noun' ? q.src.t : q.src.v;
  $('#quizCard .fb').innerHTML = `<p><b class="${ok ? 'good' : 'bad'}">${ok ? 'أحسنت ✔' : 'ليس تمامًا ✘'}</b>
    «${word}» من الجذر (${R(q.src.r).l.join(' ')}) — وزن الفعل <b style="color:${w.color}">${w.pattern}</b>${q.t === 'noun' ? '' : `، ومعناه: ${q.src.m}`}.</p>
    ${q.src.y ? `<p class="why" style="--c:${w.color}">◀ ${q.src.y}</p>` : ''}
    <div class="qbtns"><button class="pill" id="qOpen">افتح النجمة</button><button class="pill solid" id="qNext">التالي ←</button></div>`;
  $('#qNext').onclick = nextQ;
  $('#qOpen').onclick = () => { $('#quiz').classList.add('hidden'); openRose(q.src.r, q.src.w); };
}
$('#quizBtn').onclick = () => { $('#quiz').classList.remove('hidden'); if (!quiz.cur) nextQ(); };
$('#quiz .x').onclick = () => $('#quiz').classList.add('hidden');

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  ['#quiz', '#rose', '#results'].some(s => { const el = $(s); if (!el.classList.contains('hidden')) { el.classList.add('hidden'); return true; } return false; }) || closeSide();
});

// ===== البدء
$('#sRoots').textContent = AR(ROOTS.length);
$('#sVerbs').textContent = AR(VERBS.length);
$('#sNouns').textContent = AR(NOUNS.length);
renderFilters();
renderWall();
setTimeout(() => $('#hint').classList.add('fade'), 9000);
})();
