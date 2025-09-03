import { ReactNode } from 'react';

interface StatusRowProps {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function StatusRow({ icon, children, className = '' }: StatusRowProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {icon}
      <span className="text-sm text-gray-300">{children}</span>
    </div>
  );
}


