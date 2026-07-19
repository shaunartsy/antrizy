const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('c:/Users/user/Documents/antrizy/index.html', 'utf-8');
const imagesDir = 'c:/Users/user/Documents/antrizy/images';
const downloadedImages = fs.readdirSync(imagesDir);

function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

function findMatchingImage(urlStr) {
    try {
        let unescaped = urlStr.replace(/\\\//g, '/');
        const urlObj = new URL(unescaped);
        const parts = urlObj.pathname.split('/');
        let filename = decodeURIComponent(parts[parts.length - 1]);
        if (filename === 'media' || parts.length <= 3) {
            filename = decodeURIComponent(parts[parts.length - 1]);
        }
        
        let match = downloadedImages.find(img => img === filename || img.startsWith(filename.split('.')[0]));
        if (match) return match;
        
        return sanitizeFilename(filename);
    } catch (e) {
        return null;
    }
}

// 1. Remove link rel preload/prefetch to parastorage
const cheerio = require('cheerio');
const $ = cheerio.load(content);
$('link[href*="parastorage"]').each((i, el) => {
    const rel = $(el).attr('rel');
    if (rel === 'preload' || rel === 'prefetch' || rel === 'dns-prefetch') {
        $(el).remove();
    }
});

// 2. remove meta tags that we don't want or replace wixstatic in them
$('meta[content*="wixstatic"]').each((i, el) => {
    const content = $(el).attr('content');
    if (content.includes('wixstatic.com/media')) {
        const urlMatch = content.match(/https:\/\/[^"'\s]*wixstatic\.com\/media\/[^"'\s]*/);
        if (urlMatch) {
            const newName = findMatchingImage(urlMatch[0]);
            if (newName) {
                $(el).attr('content', `./images/${newName}`);
            }
        }
    }
});

content = $.html();

// 3. Global blind replace for anything left in scripts (like viewerModel)
// We will look for https://static.wixstatic.com/media/XXXX or escaped versions
const wixRegex = /https:(?:\\?\/){2}[^"'\s]*wixstatic\.com(?:\\?\/)media(?:\\?\/)[^"'\s&]*/g;
content = content.replace(wixRegex, (match) => {
    const newName = findMatchingImage(match);
    if (newName) {
        return `./images/${newName}`;
    }
    return match;
});

// Write it out
fs.writeFileSync('c:/Users/user/Documents/antrizy/index.html', content);
console.log('Final pass finished. Saved to index.html');
