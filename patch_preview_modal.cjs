const fs = require('fs');
let content = fs.readFileSync('src/components/MemberPreviewModal.tsx', 'utf8');

const target = `{!isConfirmDelete ? (
                  <button
                    onClick={() => setIsConfirmDelete(true)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Akun Member Ini</span>
                  </button>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                    <p className="text-xs text-rose-800 font-medium">
                      Yakin ingin menghapus akun <strong>{member.name}</strong> ({member.membershipId}) beserta seluruh Poin dan Riwayat Transaksinya secara permanen? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onDelete(member.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                      >
                        Ya, Hapus Sekarang
                      </button>
                      <button
                        onClick={() => setIsConfirmDelete(false)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}`;

const replacement = `{!isConfirmDelete ? (
                  <button
                    onClick={() => setIsConfirmDelete(true)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Akun Member Ini</span>
                  </button>
                ) : (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Konfirmasi Pengaman Diperlukan</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Ketik <strong>HAPUS</strong> di bawah ini untuk mengonfirmasi bahwa Anda yakin ingin menghapus akun ini:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      placeholder="Ketik HAPUS"
                      className="w-full px-3 py-2 text-xs border border-rose-200 rounded-xl font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={deleteConfirmationText !== 'HAPUS'}
                        onClick={() => {
                          onDelete(member.id);
                          setDeleteConfirmationText('');
                          setIsConfirmDelete(false);
                          onClose();
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Ya, Hapus Akun Ini Permanen
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsConfirmDelete(false);
                          setDeleteConfirmationText('');
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}`;

content = content.replace(target, replacement);

// Also need to add deleteConfirmationText state to MemberPreviewModal.tsx
const stateTarget = `const [isConfirmDelete, setIsConfirmDelete] = useState(false);`;
const stateReplacement = `const [isConfirmDelete, setIsConfirmDelete] = useState(false);\n  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');`;

content = content.replace(stateTarget, stateReplacement);

// Need to import AlertTriangle if not present
if (!content.includes('AlertTriangle')) {
  content = content.replace('X,', 'X,\n  AlertTriangle,');
}

fs.writeFileSync('src/components/MemberPreviewModal.tsx', content);
