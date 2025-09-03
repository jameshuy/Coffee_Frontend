import { Link } from "wouter";
import { ReactNode } from "react";

interface NavIconProps {
  href: string;
  active?: boolean;
  children: ReactNode;
}

export default function NavIcon({ href, active = false, children }: NavIconProps) {
  return (
    <Link href={href}>
      <div className={`p-2 transition-colors cursor-pointer ${active ? 'text-[#f1b917]' : 'text-white hover:text-[#f1b917]'}`}>
        {children}
      </div>
    </Link>
  );
}


