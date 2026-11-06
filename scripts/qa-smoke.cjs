/* Playwright smoke test: npm run build && npm run preview, then `node scripts/qa-smoke.cjs`. */
const { chromium } = require("playwright");

const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:4173/little-dash-adventure/?qa=1";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  await page.goto(BASE);
  await page.click('[data-action="worlds"]');
  await page.click('[data-world="candy"]');
  await page.click('[data-level="candy-0"]');
  await page.waitForTimeout(500);
  await page.mouse.click(400, 200); // unlocks audio and jumps

  const audio = await page.evaluate(() => ({ unlocked: Boolean(window.__lda.audio.ctx), track: window.__lda.audio.trackWorld, sequencer: Boolean(window.__lda.audio.current) }));
  await page.evaluate(() => {
    const S = 34;
    window.__bot = setInterval(() => {
      const s = window.__lda.sim;
      if (s.mode === "fly") { if (s.y + 17 > 288 - 2.6 * 34) s.press(); else s.release(); return; }
      const front = s.x + S;
      const danger = s.entities.some((e) => ((e.type === "spike" || e.type === "block") && !e.floating && e.x >= front - 5 && e.x < front + 45) || (e.type === "gap" && e.x >= front - 5 && e.x < front + 30));
      if (danger) s.press(); else s.release();
    }, 16);
    window.__lda.setTimeScale(6);
  });
  await page.waitForFunction(() => document.querySelector('[data-screen="results"]'), null, { timeout: 60000 });
  await page.evaluate(() => clearInterval(window.__bot));
  const results = await page.evaluate(() => document.querySelector(".results-stats")?.innerText.replace(/\s+/g, " "));
  await browser.close();

  console.log("audio:", audio);
  console.log("results:", results);
  if (errors.length) { console.error("errors:", errors); process.exit(1); }
  console.log("smoke test passed");
})();
