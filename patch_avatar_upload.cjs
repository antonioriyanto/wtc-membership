const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

// The original code was using updateDoc directly, which might fail due to rules or need a safe fallback.
// However, the rule allows updates. Let's make sure it handles errors and falls back to safeSetDoc.
// Wait, the client is authenticated if they are on this view? The rule says `allow update: if true;` for members, so updateDoc should work... EXCEPT if there's a problem with `safeSetDoc` not being imported or something. Let's see what happens.
// Wait! `allow update: if true;` is true for all. But maybe we need to use safeSetDoc as fallback or perhaps the error is because the payload is too large for Firestore document (1 MiB limit) or maybe the image isn't saved to `localStorage` cache immediately so it disappears?

code = code.replace(
  /const memberRef = doc\(db, 'members', member\.id\);\n      await updateDoc\(memberRef, \{ avatarUrl: compressedBase64 \}\);/g,
  `const memberRef = doc(db, 'members', member.id);
      try {
        await updateDoc(memberRef, { avatarUrl: compressedBase64 });
      } catch (err2) {
        console.warn("Avatar updateDoc failed:", err2);
        try {
          await safeSetDoc('members', member.id, { ...member, avatarUrl: compressedBase64 });
        } catch (err3) {
          console.error("Avatar safeSetDoc failed:", err3);
          throw err3;
        }
      }`
);

fs.writeFileSync('src/components/CustomerMemberView.tsx', code);
