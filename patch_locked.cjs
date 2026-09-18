const fs = require('fs');
let code = fs.readFileSync('src/lib/canonicalMember.ts', 'utf8');

code = code.replace(
  /export function isAccountLocked\(member: Pick<CanonicalMemberDocument, 'lockedUntil'>\): \{/g,
  "export function isAccountLocked(member: { lockedUntil?: string | null }): {"
);

fs.writeFileSync('src/lib/canonicalMember.ts', code);
