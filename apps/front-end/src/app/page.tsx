'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

import JobSeekerHome from '@/components/jobSeekerHome';
import EmployerHome from '@/components/employerHome';

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

export default function Index() {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = decodeToken(token);
    if (!decoded) return;

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      localStorage.removeItem('token');
      return;
    }

    setUser(decoded);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* header */}
      <header className="border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Part-Time Job System</h1>

          <nav className="flex items-center gap-6">
            {user?.role === 'JOB_SEEKER' && (
              <Link href="/calendar" className="text-sm hover:underline">
                Ажил хайх
              </Link>
            )}

            {user?.role === 'EMPLOYER' && (
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

      {/* content */}
      <main className="flex-1">
        {!user && <JobSeekerHome />}
        {user?.role === 'JOB_SEEKER' && <JobSeekerHome />}
        {user?.role === 'EMPLOYER' && <EmployerHome />}
      </main>

      {/* footer */}
      <footer className="border-t border-black/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between text-sm text-black/60">
          <span>© 2026 · Дипломын ажил</span>
          <span>МУИС · Мэдээллийн технологи</span>
        </div>
      </footer>
    </div>
  );
}
