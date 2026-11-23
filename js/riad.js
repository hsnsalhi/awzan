// رياض الأوزان — مجسّم ثلاثي الأبعاد: صحن رياض تحيط به جدران الزليج، لكل حرف جدار،
// وفي الوسط نافورة على شكل نجمة عشرية بتلاتها الأوزان العشرة.
// يعتمد على three.js (محلي في js/vendor/) وعلى واجهة window.awzan التي يعرضها app.js.
import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const $ = s => document.querySelector(s);
const deg = Math.PI / 180;

function whenReady() {
  return new Promise(res => (window.awzan && window.awzan.groves.length) ? res() : addEventListener('awzan-ready', res, { once: true }));
}

// ===== قوامات مرسومة (CanvasTexture)
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
function star8(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const rr = i % 2 ? r * 0.62 : r, a = i * Math.PI / 8;
    ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
  }
  ctx.closePath();
}
const floorTex = () => canvasTex(512, 512, (c, w) => {
  c.fillStyle = '#e4d9c4'; c.fillRect(0, 0, w, w);
  const s = w / 4;
  for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) {
    const x = i * s, y = j * s;
    star8(c, x, y, s * 0.42); c.fillStyle = (i + j) % 2 ? '#2d6a5c' : '#3b5f86'; c.fill();
    star8(c, x, y, s * 0.2); c.fillStyle = '#f4ead2'; c.fill();
    c.beginPath(); c.moveTo(x + s / 2, y + s * 0.18); c.lineTo(x + s * 0.82, y + s / 2); c.lineTo(x + s / 2, y + s * 0.82); c.lineTo(x + s * 0.18, y + s / 2); c.closePath();
    c.fillStyle = '#b8785a'; c.fill();
  }
  c.strokeStyle = 'rgba(60,40,20,.25)'; c.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, w); c.stroke(); c.beginPath(); c.moveTo(0, i * s); c.lineTo(w, i * s); c.stroke(); }
}, true);
const dadoTex = () => canvasTex(256, 128, (c, w, h) => {
  c.fillStyle = '#f1e6cc'; c.fillRect(0, 0, w, h);
  const s = h / 2;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const x = i * s + s / 2, y = j * s + s / 2;
    star8(c, x, y, s * 0.46); c.fillStyle = (i + j) % 2 ? '#1f6b4a' : '#14303a'; c.fill();
    star8(c, x, y, s * 0.2); c.fillStyle = '#c9a227'; c.fill();
  }
}, true);
const friezeTex = () => canvasTex(512, 128, (c, w, h) => {
  c.fillStyle = '#e8dcc2'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#b9a47e'; c.lineWidth = 4;
  for (let x = 0; x < w; x += 64) {               // أقواس مفصّصة منحوتة
    c.beginPath(); c.arc(x + 32, h * 0.95, 30, Math.PI, 0); c.stroke();
    c.beginPath(); c.arc(x + 32, h * 0.95, 18, Math.PI, 0); c.stroke();
    c.beginPath(); c.arc(x + 32, h * 0.32, 6, 0, Math.PI * 2); c.stroke();
  }
  c.fillStyle = '#c9a227'; c.fillRect(0, 0, w, 8); c.fillRect(0, h - 8, w, 8);
}, true);
const galleryTex = () => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#ece0c6'; c.fillRect(0, 0, w, h);
  // قوس حدوة فرس مفتوح على شرفة خشبية (مشربية)
  const ax = w / 2, top = h * 0.16, rw = w * 0.34;
  c.beginPath(); c.moveTo(ax - rw, h); c.lineTo(ax - rw, top + rw);
  c.arc(ax, top + rw, rw, Math.PI * 0.92, Math.PI * 0.08 + Math.PI * 2 - Math.PI * 2, false);
  c.lineTo(ax + rw, h); c.closePath();
  c.fillStyle = '#1a120c'; c.fill();
  c.strokeStyle = '#c9a227'; c.lineWidth = 5; c.stroke();
  c.save(); c.clip();
  c.strokeStyle = '#7a4f2a'; c.lineWidth = 3;
  for (let y = h * 0.62; y < h; y += 14) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  for (let x = 0; x < w; x += 14) { c.beginPath(); c.moveTo(x, h * 0.62); c.lineTo(x, h); c.stroke(); }
  c.fillStyle = 'rgba(255,190,110,.35)'; c.fillRect(0, top, w, h * 0.45);
  c.restore();
}, true);
const roofTex = () => canvasTex(128, 128, (c, w, h) => {
  for (let x = 0; x < w; x += 16) {
    const g = c.createLinearGradient(x, 0, x + 16, 0);
    g.addColorStop(0, '#0f4a32'); g.addColorStop(0.5, '#2f9a68'); g.addColorStop(1, '#0f4a32');
    c.fillStyle = g; c.fillRect(x, 0, 16, h);
  }
  c.fillStyle = 'rgba(0,0,0,.25)';
  for (let y = 0; y < h; y += 32) c.fillRect(0, y, w, 3);
}, true);
function medallionTex(letter, count) {
  return canvasTex(512, 512, (c, w) => {
    const r = w / 2;
    const g = c.createRadialGradient(r, r * 0.8, 20, r, r, r);
    g.addColorStop(0, '#2a8a62'); g.addColorStop(1, '#0d3a29');
    c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, w, w);
    star8(c, r, r, r * 0.98); c.fillStyle = '#c9a227'; c.fill();
    star8(c, r, r, r * 0.9); c.fillStyle = g; c.fill();
    c.beginPath(); c.arc(r, r, r * 0.6, 0, Math.PI * 2); c.strokeStyle = '#c9a227'; c.lineWidth = 8; c.stroke();
    c.fillStyle = '#f6e7b8'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `700 ${r * 0.85}px "Aref Ruqaa", Amiri, serif`;
    c.fillText(letter, r, r * 0.92);
    c.font = `600 ${r * 0.16}px "IBM Plex Sans Arabic", sans-serif`; c.fillStyle = '#c9e8d8';
    c.fillText(String(count), r, r * 1.42);
  });
}

