import React from 'react';
import { Link } from 'wouter';
import Logo from '@/components/Logo';
import { Bell, LogOut, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

type LogoutHandler = () => void;

interface NavbarProps {
  onLogout?: LogoutHandler;
  isLoggingOut?: boolean;
}

export default function Navbar({ onLogout, isLoggingOut = false }: NavbarProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Logo />
          <span className="ml-2 text-xl font-semibold text-gray-800 hidden md:block">
            PlanningSync
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-primary">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mijn Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profiel</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Instellingen</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} disabled={isLoggingOut || !onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? 'Uitloggen...' : 'Uitloggen'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}