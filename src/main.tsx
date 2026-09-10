import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { CustomDialogProvider } from './components/CustomDialogProvider.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CustomDialogProvider>
        <App />
      </CustomDialogProvider>
    </BrowserRouter>
  </StrictMode>,
);
