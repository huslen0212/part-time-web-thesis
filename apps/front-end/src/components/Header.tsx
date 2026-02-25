'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

type JwtPayload = {
  userId: number;
  role: 'JOB_SEEKER' | 'EMPLOYER';
  userName: string;
  exp: number;
};

function decodeToken(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function Header() {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const pathname = usePathname() || '/';
  const router = useRouter();

  const overrideRole = pathname.startsWith('/createJob')
    ? ('EMPLOYER' as const)
    : pathname.startsWith('/calendar') || pathname.startsWith('/jobs')
      ? ('JOB_SEEKER' as const)
      : undefined;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = decodeToken(token);
    if (!decoded) return;

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      localStorage.removeItem('token');
      setUser(null);
      return;
    }

    setUser(decoded);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const activeRole = overrideRole ?? user?.role;

  return (
    <header className="border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          Part-Time Job System
        </Link>

        <nav className="flex items-center gap-6">
          {activeRole === 'JOB_SEEKER' && (
            <Link href="/calendar" className="text-sm hover:underline">
              Ажил хайх
            </Link>
          )}

          {activeRole === 'EMPLOYER' && (
            <Link href="/createJob" className="text-sm hover:underline">
              Ажил нэмэх
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {user.userName}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  Профайл
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>Гарах</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg border border-black text-sm hover:bg-black hover:text-white transition"
            >
              Нэвтрэх
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
