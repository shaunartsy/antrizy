const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

const content = fs.readFileSync('c:/Users/user/Documents/antrizy/rendered_index.html', 'utf-8');
const $ = cheerio.load(content);

const imagesDir = 'c:/Users/user/Documents/antrizy/images';
const cssDir = 'c:/Users/user/Documents/antrizy/css';
if (!fs.existsSync(cssDir)) fs.mkdirSync(cssDir);

const downloadedImages = fs.readdirSync(imagesDir);

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
                // don't reject to avoid breaking Promise.all, just log and resolve
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

function findMatchingImage(urlStr) {
    try {
        const urlObj = new URL(urlStr);
        const parts = urlObj.pathname.split('/');
        let filename = decodeURIComponent(parts[parts.length - 1]);
        if (filename === 'media' || parts.length <= 3) {
            filename = decodeURIComponent(parts[parts.length - 1]);
        }
        
        let match = downloadedImages.find(img => img === filename || img.startsWith(filename.split('.')[0]));
        if (match) return { match: true, filename: match };
        
        return { match: false, filename: sanitizeFilename(filename) };
    } catch (e) {
        return null;
    }
}

async function processImages() {
    const promises = [];

    // Process img src
    $('img[src*="wixstatic.com"]').each((i, el) => {
        const src = $(el).attr('src');
        const imgInfo = findMatchingImage(src);
        if (imgInfo) {
            if (!imgInfo.match) {
                promises.push(downloadFile(src, path.join(imagesDir, imgInfo.filename)));
            }
            $(el).attr('src', `./images/${imgInfo.filename}`);
        }
    });

    // Process img srcset
    $('img[srcset*="wixstatic.com"]').each((i, el) => {
        const srcset = $(el).attr('srcset');
        if (!srcset) return;
        // srcset parsing: replace wix URLs with local URLs using regex
        let newSrcset = srcset;
        const wixRegex = /https:\/\/[^ ]*wixstatic\.com[^ ]+/g;
        
        let match;
        while ((match = wixRegex.exec(srcset)) !== null) {
            const url = match[0];
            const imgInfo = findMatchingImage(url);
            if (imgInfo) {
                if (!imgInfo.match) {
                    promises.push(downloadFile(url, path.join(imagesDir, imgInfo.filename)));
                }
                newSrcset = newSrcset.replace(url, `./images/${imgInfo.filename}`);
            }
        }
        
        $(el).attr('srcset', newSrcset);
    });
    
    // Process object data
    $('object[data*="wixstatic.com"]').each((i, el) => {
        const src = $(el).attr('data');
        const imgInfo = findMatchingImage(src);
        if (imgInfo) {
            if (!imgInfo.match) {
                promises.push(downloadFile(src, path.join(imagesDir, imgInfo.filename)));
            }
            $(el).attr('data', `./images/${imgInfo.filename}`);
        }
    });

    // Process inline styles background-image
    $('[style*="wixstatic.com"]').each((i, el) => {
        let style = $(el).attr('style');
        const bgRegex = /url\(['"]?(https:\/\/[^'"]+wixstatic\.com[^'"]+)['"]?\)/g;
        
        let match;
        while ((match = bgRegex.exec(style)) !== null) {
            const url = match[1];
            const imgInfo = findMatchingImage(url);
            if (imgInfo) {
                if (!imgInfo.match) {
                    promises.push(downloadFile(url, path.join(imagesDir, imgInfo.filename)));
                }
                style = style.replace(url, `./images/${imgInfo.filename}`);
            }
        }
        $(el).attr('style', style);
    });

    await Promise.all(promises);
}

async function processCSS() {
    const promises = [];
    $('link[rel="stylesheet"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.startsWith('http')) {
            const filename = sanitizeFilename(path.basename(new URL(href).pathname));
            const dest = path.join(cssDir, filename);
            promises.push(downloadFile(href, dest));
            $(el).attr('href', `./css/${filename}`);
        }
    });
    
    // Also style tags with data-url
    $('style[data-url]').each((i, el) => {
        const url = $(el).attr('data-url');
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
    $('script').each((i, el) => {
        const src = $(el).attr('src');
        const html = $(el).html() || '';
        
        if (src) {
            if (src.includes('sentry-cdn') || src.includes('parastorage') || src.includes('wixstatic') || src.includes('polyfill')) {
                $(el).remove();
            }
        } else if (html.includes('handleAccessTokens bundle') || html.includes('overrideGlobals bundle') || html.includes('performance.mark')) {
            if (html.includes('handleAccessTokens') || html.includes('overrideGlobals')) {
                $(el).remove();
            }
        }
    });
}

async function main() {
    await processImages();
    await processCSS();
    cleanupScripts();
    
    fs.writeFileSync('c:/Users/user/Documents/antrizy/index.html', $.html());
    console.log('Cleanup finished. Saved to index.html');
}

main().catch(console.error);
