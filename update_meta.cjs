const fs = require('fs');

const metaPath = 'metadata.json';
let meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
meta.name = "Watch Club - Loyalty & POS System";
meta.description = "Enterprise omnichannel loyalty management system for Watch Club Indonesia (40+ Stores). Features a Customer PWA, Cashier POS, and Head Office Admin Dashboard with Firebase realtime sync.";
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

const indexPath = 'index.html';
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<title>.*<\/title>/, '<title>Watch Club - Loyalty & POS System</title>');
html = html.replace(/<meta property="og:title" content=".*" \/>/, '<meta property="og:title" content="Watch Club - Loyalty & POS System" />');
html = html.replace(/<meta name="description" content=".*" \/>/, '<meta name="description" content="' + meta.description + '" />');
html = html.replace(/<meta property="og:description" content=".*" \/>/, '<meta property="og:description" content="' + meta.description + '" />');
fs.writeFileSync(indexPath, html);
