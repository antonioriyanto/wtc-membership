const fs = require('fs');
let code = fs.readFileSync('src/components/CashierTab.tsx', 'utf8');

code = code.replace("import { QrCode, Camera } from 'lucide-react';\n", "");
code = code.replace("import { Search, Plus, Barcode, Camera, ShoppingCart", "import { X, Search, Plus, Barcode, Camera, ShoppingCart");

code = code.replace(/setSearchQuery/g, "setSearchInput");

fs.writeFileSync('src/components/CashierTab.tsx', code);
