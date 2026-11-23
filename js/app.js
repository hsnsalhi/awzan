(async () => {
const $ = s => document.querySelector(s);
const AR = n => String(n);   // chiffres 0123…
const deg = Math.PI / 180;
const P = (r, t) => [r * Math.cos(t * deg), r * Math.sin(t * deg)];
const pts = arr => arr.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
const ang = i => -90 - i * 36;
const ALPHA = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');
const letterOf = r => { const c = r.l[0]; return 'ءأإآا'.includes(c) ? 'أ' : c; };

// ===== هندسة النجمة العشرية
function kite(i, R, r0, rm, k = 0.9) {
  const t = ang(i), q = [P(r0, t), P(rm, t - 18), P(R, t), P(rm, t + 18)];
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
    const f = opts.labels ? formFor(root, w.id) : { kind: root.f[w.id] ? 'quran' : (canGenerate(root, w.id) ? 'gen' : 'none') };
    const k = pts(kite(i, R, r0, rm));
    s += `<polygon class="petal ${f.kind}" data-w="${w.id}" style="--c:${w.color}" points="${k}"/>`;
    if (f.kind === 'quran') s += `<polygon class="glaze" points="${k}"/>`;
  });
  s += `<polygon class="core" points="${pts(Array.from({ length: 10 }, (_, i) => P(r0 * 0.98, ang(i) + 18)))}"/>`;
  s += `<text class="letters" y="${R * 0.07}" font-size="${R * (root.l.length > 3 ? 0.17 : 0.22)}">${root.l.join(' ')}</text>`;
  if (opts.labels) AWZAN.forEach((w, i) => {
    const f = formFor(root, w.id), [x, y] = P(R * 1.2, ang(i));
    s += `<g class="lab ${f.kind}" data-w="${w.id}" style="--c:${w.color}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      <text class="lv" font-size="${R * 0.12}" y="${-R * 0.02}">${f.kind === 'none' ? '—' : f.text}</text>
      <text class="lp" font-size="${R * 0.065}" y="${R * 0.1}">${w.pattern}${f.count ? ' · ' + AR(f.count) : ''}</text></g>`;
  });
  return s;
}
const GLAZE = `<linearGradient id="glaze" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>`;

// ===== التحميل
try { await loadWall(); }
catch (e) { $('#loading').innerHTML = 'تعذّر تحميل البيانات. افتح الموقع عبر خادم (GitHub Pages) لا من ملف محلي.'; return; }
$('#loading').remove();

