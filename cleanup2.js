const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

const content = fs.readFileSync('c:/Users/user/Documents/antrizy/index.html', 'utf-8');
const $ = cheerio.load(content);

const cssDir = 'c:/Users/user/Documents/antrizy/css';

async function downloadFile(url, dest) {
    if (fs.existsSync(dest)) return;
    console.log('Downloading', url, 'to', dest);
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                console.error(`Failed to get '${url}' (${response.statusCode})`);
                file.close();
                fs.unlink(dest, () => {});
                return resolve();
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            console.error(`Error downloading ${url}: ${err.message}`);
            resolve();
        });
    });
}

function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

async function processCSS() {
    const promises = [];
    
    // style tags with data-href
    $('style[data-href]').each((i, el) => {
        const url = $(el).attr('data-href');
        if (url && url.startsWith('http')) {
            const filename = sanitizeFilename(path.basename(new URL(url).pathname));
            const contentCSS = $(el).html();
            if (contentCSS && contentCSS.trim().length > 0) {
                fs.writeFileSync(path.join(cssDir, filename), contentCSS);
                $(el).replaceWith(`<link rel="stylesheet" href="./css/${filename}">`);
            } else {
                promises.push(downloadFile(url, path.join(cssDir, filename)).then(() => {
                    $(el).replaceWith(`<link rel="stylesheet" href="./css/${filename}">`);
                }));
            }
        }
    });

    await Promise.all(promises);
}

function cleanupScripts() {
    // Also remove the wix-essential-viewer-model as it contains huge JSON that is useless for local static html
    $('#wix-essential-viewer-model').remove();
    
    // remove any remaining script with data-url
    $('script[data-url]').each((i, el) => {
        const url = $(el).attr('data-url');
        if (url && (url.includes('parastorage') || url.includes('wixstatic'))) {
            $(el).remove();
        }
    });

    // remove all wix custom elements scripts if they exist
    $('script').each((i, el) => {
        const src = $(el).attr('src');
        if (src && (src.includes('parastorage') || src.includes('wixstatic'))) {
            $(el).remove();
        }
    });
}

async function main() {
    await processCSS();
    cleanupScripts();
    
    fs.writeFileSync('c:/Users/user/Documents/antrizy/index.html', $.html());
    console.log('Extra cleanup finished. Saved to index.html');
}

main().catch(console.error);
