import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '/tmp/claude-0/-home-user-spotitap-live-counter/f280dcbb-489c-5529-8ae0-18a46d242df8/scratchpad/shots';
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:4200';

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
page.on('console', m => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`); });
page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));

async function go(path, name, waitSel) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  if (waitSel) {
    try { await page.waitForSelector(waitSel, { timeout: 8000 }); }
    catch { errors.push(`[missing] ${path} -> selector ${waitSel}`); }
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`✓ ${path} (${name})`);
}

// Dashboard
await go('/dashboard', '01-dashboard', '.dash__overview');
// Reveal daily answer
try { await page.click('text=Reveal answer', { timeout: 3000 }); await page.waitForTimeout(300); } catch {}
await page.screenshot({ path: `${OUT}/01b-dashboard-revealed.png` });

// Topics list
await go('/topics', '02-topics', '.tcard');
const topicCount = await page.locator('.tcard').count();
console.log('  topic cards:', topicCount);

// A topic detail (angular18)
await go('/topics/angular18', '03-topic-angular', '.td__section');
const sections = await page.locator('.td__section').count();
console.log('  angular sections rendered:', sections);
// expand first question
try { await page.locator('.qc__head').first().click(); await page.waitForTimeout(300); } catch {}
// reveal first challenge solution
try { await page.locator('text=Reveal solution').first().click(); await page.waitForTimeout(500); } catch {}
await page.screenshot({ path: `${OUT}/03b-topic-interactions.png`, fullPage: false });
// check a mermaid svg rendered
const mermaidSvgs = await page.locator('.dg__mermaid svg').count();
console.log('  mermaid SVGs:', mermaidSvgs);
const codeBlocks = await page.locator('.cb').count();
console.log('  code blocks:', codeBlocks);

// Spring boot topic (proxy gotcha)
await go('/topics/spring-boot', '04-topic-spring', '.td__section');

// Interview mode
await go('/interview', '05-interview', '.iv__config');
try {
  await page.click('text=Start interview', { timeout: 4000 });
  await page.waitForSelector('.iv__qcard', { timeout: 6000 });
  await page.click('text=Reveal answer', { timeout: 4000 });
  await page.waitForTimeout(400);
  await page.click('text=Got it', { timeout: 4000 });
  await page.waitForTimeout(400);
  console.log('  interview flow ok');
} catch (e) { errors.push('[interview] ' + e.message); }
await page.screenshot({ path: `${OUT}/05b-interview-active.png` });

// Challenges
await go('/challenges', '06-challenges', '.cl__card');
const challengeCount = await page.locator('.cl__card').count();
console.log('  challenge cards:', challengeCount);
await page.locator('.cl__card').first().click();
await page.waitForSelector('.cd__card', { timeout: 6000 }).catch(() => errors.push('[challenge-detail] no card'));
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/06b-challenge-detail.png` });

// Progress
await go('/progress', '07-progress', '.pr__top');

// Settings + light theme
await go('/settings', '08-settings', '.st__card');
await page.click('text=Light').catch(() => {});
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/08b-settings-light.png` });
// dashboard in light
await go('/dashboard', '09-dashboard-light', '.dash__overview');

// Command palette
await page.keyboard.press('Control+k');
await page.waitForTimeout(400);
await page.keyboard.type('kafka');
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/10-palette.png` });
const paletteResults = await page.locator('.cp__item').count();
console.log('  palette results for "kafka":', paletteResults);

await browser.close();
console.log('\n=== CONSOLE / PAGE ERRORS:', errors.length, '===');
for (const e of errors) console.log('  ' + e);
process.exit(errors.length ? 1 : 0);
