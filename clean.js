const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const oldLength = content.length;
    
    // Remove hide-wix-ads style block
    const hideWixAdsRegex = /<style id="hide-wix-ads">[\s\S]*?<\/style>\s*/g;
    content = content.replace(hideWixAdsRegex, '');
    
    // Remove empty stylableCss or compCssMappers blocks (e.g. <style id="stylableCss_bi104"></style>)
    const emptyStyleRegex = /<style id="stylableCss_[^"]+">\s*<\/style>\s*/g;
    content = content.replace(emptyStyleRegex, '');

    const emptyCompRegex = /<style id="compCssMappers_[^"]+">\s*<\/style>\s*/g;
    content = content.replace(emptyCompRegex, '');
    
    // Remove empty comments like <!-- --> or comments with spaces
    const emptyCommentRegex = /<!--\s*-->/g;
    content = content.replace(emptyCommentRegex, '');
    
    // Remove specific known empty tags like <defs id="dom-store-defs"></defs> if empty
    
    if (content.length !== oldLength) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Cleaned ' + file);
    }
});
