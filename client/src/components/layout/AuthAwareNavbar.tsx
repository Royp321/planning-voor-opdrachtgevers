import React from 'react';
import { useLocation } from 'wouter';
import Navbar from './Navbar';
import { useAuth } from '@/hooks/use-auth';

export default function AuthAwareNavbar() {
  const { logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Navbar 
      onLogout={handleLogout} 
      isLoggingOut={logoutMutation.isPending} 
    />
  );
}