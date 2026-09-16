const fs = require('fs');

// src/types.ts
let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(/password\?: string;/, "pin?: string;");
fs.writeFileSync('src/types.ts', types);

// src/components/EditMemberModal.tsx
let editModal = fs.readFileSync('src/components/EditMemberModal.tsx', 'utf8');
editModal = editModal.replace(/const \[passwordInput, setPasswordInput\] = useState\(member\.password \|\| 'watchclub123'\);/g, 
  "const [passwordInput, setPasswordInput] = useState(member.pin || '123456');");
editModal = editModal.replace(/password: result/g, "pin: result");
editModal = editModal.replace(/password: passwordInput/g, "pin: passwordInput");
editModal = editModal.replace(/member\.password \|\| 'watchclub123'/g, "member.pin || '123456'");
editModal = editModal.replace(/Masukkan password baru/g, "Masukkan PIN baru (6 digit angka)");
editModal = editModal.replace(/type=\{showPassword \? 'text' : 'password'\}/g, "type={showPassword ? 'text' : 'text'} maxLength={6} pattern=\"[0-9]*\" inputMode=\"numeric\"");
editModal = editModal.replace(/<label className="block text-xs font-bold text-slate-700 mb-1.5">Reset Password<\/label>/, "<label className=\"block text-xs font-bold text-slate-700 mb-1.5\">Reset PIN (6 Digit)</label>");

fs.writeFileSync('src/components/EditMemberModal.tsx', editModal);

// src/components/MemberPreviewModal.tsx
let previewModal = fs.readFileSync('src/components/MemberPreviewModal.tsx', 'utf8');
previewModal = previewModal.replace(/\{member\.password \|\| 'watchclub123'\}/g, "{member.pin || '123456'}");
previewModal = previewModal.replace(/Password Login/g, "PIN Login");
previewModal = previewModal.replace(/<span className="text-xs font-medium text-slate-900 font-mono tracking-wider bg-slate-100 px-2 py-1 rounded-md">/g, "<span className=\"text-sm font-bold text-slate-900 tracking-[0.2em] bg-slate-100 px-2 py-1 rounded-md\">");
fs.writeFileSync('src/components/MemberPreviewModal.tsx', previewModal);

// src/components/MembersTab.tsx
let membersTab = fs.readFileSync('src/components/MembersTab.tsx', 'utf8');
membersTab = membersTab.replace(/password, dan riwayat loyalitas/g, "PIN, dan riwayat loyalitas");
fs.writeFileSync('src/components/MembersTab.tsx', membersTab);

