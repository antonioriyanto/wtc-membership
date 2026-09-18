const fs = require('fs');
let sw = fs.readFileSync('src/lib/sync-worker.ts', 'utf8');
sw = sw.replace('export async function startSyncWorker(_isInitial: boolean = false) {', 'export async function startSyncWorker() {');
fs.writeFileSync('src/lib/sync-worker.ts', sw);
