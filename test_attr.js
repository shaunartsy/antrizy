const cheerio = require('cheerio');
const fs = require('fs');
const content = fs.readFileSync('c:/Users/user/Documents/antrizy/index.html', 'utf-8');
const $ = cheerio.load(content);
let c = 0;
$('*').each((i, el) => {
    Object.keys(el.attribs || {}).forEach(attr => {
        if (el.attribs[attr].includes('wixstatic') || el.attribs[attr].includes('parastorage')) {
            if (c < 30) {
                console.log(el.tagName, attr, el.attribs[attr].substring(0, 80));
                c++;
            }
        }
    });
});
// let's also check text nodes!
$('script').each((i, el) => {
    const text = $(el).html();
    if (text && (text.includes('wixstatic') || text.includes('parastorage'))) {
        console.log('SCRIPT content contains wix URL, length:', text.length);
    }
});
