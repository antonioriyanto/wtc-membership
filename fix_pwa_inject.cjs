const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

// Find the end of the return statement. It's usually something like:
//        )}
//        {isQrModalOpen && (
// or similar.
// Wait, the bottom navigation is in CustomerMemberView? Let's check where to inject it.
// Let's inject it right before the last closing </div> of the main return.

if (!content.includes('<PwaInstallPrompt />')) {
  // We can just add it before the first occurrence of {isQrModalOpen && (
  content = content.replace(
    /(\{\s*isQrModalOpen && \()/g,
    `<PwaInstallPrompt />\n        $1`
  );
  fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
  console.log('PwaInstallPrompt injected');
} else {
  console.log('Already injected');
}
