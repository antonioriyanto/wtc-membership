const fs = require('fs');
let content = fs.readFileSync('src/main.tsx', 'utf8');
if (!content.includes('ErrorBoundary')) {
  content = "import { ErrorBoundary } from './ErrorBoundary';\n" + content;
  content = content.replace('<BrowserRouter>', '<ErrorBoundary><BrowserRouter>');
  content = content.replace('</BrowserRouter>', '</BrowserRouter></ErrorBoundary>');
  fs.writeFileSync('src/main.tsx', content);
}
