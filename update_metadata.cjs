const fs = require('fs');
let meta = fs.readFileSync('metadata.json', 'utf8');
let json = JSON.parse(meta);
json.name = "Watch Club - Head Office Admin Portal";
json.description = "Enterprise Head Office (HO) Management & Analytics Portal for Watch Club Indonesia (40+ Stores, Cashiers, Loyalty Engine & CRM)";
fs.writeFileSync('metadata.json', JSON.stringify(json, null, 2));
