import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCvjoZ65IQDF1j8Dz6W9XLcM-at5ixc39k",
  authDomain: "watch-club-membership.firebaseapp.com",
  projectId: "watch-club-membership",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    await signInWithCustomToken(auth, null);
  } catch (e) {
    console.error(e);
  }
}
test();
