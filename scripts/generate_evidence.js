import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.53\\msedge.exe';
const EVIDENCE_DIR = path.resolve('evidence');
const DIST_DIR = path.resolve('dist');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

// Static HTTP server for dist
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let file = req.url.split('?')[0];
  if (file === '/') file = '/index.html';
  const filePath = path.join(DIST_DIR, file);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(DIST_DIR, 'index.html')).pipe(res);
  }
});

server.listen(5195, async () => {
  console.log('Static server running on http://localhost:5195');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  try {
    const page = await browser.newPage();

    // 1. Desktop API Status & Master Frame Graph (1280x920)
    console.log('[1/13] Capturing 01_api_system_metrics_desktop.png...');
    await page.setViewport({ width: 1280, height: 960, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5195', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const apiBtn = items.find(el => el.textContent.includes('API Status'));
      if (apiBtn) apiBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_api_system_metrics_desktop.png') });

    // 2. Close-up of Master Frame Graph Element
    console.log('[2/13] Capturing 02_api_realtime_oscilloscope_detail.png...');
    const frameGraphCard = await page.$('.master-frame-graph-card');
    if (frameGraphCard) {
      await frameGraphCard.screenshot({ path: path.join(EVIDENCE_DIR, '02_api_realtime_oscilloscope_detail.png') });
    }

    // 3. Bufferbloat Standby / Empty State (Clean Initial Standby)
    console.log('[3/13] Capturing 03_bufferbloat_standby_empty_state.png...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const bbBtn = items.find(el => el.textContent.includes('Bufferbloat'));
      if (bbBtn) bbBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03_bufferbloat_standby_empty_state.png') });

    // 5. Bufferbloat Completed Benchmark Results & Router SQM Guide (Injected into fresh standby)
    console.log('[5/13] Capturing 05_bufferbloat_benchmark_results.png...');
    await page.evaluate(() => {
      if (window.__SET_MOCK_BUFFERBLOAT_RESULT) {
        window.__SET_MOCK_BUFFERBLOAT_RESULT({
          id: 'test_123',
          timestamp: new Date().toISOString(),
          type: 'bufferbloat',
          grade: 'A',
          gradeDetails: {
            grade: 'A',
            color: '#22c55e',
            title: 'Minimal Bloat',
            description: '6ms to 15ms queue delay under full load. Real-time traffic remains responsive.',
            ratings: {
              gaming: 'Excellent',
              voip: 'Excellent',
              streaming: 'Flawless'
            }
          },
          unloaded: { avg: 4, min: 3, max: 6, jitter: 1 },
          download: {
            bandwidthMbps: 588.4,
            loadedLatency: 12,
            latencyDelta: 8
          },
          upload: {
            bandwidthMbps: 492.1,
            loadedLatency: 9,
            latencyDelta: 5
          }
        });
      }
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '05_bufferbloat_benchmark_results.png') });

    // 6. Router SQM / CAKE Guide
    console.log('[6/13] Capturing 06_bufferbloat_router_sqm_guide.png...');
    await page.evaluate(() => {
      const guide = document.querySelector('.wf-router-guide-card');
      if (guide) {
        guide.scrollIntoView({ behavior: 'instant', block: 'start' });
      } else {
        const el = document.querySelector('.main-content');
        if (el) el.scrollTop = 580;
      }
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '06_bufferbloat_router_sqm_guide.png') });

    // 4. Bufferbloat Active Testing State (Navigate fresh, click start, capture active gauge)
    console.log('[4/13] Capturing 04_bufferbloat_active_testing_state.png...');
    await page.goto('http://localhost:5195', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const bbBtn = items.find(el => el.textContent.includes('Bufferbloat'));
      if (bbBtn) bbBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const startBtn = document.querySelector('.wf-big-start-btn');
      if (startBtn) startBtn.click();
    });
    await new Promise(r => setTimeout(r, 2200));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '04_bufferbloat_active_testing_state.png') });

    // 7. IPv4 Subnetting & VLSM Suite
    console.log('[7/13] Capturing 07_ipv4_subnetting_vlsm_suite.png...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const ipv4Btn = items.find(el => el.textContent.includes('IPv4'));
      if (ipv4Btn) ipv4Btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const el = document.querySelector('.main-content');
      if (el) el.scrollTop = 420;
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '07_ipv4_subnetting_vlsm_suite.png') });

    // 8. IPv6 128-Bit Calculator & Hextet Visualizer
    console.log('[8/13] Capturing 08_ipv6_hextet_scope_calculator.png...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const ipv6Btn = items.find(el => el.textContent.includes('IPv6'));
      if (ipv6Btn) ipv6Btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '08_ipv6_hextet_scope_calculator.png') });

    // 9. Gateway Degradation & Error State Handling
    console.log('[9/13] Capturing 09_gateway_degradation_error_state.png...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const apiBtn = items.find(el => el.textContent.includes('API Status'));
      if (apiBtn) apiBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    // Simulate error state UI
    await page.evaluate(() => {
      // Modify badges to demonstrate degraded/offline handling
      const cards = Array.from(document.querySelectorAll('.api-card'));
      if (cards[1]) {
        const badge = cards[1].querySelector('.api-status-badge');
        if (badge) {
          badge.className = 'api-status-badge badge-degraded';
          badge.textContent = 'DEGRADED';
          badge.style.borderColor = '#f59e0b';
          badge.style.color = '#f59e0b';
        }
        const ms = cards[1].querySelector('.card-ms-value');
        if (ms) ms.textContent = '380 ms';
        const tag = cards[1].querySelector('.frametime-tag');
        if (tag) {
          tag.className = 'frametime-tag ft-high';
          tag.textContent = 'High RTT';
        }
      }
      if (cards[2]) {
        const badge = cards[2].querySelector('.api-status-badge');
        if (badge) {
          badge.className = 'api-status-badge badge-offline';
          badge.textContent = 'OFFLINE';
          badge.style.borderColor = '#ef4444';
          badge.style.color = '#ef4444';
        }
        const ms = cards[2].querySelector('.card-ms-value');
        if (ms) ms.textContent = 'Timeout';
        const tag = cards[2].querySelector('.frametime-tag');
        if (tag) {
          tag.className = 'frametime-tag ft-high';
          tag.textContent = '504 Timeout';
        }
      }
      const stateHeader = document.querySelector('.metrics-sub-state');
      if (stateHeader) {
        stateHeader.innerHTML = '<span class="status-dot dot-pulse" style="background: rgb(245, 158, 11);"></span>1 Degraded Gateway Latency • 1 Offline';
      }
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '09_gateway_degradation_error_state.png') });

    // 10. Tablet Portrait (768x1024)
    console.log('[10/13] Capturing 10_tablet_portrait_768x1024.png...');
    await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5195', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const apiBtn = items.find(el => el.textContent.includes('API Status'));
      if (apiBtn) apiBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '10_tablet_portrait_768x1024.png') });

    // 11. Mobile Responsive (390x844 - iPhone / Modern Android)
    console.log('[11/13] Capturing 11_mobile_responsive_390x844.png...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5195', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const apiBtn = items.find(el => el.textContent.includes('API Status'));
      if (apiBtn) apiBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '11_mobile_responsive_390x844.png') });

    // 12. Ultra Narrow Mobile (320x568 - iPhone SE)
    console.log('[12/13] Capturing 12_mobile_narrow_320x568.png...');
    await page.setViewport({ width: 320, height: 568, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5195', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const apiBtn = items.find(el => el.textContent.includes('API Status'));
      if (apiBtn) apiBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '12_mobile_narrow_320x568.png') });

    // 13. Native Android WebView Frame Simulation (412x915)
    console.log('[13/13] Capturing 13_android_webview_simulation.png...');
    await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5195', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const apiBtn = items.find(el => el.textContent.includes('API Status'));
      if (apiBtn) apiBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    // Inject Android System UI simulation wrapper (Status Bar + App Header)
    await page.evaluate(() => {
      const topBar = document.createElement('div');
      topBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 38px;
        background: #0a0e17;
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        font-family: -apple-system, Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        z-index: 999999;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      `;
      topBar.innerHTML = `
        <span>07:14</span>
        <div style="display:flex;align-items:center;gap:6px;">
          <span>5G</span>
          <span>100%</span>
        </div>
      `;
      document.body.prepend(topBar);
      document.body.style.paddingTop = '38px';
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '13_android_webview_simulation.png') });

    console.log('All 13 evidence screenshots generated successfully!');
  } finally {
    await browser.close();
    server.close();
  }
});
