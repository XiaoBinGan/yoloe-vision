/**
 * YOLOE Vision Platform - Wheel Downloader + Installer
 * Downloads pip wheels via Node.js (no temp file issues), then extracts
 * them using Python's zipfile (no temp file needed either).
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const zlib = require('zlib');

const PYTHON = 'F:\\mambaforge\\python.exe';
const SITE_PKGS = 'D:\\softwares\\yoloe_venv\\Lib\\site-packages';
const WHEEL_DIR = 'F:\\QClaw\\workspace\\yoloe-vision\\wheels';

// Packages to install
const PACKAGES = [
  // Core dependencies first (no binary deps)
  { name: 'six', version: '1.16.0' },
  { name: 'pydantic_core-2.27.2', url: null },  // placeholder
  { name: 'pydantic', version: '2.10.4' },
  { name: 'fastapi', version: '0.115.6' },
  { name: 'starlette', version: '0.46.1' },
  { name: 'python-multipart', version: '0.0.20' },
  { name: 'aiofiles', version: '24.1.0' },
  { name: 'pillow', version: '10.4.0' },
  { name: 'numpy', version: '1.26.4' },
  { name: 'opencv-python_headless', version: '4.10.0.84' },
  { name: 'ultralytics', version: '8.3.56' },
  { name: 'annotated-types', version: '0.7.0' },
  { name: 'idna', version: '3.10' },
  { name: 'sniffio', version: '1.3.1' },
  { name: 'anyio', version: '4.8.0' },
  { name: 'h11', version: '0.14.0' },
  { name: 'httptools', version: '0.6.4' },
  { name: 'uvicorn', version: '0.34.0' },
  { name: 'watchfiles', version: '0.24.0.0' },
  { name: 'websockets', version: '14.2' },
  { name: 'pydantic_settings', version: '2.7.1' },
  { name: 'click', version: '8.1.8' },
  { name: 'python-dotenv', version: '1.0.1' },
  { name: 'packaging', version: '24.2' },
  { name: 'typing_extensions', version: '4.12.2' },
  { name: 'exceptiongroup', version: '1.2.2' },
  { name: 'websocket-client', version: '1.8.0' },
];

function mkdirp(dir) {
  if (!fs.existsSync(dir)) {
    mkdirp(path.dirname(dir));
    fs.mkdirSync(dir);
  }
}

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    console.log(`  Downloading ${path.basename(dest)}...`);
    protocol.get(url, { timeout: 30000 }, response => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    }).on('timeout', () => {
      file.close();
      fs.unlink(dest, () => {});
      reject(new Error('Download timeout'));
    }).setTimeout(30000);
  });
}

async function getPypiUrl(package, version) {
  return new Promise((resolve, reject) => {
    const url = `https://pypi.org/pypi/${package}/${version}/json`;
    https.get(url, { timeout: 10000 }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // Find cp310 cp311 cp312 win_amd64 wheel
          const files = json.urls || [];
          const wheel = files.find(f =>
            f.filename.endsWith('-cp310-cp310-win_amd64.whl') ||
            f.filename.endsWith('-cp311-cp311-win_amd64.whl') ||
            f.filename.endsWith('-cp312-cp312-win_amd64.whl') ||
            f.filename.endsWith('-py3-none-any.whl')
          ) || files.find(f => f.filename.endsWith('.whl') && !f.filename.includes('macos') && !f.filename.includes('darwin') && !f.filename.includes('linux') && !f.filename.includes('i686') && !f.filename.includes('arm'));
          if (wheel) resolve(wheel.url);
          else reject(new Error(`No wheel found for ${package} ${version}`));
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout'))).setTimeout(10000);
  });
}

async function main() {
  mkdirp(WHEEL_DIR);
  mkdirp(SITE_PKGS);

  console.log('YOLOE Wheel Installer\n');

  // Download each package
  const downloaded = [];
  for (const pkg of PACKAGES) {
    const filename = `${pkg.name}-${pkg.version}-py3-none-any.whl`;
    const dest = path.join(WHEEL_DIR, filename.replace(/:/g, '_'));
    try {
      console.log(`\n[${pkg.name} ${pkg.version}]`);
      if (!fs.existsSync(dest)) {
        const url = await getPypiUrl(pkg.name, pkg.version);
        await download(url, dest);
      } else {
        console.log(`  Already downloaded (skipping)`);
      }
      downloaded.push({ name: pkg.name, version: pkg.version, file: dest });
    } catch(e) {
      console.log(`  SKIP/ERROR: ${e.message}`);
    }
  }

  console.log(`\nDownloaded: ${downloaded.length} packages`);
  console.log('Wheels saved to:', WHEEL_DIR);
}

main().catch(console.error);
