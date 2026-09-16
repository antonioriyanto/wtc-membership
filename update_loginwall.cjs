const fs = require('fs');
let text = fs.readFileSync('src/components/LoginWall.tsx', 'utf8');

text = text.replace(/password: /g, "pin: ");
text = text.replace(/s\.password === p/g, "s.pin === p");
text = text.replace(/s\.password\.toUpperCase/g, "s.pin.toUpperCase");
text = text.replace(/\[password, setPassword\]/g, "[pin, setPin]");
text = text.replace(/const p = password\.trim\(\);/g, "const p = pin.trim();");
text = text.replace(/Username dan Password/g, "Username dan PIN");
text = text.replace(/atau Password toko/g, "atau PIN toko");
text = text.replace(/setPassword\(''\)/g, "setPin('')");
text = text.replace(/Password Cabang/g, "PIN Cabang");
text = text.replace(/Password Head Office/g, "PIN Head Office");
text = text.replace(/showPassword/g, "showPin");
text = text.replace(/setShowPassword/g, "setShowPin");
text = text.replace(/value=\{password\}/g, "value={pin}");
text = text.replace(/setPassword\(/g, "setPin(");
text = text.replace(/password cabang/g, "PIN cabang");
text = text.replace(/new-password/g, "off");
text = text.replace(/Sembunyikan password/g, "Sembunyikan PIN");
text = text.replace(/Lihat password/g, "Lihat PIN");
text = text.replace(/Password tidak/g, "PIN tidak");
text = text.replace(/password admin/g, "PIN admin");
text = text.replace(/type=\{showPin \? "text" : "password"\}/g, "type={showPin ? \"text\" : \"password\"} maxLength={10}");

fs.writeFileSync('src/components/LoginWall.tsx', text);
