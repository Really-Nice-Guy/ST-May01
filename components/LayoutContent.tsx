'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import AuthContainer from './AuthContainer';
import { useRouter, usePathname } from 'next/navigation';

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClientComponentClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user email exists in localStorage
        const userEmail = localStorage.getItem('userEmail');
        
        if (userEmail) {
          // Verify the email exists in the Users table
          const { data: existingUser } = await supabase
            .from('Users')
            .select('email')
            .eq('email', userEmail)
            .maybeSingle();

          if (existingUser) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('userEmail');
            setIsAuthenticated(false);
            if (pathname !== '/') {
              router.push('/');
            }
          }
        } else {
          setIsAuthenticated(false);
          if (pathname !== '/') {
            router.push('/');
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for storage and custom auth change events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userEmail') {
        checkAuth();
      }
    };
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-auth-changed', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-auth-changed', handleAuthChange);
    };
  }, [supabase, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <header className="w-full border-b p-4 flex justify-end">
        {isAuthenticated ? (
          <button
            onClick={() => {
              localStorage.removeItem('userEmail');
              setIsAuthenticated(false);
              router.push('/');
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        ) : (
          <AuthContainer />
        )}
      </header>
      {isAuthenticated ? (
        <main className="p-4">{children}</main>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-6">
          <div className="flex flex-row items-center w-full max-w-6xl justify-center space-x-8">
            <div className="flex flex-col items-center space-y-4">
              <img
                src="/sundaythoughts_logo.png"
                alt="Sunday Thoughts Logo"
                className="w-48 h-auto"
                style={{ minWidth: '150px' }}
              />
              <AuthContainer />
            </div>
            <img
              src="/sundaythoughts_illustration.png"
              alt="Sunday Thoughts Illustration"
              className="h-64 w-[600px] object-contain"
              style={{ minWidth: '400px' }}
            />
          </div>
          <p className="text-xl text-gray-600 mt-8">Please log in to access the portal</p>
        </div>
      )}
    </div>
  );
} 