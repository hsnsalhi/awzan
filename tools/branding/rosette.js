// Rosace zellige (mêmes proportions que le site) → SVG
const COLORS = ['#c9a227','#c8462f','#e8863a','#2e9e6a','#2aa6a0','#2f6fb5','#6a5acd','#9b59b6','#d6609e','#7fbf3f'];
function rosette(R, letters, opts = {}) {
  const P = (r, t) => [r * Math.cos(t * Math.PI / 180), r * Math.sin(t * Math.PI / 180)];
  const ang = i => -90 - i * 36, f = p => p.map(n => n.toFixed(1)).join(',');
  const r0 = R * .36, rm = R * .62;
  let s = '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".45" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>';
  const star = []; for (let i = 0; i < 10; i++) { star.push(P(R * 1.05, ang(i)), P(rm * 1.05, ang(i) - 18)); }
  s += `<polygon points="${star.map(f).join(' ')}" fill="#060c0f" stroke="#c9a227" stroke-width="${R * .02}"/>`;
  for (let i = 0; i < 10; i++) {
    const t = ang(i), q = [P(r0, t), P(rm, t - 18), P(R, t), P(rm, t + 18)];
    const cx = q.reduce((a, p) => a + p[0], 0) / 4, cy = q.reduce((a, p) => a + p[1], 0) / 4;
    const k = q.map(([x, y]) => [cx + (x - cx) * .9, cy + (y - cy) * .9]).map(f).join(' ');
    s += `<polygon points="${k}" fill="${COLORS[i]}"/><polygon points="${k}" fill="url(#g)"/>`;
  }
  const core = Array.from({ length: 10 }, (_, i) => P(r0 * .98, ang(i) + 18)).map(f).join(' ');
  s += `<polygon points="${core}" fill="#f1e6cc" stroke="#c9a227" stroke-width="${R * .025}"/>`;
  if (letters) s += `<text y="${R * .1}" text-anchor="middle" font-family="Amiri" font-weight="700" font-size="${R * (letters.length > 3 ? .24 : .34)}" fill="#1b2a2f">${letters}</text>`;
  return s;
}
if (typeof module !== 'undefined') module.exports = { rosette };
