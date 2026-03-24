/**
 * YOLOE Vision Platform - Mock Backend Server (Node.js)
 * Serves the frontend and provides mock detection API endpoints.
 * Run: node server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const WORKSPACE = path.join(__dirname);

// Builtin class pool
const CLASSES = [
  "person","bicycle","car","motorcycle","airplane","bus","train","truck","boat",
  "traffic light","fire hydrant","stop sign","bench","bird","cat","dog","horse","sheep",
  "cow","elephant","bear","zebra","giraffe","backpack","umbrella","handbag","tie",
  "suitcase","frisbee","skis","snowboard","sports ball","kite","bottle","wine glass",
  "cup","fork","knife","spoon","bowl","banana","apple","sandwich","orange","broccoli",
  "carrot","hot dog","pizza","donut","cake","chair","couch","potted plant","bed",
  "dining table","toilet","tv","laptop","mouse","remote","keyboard","cell phone",
  "book","clock","vase","scissors","teddy bear","toothbrush","building","door","fence",
  "tree","trunk","window","road","sidewalk","sky","grass","wall","building facade"
];

const PALETTE = [
  [255,87,34],[34,198,115],[59,130,246],[245,158,11],[168,85,247],[236,72,153],
  [20,184,166],[249,115,22],[124,58,237],[14,165,233],[34,197,94],[239,68,68]
];

function generateDetections(imgW, imgH, mode, textPrompt) {
  const count = Math.floor(Math.random() * 12) + 4;
  const classPool = (mode === 'text' && textPrompt)
    ? textPrompt.split(/[,，、\s]+/).filter(Boolean).slice(0, 30)
    : CLASSES;
  const detections = [];
  for (let i = 0; i < count; i++) {
    const cls = classPool[Math.floor(Math.random() * classPool.length)];
    const x1 = Math.random() * (imgW - 350);
    const y1 = Math.random() * (imgH - 350);
    const bw = Math.random() * 220 + 70;
    const bh = Math.random() * 220 + 70;
    detections.push({
      class_name: cls,
      confidence: +(Math.random() * 0.68 + 0.28).toFixed(3),
      bbox: [+x1.toFixed(1), +y1.toFixed(1), +(x1+bw).toFixed(1), +(y1+bh).toFixed(1)],
      segmentation: []
    });
  }
  return detections;
}

function computeStats(detections) {
  const counts = {};
  detections.forEach(d => { counts[d.class_name] = (counts[d.class_name] || 0) + 1; });
  return { total_objects: detections.length, classes: counts };
}

// Parse multipart form data (simplified — reads body as binary)
async function parseFormData(body, boundary) {
  // For mock purposes, just return the raw body length as image size
  return { fields: {}, fileData: body };
}

// Simple mock: estimate image size from upload size
function estimateSize(contentLength) {
  // Rough guess: image file size ~ 10% of raw bytes for JPEG
  const px = Math.floor(Math.sqrt(contentLength / 3) * 5);
  return { width: Math.min(px, 1920), height: Math.min(Math.floor(px * 0.75), 1080) };
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  try {
    // Health check
    if (pathname === '/api/health') {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ status: 'ok', model_loaded: false, model_name: 'mock', device: 'mock' }));
      return;
    }

    // Classes list
    if (pathname === '/api/classes') {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ classes: CLASSES, count: CLASSES.length }));
      return;
    }

    // Image detection
    if (pathname === '/api/detect/image') {
      const contentType = req.headers['content-type'] || '';
      const boundary = contentType.includes('multipart/form-data')
        ? '--' + contentType.split('boundary=')[1]
        : null;

      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      const contentLength = body.length;

      // Parse mode and text_prompt from form data
      let mode = 'none';
      let textPrompt = '';
      if (boundary) {
        const text = body.toString('utf8');
        const modeMatch = text.match(/name="mode"\r?\n\r?\n([^\r]+)/);
        const promptMatch = text.match(/name="text_prompt"\r?\n\r?\n([^\r]+)/);
        if (modeMatch) mode = modeMatch[1].trim();
        if (promptMatch) textPrompt = promptMatch[1].trim();
      } else {
        mode = url.searchParams.get('mode') || 'none';
        textPrompt = url.searchParams.get('text_prompt') || '';
      }

      // Estimate image size from content length
      const { width, height } = estimateSize(contentLength);
      const startTime = Date.now();

      // Simulate detection delay
      await new Promise(r => setTimeout(r, 400 + Math.random() * 600));

      const detections = generateDetections(width, height, mode, textPrompt);
      const stats = { ...computeStats(detections), inference_time_ms: Date.now() - startTime };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        result_image: null, // client renders
        detections,
        stats
      }));
      return;
    }

    // Video detection (same as image)
    if (pathname === '/api/detect/video') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      const { width, height } = estimateSize(body.length);
      const startTime = Date.now();
      await new Promise(r => setTimeout(r, 500 + Math.random() * 800));
      const detections = generateDetections(width, height, 'none', '');
      const stats = { ...computeStats(detections), inference_time_ms: Date.now() - startTime };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, result_image: null, detections, stats }));
      return;
    }

    // Serve static files
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(WORKSPACE, filePath);

    // Security: prevent directory traversal
    if (!filePath.startsWith(WORKSPACE)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const ct = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': ct });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // Fallback to index.html (SPA routing)
      const indexPath = path.join(WORKSPACE, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(indexPath).pipe(res);
      } else {
        res.writeHead(404); res.end('Not Found');
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 YOLOE Vision Platform`);
  console.log(`   Frontend: http://localhost:${PORT}`);
  console.log(`   API Docs: http://localhost:${PORT}/api/health`);
  console.log(`   Mode: MOCK (client-side canvas rendering)\n`);
});
