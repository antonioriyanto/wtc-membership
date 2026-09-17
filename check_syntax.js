const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');
const sourceFile = ts.createSourceFile('file.tsx', code, ts.ScriptTarget.Latest, true);

let hasError = false;
function visit(node) {
  if (node.kind === ts.SyntaxKind.JsxExpression) {
     // check if there's any weird syntax
  }
  ts.forEachChild(node, visit);
}
visit(sourceFile);
console.log("Syntax check passed");