// ===== الجدار: بساتين بحسب الحرف الأول
const wall = $('#wall');
const TILE = 100, GAP = 210, HEAD = 150;
let groves = [], tilePos = {};
function layoutWall() {
  const by = {};
  ROOTS.forEach(r => (by[letterOf(r)] = by[letterOf(r)] || []).push(r));
  groves = ALPHA.filter(a => by[a]).map(a => {
    const list = by[a].sort((x, y) => y.total - x.total), n = list.length;
    const cols = Math.max(2, Math.ceil(Math.sqrt(n * 1.3)));
    const rows = Math.ceil(n / cols);
    return { a, list, cols, w: cols * GAP + GAP / 2 + 40, h: rows * GAP * 0.88 + HEAD + 40 };
  });
  const area = groves.reduce((s, g) => s + g.w * g.h, 0);
  const ar = innerWidth / Math.max(innerHeight - 170, 200);
  const maxW = Math.max(Math.sqrt(area * ar) * 1.05, Math.max(...groves.map(g => g.w)));
  let x = 0, y = 0, rowH = 0;
  groves.forEach(g => {
    if (x + g.w > maxW && x > 0) { x = 0; y += rowH + 60; rowH = 0; }
    g.x = maxW - x - g.w; g.y = y;            // من اليمين إلى اليسار
    x += g.w + 60; rowH = Math.max(rowH, g.h);
  });
  groves.forEach(g => g.list.forEach((r, i) => {
    const row = Math.floor(i / g.cols), col = i % g.cols;
    tilePos[r.id] = { x: g.x + g.w - 20 - GAP / 2 - col * GAP - (row % 2 ? GAP / 2 : 0), y: g.y + HEAD + GAP * 0.45 + row * GAP * 0.88 };
  }));
}
const sizeOf = r => TILE * Math.min(1.12, Math.max(0.62, 0.55 + 0.11 * Math.log2(1 + r.total)));
function renderWall() {
  layoutWall();
  let s = `<defs>${GLAZE}</defs>`;
  groves.forEach(g => {
    s += `<g class="grove" data-a="${g.a}"><rect class="gbg" x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="40"/>
      <text class="gletter" x="${g.x + g.w - 90}" y="${g.y + 125}">${g.a}</text>
      <text class="gcount" x="${g.x + g.w - 230}" y="${g.y + 100}">${AR(g.list.length)} جذرًا</text>`;
    g.list.forEach(r => {
      const p = tilePos[r.id];
      s += `<g class="tile" data-id="${r.id}" transform="translate(${p.x.toFixed(0)},${p.y.toFixed(0)})"><g class="in">${rosetteSVG(r, sizeOf(r))}</g></g>`;
    });
    s += '</g>';
  });
  wall.innerHTML = s;
  setFilterClasses();
}
wall.addEventListener('click', e => { const t = e.target.closest('.tile'); if (t && !drag.moved) openRose(t.dataset.id); });
wall.addEventListener('pointerover', e => { const t = e.target.closest('.tile'); if (t) showTip(t.dataset.id, e); });
wall.addEventListener('pointermove', e => { if (e.target.closest('.tile')) moveTip(e); else hideTip(); });
wall.addEventListener('pointerleave', hideTip);

// ===== التكبير والتحريك
let vb = { x: 0, y: 0, w: 1000, h: 1000 };
const setVB = () => wall.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
function fitBox(bx, by, bw, bh, animate) {
  const ar = innerWidth / innerHeight;
  let t = bw / bh > ar ? { x: bx, y: by + bh / 2 - bw / ar / 2, w: bw, h: bw / ar } : { x: bx + bw / 2 - bh * ar / 2, y: by, w: bh * ar, h: bh };
  if (!animate) { vb = t; setVB(); return; }
  const a = { ...vb }, t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3);
    vb = { x: a.x + (t.x - a.x) * e, y: a.y + (t.y - a.y) * e, w: a.w + (t.w - a.w) * e, h: a.h + (t.h - a.h) * e }; setVB();
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function fit(animate) {
  const xs = groves.map(g => g.x), ys = groves.map(g => g.y);
  const bx = Math.min(...xs) - 40, by = Math.min(...ys) - 160;
  fitBox(bx, by, Math.max(...groves.map(g => g.x + g.w)) - bx + 40, Math.max(...groves.map(g => g.y + g.h)) - by + 140, animate);
}
function flyTo(a) { const g = groves.find(g => g.a === a); if (g) fitBox(g.x - 40, g.y - 260, g.w + 80, g.h + 400, true); }
function zoomAt(f, px = innerWidth / 2, py = innerHeight / 2) {
  const mx = vb.x + px / innerWidth * vb.w, my = vb.y + py / innerHeight * vb.h;
  const nw = Math.min(Math.max(vb.w * f, 300), 60000); f = nw / vb.w;
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
    const other = [...drag.ptrs.entries()].find(([id]) => id !== e.pointerId)[1];
    const d0 = Math.hypot(prev[0] - other[0], prev[1] - other[1]), d1 = Math.hypot(e.clientX - other[0], e.clientY - other[1]);
    if (d0 > 0 && d1 > 0) zoomAt(d0 / d1, (e.clientX + other[0]) / 2, (e.clientY + other[1]) / 2);
    drag.moved = true;
  }
  drag.ptrs.set(e.pointerId, [e.clientX, e.clientY]);
});
['pointerup', 'pointercancel'].forEach(t => addEventListener(t, e => drag.ptrs.delete(e.pointerId)));
document.querySelectorAll('.zoom button').forEach(b => b.onclick = () => b.dataset.z === 'fit' ? fit(true) : zoomAt(b.dataset.z === 'in' ? 0.7 : 1.4));
addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(() => { renderWall(); fit(); }, 200); });

