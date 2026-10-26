import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.53\\msedge.exe';
const SCREENSHOTS_DIR = path.resolve('docs/screenshots');
const OUTPUT_PDF_PATH = path.resolve('docs/BSIT301NS_LPUtility_MidtermPractical.pdf');

function getBase64Image(filename) {
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  if (fs.existsSync(filepath)) {
    const data = fs.readFileSync(filepath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

const imgDesktopTelemetry = getBase64Image('01_desktop_telemetry.png');
const imgCatalog = getBase64Image('02_desktop_catalog.png');
const imgIpv4 = getBase64Image('03_desktop_ipv4_suite.png');
const imgIpv6 = getBase64Image('04_desktop_ipv6_suite.png');
const imgError = getBase64Image('05_desktop_error_state.png');
const imgEmpty = getBase64Image('06_desktop_empty_state.png');
const imgMobileTelemetry = getBase64Image('07_mobile_telemetry_390x844.png');
const imgMobileDrawer = getBase64Image('08_mobile_drawer_390x844.png');
const imgMobile320 = getBase64Image('09_mobile_narrow_320x568.png');
const imgTablet = getBase64Image('10_tablet_portrait_768x1024.png');
const imgAndroidWebView = getBase64Image('11_android_webview.png');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LPUtility — Midterm Laboratory Practical Documentation</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      font-size: 9.5pt;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      min-height: 250mm;
      box-sizing: border-box;
      padding: 22mm 14mm;
      border: 1.5px solid #7a2226;
      border-radius: 6px;
    }

    .header-institution {
      text-align: center;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 14px;
    }

    .inst-name {
      font-size: 13pt;
      font-weight: 800;
      color: #7a2226;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }

    .college-name {
      font-size: 10.5pt;
      font-weight: 600;
      color: #475569;
      margin: 4px 0 0 0;
    }

    .course-title {
      font-size: 9.5pt;
      color: #64748b;
      margin: 4px 0 0 0;
      font-style: italic;
    }

    .title-block {
      text-align: center;
      margin: 28px 0;
    }

    .project-name {
      font-size: 32pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin: 0;
    }

    .project-subtitle {
      font-size: 11.5pt;
      font-weight: 600;
      color: #7a2226;
      margin-top: 8px;
      line-height: 1.4;
    }

    .project-badge {
      display: inline-block;
      margin-top: 14px;
      padding: 4px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 9999px;
      color: #991b1b;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .cover-meta-grid {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 18px 22px;
      margin: 16px 0;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 9pt;
    }

    .meta-row:last-child {
      border-bottom: none;
    }

    .meta-label {
      font-weight: 700;
      color: #475569;
    }

    .meta-val {
      font-weight: 600;
      color: #0f172a;
    }

    .cover-footer {
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }

    h2 {
      font-size: 13pt;
      font-weight: 800;
      color: #7a2226;
      border-bottom: 1.5px solid #7a2226;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 12px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    p, li {
      font-size: 9pt;
      color: #334155;
      line-height: 1.5;
    }

    ul, ol {
      margin-top: 4px;
      margin-bottom: 8px;
      padding-left: 18px;
    }

    li {
      margin-bottom: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 8.5pt;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: left;
    }

    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #1e293b;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    pre, code {
      font-family: "JetBrains Mono", Consolas, Menlo, monospace;
      font-size: 8pt;
    }

    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 8px 12px;
      border-radius: 5px;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 8px 0;
      line-height: 1.35;
    }

    .screenshot-container {
      margin: 10px 0;
      text-align: center;
      page-break-inside: avoid;
    }

    .screenshot-container img {
      max-width: 100%;
      height: auto;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
    }

    .screenshot-caption {
      font-size: 8pt;
      color: #64748b;
      margin-top: 3px;
      font-style: italic;
    }

    .two-col-grid {
      display: flex;
      gap: 12px;
      page-break-inside: avoid;
    }

    .two-col-grid > div {
      flex: 1;
    }

    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="header-institution">
      <div class="inst-name">Lyceum of the Philippines University – Cavite</div>
      <div class="college-name">College of Information Technology and Computer Studies</div>
      <div class="course-title">Application Development — Midterm Laboratory Practical</div>
    </div>

    <div class="title-block">
      <div class="project-name">LPUtility</div>
      <div class="project-subtitle">
        Network Diagnostics, Infrastructure Intelligence & Academic Utilities<br>
        Responsive Web Deployment & Android WebView Delivery
      </div>
      <div class="project-badge">BSIT301NS PRACTICAL REPORT</div>
    </div>

    <div class="cover-meta-grid">
      <div class="meta-row">
        <span class="meta-label">System Name:</span>
        <span class="meta-val">LPUtility (v2.0.0)</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Integrated Live APIs:</span>
        <span class="meta-val">1. Globalping REST API (jsDelivr) &bull; 2. RIPE Stat Data API (RIPE NCC)</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">GitHub Repository:</span>
        <span class="meta-val">https://github.com/ruru-o/lputility-webview.git</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Deployed Web Application:</span>
        <span class="meta-val">https://ruru-o.github.io/lputility-webview/</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Android Package:</span>
        <span class="meta-val">com.lpu.netpulse (LPUtility WebView Application)</span>
      </div>
    </div>

    <div class="cover-footer">
      October 2026 &bull; Lyceum of the Philippines University &bull; Academic Laboratory Submission
    </div>
  </div>

  <!-- SECTION 1 -->
  <h2>1. Project Overview & Architecture</h2>
  <p>
    <strong>LPUtility</strong> is a web application and native Android WebView application designed for IT and Computer Science students, network technicians, and developers. It provides multi-region network diagnostics, BGP routing intelligence, subnet calculations, and cryptographic utilities in one responsive, high-performance interface.
  </p>

  <h3>1.1 Problem Addressed</h3>
  <p>
    The initial prototype relied on local PowerShell scripts and third-party package links without real-time telemetry. In this release, LPUtility integrates two complementary live APIs to provide actionable network diagnostics:
  </p>
  <ul>
    <li><strong>Multi-Region Latency & Reachability:</strong> Testing targets from Europe, Asia, North America, and Oceania using distributed probes.</li>
    <li><strong>Autonomous System & BGP Context:</strong> Identifying the authoritative Autonomous System Number (ASN), organization owner, and BGP prefix block.</li>
    <li><strong>Offline Protocol Utilities:</strong> Interactive IPv4 VLSM subnetting, 128-bit IPv6 RFC 5952 calculations, and NIST SP 800-63B password/key generation.</li>
  </ul>

  <!-- SECTION 2 -->
  <div class="page-break"></div>
  <h2>2. Dual-API Integration</h2>
  <p>
    LPUtility integrates two live, production-grade APIs that work together to provide complete network diagnostic information:
  </p>
  <table>
    <thead>
      <tr>
        <th>API</th>
        <th>Provider</th>
        <th>Endpoints</th>
        <th>Data Provided</th>
        <th>Access Method</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Globalping API</strong></td>
        <td>jsDelivr</td>
        <td><code>POST /v1/measurements</code><br><code>GET /v1/measurements/{id}</code></td>
        <td>Multi-continent ping, DNS, HTTP, and traceroute latency, packet loss, and jitter.</td>
        <td>Public REST API, open CORS (*), no client secrets.</td>
      </tr>
      <tr>
        <td><strong>RIPE Stat API</strong></td>
        <td>RIPE NCC</td>
        <td><code>GET /data/network-info/</code><br><code>GET /data/as-overview/</code></td>
        <td>Authoritative ASN, organization holder, BGP prefix, and allocation registry.</td>
        <td>Public RIR data API, open CORS (*), no API key needed.</td>
      </tr>
    </tbody>
  </table>

  <h3>2.1 API Synergy</h3>
  <p>
    When a diagnostic test is triggered for a target (e.g. <code>1.1.1.1</code> or <code>google.com</code>), LPUtility dispatches active probes across multiple continents through Globalping while concurrently querying RIPE Stat for BGP routing information. The user sees active round-trip measurements alongside the network owner and BGP prefix block.
  </p>

  <h3>2.2 Code Implementation (from <code>src/services/telemetryAggregator.js</code>)</h3>
  <pre>export async function runCombinedTelemetry({ type = 'ping', target, locations }) {
  // Concurrently dispatch Globalping active probes and RIPE Stat BGP routing lookup
  const globalpingPromise = executeGlobalpingTest({ type, target, locations });
  const ripestatPromise = fetchInfrastructureTelemetry(target);

  const [globalpingResult, ripestatResult] = await Promise.all([
    globalpingPromise.catch(err => null),
    ripestatPromise.catch(err => null)
  ]);

  return { target, type, globalping: globalpingResult, ripestat: ripestatResult };
}</pre>

  <!-- SECTION 3 -->
  <div class="page-break"></div>
  <h2>3. Responsive Design & Media Queries</h2>
  <p>
    The application adapts cleanly across desktop, tablet, and mobile viewports down to 320px width using clean CSS Flexbox, CSS Grid, and media queries in <code>src/styles/layout.css</code>:
  </p>
  <pre>/* Tablet & Mobile Breakpoint (<= 768px) */
@media (max-width: 768px) {
  .mobile-menu-btn { display: inline-flex; }
  .desktop-toggle-btn { display: none; }
  .winui-sidebar {
    position: fixed; top: 50px; bottom: 0; left: 0;
    width: 240px; transform: translateX(-100%);
    z-index: 150; box-shadow: 4px 0 20px rgba(0, 0, 0, 0.7);
  }
  .winui-sidebar.mobile-open { transform: translateX(0); }
  .main-content { padding: 12px 12px 50px 12px; }
  .results-grid { grid-template-columns: 1fr; }
}

/* Small Smartphone Viewport (<= 480px) */
@media (max-width: 480px) {
  .target-input-row { flex-direction: column; }
  .run-btn { width: 100%; }
  .summary-card { flex-direction: column; align-items: stretch; }
  .tools-grid { grid-template-columns: 1fr; }
}</pre>

  <!-- SECTION 4 -->
  <h2>4. Android Native WebView Implementation</h2>
  <p>
    The Android Studio project is located in <code>responsive webview/</code>, built with Kotlin for SDK 35 (Android 15):
  </p>
  <ul>
    <li><strong>Back Navigation:</strong> Modern <code>OnBackPressedCallback</code> checks <code>webView.canGoBack()</code> to navigate through browser history before exiting.</li>
    <li><strong>URL Routing:</strong> Application routes and local assets stay inside WebView; external links open in the device browser via <code>Intent.ACTION_VIEW</code>.</li>
    <li><strong>Progress & Refresh:</strong> Custom <code>WebChromeClient</code> updates the horizontal progress bar; <code>SwipeRefreshLayout</code> enables pull-to-refresh.</li>
    <li><strong>Offline Bundle:</strong> Bundled web assets at <code>app/src/main/assets/web/</code> ensure full functionality even when offline.</li>
  </ul>

  <!-- SECTION 5 -->
  <div class="page-break"></div>
  <h2>5. Application Screenshots & Evidence</h2>

  <h3>5.1 Desktop Network Diagnostics Workspace</h3>
  <div class="screenshot-container">
    <img src="${imgDesktopTelemetry}" alt="Desktop Diagnostics Workspace" />
    <div class="screenshot-caption">Figure 1: LPUtility Desktop Network Diagnostics displaying live probe results and BGP routing data.</div>
  </div>

  <h3>5.2 Tools & Utilities Catalog</h3>
  <div class="screenshot-container">
    <img src="${imgCatalog}" alt="Tools Catalog" />
    <div class="screenshot-caption">Figure 2: LPUtility Tools Catalog with interactive utilities.</div>
  </div>

  <div class="page-break"></div>
  <h3>5.3 Protocol Calculators (IPv4 & IPv6)</h3>
  <div class="two-col-grid">
    <div>
      <div class="screenshot-container">
        <img src="${imgIpv4}" alt="IPv4 Subnet Suite" />
        <div class="screenshot-caption">Figure 3: IPv4 Subnet Analyzer.</div>
      </div>
    </div>
    <div>
      <div class="screenshot-container">
        <img src="${imgIpv6}" alt="IPv6 128-Bit Suite" />
        <div class="screenshot-caption">Figure 4: IPv6 128-Bit Calculator.</div>
      </div>
    </div>
  </div>

  <h3>5.4 Error & Empty State Handling</h3>
  <div class="two-col-grid">
    <div>
      <div class="screenshot-container">
        <img src="${imgError}" alt="Error State" />
        <div class="screenshot-caption">Figure 5: Error state handling with retry action.</div>
      </div>
    </div>
    <div>
      <div class="screenshot-container">
        <img src="${imgEmpty}" alt="Empty State" />
        <div class="screenshot-caption">Figure 6: Empty response handling.</div>
      </div>
    </div>
  </div>

  <div class="page-break"></div>
  <h3>5.5 Mobile Responsive Adaptation & Android WebView</h3>
  <div class="two-col-grid">
    <div>
      <div class="screenshot-container">
        <img src="${imgMobileTelemetry}" alt="Mobile Viewport" style="max-height: 180mm;" />
        <div class="screenshot-caption">Figure 7: Mobile viewport (390x844).</div>
      </div>
    </div>
    <div>
      <div class="screenshot-container">
        <img src="${imgAndroidWebView}" alt="Android WebView" style="max-height: 180mm;" />
        <div class="screenshot-caption">Figure 8: Native Android WebView execution.</div>
      </div>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync('docs/report_template.html', htmlContent, 'utf8');

async function generatePdf() {
  console.log('Rendering clean LPUtility PDF report...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const filePath = 'file:///' + path.resolve('docs/report_template.html').replace(/\\/g, '/');
    await page.goto(filePath, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: OUTPUT_PDF_PATH,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        bottom: '0mm',
        left: '0mm',
        right: '0mm',
      }
    });

    console.log('PDF generated successfully at:', OUTPUT_PDF_PATH);
  } finally {
    await browser.close();
  }
}

generatePdf().catch(err => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
