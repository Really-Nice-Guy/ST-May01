'use client';

import { useState } from 'react';
import LoginButton from './LoginButton';
import LoginModal from './LoginModal';
import RequestAccessModal from './RequestAccessModal';

export default function AuthContainer() {
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isRequestAccessOpen, setRequestAccessOpen] = useState(false);

  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);
  const openRequestAccess = () => setRequestAccessOpen(true);
  const closeRequestAccess = () => setRequestAccessOpen(false);

  return (
    <>
      <LoginButton onLoginClick={openLogin} />
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={closeLogin}
        onRequestAccess={openRequestAccess}
      />
      <RequestAccessModal 
        isOpen={isRequestAccessOpen}
        onClose={closeRequestAccess}
      />
    </>
  );
} 