// ===== شريط الحروف
$('#letters').innerHTML = ALPHA.filter(a => ROOTS.some(r => letterOf(r) === a)).map(a => `<button data-a="${a}">${a}</button>`).join('');
$('#letters').onclick = e => { const b = e.target.closest('button'); if (b) flyTo(b.dataset.a); };

// ===== التلميح
const tip = $('#tip');
function showTip(id, e) {
  const r = R(id), forms = Object.keys(r.f).map(Number);
  tip.innerHTML = `<b>${r.l.join(' ')}</b><br><small>${forms.map(w => `<i style="color:${W(w).color}">${W(w).pattern}</i>`).join(' · ')}<br>${AR(r.total)} موضعًا · انقر للفتح</small>`;
  tip.classList.remove('hidden'); moveTip(e);
}
function moveTip(e) { tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY - 16 + 'px'; }
function hideTip() { tip.classList.add('hidden'); }

// ===== مرشّح الأوزان
let filter = null;
const byForm = w => ROOTS.filter(r => r.f[w]).sort((a, b) => b.f[w].count - a.f[w].count);
function renderFilters() {
  $('#filters').innerHTML = `<button class="f ${filter ? '' : 'on'}" data-w="0">الكل</button>` + AWZAN.map(w =>
    `<button class="f ${filter === w.id ? 'on' : ''}" data-w="${w.id}" style="--c:${w.color}"><i></i>${w.pattern}<small>${AR(byForm(w.id).length)}</small></button>`).join('');
}
$('#filters').onclick = e => { const b = e.target.closest('.f'); if (b) setFilter(+b.dataset.w || null); };
function setFilterClasses() {
  wall.classList.toggle('filtering', !!filter);
  wall.querySelectorAll('.petal.hit').forEach(p => p.classList.remove('hit'));
  if (filter) wall.querySelectorAll(`.petal[data-w="${filter}"]`).forEach(p => p.classList.add('hit'));
}
function setFilter(w) {
  filter = w && filter !== w ? w : null;
  setFilterClasses(); renderFilters();
  if (filter) openWaznPanel(filter); else closeSide();
}

// ===== لوحة الوزن
function verbChips(w, except, limit = 40) {
  const list = byForm(w).filter(r => r.id !== except), c = W(w).color;
  const chip = r => { const f = formFor(r, w); return `<button class="vchip" style="--c:${c}" data-id="${r.id}" data-w="${w}"><b>${f.text}</b><span>${r.l.join(' ')} · ${AR(f.count)}</span></button>`; };
  return `<div class="vlist">${list.slice(0, limit).map(chip).join('')}</div>` +
    (list.length > limit ? `<button class="more" data-w="${w}" data-except="${except || ''}">+ ${AR(list.length - limit)} فعلًا آخر</button>` : '');
}
function meaningsHTML(w) {
  return `<ul class="meanings" style="--c:${w.color}">${w.meanings.map(([t, d]) => `<li><b>${t}</b> ${d}</li>`).join('')}</ul>`;
}
function openWaznPanel(wid) {
  const w = W(wid), p = patterns(wid), list = byForm(wid);
  const tokens = list.reduce((s, r) => s + r.f[wid].count, 0);
  const nouns = ROOTS.flatMap(r => r.n.filter(n => n[0] === wid).map(n => ({ r, k: n[1], lem: show(n[2]), count: n[3] }))).sort((a, b) => b.count - a.count);
  $('#sideBody').innerHTML = `<div class="wz-head" style="--c:${w.color}"><div class="wz-p">${w.pattern}</div><div><b>${w.name}</b><br>
      <span>${AR(list.length)} فعلًا · ${AR(tokens)} موضعًا في القرآن</span></div></div>
    ${meaningsHTML(w)}
    <h3>قوالب الوزن</h3>
    <div class="ptable" style="--c:${w.color}"><div><span>الماضي</span><b>${p.v}</b></div>
      ${KIND_KEYS.filter(k => p[k]).map(k => `<div><span>${KINDS[k]}</span><b>${p[k]}</b></div>`).join('')}</div>
    <h3>أفعال القرآن على هذا الوزن (الأكثر ورودًا أولًا)</h3>${verbChips(wid)}
    ${nouns.length ? `<h3>أسماء مشتقة منه في القرآن</h3><div class="vlist">${nouns.slice(0, 30).map(n =>
      `<button class="vchip" style="--c:${w.color}" data-id="${n.r.id}" data-w="${wid}"><b>${n.lem}</b><span>${KINDS[n.k]} · ${AR(n.count)}</span></button>`).join('')}</div>` : ''}`;
  $('#side').classList.remove('hidden'); $('#side').scrollTop = 0;
}
function closeSide() { $('#side').classList.add('hidden'); }
$('#side .x').onclick = () => setFilter(null);
document.addEventListener('click', e => {
  const c = e.target.closest('.vchip'); if (c) { openRose(c.dataset.id, +c.dataset.w); return; }
  const m = e.target.closest('.more');
  if (m) { m.outerHTML = verbChips(+m.dataset.w, m.dataset.except, 9999).replace(/^<div class="vlist">|<\/div>$/g, ''); }
});

