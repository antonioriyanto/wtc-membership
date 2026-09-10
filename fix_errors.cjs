const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

// 1. Fix firebase-admin import
content = content.replace(/import admin from 'firebase-admin';/, "import * as admin from 'firebase-admin';");

// 2. Fix pino logger calls that are incorrectly ordered (logger.warn(msg, obj))
content = content.replace(/logger\.warn\('Firebase Admin initialization failed\. Auth middleware will block requests if enforced\.', e\);/, "logger.warn({ err: e }, 'Firebase Admin initialization failed. Auth middleware will block requests if enforced.');");

content = content.replace(/logger\.error\("POST \/api\/members error:", err\);/g, "logger.error({ err }, 'POST /api/members error:');");
content = content.replace(/logger\.error\("PUT \/api\/members\/:id error:", err\);/g, "logger.error({ err }, 'PUT /api/members/:id error:');");
content = content.replace(/logger\.error\("POST \/api\/transactions error:", err\);/g, "logger.error({ err }, 'POST /api/transactions error:');");
content = content.replace(/logger\.error\("PUT \/api\/members\/:id error:", err\);/g, "logger.error({ err }, 'PUT /api/members/:id error:');");
content = content.replace(/logger\.error\("Error seeding initial data:", e\);/g, "logger.error({ err: e }, 'Error seeding initial data:');");
content = content.replace(/logger\.error\("Error processing transactions\/\*":, e\);/g, "logger.error({ err: e }, 'Error processing transactions/*:');");
content = content.replace(/logger\.error\('Error seeding initial data:', e\);/g, "logger.error({ err: e }, 'Error seeding initial data:');");

// Let's generic replace any remaining logger.error("some string", err) to logger.error({ err }, "some string")
// using regex
content = content.replace(/logger\.error\((["'`][^"'`]+["'`]),\s*(err|e)\);/g, "logger.error({ err: $2 }, $1);");

// 3. Fix @google/genai HarmCategory and HarmBlockThreshold
content = content.replace(/import \{ GoogleGenAI \} from '@google\/genai';/, "import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';");
content = content.replace(/category: 'HARM_CATEGORY_HARASSMENT'/, "category: HarmCategory.HARM_CATEGORY_HARASSMENT");
content = content.replace(/threshold: 'BLOCK_LOW_AND_ABOVE'/, "threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE");

fs.writeFileSync('server.ts', content, 'utf-8');
console.log('Fixed server.ts errors');
