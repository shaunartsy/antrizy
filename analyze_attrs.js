const cheerio = require('cheerio');
const fs = require('fs');

const content = fs.readFileSync('c:/Users/user/Documents/antrizy/rendered_index.html', 'utf-8');
const $ = cheerio.load(content);

let count = 0;
$('[style*="wixstatic.com"]').each((i, el) => {
    if (count < 10) {
        console.log('--- ELEMENT with background ---');
        console.log('tag:', el.tagName);
        console.log('id:', $(el).attr('id'));
        console.log('alt:', $(el).attr('alt'));
        console.log('aria-label:', $(el).attr('aria-label'));
        console.log('data-src:', $(el).attr('data-src'));
        console.log('style:', $(el).attr('style'));
        count++;
    }
});

let imgCount = 0;
$('img[src*="wixstatic.com"]').each((i, el) => {
    if (imgCount < 5) {
        console.log('--- IMG ---');
        console.log('src:', $(el).attr('src'));
        console.log('alt:', $(el).attr('alt'));
        console.log('aria-label:', $(el).attr('aria-label'));
        imgCount++;
    }
});
