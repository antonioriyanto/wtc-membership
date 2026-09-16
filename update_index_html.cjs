const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const newName = "Watch Club - Head Office Admin Portal";
const newDesc = "Enterprise Head Office (HO) Management & Analytics Portal for Watch Club Indonesia (40+ Stores, Cashiers, Loyalty Engine & CRM)";

html = html.replace(/<title>.*?<\/title>/, `<title>${newName}</title>`);
html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${newDesc}" />`);
html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${newName}" />`);
html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${newDesc}" />`);

fs.writeFileSync('index.html', html);
