const fs = require('fs');

// Patch tsconfig.json
let tsconfigStr = fs.readFileSync('tsconfig.json', 'utf8');
let tsconfig = JSON.parse(tsconfigStr);
tsconfig.compilerOptions.strict = true;
tsconfig.compilerOptions.noUnusedLocals = true;
tsconfig.compilerOptions.noUnusedParameters = true;
tsconfig.compilerOptions.noImplicitAny = true;
tsconfig.compilerOptions.jsx = "react-jsx";
fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));

// Patch package.json
let pkgStr = fs.readFileSync('package.json', 'utf8');
let pkg = JSON.parse(pkgStr);
pkg.scripts.build = "tsc --noEmit && vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

