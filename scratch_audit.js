const fs = require('fs');

const subpages = [
  'about/index.html',
  'contact/index.html',
  'products/index.html',
  'products-mixed/index.html',
];

console.log('=== FULL PATH AUDIT ===\n');

subpages.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let issues = [];

  lines.forEach((line, idx) => {
    // Check for ./images/ (should be ../images/)
    if (line.includes('./images/')) {
      issues.push({ line: idx + 1, type: './images/', snippet: line.trim().substring(0, 120) });
    }
    // Check for bare "images/ in src/srcset/href (not ../images/)
    if (line.match(/(?:src|srcset|href|poster)="images\//) || line.match(/url\(["']?images\//)) {
      issues.push({ line: idx + 1, type: 'bare images/', snippet: line.trim().substring(0, 120) });
    }
    // Check for ./css/ (should be ../css/)
    if (line.includes('./css/')) {
      issues.push({ line: idx + 1, type: './css/', snippet: line.trim().substring(0, 120) });
    }
    // Check for bare "css/ in href
    if (line.match(/href="css\//)) {
      issues.push({ line: idx + 1, type: 'bare css/', snippet: line.trim().substring(0, 120) });
    }
    // Check srcset with relative paths (multiline srcsets start with whitespace + path)
    if (line.match(/^\s+\.\/images\//) || line.match(/^\s+images\//)) {
      // Only flag if it looks like a srcset continuation
      if (lines[idx-1] && (lines[idx-1].includes('srcset') || lines[idx-1].match(/^\s+\S+\.(jpg|png|webp|gif|svg)/i))) {
        issues.push({ line: idx + 1, type: 'srcset relative', snippet: line.trim().substring(0, 120) });
      }
    }
  });

  console.log(`${file}: ${issues.length} issues`);
  issues.forEach(i => console.log(`  Line ${i.line} [${i.type}]: ${i.snippet}`));
});

// Also check for any srcset that contains ./images or bare images/ inside the attribute value
console.log('\n=== SRCSET DEEP CHECK ===\n');
subpages.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Extract all srcset values
  const srcsetRegex = /srcset="([^"]+)"/g;
  let m;
  let badSrcsets = 0;
  while ((m = srcsetRegex.exec(content)) !== null) {
    const val = m[1];
    if (val.includes('./images/') || val.match(/(?:^|\s)images\//)) {
      badSrcsets++;
      console.log(`${file}: BAD srcset: ${val.substring(0, 100)}...`);
    }
  }
  if (badSrcsets === 0) {
    console.log(`${file}: All srcsets OK`);
  }
});

// Check background-image url() in CSS that might reference local images
console.log('\n=== CSS url() CHECK ===\n');
subpages.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const urlRegex = /url\(["']?(?!data:|https?:|\/\/|#)([^"')]+)/g;
  let m;
  while ((m = urlRegex.exec(content)) !== null) {
    if (m[1].includes('images/')) {
      console.log(`${file}: CSS url() with images ref: ${m[1].substring(0, 100)}`);
    }
  }
  // If no matches printed, note it
});
