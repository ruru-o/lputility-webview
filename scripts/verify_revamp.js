import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.53\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\cc\\.gemini\\antigravity\\brain\\cac6324e-47a0-4d9f-a6f5-211d86b351de';
const DIST_DIR = path.resolve('dist');

// Simple static HTTP server for dist
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(DIST_DIR, reqPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(DIST_DIR, 'index.html')).pipe(res);
  }
});

server.listen(5188, async () => {
  console.log('Static server listening on http://localhost:5188');

  try {
    const browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1100, deviceScaleFactor: 2 });

    // 1. Bufferbloat Initial (Verifying removal of "Target: Cloudflare Anycast CDN")
    console.log('Navigating to Bufferbloat initial view...');
    await page.goto('http://localhost:5188', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'bufferbloat_initial_notarget.png') });
    console.log('Saved bufferbloat_initial_notarget.png');

    // 2. API Status (Verifying 6 optimal low-latency endpoints)
    console.log('Navigating to API Status...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const apiBtn = items.find(el => el.textContent.includes('API Status'));
      if (apiBtn) apiBtn.click();
    });
    // Wait for the probes to settle
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'api_optimal_endpoints.png') });
    console.log('Saved api_optimal_endpoints.png');

    // 3. Bufferbloat Workspace with Result & Router Guide Scrolled
    console.log('Navigating to Bufferbloat...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const bbBtn = items.find(el => el.textContent.includes('Bufferbloat'));
      if (bbBtn) bbBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Inject mock result and expand router guide
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
            bandwidthMbps: 540.8,
            loadedLatency: 14,
            latencyDelta: 10
          },
          upload: {
            bandwidthMbps: 485.2,
            loadedLatency: 12,
            latencyDelta: 8
          },
          ispContext: {
            ip: '112.198.74.20',
            holder: 'Converge ICT Solutions Inc.',
            asn: 'AS9299',
            city: 'Manila',
            country: 'PH',
            prefix: '112.198.64.0/19'
          },
          durations: { total: 18000 }
        });
      }
    });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const el = document.querySelector('.main-content');
      if (el) el.scrollTop = 500;
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'bufferbloat_router_guide.png') });
    console.log('Saved bufferbloat_router_guide.png');

    await browser.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
