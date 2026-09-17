const fs = require('fs');

let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

const stateInjection = `
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored === 'dark' || document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  
  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  const [tabHistory, setTabHistory] = useState`;

content = content.replace("  const [tabHistory, setTabHistory] = useState", stateInjection);

const buttonInjection = `
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-black/10 dark:border-white/20 bg-slate-200 dark:bg-neutral-800 flex justify-center items-center font-bold text-neutral-500 dark:text-neutral-400 overflow-hidden shrink-0 transition-all cursor-pointer hover:bg-slate-300 dark:hover:bg-neutral-700 shadow-sm"
              title="Ganti Tema"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setActiveTab('PROFILE')}
              className="w-10 h-10 rounded-full border border-black/10 dark:border-white/20 bg-slate-200 dark:bg-neutral-800 flex justify-center items-center font-bold text-neutral-500 dark:text-neutral-400 overflow-hidden shrink-0 transition-all cursor-pointer hover:bg-slate-300 dark:hover:bg-neutral-700 shadow-sm"
            >`;

content = content.replace(`          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('PROFILE')}
              className="w-10 h-10 rounded-full border border-black/10 dark:border-white/20 bg-slate-200 flex justify-center items-center font-bold text-neutral-500 dark:text-neutral-400 overflow-hidden shrink-0 transition-all cursor-pointer hover:bg-slate-300 shadow-sm"
            >`, buttonInjection);

fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
