import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.53\\msedge.exe';
const APP_URL = 'http://localhost:4173/';
const OUTPUT_DIR = path.resolve('docs/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureAll() {
  console.log('Launching Edge browser for automated evidence capture (LPUtility)...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars']
  });

  try {
    const page = await browser.newPage();

    // 1. Desktop Telemetry Dashboard (1440x900)
    console.log('1. Capturing Desktop Diagnostics Dashboard...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    
    // Wait for telemetry results to finish loading
    await page.waitForSelector('.summary-card', { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_desktop_telemetry.png') });

    // 2. Desktop Tools Catalog
    console.log('2. Capturing Tools Catalog...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.nav-item-btn'));
      const btn = btns.find(b => b.textContent.includes('All Tools'));
      if (btn) btn.click();
    });
    await page.waitForSelector('.tools-grid', { timeout: 5000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_desktop_catalog.png') });

    // 3. Desktop IPv4 Subnet Suite
    console.log('3. Capturing IPv4 Subnet Suite...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.nav-item-btn'));
      const btn = btns.find(b => b.textContent.includes('IPv4'));
      if (btn) btn.click();
    });
    await page.waitForSelector('.metrics-summary-grid', { timeout: 5000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_desktop_ipv4_suite.png') });

    // 4. Desktop IPv6 128-Bit Suite
    console.log('4. Capturing IPv6 128-Bit Suite...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.nav-item-btn'));
      const btn = btns.find(b => b.textContent.includes('IPv6'));
      if (btn) btn.click();
    });
    await page.waitForSelector('.metrics-summary-grid', { timeout: 5000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_desktop_ipv6_suite.png') });

    // 5. Desktop Error State (Simulated Demonstration)
    console.log('5. Capturing Simulated Error State & Recovery...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.nav-item-btn'));
      const btn = btns.find(b => b.textContent.includes('Network Diagnostics'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const demoErrorBtn = document.querySelectorAll('.subtle-test-actions .text-link-btn')[0];
      if (demoErrorBtn) demoErrorBtn.click();
    });
    await page.waitForSelector('.error-card', { timeout: 5000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_desktop_error_state.png') });

    // 6. Desktop Empty State
    console.log('6. Capturing Empty State Demonstration...');
    await page.evaluate(() => {
      const demoEmptyBtn = document.querySelectorAll('.subtle-test-actions .text-link-btn')[1];
      if (demoEmptyBtn) demoEmptyBtn.click();
    });
    await page.waitForSelector('.empty-card', { timeout: 5000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06_desktop_empty_state.png') });

    // Recover back to valid state
    await page.evaluate(() => {
      const recoverBtn = document.querySelector('.empty-card button');
      if (recoverBtn) recoverBtn.click();
    });
    await page.waitForSelector('.summary-card', { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));

    // 7. Mobile Telemetry Viewport (390x844 - iPhone 12/13/14 / Android Standard)
    console.log('7. Capturing Mobile Diagnostics (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07_mobile_telemetry_390x844.png') });

    // 8. Mobile Navigation Drawer Open
    console.log('8. Capturing Mobile Navigation Drawer (390x844)...');
    await page.click('.mobile-menu-btn');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_mobile_drawer_390x844.png') });

    // Close drawer
    await page.click('.mobile-backdrop');
    await new Promise(r => setTimeout(r, 400));

    // 9. Ultra-Narrow Mobile Viewport (320x568 - iPhone SE 1st Gen)
    console.log('9. Capturing Ultra-Narrow Mobile Viewport (320x568)...');
    await page.setViewport({ width: 320, height: 568, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09_mobile_narrow_320x568.png') });

    // 10. Tablet Viewport (768x1024 - iPad Portrait)
    console.log('10. Capturing Tablet Viewport (768x1024)...');
    await page.setViewport({ width: 768, height: 1024, isMobile: false, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10_tablet_portrait_768x1024.png') });

    // 11. Android WebView Simulation Frame
    console.log('11. Capturing Android WebView Simulation...');
    await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '11_android_webview.png') });

    console.log('All 11 genuine screenshots captured successfully in docs/screenshots!');
  } finally {
    await browser.close();
  }
}

captureAll().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
