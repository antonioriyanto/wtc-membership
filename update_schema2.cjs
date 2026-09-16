const fs = require('fs');
let createModal = fs.readFileSync('src/components/CreateMemberModal.tsx', 'utf8');

// There isn't any "password" mentioned in CreateMemberModal because it probably automatically assigns a pin or something, let's see.
if (createModal.includes('watchclub123')) {
  createModal = createModal.replace(/'watchclub123'/g, "'123456'");
}
fs.writeFileSync('src/components/CreateMemberModal.tsx', createModal);

// App.tsx backend logic
let app = fs.readFileSync('src/App.tsx', 'utf8');
if (app.includes('watchclub123')) {
  app = app.replace(/'watchclub123'/g, "'123456'");
}
if (app.includes('password')) {
  // Let's replace only specific member.password instances
  app = app.replace(/member\.password/g, "member.pin");
  app = app.replace(/newMember\.password/g, "newMember.pin");
  app = app.replace(/password:/g, "pin:");
}
fs.writeFileSync('src/App.tsx', app);