// ===== النجمة المفتوحة
let cur = { id: null, w: null };
async function openRose(id, wid) {
  const root = R(id); if (!root) return;
  cur.id = id;
  if (!wid || !root.f[wid] && !canGenerate(root, wid)) wid = +Object.keys(root.f).sort((a, b) => root.f[b].count - root.f[a].count)[0];
  const svg = $('#roseSvg');
  svg.innerHTML = `<defs>${GLAZE}</defs><circle class="halo" r="245"/>${rosetteSVG(root, 200, { labels: true })}`;
  svg.querySelectorAll('.petal, .lab').forEach(p => p.addEventListener('click', () => selectPetal(+p.dataset.w)));
  const rose = $('#rose');
  rose.classList.remove('hidden', 'enter'); void rose.offsetWidth; rose.classList.add('enter');
  hideTip(); $('#results').classList.add('hidden');
  await selectPetal(wid);
}
async function selectPetal(wid) {
  cur.w = wid;
  history.replaceState(null, '', `#${R(cur.id).r}/${wid}`);
  const root = R(cur.id), w = W(wid), f = formFor(root, wid), id = cur.id;
  $('#roseSvg').querySelectorAll('.petal, .lab').forEach(p => p.classList.toggle('sel', +p.dataset.w === wid));
  const panel = $('#rosePanel');
  let body = `<div class="rp-root"><b>${root.l.join(' ')}</b> <span>${AR(root.total)} موضعًا لأفعاله في القرآن</span></div>
    <div class="rp-w" style="--c:${w.color}"><span class="wz-p sm">${w.pattern}</span> ${w.short}</div>`;
  if (f.kind === 'none') {
    body += `<div class="card muted">لم يرد هذا الوزن من هذا الجذر في القرآن، ولا يُصاغ منه قياسيًا هنا (جذر معتلّ أو مهموز أو مضعّف أو رباعي، أو وزن خاصّ). اختر بتلة مضيئة.</div>`;
  } else {
    const regular = !f.irregular && wid !== 1;
    body += `<div class="big-verb" style="--c:${w.color}">${f.text}</div>
      ${regular ? `<div class="anat" style="--c:${w.color}">${anatomy(root, wid)}</div>` : ''}
      <div class="tags">${f.kind === 'quran' ? `<span class="tag ok">✦ ورد ${AR(f.count)} ${f.count > 2 && f.count < 11 ? 'مرات' : 'مرة'} في القرآن</span>` : '<span class="tag no">صيغة قياسية لم ترد في القرآن</span>'}
      ${regular ? '<span class="tag"><i class="dot z"></i>زائد <i class="dot rl"></i>أصلي</span>' : ''}</div>`;
    if (f.cur) body += `<div class="gloss-box" style="--c:${w.color}"><p class="mean">المعنى: <b>${f.cur.m}</b></p><p class="why">◀ ${f.cur.y}</p></div>`;
    if (f.kind === 'quran') body += `<h3>صيغه في القرآن</h3><div id="wforms" class="wforms"><span class="muted">…</span></div><div id="verses"></div>`;
    const p = patterns(wid);
    body += `<h3>المشتقّات · أوزان الأسماء</h3><div class="ders" style="--c:${w.color}">${KIND_KEYS.filter(k => p[k]).map(k => {
      const q = f.qn.filter(n => n.k === k);
      const word = q.length ? q.map(n => n.lem).join('، ') : f.der[k];
      if (!word) return '';
      return `<div class="der ${q.length ? 'q' : ''}" data-k="${k}"><span>${KINDS[k]}</span><b>${word}</b><small>${p[k]}</small>${q.length ? `<em>✦ ${AR(q.reduce((s, n) => s + n.count, 0))}</em>` : ''}</div>`;
    }).join('')}</div><div id="nounVerses"></div>`;
  }
  body += `<h3>معاني الوزن</h3>${meaningsHTML(w)}
    <h3>قارِن: أفعال أخرى على وزن ${w.pattern}</h3>${verbChips(wid, root.id, 24)}
    <div id="dicts"></div>`;
  panel.innerHTML = body; panel.scrollTop = 0;

  const data = await loadRoot(id);
  if (cur.id !== id || cur.w !== wid) return;
  // المعجمان
  $('#dicts').innerHTML = (data.maqayis ? `<details class="dict" open><summary>مقاييس اللغة · ابن فارس</summary><p>${data.maqayis.replace(/\n/g, '<br>')}</p></details>` : '') +
    (data.mufradat ? `<details class="dict"><summary>المفردات في غريب القرآن · الراغب الأصفهاني</summary><p>${data.mufradat.replace(/\n/g, '<br>')}</p></details>` : '');
  // الصيغ والآيات
  if (f.kind === 'quran') {
    const verbs = data.verbs.filter(v => v.form === wid);
    const forms = verbs.flatMap(v => v.forms).sort((a, b) => b.locs.length - a.locs.length);
    $('#wforms').innerHTML = forms.map((x, i) => `<button class="wf" data-i="${i}">${x.w}<small>${AR(x.locs.length)}</small></button>`).join('');
    const first = curatedLoc(f.cur, verbs[0] && { forms: verbs.flatMap(v => v.forms) });
    const all = forms.flatMap(x => x.locs);
    const ordered = first ? [first, ...all.filter(l => l !== first)] : all;
    showVerses(ordered, '#verses');
    $('#wforms').onclick = e => { const b = e.target.closest('.wf'); if (!b) return;
      $('#wforms').querySelectorAll('.wf').forEach(x => x.classList.toggle('on', x === b)); showVerses(forms[+b.dataset.i].locs, '#verses'); };
  }
  panel.querySelectorAll('.der.q').forEach(d => d.onclick = () => {
    const lems = f.qn.filter(n => n.k === d.dataset.k).map(n => norm(n.lem));
    const locs = data.nouns.filter(n => n.form === wid && lems.includes(norm(n.lem))).flatMap(n => n.locs);
    showVerses(locs, '#nounVerses');
  });
}
async function showVerses(locs, sel, n = 3) {
  const box = $(sel); if (!box) return;
  const html = await Promise.all(locs.slice(0, n).map(verseHTML));
  box.innerHTML = html.join('') + (locs.length > n ? `<button class="more vmore">+ ${AR(locs.length - n)} موضعًا آخر</button>` : '');
  const m = box.querySelector('.vmore'); if (m) m.onclick = () => showVerses(locs, sel, n + 10);
}
$('#rose .back').onclick = () => { $('#rose').classList.add('hidden'); history.replaceState(null, '', location.pathname); };

