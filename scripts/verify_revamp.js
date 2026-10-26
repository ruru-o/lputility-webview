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

    // 1. IPv4 Suite - scrolled to VLSM
    console.log('Navigating to IPv4...');
    await page.goto('http://localhost:5188', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const ipv4Btn = items.find(el => el.textContent.includes('IPv4'));
      if (ipv4Btn) ipv4Btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const el = document.querySelector('.main-content');
      if (el) el.scrollTop = 450;
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ipv4_vlsm_detail.png') });
    console.log('Saved ipv4_vlsm_detail.png');

    // 2. IPv6 Suite
    console.log('Navigating to IPv6...');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.nav-item-btn'));
      const ipv6Btn = items.find(el => el.textContent.includes('IPv6'));
      if (ipv6Btn) ipv6Btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ipv6_revamped.png') });
    console.log('Saved ipv6_revamped.png');

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
