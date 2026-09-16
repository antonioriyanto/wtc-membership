const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the mis-rendered MemberPreviewModal at the end of the file
const badBlockStart = app.indexOf('        <MemberPreviewModal');
if (badBlockStart !== -1) {
  app = app.substring(0, badBlockStart) + "      </div>\n    </div>"; // Restore what was replaced incorrectly
}

if (!app.includes("<MemberPreviewModal\n              isOpen={!!globalPreviewMember}")) {
  app = app.replace(
    "<QuickStoreSwitchModal",
    `<MemberPreviewModal
              isOpen={!!globalPreviewMember}
              onClose={() => setGlobalPreviewMember(null)}
              member={globalPreviewMember}
              transactions={transactions}
              onOpenEdit={(m) => {
                setGlobalPreviewMember(null);
              }}
              onToggleSuspend={handleToggleSuspendMember}
              onDelete={(id) => {
                handleDeleteMember(id);
                setGlobalPreviewMember(null);
              }}
            />
            <QuickStoreSwitchModal`
  );
}

fs.writeFileSync('src/App.tsx', app);