// ===== البحث
const INDEX = ROOTS.flatMap(r => [
  { k: norm(r.r), id: r.id, label: r.l.join(' '), sub: 'جذر · ' + AR(r.total) + ' موضعًا' },
  ...Object.entries(r.f).map(([w, v]) => ({ k: norm(v.lem), k2: norm(formFor(r, +w).text), id: r.id, w: +w, label: formFor(r, +w).text, sub: 'فعل · ' + W(+w).pattern })),
  ...r.n.map(n => ({ k: norm(n[2]), id: r.id, w: n[0], label: show(n[2]), sub: KINDS[n[1]] + ' · ' + W(n[0]).pattern })),
]);
$('#q').addEventListener('input', e => {
  const q = norm(e.target.value), box = $('#results');
  if (!q) { box.classList.add('hidden'); return; }
  const hits = INDEX.filter(x => x.k.includes(q) || (x.k2 && x.k2.includes(q)))
    .sort((a, b) => (a.k === q || a.k2 === q ? 0 : 1) - (b.k === q || b.k2 === q ? 0 : 1) || a.k.length - b.k.length);
  box.innerHTML = hits.slice(0, 14).map(h => `<button data-id="${h.id}" data-w="${h.w || ''}"><b>${h.label}</b><span>${h.sub}</span></button>`).join('') || '<p class="muted">لا نتائج</p>';
  box.classList.remove('hidden');
});
$('#results').onclick = e => { const b = e.target.closest('button'); if (!b) return; openRose(b.dataset.id, +b.dataset.w || undefined); $('#q').value = ''; };

