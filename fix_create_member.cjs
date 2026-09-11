const fs = require('fs');
let content = fs.readFileSync('src/components/CreateMemberModal.tsx', 'utf-8');

// We want to auto-detect while typing phone
const searchTarget = `  const [gender, setGender] = useState<'Pria' | 'Wanita'>('Pria');
  const [registeredStore, setRegisteredStore] = useState(defaultStore);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);`;

const replacement = `  const [gender, setGender] = useState<'Pria' | 'Wanita'>('Pria');
  const [registeredStore, setRegisteredStore] = useState(defaultStore);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect on phone change
  useEffect(() => {
    if (phone && members) {
      const cleanDigits = phone.replace(/[^0-9]/g, '');
      if (cleanDigits.length >= 4) {
        const existing = members.find(m => {
          const mDigits = (m.phone || '').replace(/[^0-9]/g, '');
          return m.phone === phone || (mDigits.length >= 4 && (mDigits.includes(cleanDigits) || cleanDigits.includes(mDigits)));
        });
        
        if (existing && onExistingMember) {
          onExistingMember(existing);
        }
      }
    }
  }, [phone, members, onExistingMember]);`;

content = content.replace(searchTarget, replacement);
fs.writeFileSync('src/components/CreateMemberModal.tsx', content);
console.log('Fixed auto-detect');
