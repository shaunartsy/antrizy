const fs = require('fs');
const content = fs.readFileSync('c:/Users/user/Documents/antrizy/index.html', 'utf-8');
const wixMatches = content.match(/.{0,20}wixstatic.{0,20}/g) || [];
const paraMatches = content.match(/.{0,20}parastorage.{0,20}/g) || [];
fs.writeFileSync('c:/Users/user/Documents/antrizy/matches.txt', wixMatches.slice(0,20).join('\n') + '\n---\n' + paraMatches.slice(0,20).join('\n'));
