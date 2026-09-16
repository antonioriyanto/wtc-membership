const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add global Preview states
app = app.replace(
  "const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);",
  "const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);\n  const [globalPreviewMember, setGlobalPreviewMember] = useState<Member | null>(null);"
);

// 2. Add MemberPreviewModal import if not there
if (!app.includes("MemberPreviewModal")) {
  app = app.replace(
    "import { CreateMemberModal } from './components/CreateMemberModal';",
    "import { CreateMemberModal } from './components/CreateMemberModal';\nimport { MemberPreviewModal } from './components/MemberPreviewModal';"
  );
}

// 3. Update Header props in App.tsx
app = app.replace(
  /<Header\s+onSearch=\{\(\) => \{\}\}\s+onOpenCreateVoucher=\{[\s\S]*?\/>/,
  `<Header 
                onSearch={() => {}}
                onOpenCreateVoucher={() => setIsCreateVoucherOpen(true)}
                onOpenManualAdjust={() => setIsPointAdjustOpen(true)}
                onRefreshData={handleRefreshData}
                isRefreshing={isRefreshingData}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                unreadNotificationsCount={unreadNotificationsCount}
                members={members}
                transactions={transactions}
                onSelectMember={(m) => setGlobalPreviewMember(m)}
                onSelectTransaction={(t) => {
                  const m = members.find(mem => mem.id === t.memberId);
                  if (m) setGlobalPreviewMember(m);
                }}
              />`
);

// 4. Render MemberPreviewModal at the end of App.tsx (before </>)
app = app.replace(
  "      </div>\n    </div>",
  `        <MemberPreviewModal
          isOpen={!!globalPreviewMember}
          onClose={() => setGlobalPreviewMember(null)}
          member={globalPreviewMember}
          transactions={transactions}
          onOpenEdit={(m) => {
            // Edit member from global not fully supported, just close preview for now
            // or we could add globalEditMember state
            setGlobalPreviewMember(null);
          }}
          onToggleSuspend={handleToggleSuspendMember}
          onDelete={(id) => {
            handleDeleteMember(id);
            setGlobalPreviewMember(null);
          }}
        />
      </div>
    </div>`
);

fs.writeFileSync('src/App.tsx', app);
