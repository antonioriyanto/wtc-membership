const fs = require('fs');
let header = fs.readFileSync('src/components/Header.tsx', 'utf8');

const regex = /const \[searchQuery, setSearchQuery\] = useState\(''\);\s*const \[showDropdown, setShowDropdown\] = useState\(false\);/;

const newDecl = `const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);`;

header = header.replace(regex, newDecl);
fs.writeFileSync('src/components/Header.tsx', header);
