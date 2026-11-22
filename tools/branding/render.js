// Génère les visuels : node tools/branding/render.js  (Playwright préinstallé)
const { chromium } = require('playwright');
const path = require('path');
const { rosette } = require('./rosette.js');
const fs = require('fs');
const FONTS = '<style>' + fs.readFileSync(path.resolve(__dirname, '../../css/fonts.css'), 'utf8')
  .replace(/url\(\.\.\/fonts\/([^)]+)\)/g, (_, f) => `url(data:font/woff2;base64,${fs.readFileSync(path.resolve(__dirname, '../../fonts', f)).toString('base64')})`) + '</style>';
const BG = '#0a1216';
const zellige = (w, h) => `<svg width="${w}" height="${h}" style="position:absolute;inset:0"><defs><pattern id="z" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M40 0L80 40L40 80L0 40Z" fill="none" stroke="#c9a22730" stroke-width="2"/></pattern></defs><rect width="100%" height="100%" fill="url(#z)"/></svg>`;
const page = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}</style></head><body>${body}</body></html>`;
const jobs = {
  icon_1024: [1024, 1024, `<div style="position:relative;width:1024px;height:1024px;background:radial-gradient(circle at 50% 45%,#16303a,${BG} 75%)">${zellige(1024, 1024)}
    <svg width="1024" height="1024" viewBox="-512 -512 1024 1024" style="position:absolute;inset:0">${rosette(400, 'وزن')}</svg></div>`],
  adaptive_fg_1024: [1024, 1024, `<svg width="1024" height="1024" viewBox="-512 -512 1024 1024">${rosette(300, 'وزن')}</svg>`],
  feature_1024x500: [1024, 500, `<div dir="rtl" style="position:relative;width:1024px;height:500px;background:radial-gradient(circle at 25% 50%,#16303a,${BG} 70%);font-family:'IBM Plex Sans Arabic'">${zellige(1024, 500)}
    <svg width="440" height="440" viewBox="-220 -220 440 440" style="position:absolute;left:40px;top:30px">${rosette(190, 'كبر')}</svg>
    <div style="position:absolute;right:60px;top:120px;color:#d9b45a;font:700 92px 'Aref Ruqaa'">زليج الأوزان</div>
    <div style="position:absolute;right:64px;top:270px;color:#f3ead6;font:500 30px 'IBM Plex Sans Arabic';line-height:1.6">أوزان أفعال القرآن الكريم<br><span style="color:#9fb0aa;font-size:24px">كل جذر نجمة · كل وزن بتلة</span></div></div>`],
};
(async () => {
  const b = await chromium.launch();
  for (const [name, [w, h, body]] of Object.entries(jobs)) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(page(w, h, body)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(__dirname, 'out', name + '.png'), omitBackground: name.startsWith('adaptive') });
    console.log('out/' + name + '.png');
  }
  await b.close();
})();
