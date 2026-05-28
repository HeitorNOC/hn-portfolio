/* ── Playwright scroll-pin verification script ─────────────── */
const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const URL = 'file:///C:/workspace/hn-portfolio/index.html';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getScrollMetrics(page, sectionId) {
  return page.evaluate((id) => {
    const section = document.getElementById(id);
    const scrollY = window.scrollY;
    const rect = section ? section.getBoundingClientRect() : null;
    return {
      scrollY,
      sectionTop: rect ? rect.top : null,
      sectionHeight: rect ? rect.height : null,
      windowHeight: window.innerHeight,
    };
  }, sectionId);
}

async function getSkewInfo(page) {
  return page.evaluate(() => {
    const targets = [document.body, document.querySelector('main'), document.querySelector('.pf-section'), document.querySelector('.services')];
    return targets.map(el => {
      if (!el) return null;
      const st = window.getComputedStyle(el);
      return {
        tag: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ')[0] : ''),
        transform: st.transform,
      };
    }).filter(Boolean);
  });
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('Navigating to:', URL);
  await page.goto(URL, { waitUntil: 'networkidle' });

  console.log('Waiting 3 extra seconds for GSAP/CDN...');
  await sleep(3000);

  // Check if GSAP and ScrollTrigger loaded
  const gsapInfo = await page.evaluate(() => ({
    gsap: typeof window.gsap !== 'undefined',
    ScrollTrigger: typeof window.ScrollTrigger !== 'undefined',
    gsapVersion: window.gsap ? window.gsap.version : null,
  }));
  console.log('GSAP loaded:', gsapInfo.gsap, '| ScrollTrigger loaded:', gsapInfo.ScrollTrigger, '| version:', gsapInfo.gsapVersion);

  // Dismiss loader: wait for it to become hidden/gone
  console.log('Waiting for loader to fade...');
  try {
    await page.waitForFunction(() => {
      const loader = document.getElementById('loader');
      if (!loader) return true;
      const style = window.getComputedStyle(loader);
      return style.opacity === '0' || style.display === 'none' || style.visibility === 'hidden' || loader.classList.contains('hidden');
    }, { timeout: 8000 });
    console.log('Loader dismissed.');
  } catch (e) {
    console.log('Loader did not auto-dismiss, forcing hide...');
    await page.evaluate(() => {
      const loader = document.getElementById('loader');
      if (loader) loader.style.display = 'none';
    });
  }

  await sleep(500);

  // ── PORTFOLIO SECTION ─────────────────────────────────────────
  console.log('\n=== PORTFOLIO SECTION ===');

  // Scroll to #portfolio
  await page.evaluate(() => {
    const el = document.getElementById('portfolio');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await sleep(800);

  let metrics = await getScrollMetrics(page, 'portfolio');
  console.log('Portfolio initial:', metrics);

  let skew = await getSkewInfo(page);
  console.log('Skew at portfolio start:', JSON.stringify(skew));

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'portfolio_start.png'), fullPage: false });
  console.log('Saved: portfolio_start.png');

  // Track pinning: record scrollY and section top across steps
  const portfolioScrollData = [];
  let prevSectionTop = metrics.sectionTop;

  for (let i = 1; i <= 8; i++) {
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'instant' }));
    await sleep(500);

    const m = await getScrollMetrics(page, 'portfolio');
    const skewStep = await getSkewInfo(page);

    // Detect pin: if scrollY increased by ~300 but sectionTop did NOT change much, it's pinned
    const scrollDelta = m.scrollY - metrics.scrollY;
    const topDelta = m.sectionTop - prevSectionTop;
    const isPinned = Math.abs(topDelta) < 5 && scrollDelta > 50; // section not moving while page scrolls

    portfolioScrollData.push({
      step: i,
      scrollY: m.scrollY,
      sectionTop: m.sectionTop,
      scrollDelta,
      topDelta: Math.round(topDelta * 100) / 100,
      isPinned,
    });

    console.log(`Portfolio scroll ${i}: scrollY=${m.scrollY} sectionTop=${Math.round(m.sectionTop)} topDelta=${Math.round(topDelta)} pinned=${isPinned}`);

    const hasSkew = skewStep.some(s => s && s.transform && s.transform !== 'none' && s.transform !== 'matrix(1, 0, 0, 1, 0, 0)');
    if (hasSkew) {
      console.log('  SKEW/TRANSFORM detected:', JSON.stringify(skewStep));
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `portfolio_scroll_${i}.png`), fullPage: false });
    console.log(`  Saved: portfolio_scroll_${i}.png`);

    prevSectionTop = m.sectionTop;
    metrics = m;
  }

  // Summary for portfolio
  const pinnedSteps = portfolioScrollData.filter(d => d.isPinned).length;
  console.log(`\nPortfolio: ${pinnedSteps}/8 steps showed pinning behaviour`);

  // ── SERVICOS SECTION ─────────────────────────────────────────
  console.log('\n=== SERVICOS SECTION ===');

  await page.evaluate(() => {
    const el = document.getElementById('servicos');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await sleep(800);

  let sMetrics = await getScrollMetrics(page, 'servicos');
  console.log('Servicos initial:', sMetrics);

  skew = await getSkewInfo(page);
  console.log('Skew at servicos start:', JSON.stringify(skew));

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'servicos_start.png'), fullPage: false });
  console.log('Saved: servicos_start.png');

  const servicosScrollData = [];
  let prevSTop = sMetrics.sectionTop;

  for (let i = 1; i <= 8; i++) {
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'instant' }));
    await sleep(500);

    const m = await getScrollMetrics(page, 'servicos');
    const skewStep = await getSkewInfo(page);

    const scrollDelta = m.scrollY - sMetrics.scrollY;
    const topDelta = m.sectionTop - prevSTop;
    const isPinned = Math.abs(topDelta) < 5 && scrollDelta > 50;

    servicosScrollData.push({
      step: i,
      scrollY: m.scrollY,
      sectionTop: m.sectionTop,
      scrollDelta,
      topDelta: Math.round(topDelta * 100) / 100,
      isPinned,
    });

    console.log(`Servicos scroll ${i}: scrollY=${m.scrollY} sectionTop=${Math.round(m.sectionTop)} topDelta=${Math.round(topDelta)} pinned=${isPinned}`);

    const hasSkew = skewStep.some(s => s && s.transform && s.transform !== 'none' && s.transform !== 'matrix(1, 0, 0, 1, 0, 0)');
    if (hasSkew) {
      console.log('  SKEW/TRANSFORM detected:', JSON.stringify(skewStep));
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `servicos_scroll_${i}.png`), fullPage: false });
    console.log(`  Saved: servicos_scroll_${i}.png`);

    prevSTop = m.sectionTop;
    sMetrics = m;
  }

  const sPinnedSteps = servicosScrollData.filter(d => d.isPinned).length;
  console.log(`\nServicos: ${sPinnedSteps}/8 steps showed pinning behaviour`);

  // ── Check active slide indices ────────────────────────────────
  console.log('\n=== SLIDE ANIMATION CHECK ===');

  // Navigate back to portfolio, scroll slowly and check active slides
  await page.evaluate(() => {
    const el = document.getElementById('portfolio');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await sleep(600);

  const slideStates = [];
  for (let i = 0; i < 6; i++) {
    const state = await page.evaluate(() => {
      const slides = Array.from(document.querySelectorAll('.pf-slide'));
      const dots = Array.from(document.querySelectorAll('.pf-dot'));
      return {
        slideCount: slides.length,
        activeSlide: slides.findIndex(s => {
          const cp = window.getComputedStyle(s).clipPath;
          // visible = clip-path not fully inset
          return cp && !cp.includes('inset(100%') && !cp.includes('inset(0% 0% 100%');
        }),
        activeDot: dots.findIndex(d => d.classList.contains('is-active')),
        clipPaths: slides.map(s => window.getComputedStyle(s).clipPath).slice(0, 3),
      };
    });
    slideStates.push({ scrollStep: i, ...state });

    if (i < 5) {
      await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'instant' }));
      await sleep(600);
    }
  }

  console.log('Slide states across scroll steps:');
  slideStates.forEach(s => {
    console.log(`  Step ${s.scrollStep}: slides=${s.slideCount} activeSlide=${s.activeSlide} activeDot=${s.activeDot}`);
    s.clipPaths.forEach((cp, i) => console.log(`    slide[${i}] clip: ${cp.substring(0, 60)}`));
  });

  // Console errors summary
  if (consoleErrors.length > 0) {
    console.log('\n=== CONSOLE ERRORS ===');
    consoleErrors.forEach(e => console.log(' ', e));
  } else {
    console.log('\nNo console errors detected.');
  }

  await browser.close();
  console.log('\nDone. Screenshots saved to:', SCREENSHOTS_DIR);
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
