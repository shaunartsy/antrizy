const fs = require('fs');

const content = fs.readFileSync('c:/Users/user/Documents/antrizy/rendered_index.html', 'utf-8');

// Find all image tags and print their attributes to see if we can find original filenames
const imgTagRegex = /<img[^>]+>/g;
let match;
let count = 0;
while ((match = imgTagRegex.exec(content)) !== null && count < 20) {
    console.log(match[0]);
    count++;
}

// Find wix-image custom elements
const wixImageRegex = /<wix-image[^>]+>/g;
count = 0;
while ((match = wixImageRegex.exec(content)) !== null && count < 10) {
    console.log(match[0]);
    count++;
}

// Search for one of the downloaded images in the HTML text
console.log('\nSearching for downloaded image names in HTML:');
const imagesDir = 'c:/Users/user/Documents/antrizy/images';
const downloadedImages = fs.readdirSync(imagesDir);

for (let i = 0; i < 20; i++) {
    const imgName = downloadedImages[i];
    if (content.includes(imgName)) {
        console.log('Found exact match for:', imgName);
    }
    const baseName = imgName.split('.')[0].replace('_edited', '');
    if (content.includes(baseName) && baseName.length > 3) {
        console.log('Found partial match for:', baseName);
    }
}
