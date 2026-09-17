const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetImport = `import { AdminLogin, MemberLogin } from './components/LoginWall';`;
const newImport = `import { AdminLogin, MemberLogin } from './components/LoginWall';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';`;
content = content.replace(targetImport, newImport);

const targetState = `  const [adminAuthenticated, setAdminAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('wtc_ho_auth') === 'true';
    } catch {
      return false;
    }
  });`;
const newState = `  const [adminAuthenticated, setAdminAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('wtc_ho_auth') === 'true';
    } catch {
      return false;
    }
  });
  
  // Realtime Firebase Auth Listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          const role = tokenResult.claims.role;
          console.log('Firebase Auth Logged In as:', user.uid, 'Role:', role);
        } catch (e) {
          console.error('Failed to parse token claims:', e);
        }
      } else {
        console.log('Firebase Auth Logged Out');
      }
    });
    return () => unsubscribe();
  }, []);`;
content = content.replace(targetState, newState);

const targetLogout = `            onSignOut={() => {
              try { 
                localStorage.removeItem('wtc_ho_auth'); 
              } catch {}
              setAdminAuthenticated(false);
              navigate('/');
            }}`;
const newLogout = `            onSignOut={() => {
              const auth = getAuth();
              signOut(auth).then(() => {
                try { localStorage.removeItem('wtc_ho_auth'); } catch {}
                setAdminAuthenticated(false);
                navigate('/');
              });
            }}`;
content = content.replace(targetLogout, newLogout);

const targetCashierLogout = `            onSignOut={() => {
              setCashierAuthenticated(false);
              try { 
                localStorage.removeItem('wtc_cashier_auth'); 
                localStorage.removeItem('wtc_cashier_name'); 
                localStorage.removeItem('wtc_cashier_store'); 
              } catch {}
              navigate('/cashier');
            }}`;
const newCashierLogout = `            onSignOut={() => {
              const auth = getAuth();
              signOut(auth).then(() => {
                setCashierAuthenticated(false);
                try { 
                  localStorage.removeItem('wtc_cashier_auth'); 
                  localStorage.removeItem('wtc_cashier_name'); 
                  localStorage.removeItem('wtc_cashier_store'); 
                } catch {}
                navigate('/cashier');
              });
            }}`;
content = content.replace(targetCashierLogout, newCashierLogout);

const targetCashierLogout2 = `onSignOut={() => {
              setCashierAuthenticated(false);
              try { 
                localStorage.removeItem('wtc_cashier_auth'); 
                localStorage.removeItem('wtc_cashier_name'); 
                localStorage.removeItem('wtc_cashier_store'); 
              } catch {}
              navigate('/cashier');
            }}`;
content = content.replace(targetCashierLogout2, newCashierLogout);

fs.writeFileSync('src/App.tsx', content);
