const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const catalog = require('./src/data/catalog.json');
const iconsDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
      fileStream.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function fetchAllIcons() {
  console.log(`Fetching .ico files for ${catalog.length} software packages...`);

  for (const item of catalog) {
    const targetFile = path.join(iconsDir, `${item.id}.ico`);
    if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 200) {
      console.log(`✓ [Cached] ${item.name}`);
      continue;
    }

    try {
      const domain = new URL(item.officialUrl).hostname;
      // Primary: Official direct favicon.ico
      const primaryUrl = `https://${domain}/favicon.ico`;
      // Secondary fallback: High-res 128px icon from Google favicon service
      const fallbackUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

      try {
        await downloadFile(primaryUrl, targetFile);
        console.log(`✓ [Direct .ico] ${item.name} (${domain})`);
      } catch (err) {
        await downloadFile(fallbackUrl, targetFile);
        console.log(`✓ [High-res Favicon] ${item.name} (${domain})`);
      }
    } catch (err) {
      console.warn(`✗ [Failed] ${item.name}: ${err.message}`);
    }
  }

  console.log('Finished fetching icons.');
}

fetchAllIcons();
