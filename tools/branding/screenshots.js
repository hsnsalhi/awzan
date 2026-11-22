// Captures des stores depuis le site servi en local : node tools/branding/screenshots.js http://localhost:8765
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8765';
const OUT = path.join(__dirname, '..', '..', 'docs', 'stores', 'screenshots');
const SIZES = { ios_6_5: ['ios_6.5', 428, 926, 3], android: ['android', 360, 640, 3] };
const steps = [
  ['01_jidar', async p => { await p.waitForTimeout(1200); }],
  ['02_lawh', async p => { await p.click('#letters button[data-a="ق"]'); await p.waitForTimeout(1200); }],
  ['03_wazn', async p => { await p.click('.f[data-w="10"]'); await p.waitForTimeout(800); }],
  ['04_najma', async p => { await p.click('.f[data-w="10"]'); await p.fill('#q', 'استكبر'); await p.waitForTimeout(300); await p.click('#results button'); await p.waitForSelector('#verses .ayah'); await p.waitForTimeout(1200); }],
  ['05_ayat', async p => { await p.evaluate(() => { const el = document.querySelector('#rosePanel'); el.scrollTop = el.querySelector('#verses').offsetTop - 80; }); await p.waitForTimeout(800); }],
  ['06_mushtaqqat', async p => { await p.evaluate(() => { const el = document.querySelector('#rosePanel'); el.scrollTop = el.querySelector('.ders').offsetTop - 120; }); await p.waitForTimeout(500); }],
  ['07_tahaddi', async p => { await p.click('#rose .back'); await p.click('#quizBtn'); await p.waitForSelector('.opt'); await p.waitForTimeout(800); }],
];
(async () => {
  const b = await chromium.launch();
  for (const [dir, w, h, dpr] of Object.values(SIZES)) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
    await p.goto(BASE + '/index.html'); await p.waitForSelector('.tile');
    await p.evaluate(() => document.querySelector('#hint').classList.add('fade'));
    for (const [name, act] of steps) {
      await act(p);
      await p.screenshot({ path: path.join(OUT, dir, name + '.png') });
    }
    console.log(dir, 'ok');
  }
  await b.close();
})();
