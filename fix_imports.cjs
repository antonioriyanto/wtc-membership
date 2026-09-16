const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

code = code.replace("import React, { useState, useMemo, useEffect } from 'react';", "import React, { useState, useMemo, useEffect, useRef } from 'react';");
code = code.replace("import { Camera } from 'lucide-react';\nimport { QRCodeSVG }", "import { QRCodeSVG }");

fs.writeFileSync('src/components/CustomerMemberView.tsx', code);