// ===== التحدّي
const quiz = { score: 0, total: 0, streak: 0, cur: null };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
async function nextQ() {
  $('#quizCard').innerHTML = '<p class="muted">…</p>';
  const t = pick(['wazn', 'wazn', 'meaning', 'noun']);
  let q;
  if (t === 'meaning') {
    const c = pick(CURATED), r = ROOT_BY_R[c.r];
    if (!r || !r.f[c.w]) return nextQ();
    const data = await loadRoot(r.id), verbs = data.verbs.filter(v => v.form === c.w);
    const loc = curatedLoc(c, { forms: verbs.flatMap(v => v.forms) }) || verbs[0].forms[0].locs[0];
    q = { t, r, w: c.w, loc, word: c.v, correct: c.m, why: c.y, opts: shuffle([c.m, ...[...new Set(shuffle(CURATED.filter(x => x.m !== c.m)).map(x => x.m))].slice(0, 3)]),
      title: `ما معنى الكلمة المضيئة؟ استعن بوزنها <span style="color:${W(c.w).color}">${W(c.w).pattern}</span>` };
  } else if (t === 'noun') {
    const r = pick(ROOTS.filter(r => r.n.some(n => n[0] > 1))), n = pick(r.n.filter(n => n[0] > 1));
    const data = await loadRoot(r.id), dn = data.nouns.find(x => x.form === n[0] && norm(x.lem) === norm(n[2]));
    const correct = patterns(n[0])[n[1]];
    const pool = [...new Set(AWZAN.filter(w => w.id > 1 && w.id !== n[0]).map(w => patterns(w.id)[n[1]]).filter(x => x && x !== correct))];
    q = { t, r, w: n[0], loc: pick(dn.locs), word: show(n[2]), correct, opts: shuffle([correct, ...shuffle(pool).slice(0, 3)]), title: `«${show(n[2])}» ${KINDS[n[1]]}. على أيّ قالب صيغ؟` };
  } else {
    const r = pick(ROOTS.filter(r => Object.keys(r.f).some(w => w > 1))), w = +pick(Object.keys(r.f).filter(w => w > 1));
    const data = await loadRoot(r.id), v = pick(data.verbs.filter(v => v.form === w)), fm = pick(v.forms);
    q = { t, r, w, loc: pick(fm.locs), word: fm.w, correct: W(w).pattern, opts: shuffle([W(w).pattern, ...shuffle(AWZAN.filter(x => x.id !== w)).slice(0, 3).map(x => x.pattern)]),
      title: 'على أيّ وزن جاء الفعل المضيء؟' };
  }
  quiz.cur = q;
  $('#quizCard').innerHTML = `<p class="q-title">${q.title}</p>${await verseHTML(q.loc)}
    <div class="opts">${q.opts.map(o => `<button class="opt ${q.t === 'meaning' ? 'sm' : ''}">${o}</button>`).join('')}</div><div class="fb"></div>`;
  $('#quizCard').querySelectorAll('.opt').forEach(b => b.onclick = () => answer(b));
}
function answer(btn) {
  const q = quiz.cur, ok = btn.textContent === q.correct, w = W(q.w);
  quiz.total++; ok ? (quiz.score++, quiz.streak++) : (quiz.streak = 0);
  $('#quizCard').querySelectorAll('.opt').forEach(b => { b.disabled = true; if (b.textContent === q.correct) b.classList.add('right'); });
  if (!ok) btn.classList.add('wrong');
  $('#qScore').textContent = AR(quiz.score); $('#qTotal').textContent = AR(quiz.total); $('#qStreak').textContent = AR(quiz.streak);
  const f = formFor(q.r, q.w);
  $('#quizCard .fb').innerHTML = `<p><b class="${ok ? 'good' : 'bad'}">${ok ? 'أحسنت ✔' : 'ليس تمامًا ✘'}</b>
    «${q.word}» من الجذر (${q.r.l.join(' ')}) — الفعل <b>${f.text}</b> على وزن <b style="color:${w.color}">${w.pattern}</b> (${w.short}).</p>
    ${q.why ? `<p class="why" style="--c:${w.color}">◀ ${q.why}</p>` : ''}
    <div class="qbtns"><button class="pill" id="qOpen">افتح النجمة</button><button class="pill solid" id="qNext">التالي ←</button></div>`;
  $('#qNext').onclick = nextQ;
  $('#qOpen').onclick = () => { $('#quiz').classList.add('hidden'); openRose(q.r.id, q.w); };
}
$('#quizBtn').onclick = () => { $('#quiz').classList.remove('hidden'); if (!quiz.cur) nextQ(); };
$('#quiz .x').onclick = () => $('#quiz').classList.add('hidden');
$('#aboutBtn').onclick = () => $('#about').classList.toggle('hidden');
$('#about .x').onclick = () => $('#about').classList.add('hidden');

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  for (const s of ['#about', '#quiz', '#rose', '#results']) { const el = $(s); if (!el.classList.contains('hidden')) { el.classList.add('hidden'); return; } }
  setFilter(null);
});

// ===== التطبيق (WebView): زرّ الرجوع والروابط الخارجية
window.awzanBack = () => {
  for (const sel of ['#about', '#quiz', '#rose', '#results']) {
    const el = $(sel);
    if (!el.classList.contains('hidden')) { el.classList.add('hidden'); return true; }
  }
  if (filter) { setFilter(null); return true; }
  return false;
};
document.addEventListener('click', e => {
  const a = e.target.closest('a[target=_blank]');
  if (a && window.AwzanApp) { e.preventDefault(); window.AwzanApp.postMessage(a.href); }
});

// ===== البدء
$('#sRoots').textContent = AR(META.counts.roots);
$('#sVerbs').textContent = AR(META.counts.verbs);
$('#sTokens').textContent = AR(META.counts.tokens);
renderFilters();
renderWall();
fit();
const hash = decodeURIComponent(location.hash.slice(1)).split('/');
if (hash[0] && ROOT_BY_R[hash[0]]) openRose(ROOT_BY_R[hash[0]].id, +hash[1] || undefined);
setTimeout(() => $('#hint').classList.add('fade'), 9000);
})();
