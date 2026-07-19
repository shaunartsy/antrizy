const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('c:/Users/user/Documents/antrizy/rendered_index.html', 'utf-8');
const $ = cheerio.load(content);

const imagesDir = 'c:/Users/user/Documents/antrizy/images';
const downloadedImages = fs.readdirSync(imagesDir);

let missing = 0;
let found = 0;

$('img[src*="wixstatic.com"]').each((i, el) => {
    const src = $(el).attr('src');
    const urlObj = new URL(src);
    const parts = urlObj.pathname.split('/');
    let filename = decodeURIComponent(parts[parts.length - 1]);
    
    // some images might be in the root of media: /media/hash.jpg
    if (filename === 'media' || parts.length <= 3) {
        filename = decodeURIComponent(parts[parts.length - 1]);
    }
    
    // Exact or partial match
    const match = downloadedImages.find(img => img === filename || img.startsWith(filename.split('.')[0]));
    if (match) {
        found++;
    } else {
        console.log('Missing mapping for:', src, '-> expected:', filename);
        missing++;
    }
});

console.log(`Found: ${found}, Missing: ${missing}`);
