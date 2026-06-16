// One-off: pull the two base64 audio data URIs out of src/App.jsx into real
// files under /public, and rewrite the constants to reference those files.
// This cuts the JS bundle by ~6.7MB and lets the browser stream/decode the
// audio natively (fixing the startup glitch).
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.jsx');
let src = fs.readFileSync(appPath, 'utf8');

function extract(constName, outFile) {
  const re = new RegExp('const ' + constName + ' = "data:audio/mpeg;base64,([A-Za-z0-9+/=]+)"');
  const m = src.match(re);
  if (!m) { console.log('NO MATCH for ' + constName); return; }
  const bytes = Buffer.from(m[1], 'base64');
  const outPath = path.join(__dirname, '..', 'public', outFile);
  fs.writeFileSync(outPath, bytes);
  src = src.replace(re, 'const ' + constName + ' = "/' + outFile + '"');
  console.log(constName + ' -> public/' + outFile + ' (' + (bytes.length / 1024 / 1024).toFixed(2) + ' MB)');
}

extract('BG_URL', 'Streamside-Life.mp3');
extract('BR_URL', '832Hz-Love-Freq.mp3');

fs.writeFileSync(appPath, src);
console.log('App.jsx rewritten. New size: ' + (Buffer.byteLength(src) / 1024).toFixed(0) + ' KB');
