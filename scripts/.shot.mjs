import { chromium } from 'playwright';
const b = await chromium.launch();
for (const path of process.argv.slice(3)) for (const [n,w,h] of [['portrait',820,1180],['laptop',1440,900]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('console', m => { if (m.type()==='error'||m.type()==='warning') console.log(path, n, m.type(), m.text()); });
  await p.goto('http://localhost:4173' + path);
  for (let y = 0; y < 7000; y += 400) { await p.mouse.wheel(0, 400); await p.waitForTimeout(100); }
  await p.waitForTimeout(600);
  await p.addStyleTag({ content: 'header{position:static!important}' });
  await p.screenshot({ path: `${process.argv[2]}/${path.replace(/\W/g,'') || 'home'}-${n}.png`, fullPage: true });
  console.log(path, n, await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
}
await b.close();
