import { chromium } from 'playwright';
const b = await chromium.launch();
for (const path of process.argv.slice(3)) for (const [n,w,h] of [['portrait',820,1180],['landscape',1180,820],['laptop',1440,900]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('console', m => { if (m.type()==='error'||m.type()==='warning') console.log(path, n, m.type(), m.text()); });
  await p.goto('http://localhost:4173' + path);
  for (let y = 0; y < 8000; y += 500) { await p.mouse.wheel(0, 500); await p.waitForTimeout(90); }
  await p.waitForTimeout(500);
  await p.addStyleTag({ content: 'header{position:static!important}' });
  await p.screenshot({ path: `${process.argv[2]}/${path.replace(/\W/g,'') || 'home'}-${n}.png`, fullPage: true });
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over > 0) console.log(path, n, 'OVERFLOW', over);
}
await b.close();
