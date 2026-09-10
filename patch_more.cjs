const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// CreateMemberModal -> onCreateMember
content = content.replace(
  /try \{\n\s*const res = await fetch\('\/api\/members'[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n\n\s*setMembers\(prev => \{[\s\S]*?\}\);/g,
  `try {
                  await setDoc(doc(db, 'members', created.id), created);
                } catch (err) {
                  console.warn("Backend API unavailable, saved member locally:", err);
                }`
);

// CreateVoucherModal -> onCreateVoucher (update)
content = content.replace(
  /try \{\n\s*const res = await fetch\(\`\/api\/vouchers\/\$\{editingVoucher\.id\}\`[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n\n\s*setVouchers\(prev => \{[\s\S]*?\}\);\n\s*setEditingVoucher\(null\);\n\s*setIsCreateVoucherOpen\(false\);/,
  `try {
                    await setDoc(doc(db, 'vouchers', updated.id), updated);
                  } catch (err) {}
                  setEditingVoucher(null);
                  setIsCreateVoucherOpen(false);`
);

// CreateVoucherModal -> onCreateVoucher (create)
content = content.replace(
  /try \{\n\s*const res = await fetch\('\/api\/vouchers'[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n\n\s*setVouchers\(prev => \{[\s\S]*?\}\);\n\s*setIsCreateVoucherOpen\(false\);/,
  `try {
                    await setDoc(doc(db, 'vouchers', created.id), created);
                  } catch (err) {}
                  setIsCreateVoucherOpen(false);`
);

// VouchersTab toggle status
content = content.replace(
  /try \{\n\s*await fetch\(\`\/api\/vouchers\/\$\{voucherId\}\`[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n\s*setVouchers\(prev => \{[\s\S]*?return next;\n\s*\}\);/,
  `try {
                        await setDoc(doc(db, 'vouchers', voucherId), updated);
                      } catch (err) {
                        console.warn('API error updating voucher status:', err);
                      }`
);

// ManualPointAdjustmentModal -> onSubmitAdjustment
content = content.replace(
  /try \{\n\s*const res = await fetch\('\/api\/transactions'[\s\S]*?\} catch \(e: any\) \{[\s\S]*?\}\n\n\s*setTransactions\(prev => \{[\s\S]*?\}\);\n\s*setMembers\(prev => \{[\s\S]*?\}\);/g,
  `try {
                  const batch = writeBatch(db);
                  batch.set(doc(db, 'transactions', savedTrx.id), savedTrx);
                  batch.set(doc(db, 'members', updatedMember.id), updatedMember);
                  await batch.commit();
                } catch (e: any) {
                  console.warn("Backend API unavailable, applied adjustment locally:", e);
                }`
);

fs.writeFileSync('src/App.tsx', content);
