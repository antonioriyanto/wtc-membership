const crypto = require('crypto');
const fs = require('fs');

let content = fs.readFileSync('src/components/LoginWall.tsx', 'utf8');
const match = content.match(/export const STORE_ACCOUNTS = (\[[\s\S]*?\]);/);
if (match) {
  const arrStr = match[1].replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
  const arr = eval(match[1]); // safe enough here
  
  const hashes = {};
  for (let s of arr) {
    const hash = crypto.createHash('sha256').update(s.pin).digest('hex');
    hashes[s.username] = hash;
  }
  hashes['HO'] = crypto.createHash('sha256').update('WTC26').digest('hex');
  hashes['ADMIN'] = crypto.createHash('sha256').update('WTC26').digest('hex');
  hashes['ADMINWTC'] = crypto.createHash('sha256').update('WTC26').digest('hex');

  console.log("export const STORE_PIN_HASHES: Record<string, string> = " + JSON.stringify(hashes, null, 2) + ";");
} else {
  console.log("Not found");
}