async function main() {
  await whenReady();
  try { await Promise.all(['700 80px "Aref Ruqaa"', '700 40px Amiri', '600 20px "IBM Plex Sans Arabic"'].map(f => document.fonts.load(f))); } catch (_) {}
  const A = window.awzan;
  const canvas = $('#riadCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const aniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1a24');
  scene.fog = new THREE.Fog('#0b1a24', 80, 220);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);

  // ===== الجدران
  const groves = A.groves, maxN = Math.max(...groves.map(g => g.list.length));
  const FH = 10.5, COL = 1.0;
  const bays = groves.map(g => {
    const cv = document.createElement('canvas');
    const info = A.drawGrove(cv, g.a, null);
    const ph = 2.8 + 3.6 * Math.sqrt(g.list.length / maxN), pw = ph * info.ratio;
    return { a: g.a, n: g.list.length, cv, ph, pw, bw: pw + 1.8 };
  });
  const C = bays.reduce((s, b) => s + b.bw + COL, 0), R = C / (2 * Math.PI);

  const plaster = new THREE.MeshStandardMaterial({ color: '#ece0c6', roughness: 0.92 });
  const wood = new THREE.MeshStandardMaterial({ color: '#7a4f2a', roughness: 0.7 });
  const goldM = new THREE.MeshStandardMaterial({ color: '#c9a227', roughness: 0.35, metalness: 0.6 });
  const dadoM = new THREE.MeshStandardMaterial({ map: dadoTex(), roughness: 0.4 });
  const friezeT = friezeTex();
  const roofT = roofTex();
  const galT = galleryTex();
  const UP = 4.2;   // الطابق العلوي
  const panels = [], petals = [];

  let arc = 0;
  for (const b of bays) {
    const theta = Math.PI + (arc + b.bw / 2) / R;
    const grp = new THREE.Group();
    grp.position.set(R * Math.sin(theta), 0, R * Math.cos(theta));
    grp.lookAt(0, 0, 0);
    scene.add(grp);
    b.group = grp; b.theta = theta;

    const facade = new THREE.Mesh(new THREE.BoxGeometry(b.bw + COL + 0.05, FH, 0.8), plaster);
    facade.position.set(0, FH / 2, -0.4); grp.add(facade);
    const dt = dadoM.map.clone(); dt.repeat.set((b.bw + COL) / 1.2, 1); dt.needsUpdate = true;
    const dado = new THREE.Mesh(new THREE.PlaneGeometry(b.bw + COL, 1.1), new THREE.MeshStandardMaterial({ map: dt, roughness: 0.35 }));
    dado.position.set(0, 0.55, 0.01); grp.add(dado);

    // إطار خشبي ثم لوح الزليج
    const y0 = 1.5 + b.ph / 2;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(b.pw + 0.5, b.ph + 0.5, 0.2), wood);
    frame.position.set(0, y0, 0.1); grp.add(frame);
    const tex = new THREE.CanvasTexture(b.cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = aniso;
    const pmat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.45, roughness: 0.5 });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(b.pw, b.ph), pmat);
    panel.position.set(0, y0, 0.21); panel.userData = { a: b.a };
    grp.add(panel); panels.push(panel); b.panel = panel; b.tex = tex;

    // قوس فوق اللوح + ميدالية الحرف
    const archR = Math.min(b.pw / 2 + 0.25, 2.2);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(archR, 0.09, 8, 48, Math.PI), goldM);
    arch.position.set(0, 1.5 + b.ph + 0.25, 0.12); grp.add(arch);
    const medal = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9),
      new THREE.MeshStandardMaterial({ map: medallionTex(b.a, b.n), transparent: true, emissive: '#ffffff', emissiveMap: null, emissiveIntensity: 0, roughness: 0.4 }));
    medal.material.emissiveMap = medal.material.map; medal.material.emissiveIntensity = 0.35;
    medal.position.set(0, Math.min(1.5 + b.ph + 0.25 + archR * 0.55, FH - 2.4), 0.15); medal.userData = { a: b.a };
    grp.add(medal); panels.push(medal);

    // إفريز جصّي وسقف من القرميد الأخضر
    const ft = friezeT.clone(); ft.repeat.set((b.bw + COL) / 2, 1); ft.needsUpdate = true;
    const frieze = new THREE.Mesh(new THREE.PlaneGeometry(b.bw + COL, 0.9), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.9 }));
    frieze.position.set(0, FH - 1.0, 0.01); grp.add(frieze);
    // طابق علوي: رواق أقواس ومشربيات، فوقه شرفة ثم سقف القرميد الأخضر
    const up = new THREE.Mesh(new THREE.BoxGeometry(b.bw + COL + 0.05, UP, 0.8), plaster);
    up.position.set(0, FH + UP / 2, -0.4); grp.add(up);
    const gt = galT.clone(); gt.repeat.set(Math.max(1, Math.round((b.bw + COL) / 2.4)), 1); gt.needsUpdate = true;
    const gal = new THREE.Mesh(new THREE.PlaneGeometry(b.bw + COL, UP - 0.4),
      new THREE.MeshStandardMaterial({ map: gt, emissive: '#ffffff', emissiveMap: gt, emissiveIntensity: 0.25, roughness: 0.9 }));
    gal.position.set(0, FH + UP / 2 - 0.1, 0.01); grp.add(gal);
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(b.bw + COL + 0.1, 0.25, 1.0), wood);
    ledge.position.set(0, FH + 0.1, 0.25); grp.add(ledge);
    const rt = roofT.clone(); rt.repeat.set((b.bw + COL) / 1.2, 1); rt.needsUpdate = true;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(b.bw + COL + 0.3, 0.18, 2.2), new THREE.MeshStandardMaterial({ map: rt, roughness: 0.3, metalness: 0.1 }));
    roof.position.set(0, FH + UP + 0.4, 0.6); roof.rotation.x = 0.42; grp.add(roof);
    arc += b.bw + COL;

    // عمود وفانوس بين الجدارين
    const ct = Math.PI + arc / R - (COL / 2) / R;
    const col = new THREE.Group();
    col.position.set((R - 0.6) * Math.sin(ct), 0, (R - 0.6) * Math.cos(ct));
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, FH - 1.4, 16), plaster);
    shaft.position.y = (FH - 1.4) / 2; col.add(shaft);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), goldM); cap.position.y = FH - 1.3; col.add(cap);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.75), dadoM); base.position.y = 0.25; col.add(base);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: '#ffcf7a', emissive: '#ffb347', emissiveIntensity: 2.2 }));
    lamp.position.set(0, 4.2, 0); col.add(lamp);
    scene.add(col);
  }

  // ===== صومعة خلف الجدار الأول
  const minaret = new THREE.Group(); scene.add(minaret);
  minaret.position.set(0, 0, -(R + 9));
  const mt = galT.clone(); mt.repeat.set(2, 6); mt.needsUpdate = true;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(7, 34, 7), new THREE.MeshStandardMaterial({ color: '#d8b98f', map: mt, roughness: 0.9 }));
  tower.position.y = 17; minaret.add(tower);
  const band = new THREE.Mesh(new THREE.BoxGeometry(7.3, 2.2, 7.3), new THREE.MeshStandardMaterial({ map: dadoM.map, roughness: 0.4 }));
  band.position.y = 31.5; minaret.add(band);
  const lantern = new THREE.Mesh(new THREE.BoxGeometry(3.2, 6, 3.2), new THREE.MeshStandardMaterial({ color: '#d8b98f', roughness: 0.9 }));
  lantern.position.y = 37; minaret.add(lantern);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.9, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ map: roofT, color: '#2f9a68', roughness: 0.3 }));
  dome.position.y = 40; minaret.add(dome);
  [1.2, 0.9, 0.6].forEach((r, i) => { const ball = new THREE.Mesh(new THREE.SphereGeometry(r * 0.45, 16, 12), goldM); ball.position.y = 42.4 + i * 1.1; minaret.add(ball); });

  // ===== الأرضية والنافورة
  const ftex = floorTex(); ftex.repeat.set(R / 3.2, R / 3.2); ftex.anisotropy = aniso;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 2, 96), new THREE.MeshStandardMaterial({ map: ftex, roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);

  const fountain = new THREE.Group(); scene.add(fountain);
  const marble = new THREE.MeshStandardMaterial({ color: '#f4efe4', roughness: 0.25 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 0.9, 10), marble); basin.position.y = 0.45; fountain.add(basin);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(4.75, 4.75, 0.1, 10),
    new THREE.MeshStandardMaterial({ color: '#1b6f8c', emissive: '#0d3a4a', emissiveIntensity: 0.6, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.9 }));
  water.position.y = 0.86; fountain.add(water);
  // نجمة الأوزان العشرية فوق الماء
  const P2 = (r, t) => new THREE.Vector2(r * Math.cos(t * deg), r * Math.sin(t * deg));
  const Rs = 3.9, r0 = Rs * 0.36, rm = Rs * 0.62;
  A.AWZAN.forEach((w, i) => {
    const t = 90 + i * 36;                        // البتلة الأولى نحو الكاميرا الابتدائية
    const pts = [P2(r0, t), P2(rm, t - 18), P2(Rs, t), P2(rm, t + 18)];
    const cx = pts.reduce((s, p) => s + p.x, 0) / 4, cy = pts.reduce((s, p) => s + p.y, 0) / 4;
    const shape = new THREE.Shape(pts.map(p => new THREE.Vector2(cx + (p.x - cx) * 0.9, cy + (p.y - cy) * 0.9)));
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: false }),
      new THREE.MeshStandardMaterial({ color: w.color, roughness: 0.3, emissive: w.color, emissiveIntensity: 0.35 }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.9; m.userData = { w: w.id };
    fountain.add(m); petals.push(m);
  });
  const coreShape = new THREE.Shape(Array.from({ length: 10 }, (_, i) => P2(r0 * 0.98, 90 + i * 36 + 18)));
  const core = new THREE.Mesh(new THREE.ExtrudeGeometry(coreShape, { depth: 0.3, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: '#f1e6cc', roughness: 0.4 }));
  core.rotation.x = -Math.PI / 2; core.position.y = 0.9; fountain.add(core);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 1.8, 12), goldM); spout.position.y = 2.1; fountain.add(spout);
  const jet = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.4, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: '#bfe8ff', emissive: '#6fc3e8', emissiveIntensity: 0.6, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  jet.position.y = 3.6; jet.rotation.x = Math.PI; fountain.add(jet);

  // ===== السماء والإضاءة
  const starsG = new THREE.BufferGeometry(), sp = [];
  for (let i = 0; i < 1500; i++) {
    const u = Math.random() * Math.PI * 2, v = Math.random() * 0.45 * Math.PI, rr = 260;
    sp.push(rr * Math.cos(u) * Math.sin(v), rr * Math.cos(v) + 20, rr * Math.sin(u) * Math.sin(v));
  }
  starsG.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starsG, new THREE.PointsMaterial({ color: '#f6e7b8', size: 1.2, sizeAttenuation: false, fog: false })));
  scene.add(new THREE.HemisphereLight('#9fc3d8', '#4a3424', 1.1));
  const moon = new THREE.DirectionalLight('#dfe9ff', 1.1); moon.position.set(-30, 60, 20); scene.add(moon);
  for (let i = 0; i < 6; i++) {
    const t = i / 6 * Math.PI * 2, l = new THREE.PointLight('#ffb35a', 60, R * 1.1, 1.6);
    l.position.set((R - 4) * Math.sin(t), 5, (R - 4) * Math.cos(t)); scene.add(l);
  }
  const fl = new THREE.PointLight('#8fd6ff', 25, 14, 1.5); fl.position.set(0, 3, 0); scene.add(fl);

  // ===== الكاميرا والتحكّم
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 3; controls.maxDistance = R * 0.92;
  controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.56;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.35;
  controls.target.set(0, 6, 0);
  camera.position.set(0, 7.5, R * 0.66);
  controls.addEventListener('start', () => { controls.autoRotate = false; tween = null; });
  controls.update();

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // ===== انتقال الكاميرا إلى جدار
  let tween = null, focused = null;
  const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  function flyTo(pos, target, ms, done) {
    tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, s: performance.now(), ms, done };
    controls.autoRotate = false;
  }
  function wallView(a) {
    const b = bays.find(x => x.a === a); if (!b) return null;
    const c = new THREE.Vector3(); b.panel.getWorldPosition(c);
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(b.group.quaternion);
    const vf = Math.tan(camera.fov / 2 * deg);
    const d = Math.min(Math.max((b.ph / 2 + 0.8) / vf, (b.pw / 2 + 0.8) / (vf * camera.aspect)), R * 0.85);
    return { pos: c.clone().addScaledVector(n, d), target: c };
  }
  function focus(a, enter) {
    const v = wallView(a); if (!v) return;
    focused = a;
    flyTo(v.pos, v.target, 1100, enter ? () => A.enterWall(a) : null);
    const n = A.rootsCount(a);
    $('#enterBtn').innerHTML = `ادخل جدار <b>${a}</b> · ${n} جذرًا ←`;
    $('#enterBtn').classList.remove('hidden');
  }
  $('#enterBtn').onclick = () => { if (focused) A.enterWall(focused); };

  // ===== التأشير والنقر
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let hover = null, down = null;
  const tip = $('#tip');
  function pick(e) {
    ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    return ray.intersectObjects([...panels, ...petals], false)[0]?.object || null;
  }
  function setHover(o, e) {
    if (hover && hover !== o && hover.userData.a) hover.material.emissiveIntensity = hover.geometry.parameters.width > 2 ? 0.45 : 0.35;
    hover = o;
    canvas.style.cursor = o ? 'pointer' : 'grab';
    if (!o) { tip.classList.add('hidden'); return; }
    if (o.userData.a) {
      o.material.emissiveIntensity = 0.8;
      tip.innerHTML = `<b>${o.userData.a}</b><br><small>${A.rootsCount(o.userData.a)} جذرًا · انقر للدخول</small>`;
    } else {
      const w = A.AWZAN.find(x => x.id === o.userData.w);
      tip.innerHTML = `<b style="color:${w.color}">${w.pattern}</b><br><small>${w.short} · انقر لإضاءته في الجدران</small>`;
    }
    tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY - 16 + 'px';
    tip.classList.remove('hidden');
  }
  canvas.addEventListener('pointermove', e => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) setHover(pick(e), e); else setHover(null); });
  canvas.addEventListener('pointerleave', () => setHover(null));
  canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) { down = null; return; }
    down = null;
    const o = pick(e); setHover(null);
    if (!o) return;
    if (o.userData.a) focus(o.userData.a, true);
    else A.setFilter(o.userData.w);
  });

  // ===== إضاءة وزن في كل الجدران
  function setFilter(w) {
    bays.forEach(b => { A.drawGrove(b.cv, b.a, w); b.tex.needsUpdate = true; });
    petals.forEach(p => {
      const on = !w || p.userData.w === w;
      p.material.emissiveIntensity = w && on ? 1.2 : 0.35;
      p.material.opacity = on ? 1 : 0.25; p.material.transparent = !on;
      p.position.y = w && on ? 1.15 : 0.9;
    });
  }

  // ===== الحلقة
  let running = document.body.classList.contains('riad');
  const clock = new THREE.Clock();
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    if (tween) {
      const k = Math.min(1, (performance.now() - tween.s) / tween.ms), e = ease(k);
      camera.position.lerpVectors(tween.p0, tween.p1, e);
      controls.target.lerpVectors(tween.t0, tween.t1, e);
      if (k >= 1) { const d = tween.done; tween = null; if (d) d(); }
    }
    jet.scale.set(1 + Math.sin(t * 3) * 0.06, 1 + Math.sin(t * 2.3) * 0.08, 1 + Math.sin(t * 3) * 0.06);
    water.material.emissiveIntensity = 0.55 + Math.sin(t * 1.7) * 0.12;
    controls.update();
    renderer.render(scene, camera);
  }
  loop();

  window.riad = {
    focus: a => focus(a, false),
    setFilter,
    pause() { running = false; $('#enterBtn').classList.add('hidden'); setHover(null); },
    resume() { if (!running) { running = true; resize(); loop(); } },
  };
  if (A.filter) setFilter(A.filter);
  document.body.classList.add('riad-ready');
}

main().catch(async e => {
  console.error('riad', e);
  // بلا WebGL : جدار الحرف الأول مباشرة، مع تنبيه
  await whenReady();
  document.body.classList.add('no3d');
  window.awzan.enterWall(null);
  const h = $('#hint');
  h.querySelector('.in-wall').textContent = 'العرض ثلاثي الأبعاد غير متاح في هذا المتصفح · اختر جدارًا من شريط الحروف';
  h.classList.remove('fade');
});
