import React from 'react';
import AuthAwareNavbar from './AuthAwareNavbar';
import Sidebar from './Sidebar';
import { useNavigation } from '@/contexts/NavigationContext';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  const { activeView } = useNavigation();

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthAwareNavbar />
      <div className="flex">
        <Sidebar activeView={activeView} />
        <main className="flex-1 p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}