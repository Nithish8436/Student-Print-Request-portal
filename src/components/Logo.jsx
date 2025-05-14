
import React from 'react';
import { Printer } from 'lucide-react';

const Logo = ({ size = 'medium' }) => {
  return (
    <div className="flex items-center gap-2">
      <Printer className={`text-primary ${size === 'large' ? 'w-10 h-10' : 'w-6 h-6'}`} />
      <span className={`font-bold ${size === 'large' ? 'text-2xl' : 'text-xl'}`}>PrintHub</span>
    </div>
  );
};

export default Logo;
