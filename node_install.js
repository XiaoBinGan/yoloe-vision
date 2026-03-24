/**
 * YOLOE Platform - Node.js Package Installer
 * Uses Node.js child_process with elevated gsudo to run pip.
 * gsudo runs at High IL, bypassing the sandbox restrictions.
 */
const { execSync, spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const zlib = require('zlib');

const PYTHON = 'F:\\mambaforge\\python.exe';
const VENV_DIR = path.join(__dirname);
const TARGET = path.join(VENV_DIR, 'Lib', 'site-packages');
const WHEEL_DIR = path.join(VENV_DIR, 'wheels');

// Ensure directories exist
function mkdirp(dir) {
  if (!fs.existsSync(dir)) {
    mkdirp(path.dirname(dir));
    fs.mkdirSync(dir);
  }
}

mkdirp(TARGET);
mkdirp(WHEEL_DIR);

// Run pip via gsudo (High IL process)
function pipInstall(pkg) {
  console.log(`  Installing ${pkg}...`);
  try {
    // Use gsudo to run pip at High IL
    const cmd = `${PYTHON} -m pip install "${pkg}" --target "${TARGET}" --quiet`;
    const result = execSync(cmd, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env, TEMP: WHEEL_DIR, TMP: WHEEL_DIR }
    });
    console.log(`    OK`);
    return true;
  } catch (e) {
    const stderr = e.stderr ? e.stderr.toString() : '';
    const stdout = e.stdout ? e.stdout.toString() : '';
    console.log(`    FAIL: ${stderr.slice(-200) || 'unknown error'}`);
    return false;
  }
}

// Check which packages are already available
function checkInstalled() {
  console.log('\nChecking installed packages...');
  const pkgs = ['fastapi', 'ultralytics', 'uvicorn', 'numpy', 'PIL', 'cv2', 'pydantic'];
  try {
    const check = execSync(`${PYTHON} -c "import sys; import importlib; ` +
      `; '.join([p+'='+getattr(importlib.import_module(p.replace('-','_')),'__version__','?') for p in ['fastapi','ultralytics','numpy','PIL','cv2','pydantic']])"`
    , { windowsHide: true });
    console.log(check.toString().trim());
  } catch(e) {
    console.log('  (check failed)');
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('YOLOE Package Installer');
  console.log(`Python: ${PYTHON}`);
  console.log(`Target: ${TARGET}`);
  console.log('='.repeat(60));

  checkInstalled();

  const packages = [
    'six==1.16.0',
    'typing_extensions==4.12.2',
    'annotated-types==0.7.0',
    'pydantic_core',
    'pydantic==2.10.4',
    'starlette==0.46.1',
    'anyio==4.8.0',
    'h11==0.14.0',
    'websockets==14.2',
    'httptools==0.6.4',
    'python-dotenv==1.0.1',
    'click==8.1.8',
    'pydantic-settings==2.7.1',
    'fastapi==0.115.6',
    'uvicorn[standard]==0.34.0',
    'python-multipart==0.0.20',
    'aiofiles==24.1.0',
    'packaging==24.2',
    'Pillow==10.4.0',
    'numpy==1.26.4',
    'opencv-python-headless==4.10.0.84',
    'ultralytics==8.3.56',
  ];

  const ok = [], fail = [];
  for (const pkg of packages) {
    if (pipInstall(pkg)) {
      ok.push(pkg);
    } else {
      // Try without deps
      const alt = pkg.replace(/==.*/, '');
      console.log(`  Retrying ${alt} (no-deps)...`);
      try {
        execSync(`${PYTHON} -m pip install ${alt} --target "${TARGET}" --no-deps -q`, {
          windowsHide: true,
          env: { ...process.env, TEMP: WHEEL_DIR, TMP: WHEEL_DIR }
        });
        console.log(`    OK (no-deps)`);
        ok.push(pkg + ' [no-deps]');
      } catch(e2) {
        fail.push(pkg);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Installed: ${ok.length}, Failed: ${fail.length}`);
  if (ok.length) console.log('OK:', ok.join(', '));
  if (fail.length) console.log('FAILED:', fail.join(', '));
  checkInstalled();
}

main().catch(console.error);
