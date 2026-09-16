const fs = require('fs');
let content = fs.readFileSync('src/components/MembersTab.tsx', 'utf8');

// 1. Add Import
content = content.replace(
  "import { MemberPreviewModal } from './MemberPreviewModal';",
  "import { MemberPreviewModal } from './MemberPreviewModal';\nimport { DeleteMemberModal } from './DeleteMemberModal';"
);

// 2. Add State
content = content.replace(
  "const [editingMember, setEditingMember] = useState<Member | null>(null);",
  "const [editingMember, setEditingMember] = useState<Member | null>(null);\n  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);\n  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);"
);

// 3. Update Delete Button onClick
const oldDeleteClick = `showConfirm(
                              \`Hapus akun member \${m.name} (\${m.membershipId}) secara permanen?\`,
                              'Konfirmasi Hapus Member',
                              () => handleDeleteMember(m.id),
                              'Ya, Hapus Permanen',
                              'Batal'
                            );`;
const newDeleteClick = `setMemberToDelete(m);
                            setIsDeleteModalOpen(true);`;

content = content.split(oldDeleteClick).join(newDeleteClick);

// 4. Mount Modal at the end
const modalsEnd = `<EditMemberModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        onSave={handleSaveMember}
        onDelete={handleDeleteMember}
        stores={stores}
      />`;
const newModalsEnd = modalsEnd + `\n\n      <DeleteMemberModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setMemberToDelete(null);
        }}
        member={memberToDelete}
        onConfirmDelete={handleDeleteMember}
      />`;

content = content.split(modalsEnd).join(newModalsEnd);

fs.writeFileSync('src/components/MembersTab.tsx', content);
