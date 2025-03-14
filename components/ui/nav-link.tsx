import Link from 'next/link';
import { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function NavLink({ href, children, className = '' }: NavLinkProps) {
  return (
    <Link 
      href={href} 
      className={`text-medical-light hover:text-medical-accent transition-colors ${className}`}
    >
      {children}
    </Link>
  );
} 