const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
let start = h.indexOf('<section id="comp-lpj1bhfh"');
let end = h.indexOf('</section>', start) + 10;
console.log(h.substring(start, end));
