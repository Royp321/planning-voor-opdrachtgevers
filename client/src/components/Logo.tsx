import React from 'react';
import { Link } from 'wouter';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center p-2">
      <div className="flex items-center bg-white rounded-md p-1">
        <img 
          src="/images/spartec-logo.jpg" 
          alt="Spar-Tec Logo" 
          className="h-12 w-auto"
        />
      </div>
    </Link>
  );
}