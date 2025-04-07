import React from 'react';
import { Link } from 'wouter';
import { LayoutDashboard, FileText, Users, Package, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeView: string;
}

export default function Sidebar({ activeView }: SidebarProps) {
  const navItems = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: '/',
      active: activeView === 'dashboard'
    },
    {
      name: 'Werkbonnen',
      icon: <FileText className="h-5 w-5" />,
      href: '/werkbonnen',
      active: activeView === 'werkbonnen'
    },
    {
      name: 'Klanten',
      icon: <Users className="h-5 w-5" />,
      href: '/klanten',
      active: activeView === 'klanten'
    },
    {
      name: 'Materialen',
      icon: <Package className="h-5 w-5" />,
      href: '/materialen',
      active: activeView === 'materialen'
    },
    {
      name: 'Facturen',
      icon: <Receipt className="h-5 w-5" />,
      href: '/facturen',
      active: activeView === 'facturen'
    }
  ];

  return (
    <div className="hidden md:block w-64 bg-white h-[calc(100vh-4rem)] border-r border-gray-200">
      <div className="p-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center px-4 py-2.5 text-sm font-medium rounded-md",
                item.active 
                  ? "bg-primary text-white" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}>
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}