const fs = require('fs');
let content = fs.readFileSync('src/components/LoginWall.tsx', 'utf-8');

const replacement = `interface MemberLoginProps {
  onLogin: (memberId: string) => void;
  onRegisterGoogle: (phone: string) => Promise<void>;
  members: any[];
}

export const MemberLogin: React.FC<MemberLoginProps> = ({ onLogin, onRegisterGoogle, members }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isNotRegistered, setIsNotRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPendingGoogle, setIsPendingGoogle] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return setError('Silakan masukkan nomor telepon Anda.');
    
    setLoading(true);
    setError('');
    setIsNotRegistered(false);

    try {
      const cleanDigits = phone.replace(/[^0-9]/g, '');
      const found = members.find((m: any) => {
        const mDigits = (m.phone || '').replace(/[^0-9]/g, '');
        return m.phone === phone || (cleanDigits.length >= 4 && mDigits.length >= 4 && (mDigits.includes(cleanDigits) || cleanDigits.includes(mDigits)));
      });

      if (found) {
        onLogin(found.id);
      } else {
        setError('Nomor handphone belum terdaftar sebagai member.');
        setIsNotRegistered(true);
      }
    } catch (err) {
      setError('Gagal memproses data member.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async (p?: string) => {
    setLoading(true);
    try {
      await onRegisterGoogle(p || phone || '');
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(/interface MemberLoginProps \{[\s\S]*?const handleLogin = async \(e: React\.FormEvent\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};/m, replacement);

content = content.replace(/onClick=\{\(\) => onRegisterGoogle\(phone\)\}/g, 'onClick={() => handleGoogleClick()}');

fs.writeFileSync('src/components/LoginWall.tsx', content);
console.log('Fixed LoginWall.tsx google click wrapper');
