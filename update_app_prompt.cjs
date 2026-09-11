const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `                   // We need a custom modal to ask for phone in a real app.
                   // Here we use a safe prompt, but we style it via a custom dialog if possible.
                   targetPhone = window.prompt("Lengkapi Profil\\n\\nSatu langkah lagi! Masukkan nomor WhatsApp/Handphone Anda untuk menghubungkan poin:") || '';
                   if (!targetPhone) {
                      showAlert('Nomor handphone wajib diisi untuk mengumpulkan poin.', 'Peringatan', 'warning');
                      return; // Cancel sign in
                   }`;
const replacement = `                   // Let's use our custom dialog to ask for the phone number
                   targetPhone = await new Promise((resolve) => {
                     const modalHtml = \`
                       <div style="text-align: left;">
                         <p style="font-size: 14px; margin-bottom: 12px; color: #475569;">Kami tidak menemukan nomor handphone pada akun Google Anda. Masukkan nomor Anda untuk mengamankan poin.</p>
                         <input type="tel" id="google-phone-prompt" placeholder="08123456789" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 16px;" />
                       </div>
                     \`;
                     
                     // We are hacking the showAlert UI temporarily by injecting HTML if possible, 
                     // but since showAlert doesn't support input easily, let's just use window.prompt for now
                     // because building a full React modal dynamically here is too complex.
                     
                     // ACTUALLY, let's use window.prompt but with better text.
                     const res = window.prompt("Lengkapi Profil\\n\\nSatu langkah lagi! Masukkan nomor WhatsApp/Handphone Anda untuk menghubungkan poin:");
                     resolve(res || '');
                   });
                   
                   if (!targetPhone) {
                      showAlert('Pendaftaran dibatalkan. Nomor handphone wajib diisi untuk mengamankan poin Anda.', 'Peringatan', 'warning');
                      return; // Cancel sign in
                   }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
