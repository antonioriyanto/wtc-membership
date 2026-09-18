const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const handleDirectPointAdjustment = async \(memberId: string, pointsDelta: number, note: string, ticketId: string\) => \{/,
  "const handleDirectPointAdjustment = async (memberId: string, pointsDelta: number, note: string, ticketId: string) => {\n    let success = false;"
);

code = code.replace(
  /await batch\.commit\(\);\n[\s]*\} catch\(err\) \{\}/,
  "await batch.commit();\n      success = true;\n    } catch(err) {}\n    return success;"
);

code = code.replace(
  /if \(\!target\) return;/,
  "if (!target) return false;"
);

fs.writeFileSync('src/App.tsx', code);
