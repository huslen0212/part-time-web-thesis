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

/* ===== JWT decode helper ===== */
type JwtPayload = {
  userId: number;
  role: 'JOB_SEEKER' | 'EMPLOYER';
  userName: string;
  exp: number; // unix timestamp
};

function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function Index() {
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserName(null);
    router.push('/');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = decodeToken(token);
    if (!decoded) return;

    // ⏱ token хугацаа дууссан эсэх
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      localStorage.removeItem('token');
      return;
    }

    setUserName(decoded.userName);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* ================= Header ================= */}
      <header className="border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">
            Part-Time Job System
          </h1>

          <nav className="flex items-center gap-6">
            <Link href="/calendar" className="text-sm hover:underline">
              Ажил хайх
            </Link>

            {userName ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3 py-1 rounded-lg text-sm"
                  >
                    <span className="flex items-center gap-2">{userName}</span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    Профайл
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Гарах
                  </DropdownMenuItem>
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

      {/* ================= Hero ================= */}
      <main className="flex-1">
        <section>
          <div className="max-w-7xl mx-auto px-6 py-24 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Цагийн ажил зуучлалын систем
            </h2>
            <p className="max-w-3xl mx-auto mb-10 text-black/70">
              Оюутан болон ажил олгогчдыг холбосон, цагийн ажил хайх, удирдах,
              хуваарьт суурилсан веб систем
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6">
              {!userName && (
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-xl border border-black font-medium hover:bg-black hover:text-white transition"
                >
                  Нэвтрэх
                </Link>
              )}

              <Link
                href="/calendar"
                className="px-8 py-4 rounded-xl border border-black font-medium hover:bg-black hover:text-white transition"
              >
                Ажил хайх
              </Link>
            </div>
          </div>
        </section>

        {/* ================= Features ================= */}
        <section className="border-t border-black/10 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-2xl font-semibold text-center mb-12">
              Системийн боломжууд
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-xl border border-black/10 p-6 text-center">
                <h4 className="font-semibold mb-2">Ажил хайх</h4>
                <p className="text-sm text-black/70">
                  Цаг, байршил, цалингаар тохирох ажлыг олох
                </p>
              </div>

              <div className="rounded-xl border border-black/10 p-6 text-center">
                <h4 className="font-semibold mb-2">Хуваарь удирдах</h4>
                <p className="text-sm text-black/70">
                  Ажиллах боломжит цагаа календарь хэлбэрээр удирдах
                </p>
              </div>

              <div className="rounded-xl border border-black/10 p-6 text-center">
                <h4 className="font-semibold mb-2">Зуучлал</h4>
                <p className="text-sm text-black/70">
                  Ажил олгогч ба ажил хайгчийг шууд холбох
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= Footer ================= */}
      <footer className="border-t border-black/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between text-sm text-black/60">
          <span>© 2026 · Дипломын ажил</span>
          <span>МУИС · Мэдээллийн технологи</span>
        </div>
      </footer>
    </div>
  );
}
