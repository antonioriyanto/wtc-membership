# START HERE FOR NEW LLM / DEVELOPER
**Document**: `PROJECT_HANDOVER/START_HERE_FOR_NEW_LLM.md`  
**Generated**: 2026-09-21T19:32:00-07:00

> **COPY-PASTE THIS PROMPT TO INITIALIZE ANY NEW AI CODING AGENT**:

```markdown
Anda mengambil alih project enterprise Watch Club Indonesia (Omnichannel Loyalty & POS System untuk 42+ toko ritel jam tangan mewah).

Sebelum Anda mengubah code atau menambahkan fitur baru, lakukan langkah persiapan berikut:
1. Buka dan baca `PROJECT_HANDOVER/LLM_CONTEXT.md` untuk memahami mental model lengkap sistem.
2. Buka `PROJECT_HANDOVER/07_BUSINESS_LOGIC.md` untuk memahami rumus perhitungan poin (1 poin / Rp 10.000) dan multiplier tier (Platinum 1.75x, Gold 1.25x).
3. Buka `PROJECT_HANDOVER/22_CRITICAL_INVARIANTS.md` untuk melihat hal-hal yang TIDAK BOLEH dirusak (immutability transaksi/audit, deduplikasi nomor struk, perlindungan ghost login).
4. Periksa file `server.ts` dan `src/App.tsx` sebelum melakukan perubahan arsitektur.

Aturan Utama Pengembangan:
- Jangan pernah menghapus implementasi nyata dan menggantinya dengan mock/dummy.
- Port server terikat pada port 3000 (Express 5 + Vite SPA middleware).
- Jalankan `npm run lint` (`tsc --noEmit`) dan `npm run build` setelah setiap perubahan untuk memastikan kompatibilitas produksi.
- Selalu pertahankan dual-sync: Firestore realtime + fallback penyimpanan disk lokal di `data/*.json`.

Silakan konfirmasi bahwa Anda telah membaca konteks ini dan sebutkan 3 portal utama yang ada di sistem ini.
```
